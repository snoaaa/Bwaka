import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type { AuthError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

import { normalizePhone } from './schemas';

WebBrowser.maybeCompleteAuthSession();

export type AuthResult = { ok: true } | { ok: false; message: string };
export type OAuthProvider = 'google' | 'facebook';

export type AuthTarget =
  | { type: 'email'; email: string }
  | { type: 'phone'; phone: string };

const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  google: 'Google',
  facebook: 'Facebook',
};

const OK: AuthResult = { ok: true };
const fail = (message: string): AuthResult => ({ ok: false, message });

export function getRedirectUrl(): string {
  return Linking.createURL('auth/callback');
}

function toMessage(error: AuthError, provider?: OAuthProvider): string {
  switch (error.code) {
    case 'over_email_send_rate_limit':
    case 'over_sms_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts. Please wait a few minutes before trying again.';
    case 'email_address_invalid':
      return 'Please enter a valid email address.';
    case 'phone_invalid':
    case 'sms_send_failed':
      return 'Unable to deliver SMS to this phone number. Please verify the number and dial code.';
    case 'signup_disabled':
      return 'New registrations are currently closed.';
    case 'provider_disabled':
    case 'validation_failed':
      return provider
        ? `${PROVIDER_LABEL[provider]} sign-in is not configured yet.`
        : 'This sign-in method is currently unavailable.';
    case 'bad_code_verifier':
    case 'flow_state_not_found':
    case 'flow_state_expired':
    case 'otp_expired':
      return 'This verification code has expired. Please request a new one.';
    case 'invalid_grant':
    case 'otp_disabled':
      return 'Incorrect verification code. Please check and try again.';
    case 'user_not_found':
      return 'Unable to sign in. Please verify your credentials or create a new account.';
    case 'user_already_exists':
    case 'email_exists':
    case 'email_conflict_identity_not_provided':
      return 'An account with this email already exists using another sign-in method. Please sign in with your original method.';
    case 'access_denied':
      return 'Authorization was cancelled or access was denied.';
    default:
      break;
  }
  if (error.name === 'AuthRetryableFetchError') {
    return 'Unable to reach the server. Check your connection and try again.';
  }
  return error.message || 'Something went wrong. Please try again.';
}

export async function sendOtp(
  target: AuthTarget,
  options: { isSignUp: boolean; fullName?: string }
): Promise<AuthResult> {
  if (target.type === 'email') {
    const email = target.email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: options.isSignUp,
        data: options.fullName ? { full_name: options.fullName.trim() } : undefined,
      },
    });

    if (error) {
      if (!options.isSignUp && (error.code === 'user_not_found' || error.code === 'otp_disabled')) {
        return fail('No registered account was found with this email. Please check the address or sign up.');
      }
      return fail(toMessage(error));
    }
    return OK;
  }

  const normalized = normalizePhone(target.phone);
  if (!normalized) {
    return fail('Please enter a valid phone number with your country dial code.');
  }

  const { error } = await supabase.auth.signInWithOtp({
    phone: normalized,
    options: {
      shouldCreateUser: options.isSignUp,
      data: {
        phone: normalized,
        ...(options.fullName ? { full_name: options.fullName.trim() } : {}),
      },
    },
  });

  if (error) {
    if (!options.isSignUp && (error.code === 'user_not_found' || error.code === 'otp_disabled')) {
      return fail('No registered account was found with this phone number. Please check the number or sign up.');
    }
    return fail(toMessage(error));
  }
  return OK;
}

export async function verifyOtp(target: AuthTarget, token: string): Promise<AuthResult> {
  const cleanToken = token.trim();

  if (target.type === 'email') {
    const email = target.email.trim().toLowerCase();
    const result = await supabase.auth.verifyOtp({
      email,
      token: cleanToken,
      type: 'email',
    });

    if (result.error) {
      const signupResult = await supabase.auth.verifyOtp({
        email,
        token: cleanToken,
        type: 'signup',
      });

      if (signupResult.error) {
        return fail(toMessage(signupResult.error));
      }
    }
    return OK;
  }

  const normalized = normalizePhone(target.phone);
  if (!normalized) {
    return fail('Invalid phone number format.');
  }

  const { error } = await supabase.auth.verifyOtp({
    phone: normalized,
    token: cleanToken,
    type: 'sms',
  });

  if (error) {
    return fail(toMessage(error));
  }
  return OK;
}

export async function signInWithProvider(provider: OAuthProvider): Promise<AuthResult> {
  const redirectTo = getRedirectUrl();
  const isWeb = Platform.OS === 'web';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: !isWeb,
      ...(provider === 'google' ? { queryParams: { prompt: 'select_account' } } : {}),
      ...(provider === 'facebook' ? { scopes: 'email,public_profile' } : {}),
    },
  });

  if (error) return fail(toMessage(error, provider));
  if (isWeb || !data.url) return OK;

  try {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') {
      if (result.type === 'cancel' || result.type === 'dismiss') {
        return fail('Sign-in was cancelled.');
      }
      return fail('Sign-in was not completed. Please try again.');
    }
    return completeFromUrl(result.url);
  } catch {
    return fail('Unable to open browser for authentication. Please try again.');
  }
}

const inflight = new Map<string, Promise<AuthResult>>();

export function exchangeCode(code: string): Promise<AuthResult> {
  const existing = inflight.get(code);
  if (existing) return existing;

  const promise = supabase.auth
    .exchangeCodeForSession(code)
    .then(({ error }) => (error ? fail(toMessage(error)) : OK))
    .catch(() => fail('Unable to reach server. Please check your connection.'))
    .finally(() => {
      setTimeout(() => inflight.delete(code), 5000);
    });

  inflight.set(code, promise);
  return promise;
}

export async function completeFromUrl(url: string): Promise<AuthResult> {
  const params = readRedirectParams(url);

  if (params.error || params.error_description) {
    const expired = params.error_code === 'otp_expired';
    return fail(
      expired
        ? 'This verification link has expired. Please request a new one.'
        : params.error_description || 'Sign-in was not completed. Please try again.'
    );
  }

  if (params.code) {
    return exchangeCode(params.code);
  }

  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) return fail(toMessage(error));
    return OK;
  }

  return fail('Authorization code or session token missing. Please try again.');
}

export function readRedirectParams(url: string): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  const hashIndex = url.indexOf('#');
  const hash = hashIndex >= 0 ? url.slice(hashIndex + 1) : '';

  const { queryParams } = Linking.parse(hashIndex >= 0 ? url.slice(0, hashIndex) : url);
  for (const [key, value] of Object.entries(queryParams ?? {})) {
    out[key] = Array.isArray(value) ? value[0] : (value ?? undefined);
  }
  if (hash) {
    for (const [key, value] of new URLSearchParams(hash)) {
      out[key] ??= value;
    }
  }
  return out;
}

export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut();
    return error ? fail('Unable to log out completely. Please try again.') : OK;
  } catch {
    return fail('Error signing out.');
  }
}
