import React, { useState } from 'react';
import { Check, Eye, EyeOff, Globe } from 'lucide-react';

interface OnboardingShellProps {
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  maxWidthClass?: string;
}

export const OnboardingShell: React.FC<OnboardingShellProps> = ({
  children,
  headerRight,
  maxWidthClass = 'max-w-2xl',
}) => (
  <div className="min-h-screen text-slate-100 antialiased selection:bg-[#19C8FF] selection:text-slate-900 flex flex-col justify-between p-4 sm:p-6 md:p-8">
    {/* Brand Header */}
    <header className="w-full max-w-5xl mx-auto flex items-center justify-between gap-4">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#19C8FF] flex items-center justify-center shadow-[0_0_18px_rgba(25,200,255,0.4)] shrink-0">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-tight text-white">Gloweave</h1>
          <p className="text-[10px] text-sky-200/70 tracking-wider uppercase font-medium">
            Discover • Connect • Innovate
          </p>
        </div>
      </div>
      {headerRight}
    </header>

    {/* Centered Stage */}
    <main className={`w-full ${maxWidthClass} mx-auto my-8`}>{children}</main>

    <footer className="w-full max-w-5xl mx-auto text-center text-[11px] text-slate-500">
      Gloweave Global Problem Discovery &amp; Innovation Network
    </footer>
  </div>
);

interface OnboardingProgressBarProps {
  currentStep: number; // 0-indexed
  totalSteps: number;
  label?: string;
}

export const OnboardingProgressBar: React.FC<OnboardingProgressBarProps> = ({
  currentStep,
  totalSteps,
  label,
}) => {
  const stepNum = currentStep + 1;
  const percent = Math.round((stepNum / totalSteps) * 100);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-[#38BDF8] tabular-nums">
          Step {stepNum} of {totalSteps}
        </span>
        <span className="text-slate-400 font-medium tabular-nums">
          {label ? `${label} · ` : ''}
          {percent}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#060E22] border border-[#1E386E]/70 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#0066FF] to-[#22D3EE] transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

interface OptionSelectCardProps {
  label: string;
  selected: boolean;
  multi?: boolean;
  onClick: () => void;
}

export const OptionSelectCard: React.FC<OptionSelectCardProps> = ({
  label,
  selected,
  multi = false,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 transition cursor-pointer ${
      selected
        ? 'bg-[#0066FF]/20 border-[#38BDF8]/70 text-white shadow-[0_0_20px_-6px_rgba(56,189,248,0.45)]'
        : 'bg-[#071129]/80 border-[#1A3160]/80 text-slate-200 hover:border-sky-400/40 hover:bg-[#0B1A3D]'
    }`}
  >
    <span>{label}</span>
    <span
      className={`w-5 h-5 ${multi ? 'rounded-md' : 'rounded-full'} border flex items-center justify-center shrink-0 transition ${
        selected
          ? 'bg-[#0073FF] border-[#38BDF8] text-white'
          : 'border-slate-600 bg-[#040A1A]'
      }`}
    >
      {selected && <Check className="w-3 h-3" />}
    </span>
  </button>
);

interface PasswordInputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
}

export const PasswordInputField: React.FC<PasswordInputFieldProps> = ({
  id,
  label,
  value,
  onChange,
  autoComplete = 'new-password',
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
