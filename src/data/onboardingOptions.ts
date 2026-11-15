import { OnboardingAnswers, OnboardingDraft } from '../types/gloweave';

export const ROLE_OPTIONS = [
  'Student',
  'Developer',
  'Entrepreneur',
  'Researcher',
  'Business owner',
  'Innovator',
  'Problem solver',
  'Other',
] as const;

export const INDUSTRY_OPTIONS = [
  'Technology & AI',
  'Healthcare',
  'Agriculture',
  'Education',
  'Energy',
  'Environment',
  'Business & Finance',
] as const;

export const GOAL_OPTIONS = [
  'Discover problems',
  'Share problems',
  'Propose solutions',
  'Showcase a startup or product',
  'Connect with innovators',
  'Explore opportunities',
] as const;

export const CONTRIBUTION_OPTIONS = [
  'Share ideas',
  'Build solutions',
  'Collaborate',
  'Support innovations',
  'Research global challenges',
] as const;

export const EMPTY_ONBOARDING_ANSWERS: OnboardingAnswers = {
  role: '',
  otherRole: '',
  interests: [],
  country: '',
  goal: '',
  contribution: '',
  displayName: '',
};

export const ONBOARDING_DRAFT_KEY = 'gloweave_onboarding_draft_v1';

export function createInitialDraft(): OnboardingDraft {
  return {
    phase: 'welcome',
    step: 0,
    email: '',
    verificationEmailSent: false,
    answers: { ...EMPTY_ONBOARDING_ANSWERS },
    updatedAt: new Date().toISOString(),
  };
}

export function loadOnboardingDraft(): OnboardingDraft {
  try {
    const raw = window.localStorage.getItem(ONBOARDING_DRAFT_KEY);
    if (!raw) return createInitialDraft();
    const parsed = JSON.parse(raw) as Partial<OnboardingDraft>;
    return {
      phase: parsed.phase || 'welcome',
      step: typeof parsed.step === 'number' ? Math.max(0, Math.min(5, parsed.step)) : 0,
      email: typeof parsed.email === 'string' ? parsed.email : '',
      verificationEmailSent: Boolean(parsed.verificationEmailSent),
      answers: {
        ...EMPTY_ONBOARDING_ANSWERS,
        ...(parsed.answers || {}),
        interests: Array.isArray(parsed.answers?.interests) ? parsed.answers.interests : [],
      },
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return createInitialDraft();
  }
}

export function saveOnboardingDraft(draft: OnboardingDraft): void {
  try {
    // Passwords are never included in OnboardingDraft or persisted to localStorage.
    window.localStorage.setItem(
      ONBOARDING_DRAFT_KEY,
      JSON.stringify({
        ...draft,
        updatedAt: new Date().toISOString(),
      })
    );
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function clearOnboardingDraft(): void {
  try {
    window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
  } catch {
    // Ignore cleanly
  }
}
