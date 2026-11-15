import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';
import { OnboardingAnswers } from '../types/gloweave';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export interface PersistedUserProfile {
  id: string;
  email: string;
  display_name: string;
  role_identity: string;
  other_role?: string | null;
  country: string;
  interests: string[];
  primary_goal: string;
  contribution_style: string;
  avatar_url?: string | null;
  onboarding_completed: boolean;
}

export async function sendVerificationEmail(email: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!supabase) {
    return {
      ok: false,
      error:
        'Authentication provider is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to send real verification emails.',
    };
  }

  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      shouldCreateUser: true,
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function verifyEmailToken(
  email: string,
  token: string
): Promise<{ ok: boolean; session: Session | null; error?: string }> {
  if (!supabase) {
    return {
      ok: false,
      session: null,
      error: 'Authentication provider is not configured.',
    };
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: 'email',
  });

  if (error) {
    return { ok: false, session: null, error: error.message };
  }

  return { ok: true, session: data.session };
}

export async function getVerifiedEmailSession(): Promise<{
  session: Session | null;
  emailVerified: boolean;
}> {
  if (!supabase) {
    return { session: null, emailVerified: false };
  }

  const { data } = await supabase.auth.getSession();
  const session = data.session;
  const emailVerified = Boolean(
    session?.user && (session.user.email_confirmed_at || session.user.confirmed_at)
  );
  return { session, emailVerified };
}

export async function completeAccountRegistration(params: {
  password: string;
  onboarding: OnboardingAnswers;
}): Promise<{ ok: boolean; profile?: PersistedUserProfile; error?: string }> {
  if (!supabase) {
    return {
      ok: false,
      error: 'Authentication provider is not configured.',
    };
  }

  const { session, emailVerified } = await getVerifiedEmailSession();
  if (!session || !emailVerified) {
    return {
      ok: false,
      error: 'Your email must be verified before creating a password and account.',
    };
  }

  // Set user password directly via Supabase Auth (never stored in plaintext)
  const { data: userData, error: passwordError } = await supabase.auth.updateUser({
    password: params.password,
    data: {
      display_name: params.onboarding.displayName,
      role_identity: params.onboarding.role,
      country: params.onboarding.country,
      onboarding_completed: true,
    },
  });

  if (passwordError) {
    return { ok: false, error: passwordError.message };
  }

  const user = userData.user || session.user;
  const email = user.email || '';

  const profilePayload: PersistedUserProfile = {
    id: user.id,
    email,
    display_name: params.onboarding.displayName.trim(),
    role_identity:
      params.onboarding.role === 'Other' && params.onboarding.otherRole.trim()
        ? params.onboarding.otherRole.trim()
        : params.onboarding.role,
    other_role: params.onboarding.otherRole.trim() || null,
    country: params.onboarding.country,
    interests: params.onboarding.interests,
    primary_goal: params.onboarding.goal,
    contribution_style: params.onboarding.contribution,
    onboarding_completed: true,
  };

  // Persist profile & onboarding answers to PostgreSQL
  const { error: profileError } = await supabase.from('profiles').upsert(profilePayload);
  if (profileError) {
    return {
      ok: false,
      error: `Password set, but failed to save profile in PostgreSQL: ${profileError.message}`,
    };
  }

  const { error: onboardingError } = await supabase.from('onboarding_responses').upsert(
    {
      user_id: user.id,
      role_identity: params.onboarding.role,
      other_role: params.onboarding.otherRole.trim() || null,
      interests: params.onboarding.interests,
      country: params.onboarding.country,
      primary_goal: params.onboarding.goal,
      contribution_style: params.onboarding.contribution,
      preferred_name: params.onboarding.displayName.trim(),
    },
    { onConflict: 'user_id' }
  );

  if (onboardingError) {
    return {
      ok: false,
      error: `Profile saved, but failed to log onboarding responses: ${onboardingError.message}`,
    };
  }

  return { ok: true, profile: profilePayload };
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ ok: boolean; session: Session | null; error?: string }> {
  if (!supabase) {
    return {
      ok: false,
      session: null,
      error: 'Authentication provider is not configured.',
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { ok: false, session: null, error: error.message };
  }

  return { ok: true, session: data.session };
}

export async function fetchUserProfile(userId: string): Promise<PersistedUserProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as PersistedUserProfile;
}
