import React, { useState } from 'react';
import {
  Bell,
  Boxes,
  ChevronDown,
  Compass,
  Crown,
  Globe,
  Home,
  Lightbulb,
  LineChart,
  LogOut,
  Menu,
  MessageSquare,
  MoreVertical,
  Network,
  PieChart,
  Plus,
  Rocket,
  Search,
  Settings,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { CONTINENTS } from '../data/countries';
import { NavView, RegionFilter } from '../types/gloweave';
import { AvatarBadge } from './VisualThumbnails';

interface SidebarProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  unreadMessages: number;
  unreadNotifications: number;
  isPro: boolean;
  isAuthenticated: boolean;
  profileName: string;
  profilePhotoUrl: string | null;
  onOpenUpgrade: () => void;
  onSignOut: () => void;
}

const PRIMARY_NAV: { id: NavView; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'discover', label: 'Discover', icon: Compass },
  { id: 'matches', label: 'Matches', icon: Network },
  { id: 'problems', label: 'Problems', icon: Lightbulb },
  { id: 'solutions', label: 'Solutions', icon: Rocket },
  { id: 'startups', label: 'Startups', icon: Boxes },
  { id: 'rankings', label: 'Rankings', icon: Trophy },
  { id: 'distribution', label: 'Distribution', icon: PieChart },
  { id: 'analytics', label: 'Analytics', icon: LineChart },
  { id: 'community', label: 'Community', icon: Users },
];

export const DesktopSidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  unreadMessages,
  unreadNotifications,
  isPro,
  isAuthenticated,
  profileName,
  profilePhotoUrl,
  onOpenUpgrade,
  onSignOut,
}) => {
  return (
    <aside className="hidden md:flex w-64 bg-gradient-to-b from-[#08132B] via-[#060E22] to-[#050B1C] border-r border-[#172B54]/80 flex-col justify-between shrink-0 fixed inset-y-0 left-0 z-30">
      <div className="overflow-y-auto">
        {/* Brand Header */}
        <button
          type="button"
          onClick={() => onSelectView('home')}
          className="w-full p-5 flex items-center space-x-3 border-b border-[#172B54]/60 text-left hover:bg-white/[0.02] transition"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#19C8FF] flex items-center justify-center shadow-[0_0_18px_rgba(25,200,255,0.4)] shrink-0">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-lg tracking-tight text-white">
              Gloweave
            </h1>
            <p className="text-[10px] text-sky-200/70 tracking-wider uppercase font-medium truncate">
              Discover • Connect • Innovate
            </p>
          </div>
        </button>

        {/* Nav Links */}
        <nav className="p-3 space-y-1" aria-label="Main navigation">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition whitespace-nowrap ${
                  active
                    ? 'bg-gradient-to-r from-[#0066FF] via-[#0B7FFF]/65 to-[#0B2A66]/30 text-white shadow-[0_4px_18px_-4px_rgba(0,115,255,0.65)] font-semibold'
                    : 'text-slate-300/80 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-sky-200' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 pb-1 border-t border-[#172B54]/70 my-2" />

          <button
            type="button"
            onClick={() => onSelectView('messages')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition ${
              activeView === 'messages'
                ? 'bg-gradient-to-r from-[#0066FF] via-[#0B7FFF]/65 to-[#0B2A66]/30 text-white shadow-[0_4px_18px_-4px_rgba(0,115,255,0.65)] font-semibold'
                : 'text-slate-300/80 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-4 h-4 shrink-0 text-sky-400/80" />
              <span>Messages</span>
            </div>
            {unreadMessages > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold tabular-nums">
                {unreadMessages}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectView('notifications')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition ${
              activeView === 'notifications'
                ? 'bg-gradient-to-r from-[#0066FF] via-[#0B7FFF]/65 to-[#0B2A66]/30 text-white shadow-[0_4px_18px_-4px_rgba(0,115,255,0.65)] font-semibold'
                : 'text-slate-300/80 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Bell className="w-4 h-4 shrink-0 text-slate-400" />
              <span>Notifications</span>
            </div>
            {unreadNotifications > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold tabular-nums">
                {unreadNotifications}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenUpgrade}
            className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-amber-300 hover:bg-amber-500/10 font-semibold text-sm transition cursor-pointer mt-1"
          >
            <Crown className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{isPro ? 'Upgrade to Pro' : 'Upgrade to Pro'}</span>
          </button>
        </nav>
      </div>

      {/* Bottom Profile */}
      <div className="p-4 border-t border-[#172B54]/70 space-y-3 bg-[#050B1C]/90">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onSelectView('profile')}
            className="flex items-center space-x-2.5 min-w-0 text-left hover:opacity-90 transition cursor-pointer"
          >
            <AvatarBadge
              photoUrl={profilePhotoUrl}
              alt={profileName || 'Profile picture'}
              accentFrom="#0066FF"
              accentTo="#22D3EE"
            />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">
                {profileName || 'Your Profile'}
              </h4>
              <p className="text-[10px] text-emerald-400 font-medium flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span>{isPro ? 'Pro Member' : 'Member'}</span>
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onSelectView('profile')}
            aria-label="Open profile settings"
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-white/5 transition"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1 text-xs">
          <button
            type="button"
            onClick={() => onSelectView('profile')}
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg transition ${
              activeView === 'profile'
                ? 'bg-white/10 text-cyan-300'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Profile &amp; Settings</span>
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center space-x-2 text-slate-400 hover:text-rose-300 px-2 py-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isAuthenticated ? 'Logout' : 'Register / Onboarding'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

interface DesktopHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  region: RegionFilter;
  onRegionChange: (r: RegionFilter) => void;
  unreadNotifications: number;
  profileName: string;
  profilePhotoUrl: string | null;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

const REGIONS: RegionFilter[] = ['Global', ...CONTINENTS];

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  searchQuery,
  onSearchChange,
  region,
  onRegionChange,
  unreadNotifications,
  profileName,
  profilePhotoUrl,
  onOpenNotifications,
  onOpenProfile,
}) => {
  const [regionOpen, setRegionOpen] = useState(false);

  return (
    <header className="hidden md:flex items-center justify-between pb-4 border-b border-[#172B54]/70 gap-4">
      <div className="relative w-full max-w-md">
        <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-300/70" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder='Search problems, matches, solutions, startups or regions...'
          className="w-full bg-[#0A1633]/90 border border-[#1E386E]/80 rounded-full pl-10 pr-8 py-2.5 text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-400/60 transition"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center space-x-3 shrink-0">
        <div className="relative">
          <button
            type="button"
            onClick={() => setRegionOpen((prev) => !prev)}
            className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-[#0A1633]/90 border border-[#1E386E]/80 text-slate-200 text-xs font-semibold hover:border-sky-400/50 transition whitespace-nowrap"
          >
            <Globe className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>{region}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          {regionOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl bg-[#091533] border border-[#1E386E] shadow-2xl py-1.5 z-40">
              {REGIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    onRegionChange(item);
                    setRegionOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs transition flex items-center justify-between ${
                    region === item
                      ? 'text-sky-300 bg-[#0066FF]/25 font-semibold'
                      : 'text-slate-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{item}</span>
                  {region === item && <span className="text-[10px]">Active</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenNotifications}
          aria-label="Notifications"
          className="relative p-2.5 rounded-xl bg-[#0A1633]/90 border border-[#1E386E]/80 text-slate-200 hover:text-white hover:border-sky-400/50 transition"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white tabular-nums">
              {unreadNotifications}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center space-x-2.5 pl-3 border-l border-[#172B54] hover:opacity-90 transition cursor-pointer"
        >
          <AvatarBadge
            photoUrl={profilePhotoUrl}
            alt={profileName || 'Profile picture'}
            size="sm"
            accentFrom="#0066FF"
            accentTo="#22D3EE"
          />
          <span className="text-xs font-bold text-white whitespace-nowrap">
            {profileName ? profileName.split(' ')[0] : 'Profile'}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      </div>
    </header>
  );
};

interface MobileChromeProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  unreadNotifications: number;
  isPro: boolean;
  isAuthenticated: boolean;
  profileName: string;
  profilePhotoUrl: string | null;
  onOpenSubmit: () => void;
  onOpenUpgrade: () => void;
  onSignOut: () => void;
}

export const MobileHeader: React.FC<{
  onOpenMenu: () => void;
  unreadNotifications: number;
  onOpenNotifications: () => void;
  onGoHome: () => void;
}> = ({ onOpenMenu, unreadNotifications, onOpenNotifications, onGoHome }) => (
  <header className="md:hidden sticky top-0 z-40 bg-[#050C1D]/95 backdrop-blur border-b border-[#172B54]/80 px-4 py-3 flex items-center justify-between">
    <button type="button" onClick={onGoHome} className="flex items-center space-x-2.5 text-left">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#19C8FF] flex items-center justify-center shadow-[0_0_16px_rgba(25,200,255,0.4)]">
        <Globe className="w-5 h-5 text-white" />
      </div>
      <div>
        <h1 className="font-extrabold text-lg tracking-tight text-white">
          Gloweave
        </h1>
        <p className="text-[10px] text-sky-200/70 tracking-wider uppercase font-medium">
          Discover • Connect • Innovate
        </p>
      </div>
    </button>
    <div className="flex items-center space-x-2.5">
      <button
        type="button"
        onClick={onOpenNotifications}
        aria-label="Notifications"
        className="relative p-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-slate-200 min-w-[40px] min-h-[40px] flex items-center justify-center"
      >
        <Bell className="w-4 h-4" />
        {unreadNotifications > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white tabular-nums">
            {unreadNotifications}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open navigation drawer"
        className="p-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-slate-200 min-w-[40px] min-h-[40px] flex items-center justify-center"
      >
        <Menu className="w-4 h-4" />
      </button>
    </div>
  </header>
);

export const MobileBottomNav: React.FC<{
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  onOpenSubmit: () => void;
}> = ({ activeView, onSelectView, onOpenSubmit }) => (
  <nav
    className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#050C1D]/95 backdrop-blur-lg border-t border-[#172B54]/80 px-4 py-2 flex items-center justify-around"
    aria-label="Mobile navigation"
  >
    <button
      type="button"
      onClick={() => onSelectView('home')}
      className={`flex flex-col items-center min-w-[44px] ${
        activeView === 'home' ? 'text-[#19C8FF]' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      <Home className="w-4 h-4" />
      <span className="text-[10px] font-semibold mt-1">Home</span>
    </button>
    <button
      type="button"
      onClick={() => onSelectView('discover')}
      className={`flex flex-col items-center min-w-[44px] ${
        activeView === 'discover' ? 'text-[#19C8FF]' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      <Compass className="w-4 h-4" />
      <span className="text-[10px] font-medium mt-1">Discover</span>
    </button>
    <button
      type="button"
      onClick={onOpenSubmit}
      className="flex flex-col items-center text-slate-300 hover:text-white min-w-[44px]"
    >
      <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
        <Plus className="w-3.5 h-3.5" />
      </div>
      <span className="text-[10px] font-medium mt-0.5">Submit</span>
    </button>
    <button
      type="button"
      onClick={() => onSelectView('matches')}
      className={`flex flex-col items-center min-w-[44px] ${
        activeView === 'matches' ? 'text-[#19C8FF]' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      <Network className="w-4 h-4" />
      <span className="text-[10px] font-medium mt-1">Matches</span>
    </button>
    <button
      type="button"
      onClick={() => onSelectView('profile')}
      className={`flex flex-col items-center min-w-[44px] ${
        activeView === 'profile' ? 'text-[#19C8FF]' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      <Users className="w-4 h-4" />
      <span className="text-[10px] font-medium mt-1">Profile</span>
    </button>
  </nav>
);

export const MobileDrawer: React.FC<
  MobileChromeProps & { open: boolean; onClose: () => void }
> = ({
  open,
  onClose,
  activeView,
  onSelectView,
  isPro,
  isAuthenticated,
  profileName,
  profilePhotoUrl,
  onOpenUpgrade,
  onSignOut,
}) => {
  if (!open) return null;

  const links: { id: NavView; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'discover', label: 'Discover' },
    { id: 'matches', label: 'Matches' },
    { id: 'problems', label: 'Problems' },
    { id: 'solutions', label: 'Solutions' },
    { id: 'startups', label: 'Startups' },
    { id: 'rankings', label: 'Rankings' },
    { id: 'distribution', label: 'Distribution' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'community', label: 'Community' },
    { id: 'messages', label: 'Messages' },
    { id: 'notifications', label: 'Notifications' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md md:hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Mobile menu"
    >
      <div
        className="absolute right-0 top-0 bottom-0 w-4/5 max-w-xs bg-[#060B18] border-l border-[#172B54] p-5 flex flex-col justify-between overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[#172B54] mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#19C8FF] flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-base text-white">Gloweave</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1.5 text-sm font-medium">
            {links.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectView(item.id);
                  onClose();
                }}
                className={`w-full text-left block px-3 py-2 rounded-xl transition ${
                  activeView === item.id
                    ? 'bg-gradient-to-r from-[#0066FF] to-[#0B7FFF]/40 text-white font-semibold'
                    : 'text-slate-300 hover:bg-white/[0.04]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[#172B54] mt-4 space-y-3">
          <button
            type="button"
            onClick={() => {
              onSelectView('profile');
              onClose();
            }}
            className="w-full text-left flex items-center space-x-3 p-2 rounded-xl hover:bg-white/[0.05] transition"
          >
            <AvatarBadge
              photoUrl={profilePhotoUrl}
              alt={profileName || 'Profile picture'}
              size="lg"
              accentFrom="#0066FF"
              accentTo="#22D3EE"
            />
            <div className="min-w-0">
              <div className="font-bold text-sm text-white truncate">
                {profileName || 'Your Profile'}
              </div>
              <div className="text-xs text-emerald-400">
                {isPro ? 'Pro Member' : 'Member'}
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenUpgrade();
            }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] text-slate-950 font-bold text-xs"
          >
            {isPro ? 'Pro Access Active' : 'Upgrade to Pro'}
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-300 hover:text-rose-300 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isAuthenticated ? 'Logout' : 'Register / Onboarding'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
