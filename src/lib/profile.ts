import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
};

/** Reads the signed-in user's profile row (RLS restricts this to their own). */
export async function fetchMyProfile(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, avatar_url')
    .maybeSingle();

  if (error) return null;
  return data;
}
