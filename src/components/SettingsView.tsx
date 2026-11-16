import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Bookmark,
  Camera,
  Check,
  CheckCircle2,
  Crown,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Languages,
  LifeBuoy,
  Loader2,
  LogOut,
  Mail,
  Scale,
  Settings,
  Shield,
  Trash2,
  User,
} from 'lucide-react';
import {
  isSupabaseConfigured,
  updateAccountEmail,
  updateAccountPassword,
  updateUserProfile,
} from '../lib/supabase';
import {
  LegalDocumentId,
  MatchItem,
  ProblemItem,
  SettingsTabId,
  SolutionItem,
  SupportTabId,
  UserSettingsPreferences,
} from '../types/gloweave';
import { CountrySelector } from './CountrySelector';
import { AvatarBadge } from './VisualThumbnails';

interface SettingsViewProps {
  activeTab: SettingsTabId;
  onSelectTab: (tab: SettingsTabId) => void;
  authenticatedUser: { id: string; email: string } | null;
  isPro: boolean;
  profileName: string;
  profileRole: string;
  profileLocation: string;
  profilePhotoUrl: string | null;
  preferences: UserSettingsPreferences;
  savedProblems: ProblemItem[];
  savedSolutions: SolutionItem[];
  savedMatches: MatchItem[];
  onUpdateProfile: (updates: { name?: string; role?: string; location?: string }) => void;
  onUploadPhoto: (dataUrl: string) => void;
  onRemovePhoto: () => void;
  onUpdatePreferences: (next: UserSettingsPreferences) => void;
  onOpenUpgrade: () => void;
  onOpenSupport: (subTab?: SupportTabId) => void;
  onOpenLegal: (docId?: LegalDocumentId) => void;
  onSelectProblem: (problem: ProblemItem) => void;
  onSelectSolution: (solution: SolutionItem) => void;
  onToggleProblemBookmark: (id: string) => void;
  onToggleSolutionBookmark: (id: string) => void;
  onToggleMatchBookmark: (id: string) => void;
  onRequestSignOut: () => void;
  onRequestDeleteAccount: () => void;
  onRequireAuth?: (actionLabel: string) => void;
  onToast: (msg: string) => void;
}

const SETTINGS_SECTIONS: {
  id: SettingsTabId;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'account', label: 'Account Info', icon: User },
  { id: 'profile', label: 'Edit Profile', icon: Settings },
  { id: 'email', label: 'Change Email', icon: Mail },
  { id: 'password', label: 'Change Password', icon: KeyRound },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'language', label: 'Language', icon: Languages },
  { id: 'saved', label: 'Saved Items', icon: Bookmark },
  { id: 'support', label: 'Help & Support', icon: LifeBuoy },
  { id: 'legal', label: 'Legal & Policies', icon: Scale },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  activeTab,
  onSelectTab,
  authenticatedUser,
  isPro,
  profileName,
  profileRole,
  profileLocation,
  profilePhotoUrl,
  preferences,
  savedProblems,
  savedSolutions,
  savedMatches,
  onUpdateProfile,
  onUploadPhoto,
  onRemovePhoto,
  onUpdatePreferences,
  onOpenUpgrade,
  onOpenSupport,
  onOpenLegal,
  onSelectProblem,
  onSelectSolution,
  onToggleProblemBookmark,
  onToggleSolutionBookmark,
  onToggleMatchBookmark,
  onRequestSignOut,
  onRequestDeleteAccount,
  onRequireAuth,
  onToast,
}) => {
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Edit Profile form state
  const [editName, setEditName] = useState(profileName);
  const [editRole, setEditRole] = useState(profileRole);
  const [editLocation, setEditLocation] = useState(profileLocation);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Change Email state
  const [newEmail, setNewEmail] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const totalSavedCount = savedProblems.length + savedSolutions.length + savedMatches.length;

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onToast('Please choose an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUploadPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileStatus(null);
    if (!authenticatedUser) {
      onRequireAuth?.('save profile changes');
      return;
    }
    if (editName.trim().length < 2) {
      setProfileStatus({ type: 'error', text: 'Display name must be at least 2 characters.' });
      return;
    }

    onUpdateProfile({
      name: editName.trim(),
      role: editRole.trim(),
      location: editLocation.trim(),
    });

    if (authenticatedUser && isSupabaseConfigured) {
      setProfileBusy(true);
      const res = await updateUserProfile({
        userId: authenticatedUser.id,
        displayName: editName.trim(),
        roleIdentity: editRole.trim() || 'Member',
        country: editLocation.trim() || 'Global',
        avatarUrl: profilePhotoUrl,
      });
      setProfileBusy(false);

      if (!res.ok) {
        setProfileStatus({
          type: 'error',
          text: res.error || 'Could not update profile in PostgreSQL.',
        });
        return;
      }

      setProfileStatus({
        type: 'success',
        text: 'Profile updated and saved to your account database.',
      });
      onToast('Profile updated.');
    } else {
      setProfileStatus({
        type: 'info',
        text: 'Saved in local session. Sign in with Supabase Auth configured to persist changes to your account database.',
      });
      onToast('Profile updated locally.');
    }
  };

  const handleEmailChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      setEmailStatus({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    if (authenticatedUser && newEmail.trim().toLowerCase() === authenticatedUser.email.toLowerCase()) {
      setEmailStatus({ type: 'error', text: 'New email must differ from your current email.' });
      return;
    }

    setEmailBusy(true);
    const res = await updateAccountEmail(newEmail);
    setEmailBusy(false);

    if (!res.ok) {
      setEmailStatus({ type: 'error', text: res.error || 'Unable to update email.' });
      return;
    }

    setEmailStatus({
      type: 'success',
      text: `Verification links sent. Please confirm the change in both your current and new (${newEmail.trim()}) inboxes.`,
    });
    setNewEmail('');
    onToast('Email confirmation sent.');
  };

  const hasMinLen = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmNewPassword;
  const isPasswordValid = hasMinLen && hasUpper && hasLower && hasNumber && passwordsMatch;

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);
    if (!isPasswordValid) {
      setPasswordStatus({
        type: 'error',
        text: 'Please meet all password requirements and confirm your new password.',
      });
      return;
    }

    setPasswordBusy(true);
    const res = await updateAccountPassword({
      newPassword,
      currentEmail: authenticatedUser?.email,
      currentPassword: currentPassword || undefined,
    });
    setPasswordBusy(false);

    if (!res.ok) {
      setPasswordStatus({ type: 'error', text: res.error || 'Unable to update password.' });
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordStatus({
      type: 'success',
      text: 'Your account password has been updated.',
    });
    onToast('Password updated.');
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center space-x-2.5">
            <Settings className="w-6 h-6 text-[#38BDF8]" />
            <span>Settings &amp; Account Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage account security, profile details, preferences, saved intelligence, and policies.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            type="button"
            onClick={() => onOpenSupport('help-center')}
            className="px-3.5 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 hover:border-sky-400/50 cursor-pointer"
          >
            Help &amp; Support
          </button>
          <button
            type="button"
            onClick={() => onOpenLegal('privacy')}
            className="px-3.5 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-[#38BDF8] hover:border-sky-400/50 cursor-pointer"
          >
            Legal Policies
          </button>
        </div>
      </div>

      {!authenticatedUser && (
        <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-400/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-200 leading-relaxed">
            <strong className="text-[#38BDF8]">Review Mode:</strong> You can review Settings, Help
            &amp; Support, and Legal Policies freely. Sign in or create an account to edit profile
            details, change credentials, or save preferences.
          </div>
          <button
            type="button"
            onClick={() => onRequireAuth?.('manage your account settings')}
            className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold shrink-0 cursor-pointer"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* Main Layout: Left Sidebar Nav + Content Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-4 xl:col-span-3 glass-card rounded-2xl p-2.5 space-y-1">
          {SETTINGS_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const active = activeTab === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => onSelectTab(sec.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  active
                    ? 'btn-royal text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#38BDF8]'}`} />
                  <span>{sec.label}</span>
                </span>
                {sec.id === 'saved' && (
                  <span className="px-2 py-0.5 rounded-md bg-[#040A1A]/70 text-[10px] tabular-nums">
                    {totalSavedCount}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 mt-2 border-t border-[#172B54]/80 space-y-1">
            <button
              type="button"
              onClick={onRequestSignOut}
              className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.04] transition cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-sky-400" />
              <span>{authenticatedUser ? 'Sign Out' : 'Sign In / Create Account'}</span>
            </button>
            {authenticatedUser && (
              <button
                type="button"
                onClick={onRequestDeleteAccount}
                className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account</span>
              </button>
            )}
          </div>
        </aside>

        {/* Right Panel */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* 1. ACCOUNT INFORMATION */}
          {activeTab === 'account' && (
            <div className="space-y-5">
              <div className="glass-card p-6 rounded-2xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center space-x-3.5">
                    <AvatarBadge
                      photoUrl={profilePhotoUrl}
                      alt={profileName || 'Profile picture'}
                      size="lg"
                      accentFrom="#0066FF"
                      accentTo="#22D3EE"
                    />
                    <div>
                      <h3 className="text-base font-extrabold text-white">
                        {profileName || 'Guest Preview Session'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {authenticatedUser ? authenticatedUser.email : 'No email signed in'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-lg border text-[11px] font-bold self-start ${
                      authenticatedUser
                        ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300'
                        : 'bg-amber-500/15 border-amber-400/35 text-amber-300'
                    }`}
                  >
                    {authenticatedUser ? 'Verified Authenticated Account' : 'Unauthenticated Preview'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#040A1A] border border-[#1E386E]">
                    <div className="text-[11px] text-slate-400">Account Email</div>
                    <div className="font-bold text-white mt-0.5 truncate">
                      {authenticatedUser?.email || 'Not signed in'}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#040A1A] border border-[#1E386E]">
                    <div className="text-[11px] text-slate-400">Role / Country</div>
                    <div className="font-bold text-white mt-0.5 truncate">
                      {[profileRole, profileLocation].filter(Boolean).join(' · ') || 'Not set'}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#040A1A] border border-[#1E386E]">
                    <div className="text-[11px] text-slate-400">Authentication Backend</div>
                    <div className="font-bold text-white mt-0.5">
                      {isSupabaseConfigured
                        ? 'Supabase Auth Configured'
                        : 'Awaiting Auth Provider Config'}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#040A1A] border border-[#1E386E] flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[11px] text-slate-400">Plan Tier</div>
                      <div className="font-bold text-white mt-0.5">
                        {isPro ? 'Pro Access' : 'Standard'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenUpgrade}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] text-slate-950 font-extrabold text-[11px] flex items-center space-x-1 cursor-pointer"
                    >
                      <Crown className="w-3 h-3" />
                      <span>{isPro ? 'Pro' : 'Upgrade'}</span>
                    </button>
                  </div>
                </div>

                {authenticatedUser && (
                  <div className="p-3 rounded-xl bg-[#040A1A] border border-[#1E386E] text-[11px] text-slate-400 flex items-center justify-between gap-2">
                    <span>Account ID</span>
                    <code className="text-sky-300 font-mono truncate">{authenticatedUser.id}</code>
                  </div>
                )}

                <div className="flex flex-wrap gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => onSelectTab('profile')}
                    className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectTab('email')}
                    className="px-4 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 hover:border-sky-400/50 cursor-pointer"
                  >
                    Change Email
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectTab('password')}
                    className="px-4 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 hover:border-sky-400/50 cursor-pointer"
                  >
                    Change Password
                  </button>
                </div>
              </div>

              {/* Danger Zone Quick Access */}
              <div className="glass-card p-5 rounded-2xl border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white">Session &amp; Account Removal</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sign out safely or request account deletion. Confirmation is required for both.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onRequestSignOut}
                    className="px-4 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 hover:border-sky-400/50 cursor-pointer"
                  >
                    Sign Out
                  </button>
                  <button
                    type="button"
                    onClick={onRequestDeleteAccount}
                    className="px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs font-bold text-rose-300 hover:bg-rose-500/25 cursor-pointer"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. EDIT PROFILE */}
          {activeTab === 'profile' && (
            <div className="glass-card p-6 rounded-2xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-white">Edit Profile</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Update your display name, role, country, and profile photo.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-[#040A1A] border border-[#1E386E] text-[10px] font-semibold text-[#38BDF8]">
                  {authenticatedUser && isSupabaseConfigured
                    ? 'Synced with PostgreSQL'
                    : 'Local Session Storage'}
                </span>
              </div>

              <div className="flex items-center space-x-4 p-4 rounded-xl bg-[#040A1A] border border-[#1E386E]">
                <AvatarBadge
                  photoUrl={profilePhotoUrl}
                  alt={profileName || 'Profile picture'}
                  size="lg"
                  accentFrom="#0066FF"
                  accentTo="#22D3EE"
                />
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-white">Profile Picture</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!authenticatedUser) {
                          onRequireAuth?.('upload a profile photo');
                          return;
                        }
                        photoInputRef.current?.click();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#0A1633] border border-[#1E386E] text-[11px] font-semibold text-[#38BDF8] flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{profilePhotoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                    </button>
                    {profilePhotoUrl && (
                      <button
                        type="button"
                        onClick={onRemovePhoto}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] font-semibold text-rose-300 cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => {
                        setEditName(e.target.value);
                        setProfileStatus(null);
                      }}
                      placeholder="Your name"
                      className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Role / Bio
                    </label>
                    <input
                      type="text"
                      value={editRole}
                      onChange={(e) => {
                        setEditRole(e.target.value);
                        setProfileStatus(null);
                      }}
                      placeholder="e.g. Researcher, Founder, Developer"
                      className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Country
                  </label>
                  <CountrySelector
                    value={editLocation}
                    onChange={(country) => {
                      setEditLocation(country);
                      setProfileStatus(null);
                    }}
                    placeholder="Select your country"
                  />
                </div>

                {profileStatus && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${
                      profileStatus.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-400/35 text-emerald-200'
                        : profileStatus.type === 'error'
                        ? 'bg-rose-500/10 border-rose-500/35 text-rose-300'
                        : 'bg-sky-500/10 border-sky-400/35 text-sky-200'
                    }`}
                  >
                    {profileStatus.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{profileStatus.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={profileBusy}
                  className="px-5 py-2.5 rounded-xl btn-royal text-white text-xs font-bold flex items-center space-x-2 cursor-pointer disabled:opacity-60"
                >
                  {profileBusy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{profileBusy ? 'Saving Profile...' : 'Save Profile Changes'}</span>
                </button>
              </form>
            </div>
          )}

          {/* 3. CHANGE EMAIL */}
          {activeTab === 'email' && (
            <div className="glass-card p-6 rounded-2xl space-y-5 max-w-xl">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-white">Change Email Address</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Update the email used for verification and sign-in.
                  </p>
                </div>
                {(!isSupabaseConfigured || !authenticatedUser) && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/35 text-[10px] font-bold text-amber-300">
                    {!isSupabaseConfigured
                      ? 'Awaiting Auth Backend Config'
                      : 'Sign-In Required'}
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-[#040A1A] border border-[#1E386E] text-xs flex items-center justify-between">
                <span className="text-slate-400">Current Email</span>
                <span className="font-bold text-white">
                  {authenticatedUser?.email || 'Not signed in'}
                </span>
              </div>

              <form onSubmit={handleEmailChangeSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    New Email Address
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      setEmailStatus(null);
                    }}
                    placeholder="new-email@domain.com"
                    className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                  />
                </div>

                {emailStatus && (
                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      emailStatus.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-400/35 text-emerald-200'
                        : 'bg-rose-500/10 border-rose-500/35 text-rose-300'
                    }`}
                  >
                    {emailStatus.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={emailBusy}
                  className="px-5 py-2.5 rounded-xl btn-royal text-white text-xs font-bold flex items-center space-x-2 cursor-pointer disabled:opacity-60"
                >
                  {emailBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{emailBusy ? 'Sending Confirmation...' : 'Send Email Change Link'}</span>
                </button>
              </form>
            </div>
          )}

          {/* 4. CHANGE PASSWORD */}
          {activeTab === 'password' && (
            <div className="glass-card p-6 rounded-2xl space-y-5 max-w-xl">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-white">Change Password</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Set a strong new password for your Gloweave account.
                  </p>
                </div>
                {(!isSupabaseConfigured || !authenticatedUser) && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/35 text-[10px] font-bold text-amber-300">
                    {!isSupabaseConfigured
                      ? 'Awaiting Auth Backend Config'
                      : 'Sign-In Required'}
                  </span>
                )}
              </div>

              <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowPasswords((prev) => !prev)}
                    className="text-[11px] font-semibold text-[#38BDF8] flex items-center space-x-1 cursor-pointer"
                  >
                    {showPasswords ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hide passwords</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Show passwords</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Current Password (optional verification)
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPasswordStatus(null);
                    }}
                    autoComplete="current-password"
                    className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    New Password
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordStatus(null);
                    }}
                    autoComplete="new-password"
                    className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value);
                      setPasswordStatus(null);
                    }}
                    autoComplete="new-password"
                    className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-400"
                  />
                </div>

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

                {passwordStatus && (
                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      passwordStatus.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-400/35 text-emerald-200'
                        : 'bg-rose-500/10 border-rose-500/35 text-rose-300'
                    }`}
                  >
                    {passwordStatus.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={passwordBusy}
                  className="px-5 py-2.5 rounded-xl btn-royal text-white text-xs font-bold flex items-center space-x-2 cursor-pointer disabled:opacity-60"
                >
                  {passwordBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{passwordBusy ? 'Updating Password...' : 'Update Password'}</span>
                </button>
              </form>
            </div>
          )}

          {/* 5. NOTIFICATION PREFERENCES */}
          {activeTab === 'notifications' && (
            <div className="glass-card p-6 rounded-2xl space-y-5 max-w-2xl">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-white">Notification Preferences</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Choose which Gloweave intelligence and evidence alerts you want enabled.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/35 text-[10px] font-bold text-amber-300">
                  Saved Locally · Email/Push Sync Awaiting Backend
                </span>
              </div>

              <div className="space-y-3">
                {(
                  [
                    {
                      key: 'batchUpdates',
                      label: 'Scheduled Batch Analysis Updates',
                      desc: 'Alert when submitted resource links move through the 24–48h batch window.',
                    },
                    {
                      key: 'solutionVerification',
                      label: 'Solution Evidence & Status Changes',
                      desc: 'Notify when submitted evidence changes between Under review, Verification required, or Solved.',
                    },
                    {
                      key: 'matchAlerts',
                      label: 'Potential Matchmaking Alerts',
                      desc: 'Notify when AI-suggested or verified matches align with your tracked problems.',
                    },
                    {
                      key: 'weeklyDigest',
                      label: 'Weekly Global Intelligence Digest',
                      desc: 'Summary of newly discovered global problems and verified solutions.',
                    },
                  ] as const
                ).map((item) => (
                  <label
                    key={item.key}
                    className="p-4 rounded-xl bg-[#040A1A] border border-[#1E386E] flex items-center justify-between gap-4 cursor-pointer hover:border-sky-400/40 transition"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{item.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.notifications[item.key]}
                      onChange={(e) => {
                        onUpdatePreferences({
                          ...preferences,
                          notifications: {
                            ...preferences.notifications,
                            [item.key]: e.target.checked,
                          },
                        });
                        onToast('Notification preference updated locally.');
                      }}
                      className="w-4 h-4 accent-[#19C8FF] shrink-0"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 6. PRIVACY SETTINGS */}
          {activeTab === 'privacy' && (
            <div className="glass-card p-6 rounded-2xl space-y-5 max-w-2xl">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-white">Privacy Settings</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Control how your profile and contributions appear across Gloweave.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/35 text-[10px] font-bold text-amber-300">
                  Saved Locally · Server Enforcement Awaiting Backend
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#040A1A] border border-[#1E386E] space-y-2.5">
                <div className="text-xs font-bold text-white">Profile Visibility</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(
                    [
                      {
                        id: 'community',
                        title: 'Community Members',
                        desc: 'Visible to logged-in contributors and matchmakers.',
                      },
                      {
                        id: 'private',
                        title: 'Private',
                        desc: 'Hide your profile from community discovery directories.',
                      },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onUpdatePreferences({
                          ...preferences,
                          privacy: { ...preferences.privacy, profileVisibility: opt.id },
                        });
                        onToast(`Profile visibility set to ${opt.title} (local).`);
                      }}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        preferences.privacy.profileVisibility === opt.id
                          ? 'bg-[#0066FF]/20 border-sky-400/60 text-white'
                          : 'bg-[#071129] border-[#1E386E] text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{opt.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {(
                  [
                    {
                      key: 'showCountry',
                      label: 'Show Country on Profile',
                      desc: 'Display your selected country alongside your role in contributor listings.',
                    },
                    {
                      key: 'allowDirectMessages',
                      label: 'Allow Collaborator Messages',
                      desc: 'Let matched problem solvers and founders start direct collaboration threads.',
                    },
                    {
                      key: 'publicSubmissionAttribution',
                      label: 'Attribute Evidence Submissions to Profile',
                      desc: 'Display your display name on approved solution evidence records.',
                    },
                  ] as const
                ).map((item) => (
                  <label
                    key={item.key}
                    className="p-4 rounded-xl bg-[#040A1A] border border-[#1E386E] flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{item.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.privacy[item.key]}
                      onChange={(e) => {
                        onUpdatePreferences({
                          ...preferences,
                          privacy: { ...preferences.privacy, [item.key]: e.target.checked },
                        });
                        onToast('Privacy preference updated locally.');
                      }}
                      className="w-4 h-4 accent-[#19C8FF] shrink-0"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 7. LANGUAGE PREFERENCES */}
          {activeTab === 'language' && (
            <div className="glass-card p-6 rounded-2xl space-y-5 max-w-xl">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-white">Language Preferences</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select your preferred interface language.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/35 text-[10px] font-bold text-amber-300">
                  Additional Locales Awaiting Backend
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: 'English (Default)', available: true, note: 'Active interface language' },
                  { name: 'French (Français)', available: false, note: 'Awaiting translation pack' },
                  { name: 'Spanish (Español)', available: false, note: 'Awaiting translation pack' },
                  { name: 'Portuguese (Português)', available: false, note: 'Awaiting translation pack' },
                ].map((lang) => (
                  <button
                    key={lang.name}
                    type="button"
                    onClick={() => {
                      if (!lang.available) {
                        onToast(`${lang.name} translation pack is awaiting localisation integration.`);
                        return;
                      }
                      onUpdatePreferences({ ...preferences, language: lang.name });
                      onToast(`Interface language set to ${lang.name}.`);
                    }}
                    className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-left transition cursor-pointer ${
                      preferences.language === lang.name
                        ? 'bg-[#0066FF]/20 border-sky-400/60 text-white'
                        : 'bg-[#040A1A] border-[#1E386E] text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center space-x-2">
                        <Globe className="w-3.5 h-3.5 text-[#38BDF8]" />
                        <span>{lang.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 pl-5">{lang.note}</div>
                    </div>
                    {preferences.language === lang.name ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-semibold">Pending</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 8. SAVED ITEMS */}
          {activeTab === 'saved' && (
            <div className="glass-card p-6 rounded-2xl space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-white">Saved Items</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bookmarked problems, solution evidence, and matches ({totalSavedCount} saved).
                </p>
              </div>

              {totalSavedCount === 0 ? (
                <div className="p-6 rounded-xl bg-[#040A1A] border border-[#1E386E] text-center space-y-2">
                  <p className="text-xs font-semibold text-white">0 saved items yet</p>
                  <p className="text-xs text-slate-400">
                    Bookmark problems, matches, or solution evidence to track them here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedProblems.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl bg-[#040A1A] border border-[#1E386E] flex items-center justify-between gap-3"
                    >
                      <button
                        type="button"
                        onClick={() => onSelectProblem(p)}
                        className="text-left flex-1 cursor-pointer"
                      >
                        <span className="text-[10px] font-bold text-purple-300">SAVED PROBLEM</span>
                        <h4 className="text-xs sm:text-sm font-bold text-white">{p.title}</h4>
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleProblemBookmark(p.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#0A1633] border border-[#1E386E] text-xs text-slate-300 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {savedSolutions.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-xl bg-[#040A1A] border border-[#1E386E] flex items-center justify-between gap-3"
                    >
                      <button
                        type="button"
                        onClick={() => onSelectSolution(s)}
                        className="text-left flex-1 cursor-pointer"
                      >
                        <span className="text-[10px] font-bold text-emerald-300">
                          SAVED SOLUTION
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white">{s.name}</h4>
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleSolutionBookmark(s.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#0A1633] border border-[#1E386E] text-xs text-slate-300 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {savedMatches.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-xl bg-[#040A1A] border border-[#1E386E] flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-[#38BDF8]">SAVED MATCH</span>
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {m.candidateName}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">{m.candidateSubtitle}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleMatchBookmark(m.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#0A1633] border border-[#1E386E] text-xs text-slate-300 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 9. HELP & SUPPORT LAUNCHER */}
          {activeTab === 'support' && (
            <div className="glass-card p-6 rounded-2xl space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-white">Help &amp; Support</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Open any support resource or report a technical or content issue.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {(
                  [
                    {
                      id: 'help-center',
                      title: 'Help Center',
                      desc: 'Guides on batch submissions, matching, and verification.',
                    },
                    {
                      id: 'faq',
                      title: 'Frequently Asked Questions',
                      desc: 'Answers on 24–48h turnaround, statuses, and account setup.',
                    },
                    {
                      id: 'contact',
                      title: 'Contact Support',
                      desc: 'Draft an inquiry for account, privacy, or submission support.',
                    },
                    {
                      id: 'report',
                      title: 'Report a Problem',
                      desc: 'Flag broken links, inaccurate matches, or community concerns.',
                    },
                    {
                      id: 'about',
                      title: 'About Gloweave',
                      desc: 'Platform mission, workflow overview, and build details.',
                    },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onOpenSupport(item.id)}
                    className="text-left p-4 rounded-xl bg-[#040A1A] border border-[#1E386E] hover:border-sky-400/50 transition space-y-1 cursor-pointer"
                  >
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>{item.title}</span>
                      <span className="text-[#38BDF8]">Open →</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 10. LEGAL & POLICIES LAUNCHER */}
          {activeTab === 'legal' && (
            <div className="glass-card p-6 rounded-2xl space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-white">Legal &amp; Policies</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  All documents are clearly labeled as working drafts pending formal legal review.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {(
                  [
                    {
                      id: 'privacy',
                      title: 'Privacy Policy',
                      desc: 'Data collected, browser storage, and account rights (Draft).',
                    },
                    {
                      id: 'terms',
                      title: 'Terms and Conditions',
                      desc: 'Platform rules, link submissions, and batch turnaround terms (Draft).',
                    },
                    {
                      id: 'guidelines',
                      title: 'Community Guidelines',
                      desc: 'Constructive collaboration and honest evidence rules (Draft).',
                    },
                    {
                      id: 'data-ai',
                      title: 'Data and AI Policy',
                      desc: 'AI-suggested vs verified separation and batch analysis limits (Draft).',
                    },
                  ] as const
                ).map((docItem) => (
                  <button
                    key={docItem.id}
                    type="button"
                    onClick={() => onOpenLegal(docItem.id)}
                    className="text-left p-4 rounded-xl bg-[#040A1A] border border-[#1E386E] hover:border-sky-400/50 transition space-y-1 cursor-pointer"
                  >
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>{docItem.title}</span>
                      <span className="text-[#38BDF8]">Read →</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{docItem.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
