-- =============================================================================
-- Bwaka — auth profiles
--
-- One `public.profiles` row per `auth.users` row, created by a trigger from the
-- user metadata the client sends at sign-up (email magic link) or that the
-- OAuth provider returns (Google / Facebook).
--
-- Security model:
--   * RLS on; users can read and update ONLY their own row.
--   * No INSERT / DELETE grants for clients: rows are created by the trigger
--     (SECURITY DEFINER) and removed by ON DELETE CASCADE from auth.users.
--   * Column-level UPDATE grant: clients can never change `id` or timestamps.
--   * All user-supplied data is validated again here (never trust the client).
-- =============================================================================

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint profiles_full_name_length check (char_length(btrim(full_name)) between 2 and 80),
  -- E.164. The phone is a contact number and is NOT verified (no SMS / OTP).
  constraint profiles_phone_e164 check (phone is null or phone ~ '^\+[1-9][0-9]{6,14}$'),
  constraint profiles_avatar_url_https check (avatar_url is null or avatar_url ~* '^https://')
);

comment on table public.profiles is 'Public profile for each authenticated user.';
comment on column public.profiles.phone is 'Optional contact number in E.164 format. Unverified.';

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Supabase grants broad default privileges on new public tables; drop them and
-- grant back only what the app needs.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, phone, avatar_url) on table public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Create the profile when an auth user is created.
-- Must never raise: a failure here would block sign-up entirely, so every value
-- is sanitised into something the table constraints accept.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta      jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_name    text;
  v_phone   text;
  v_avatar  text;
begin
  -- Email sign-up sends `full_name`; Google sends `full_name` / `name`;
  -- Facebook sends `name`.
  v_name := nullif(btrim(coalesce(meta ->> 'full_name', meta ->> 'name', '')), '');
  if v_name is null then
    v_name := nullif(split_part(coalesce(new.email, ''), '@', 1), '');
  end if;
  v_name := left(coalesce(v_name, 'He''i user'), 80);
  if char_length(btrim(v_name)) < 2 then
    v_name := 'He''i user';
  end if;

  -- Prioritize the cryptographically verified phone from auth.users (new.phone)
  -- over unverified client-supplied metadata.
  v_phone := coalesce(nullif(btrim(new.phone), ''), nullif(btrim(coalesce(meta ->> 'phone', '')), ''));
  if v_phone is not null and v_phone !~ '^\+[1-9][0-9]{6,14}$' then
    v_phone := null;
  end if;

  v_avatar := coalesce(meta ->> 'avatar_url', meta ->> 'picture');
  if v_avatar is not null and v_avatar !~* '^https://' then
    v_avatar := null;
  end if;

  insert into public.profiles (id, full_name, phone, avatar_url)
  values (new.id, v_name, v_phone, v_avatar)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
