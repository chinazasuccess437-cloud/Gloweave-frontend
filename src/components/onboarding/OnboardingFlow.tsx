import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Compass,
  Globe,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  CONTRIBUTION_OPTIONS,
  GOAL_OPTIONS,
  INDUSTRY_OPTIONS,
  ROLE_OPTIONS,
} from '../../data/onboardingOptions';
import {
  completeAccountRegistration,
  getVerifiedEmailSession,
  isSupabaseConfigured,
  PersistedUserProfile,
  sendVerificationEmail,
  signInWithPassword,
  supabase,
  verifyEmailToken,
} from '../../lib/supabase';
import { OnboardingAnswers, OnboardingDraft, OnboardingPhase } from '../../types/gloweave';
import { CountrySelector } from '../CountrySelector';
import { HeroGlobeGraphic } from '../VisualThumbnails';
import {
  OnboardingProgressBar,
  OnboardingShell,
  OptionSelectCard,
  PasswordInputField,
} from './OnboardingParts';

interface OnboardingFlowProps {
  draft: OnboardingDraft;
  onDraftChange: (updater: (prev: OnboardingDraft) => OnboardingDraft) => void;
  onRegistrationComplete: (profile: PersistedUserProfile) => void;
  onSignInComplete: (email: string, profile: PersistedUserProfile | null) => void;
  onEnterGuestPreview: () => void;
}

const TOTAL_QUESTIONS = 6;

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  draft,
  onDraftChange,
  onRegistrationComplete,
  onSignInComplete,
  onEnterGuestPreview,
}) => {
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [busy, setBusy] = useState(false);

  // Ephemeral verification / auth fields (never stored in localStorage)
  const [otpCode, setOtpCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Password fields (ephemeral only, never persisted in plaintext)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Returning user sign-in fields
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  const { phase, step, answers, email, verificationEmailSent } = draft;

  const setPhase = (nextPhase: OnboardingPhase) => {
    setError('');
    setInfoMessage('');
    onDraftChange((prev) => ({ ...prev, phase: nextPhase }));
  };

  const updateAnswers = (patch: Partial<OnboardingAnswers>) => {
    setError('');
    onDraftChange((prev) => ({
      ...prev,
      answers: { ...prev.answers, ...patch },
    }));
  };

  // Sync real Supabase Auth verification session when returning from email verification link
  useEffect(() => {
    if (!supabase) return;

    let active = true;
    const syncSession = async () => {
      const { session, emailVerified: verified } = await getVerifiedEmailSession();
      if (!active) return;
      if (verified && session?.user?.email) {
        setEmailVerified(true);
        if (phase === 'verify') {
          onDraftChange((prev) => ({
            ...prev,
            email: session.user.email || prev.email,
            phase: 'password',
          }));
        }
      }
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const verified = Boolean(
        session?.user && (session.user.email_confirmed_at || session.user.confirmed_at)
      );
      setEmailVerified(verified);
      if (verified && phase === 'verify') {
        onDraftChange((prev) => ({
          ...prev,
          email: session?.user?.email || prev.email,
          phase: 'password',
        }));
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [phase, onDraftChange]);

  // Cooldown timer for resend verification button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = window.setTimeout(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [resendCooldown]);

  const effectiveRole =
    answers.role === 'Other' && answers.otherRole.trim()
      ? answers.otherRole.trim()
      : answers.role;

  // =========================================================
  // PHASE 1: WELCOME
  // =========================================================
  if (phase === 'welcome') {
    return (
      <OnboardingShell
        maxWidthClass="max-w-4xl"
        headerRight={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEnterGuestPreview}
              className="px-3.5 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              Preview App
            </button>
            <button
              type="button"
              onClick={() => setPhase('signin')}
              className="px-3.5 py-2 rounded-xl bg-[#0A1633] border border-sky-400/35 text-xs font-semibold text-[#38BDF8] hover:bg-[#11244D] transition cursor-pointer"
            >
              Sign In
            </button>
          </div>
        }
      >
        <section className="relative rounded-3xl overflow-hidden hero-glass p-6 sm:p-10 space-y-8">
          <HeroGlobeGraphic variant="desktop" />

          <div className="relative z-10 max-w-xl space-y-4">
            <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-lg bg-[#091533]/85 border border-sky-400/30 text-[11px] font-bold text-[#38BDF8]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Global Problem Discovery &amp; Innovation Platform</span>
            </span>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.12] text-white">
              Welcome to Glow<span className="text-[#38BDF8]">eave</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
              A smarter, more connected world starts with real challenges. Personalise your workspace
              in under a minute to discover high-impact problems, propose solutions, and connect with
              innovators across every continent.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-[#08132B]/85 border border-[#1E386E]/80 space-y-1">
                <Compass className="w-4 h-4 text-[#22D3EE]" />
                <div className="text-xs font-bold text-white">Discover Problems</div>
                <p className="text-[11px] text-slate-400">
                  Track challenges tailored to your industries and region.
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#08132B]/85 border border-[#1E386E]/80 space-y-1">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <div className="text-xs font-bold text-white">Share Solutions</div>
                <p className="text-[11px] text-slate-400">
                  Publish proposals, startups, and verified breakthroughs.
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#08132B]/85 border border-[#1E386E]/80 space-y-1">
                <Users className="w-4 h-4 text-[#38BDF8]" />
                <div className="text-xs font-bold text-white">Connect Globally</div>
                <p className="text-[11px] text-slate-400">
                  Collaborate with researchers, builders, and founders.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPhase('questions')}
                className="px-7 py-3.5 rounded-full btn-royal text-white font-bold text-sm flex items-center space-x-2 cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPhase('signin')}
                className="px-5 py-3.5 rounded-full bg-[#09142E]/85 border border-sky-300/25 text-slate-200 font-semibold text-xs hover:bg-[#11244D] transition cursor-pointer"
              >
                Already registered? Sign In
              </button>
            </div>
          </div>
        </section>
      </OnboardingShell>
    );
  }

  // =========================================================
  // RETURNING USER SIGN-IN
  // =========================================================
  if (phase === 'signin') {
    const handleSignIn = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!signInEmail.trim() || !signInPassword) {
        setError('Enter your email and password.');
        return;
      }
      setBusy(true);
      setError('');
      const res = await signInWithPassword(signInEmail, signInPassword);
      setBusy(false);
      if (!res.ok || !res.session?.user) {
        setError(res.error || 'Unable to sign in.');
        return;
      }
      setSignInPassword('');
      onSignInComplete(res.session.user.email || signInEmail, null);
    };

    return (
      <OnboardingShell
        maxWidthClass="max-w-md"
        headerRight={
          <button
            type="button"
            onClick={() => setPhase('welcome')}
            className="text-xs font-semibold text-[#38BDF8] hover:underline cursor-pointer"
          >
            Back to Welcome
          </button>
        }
      >
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-5 border border-sky-400/25">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Sign in to Gloweave</h2>
            <p className="text-xs text-slate-400 mt-1">
              Access your verified account and personalised dashboard.
            </p>
          </div>

          {!isSupabaseConfigured && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-xs text-amber-200 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Authentication provider is not configured yet (<code>VITE_SUPABASE_URL</code> and{' '}
                <code>VITE_SUPABASE_ANON_KEY</code>).
              </span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                autoComplete="email"
                className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
              />
            </div>

            <PasswordInputField
              id="signin-password"
              label="Password"
              value={signInPassword}
              onChange={setSignInPassword}
              autoComplete="current-password"
            />

            {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

            <button
              type="submit"
              disabled={busy || !isSupabaseConfigured}
              className="w-full py-3 rounded-xl btn-royal text-white font-bold text-xs disabled:opacity-50 cursor-pointer"
            >
              {busy ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => setPhase('questions')}
              className="text-xs font-semibold text-[#38BDF8] hover:underline cursor-pointer"
            >
              New to Gloweave? Start personalised onboarding →
            </button>
          </div>
        </div>
      </OnboardingShell>
    );
  }

  // =========================================================
  // PHASE 2: PERSONALISED ONBOARDING (6 QUESTIONS, 1 AT A TIME)
  // =========================================================
  if (phase === 'questions') {
    const validateCurrentStep = (): boolean => {
      if (step === 0) {
        if (!answers.role) {
          setError('Please choose the option that best describes you.');
          return false;
        }
        if (answers.role === 'Other' && answers.otherRole.trim().length < 2) {
          setError('Please specify how you describe yourself.');
          return false;
        }
      } else if (step === 1) {
        if (answers.interests.length === 0) {
          setError('Please select at least one industry.');
          return false;
        }
      } else if (step === 2) {
        if (!answers.country) {
          setError('Please select your country.');
          return false;
        }
      } else if (step === 3) {
        if (!answers.goal) {
          setError('Please select what brings you to Gloweave.');
          return false;
        }
      } else if (step === 4) {
        if (!answers.contribution) {
          setError('Please select how you would like to contribute.');
          return false;
        }
      } else if (step === 5) {
        if (answers.displayName.trim().length < 2) {
          setError('Please enter your preferred display name (at least 2 characters).');
          return false;
        }
      }
      setError('');
      return true;
    };

    const handleNextStep = () => {
      if (!validateCurrentStep()) return;
      if (step < TOTAL_QUESTIONS - 1) {
        onDraftChange((prev) => ({ ...prev, step: step + 1 }));
      } else {
        setPhase('completion');
      }
    };

    const handlePrevStep = () => {
      setError('');
      if (step > 0) {
        onDraftChange((prev) => ({ ...prev, step: step - 1 }));
      } else {
        setPhase('welcome');
      }
    };

    const toggleIndustry = (industry: string) => {
      const exists = answers.interests.includes(industry);
      updateAnswers({
        interests: exists
          ? answers.interests.filter((item) => item !== industry)
          : [...answers.interests, industry],
      });
    };

    return (
      <OnboardingShell
        maxWidthClass="max-w-xl"
        headerRight={
          <span className="text-[11px] text-slate-400 font-medium">
            Progress saved automatically
          </span>
        }
      >
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-sky-400/25">
          <OnboardingProgressBar
            currentStep={step}
            totalSteps={TOTAL_QUESTIONS}
            label="Personalised Onboarding"
          />

          {/* Question 1 */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  What best describes you?
                </h2>
                <p className="text-xs text-slate-400 mt-1">Select one option.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ROLE_OPTIONS.map((option) => (
                  <OptionSelectCard
                    key={option}
                    label={option}
                    selected={answers.role === option}
                    onClick={() => updateAnswers({ role: option })}
                  />
                ))}
              </div>
              {answers.role === 'Other' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Specify your role
                  </label>
                  <input
                    type="text"
                    value={answers.otherRole}
                    onChange={(e) => updateAnswers({ otherRole: e.target.value })}
                    placeholder="Enter your role"
                    className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                  />
                </div>
              )}
            </div>
          )}

          {/* Question 2 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  Which industries interest you?
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Select all that apply ({answers.interests.length} selected).
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {INDUSTRY_OPTIONS.map((industry) => (
                  <OptionSelectCard
                    key={industry}
                    label={industry}
                    multi
                    selected={answers.interests.includes(industry)}
                    onClick={() => toggleIndustry(industry)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Question 3 */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  Which country are you based in?
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Search or scroll through the A–Z country list.
                </p>
              </div>
              <CountrySelector
                value={answers.country}
                onChange={(country) => updateAnswers({ country })}
                placeholder="Select your country"
              />
            </div>
          )}

          {/* Question 4 */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  What brings you to Gloweave?
                </h2>
                <p className="text-xs text-slate-400 mt-1">Choose your primary goal.</p>
              </div>
              <div className="space-y-2.5">
                {GOAL_OPTIONS.map((goal) => (
                  <OptionSelectCard
                    key={goal}
                    label={goal}
                    selected={answers.goal === goal}
                    onClick={() => updateAnswers({ goal })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Question 5 */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  How would you like to contribute?
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Tell us how you plan to engage with the community.
                </p>
              </div>
              <div className="space-y-2.5">
                {CONTRIBUTION_OPTIONS.map((item) => (
                  <OptionSelectCard
                    key={item}
                    label={item}
                    selected={answers.contribution === item}
                    onClick={() => updateAnswers({ contribution: item })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Question 6 */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  What should we call you?
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your preferred display name for your Gloweave profile.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Preferred Display Name
                </label>
                <input
                  type="text"
                  value={answers.displayName}
                  onChange={(e) => updateAnswers({ displayName: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleNextStep();
                    }
                  }}
                  placeholder="Enter display name"
                  className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-medium">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-[#172B54]">
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2.5 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 hover:border-sky-400/50 flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-xl btn-royal text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </OnboardingShell>
    );
  }

  // =========================================================
  // PHASE 3: ONBOARDING COMPLETION
  // =========================================================
  if (phase === 'completion') {
    return (
      <OnboardingShell maxWidthClass="max-w-xl">
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-sky-400/25">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#38BDF8]">
                Onboarding Complete
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Ready for you, {answers.displayName}
              </h2>
            </div>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed">
            You&apos;re one step closer to connecting with global innovators. Let&apos;s create your
            Gloweave account.
          </p>

          {/* Saved onboarding summary */}
          <div className="p-4 rounded-2xl bg-[#040A1A]/85 border border-[#1E386E] space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Role</span>
              <span className="font-semibold text-white">{effectiveRole}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Country</span>
              <span className="font-semibold text-white">{answers.country}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Goal</span>
              <span className="font-semibold text-white text-right">{answers.goal}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Contribution</span>
              <span className="font-semibold text-white text-right">{answers.contribution}</span>
            </div>
            <div className="pt-2 border-t border-slate-800/80">
              <div className="text-slate-400 mb-1.5">Industries of Interest</div>
              <div className="flex flex-wrap gap-1.5">
                {answers.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-2.5 py-1 rounded-lg bg-[#0A1936] border border-sky-400/30 text-[11px] text-sky-200 font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                onDraftChange((prev) => ({ ...prev, phase: 'questions', step: 5 }));
              }}
              className="px-4 py-2.5 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 hover:border-sky-400/50 flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => setPhase('email')}
              className="px-6 py-3 rounded-xl btn-royal text-white font-bold text-xs flex items-center space-x-2 cursor-pointer"
            >
              <span>Continue to Registration</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </OnboardingShell>
    );
  }

  // =========================================================
  // PHASE 4: EMAIL REGISTRATION
  // =========================================================
  if (phase === 'email') {
    const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

    const handleSubmitEmail = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValidEmail(email)) {
        setError('Please enter a valid email address.');
        return;
      }

      setError('');
      setInfoMessage('');

      if (!isSupabaseConfigured) {
        onDraftChange((prev) => ({
          ...prev,
          verificationEmailSent: false,
          phase: 'verify',
        }));
        return;
      }

      setBusy(true);
      const res = await sendVerificationEmail(email);
      setBusy(false);

      if (!res.ok) {
        setError(res.error || 'Could not send verification email.');
        return;
      }

      setResendCooldown(60);
      onDraftChange((prev) => ({
        ...prev,
        verificationEmailSent: true,
        phase: 'verify',
      }));
    };

    return (
      <OnboardingShell maxWidthClass="max-w-md">
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-5 border border-sky-400/25">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-[#38BDF8] flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
                Registration · Step 1 of 3
              </span>
              <h2 className="text-xl font-extrabold text-white">Enter your email</h2>
            </div>
          </div>

          <div className="px-3.5 py-2.5 rounded-xl bg-[#040A1A] border border-[#1E386E] text-[11px] text-slate-300 flex items-center justify-between gap-2">
            <span className="truncate">
              Saved profile: <strong className="text-white">{answers.displayName}</strong> ·{' '}
              {effectiveRole} ({answers.country})
            </span>
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          </div>

          <form onSubmit={handleSubmitEmail} className="space-y-4">
            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setError('');
                  onDraftChange((prev) => ({
                    ...prev,
                    email: e.target.value,
                    verificationEmailSent: false,
                  }));
                }}
                autoComplete="email"
                placeholder="name@domain.com"
                className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setPhase('completion')}
                className="px-4 py-2.5 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 hover:border-sky-400/50 flex items-center space-x-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-6 py-2.5 rounded-xl btn-royal text-white font-bold text-xs flex items-center space-x-1.5 disabled:opacity-60 cursor-pointer"
              >
                <span>{busy ? 'Sending...' : 'Continue'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </OnboardingShell>
    );
  }

  // =========================================================
  // PHASE 5: EMAIL VERIFICATION
  // =========================================================
  if (phase === 'verify') {
    const handleResend = async () => {
      if (!isSupabaseConfigured || resendCooldown > 0) return;
      setBusy(true);
      setError('');
      setInfoMessage('');
      const res = await sendVerificationEmail(email);
      setBusy(false);
      if (!res.ok) {
        setError(res.error || 'Failed to resend verification email.');
        return;
      }
      setResendCooldown(60);
      onDraftChange((prev) => ({ ...prev, verificationEmailSent: true }));
      setInfoMessage(`Verification email resent to ${email}.`);
    };

    const handleCheckStatus = async () => {
      if (!isSupabaseConfigured) return;
      setBusy(true);
      setError('');
      setInfoMessage('');
      const { session, emailVerified: verified } = await getVerifiedEmailSession();
      setBusy(false);
      if (verified && session) {
        setEmailVerified(true);
        setPhase('password');
      } else {
        setInfoMessage(
          'Your email is still pending verification. Please click the verification link in your inbox or enter the verification code.'
        );
      }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!otpCode.trim()) {
        setError('Enter the verification code from your email.');
        return;
      }
      setBusy(true);
      setError('');
      setInfoMessage('');
      const res = await verifyEmailToken(email, otpCode);
      setBusy(false);
      if (!res.ok || !res.session) {
        setError(res.error || 'Invalid or expired verification code.');
        return;
      }
      setEmailVerified(true);
      setPhase('password');
    };

    return (
      <OnboardingShell maxWidthClass="max-w-md">
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-5 border border-sky-400/25">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-[#38BDF8] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
                Registration · Step 2 of 3
              </span>
              <h2 className="text-xl font-extrabold text-white">Verify your email</h2>
            </div>
          </div>

          {/* Verification Status Box */}
          <div className="p-3.5 rounded-xl bg-[#040A1A] border border-[#1E386E] flex items-center justify-between text-xs">
            <span className="text-slate-400">Verification Status</span>
            {!isSupabaseConfigured ? (
              <span className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-400/40 text-amber-300 font-semibold">
                Provider Not Configured
              </span>
            ) : emailVerified ? (
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-semibold">
                Verified
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-md bg-sky-500/20 border border-sky-400/40 text-sky-300 font-semibold">
                Pending Verification
              </span>
            )}
          </div>

          {!isSupabaseConfigured ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/35 space-y-2.5 text-xs text-amber-100">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="font-semibold">
                  Real email verification requires Supabase Auth to be configured.
                </p>
              </div>
              <p className="text-amber-200/85 leading-relaxed">
                Your onboarding answers for <strong>{answers.displayName}</strong> and email{' '}
                <strong>{email}</strong> are safely saved. Once{' '}
                <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> are
                configured, Gloweave will send a real verification link to your inbox before
                unlocking password creation.
              </p>
            </div>
          ) : (
            <>
              <div className="p-4 rounded-xl bg-[#071530] border border-sky-400/30 space-y-1.5">
                <p className="text-xs text-slate-100 leading-relaxed">
                  {verificationEmailSent
                    ? "We've sent a verification link to your email. Please check your inbox to verify your address."
                    : `Ready to send verification link to ${email}.`}
                </p>
                <p className="text-[11px] text-[#38BDF8] font-semibold truncate">{email}</p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    Or enter verification code from email
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter verification code"
                      className="flex-1 bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                    />
                    <button
                      type="submit"
                      disabled={busy}
                      className="px-4 py-2 rounded-xl btn-royal text-white font-bold text-xs cursor-pointer disabled:opacity-60"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleCheckStatus}
                  disabled={busy}
                  className="px-4 py-2.5 rounded-xl bg-[#0A1633] border border-sky-400/40 text-xs font-semibold text-[#38BDF8] hover:bg-[#11244D] flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check Status</span>
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={busy || resendCooldown > 0}
                  className="px-4 py-2.5 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 hover:border-sky-400/40 disabled:opacity-50 cursor-pointer"
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend verification email'}
                </button>
              </div>
            </>
          )}

          {infoMessage && (
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-400/30 text-xs text-sky-200">
              {infoMessage}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setPhase('email')}
              className="text-xs font-semibold text-[#38BDF8] hover:underline cursor-pointer"
            >
              Change email address
            </button>
            <button
              type="button"
              onClick={onEnterGuestPreview}
              className="text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
            >
              Preview Dashboard (No Account)
            </button>
          </div>
        </div>
      </OnboardingShell>
    );
  }

  // =========================================================
  // PHASE 6 & 7: PASSWORD CREATION & ACCOUNT CREATION
  // =========================================================
  if (!isSupabaseConfigured || !emailVerified) {
    return (
      <OnboardingShell maxWidthClass="max-w-md">
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4 border border-amber-400/30 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-300 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-white">Email Verification Required</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Password creation is locked until your email address is verified.
          </p>
          <button
            type="button"
            onClick={() => setPhase('verify')}
            className="px-5 py-2.5 rounded-xl btn-royal text-white font-bold text-xs cursor-pointer"
          >
            Return to Verification
          </button>
        </div>
      </OnboardingShell>
    );
  }

  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isPasswordValid = hasMinLen && hasUpper && hasLower && hasNumber && passwordsMatch;

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Please meet all password requirements and confirm your password.');
      return;
    }
    setBusy(true);
    setError('');
    const result = await completeAccountRegistration({
      password,
      onboarding: answers,
    });
    setBusy(false);

    if (!result.ok || !result.profile) {
      setError(result.error || 'Could not complete registration.');
      return;
    }

    // Clear ephemeral password immediately after submission
    setPassword('');
    setConfirmPassword('');
    onRegistrationComplete(result.profile);
  };

  return (
    <OnboardingShell maxWidthClass="max-w-md">
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-5 border border-sky-400/25">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Email Verified · Final Step
            </span>
            <h2 className="text-xl font-extrabold text-white">Create your password</h2>
          </div>
        </div>

        <form onSubmit={handleCreateAccount} className="space-y-4">
          <PasswordInputField
            id="create-password"
            label="Create Password"
            value={password}
            onChange={(v) => {
              setError('');
              setPassword(v);
            }}
            autoComplete="new-password"
          />

          <PasswordInputField
            id="confirm-password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(v) => {
              setError('');
              setConfirmPassword(v);
            }}
            autoComplete="new-password"
          />

          <div className="p-3.5 rounded-xl bg-[#040A1A] border border-[#1E386E] grid grid-cols-2 gap-2 text-[11px]">
            {[
              { ok: hasMinLen, text: '8+ characters' },
              { ok: hasUpper, text: 'Uppercase letter' },
              { ok: hasLower, text: 'Lowercase letter' },
              { ok: hasNumber, text: 'At least 1 number' },
              { ok: passwordsMatch, text: 'Passwords match' },
            ].map((rule) => (
              <div
                key={rule.text}
                className={`flex items-center space-x-1.5 ${
                  rule.ok ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                <Check className="w-3 h-3 shrink-0" />
                <span>{rule.text}</span>
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !isPasswordValid}
            className="w-full py-3 rounded-xl btn-royal text-white font-bold text-xs disabled:opacity-50 cursor-pointer"
          >
            {busy ? 'Creating your Gloweave account...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </OnboardingShell>
  );
};
