import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUp,
  Award,
  Bell,
  Camera,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  Crown,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Globe,
  Image as ImageIcon,
  LifeBuoy,
  Lightbulb,
  Link2,
  Loader2,
  MessageSquare,
  Network,
  Plus,
  RefreshCw,
  Rocket,
  Scale,
  Search,
  Send,
  Server,
  Settings,
  Sparkles,
  Star,
  ThumbsUp,
  Trophy,
  Upload,
  X,
} from 'lucide-react';
import {
  ALL_RESOURCE_FILTER_TYPES,
  CATEGORIES,
  IMPACT_SEVERITY_LEVELS,
  VERIFICATION_STATUSES,
} from '../data/gloweaveData';
import { CONTINENTS } from '../data/countries';
import {
  APP_VERSION,
  BACKEND_API_CONTRACTS,
  getBackendStatusLabel,
  isBackendConfigured,
} from '../lib/backendApi';
import {
  ChatAttachment,
  ContributorItem,
  EvidenceType,
  ImpactSeverityLevel,
  LegalDocumentId,
  MatchItem,
  MatchUserFeedback,
  MessageThread,
  NavView,
  NotificationItem,
  ProblemItem,
  ProblemSolutionStatus,
  RegionFilter,
  RegionInsight,
  ResourceKind,
  ResourceSubmission,
  SettingsTabId,
  SolutionItem,
  SolutionStatus,
  StartupItem,
  SupportTabId,
  UserSettingsPreferences,
  VerificationStatus,
} from '../types/gloweave';
import { CountrySelector } from './CountrySelector';
import { LegalDocumentView } from './LegalDocumentView';
import { MatchesView } from './MatchesView';
import {
  ProblemDetailView,
  problemSolutionStatusBadge,
  severityBadge,
  solutionStatusBadge,
  verificationStatusBadge,
} from './ProblemDetailView';
import { SettingsView } from './SettingsView';
import { SupportView } from './SupportView';
import {
  AvatarBadge,
  DottedWorldMap,
  ProblemThumbnail,
  SolutionVisualBanner,
} from './VisualThumbnails';

interface SecondaryViewsProps {
  activeView: Exclude<NavView, 'home'>;
  previousView: NavView;
  searchQuery: string;
  regionFilter: RegionFilter;
  problems: ProblemItem[];
  solutions: SolutionItem[];
  matches: MatchItem[];
  submissions: ResourceSubmission[];
  startups: StartupItem[];
  contributors: ContributorItem[];
  regions: RegionInsight[];
  messages: MessageThread[];
  notifications: NotificationItem[];
  activeProblemDetail: ProblemItem | null;
  activeThreadId: string | null;
  authenticatedUser: { id: string; email: string } | null;
  isPro: boolean;
  profileName: string;
  profileRole: string;
  profileLocation: string;
  profilePhotoUrl: string | null;
  emailDigest: boolean;
  preferences: UserSettingsPreferences;
  settingsTab: SettingsTabId;
  legalDocId: LegalDocumentId;
  supportTab: SupportTabId;
  onSelectSettingsTab: (tab: SettingsTabId) => void;
  onSelectLegalDoc: (docId: LegalDocumentId) => void;
  onSelectSupportTab: (tab: SupportTabId) => void;
  onUpdatePreferences: (next: UserSettingsPreferences) => void;
  onRequestSignOut: () => void;
  onRequestDeleteAccount: () => void;
  onSelectView: (view: NavView) => void;
  onBackFromProblem: () => void;
  onOpenSubmit: (opts?: { kind?: 'resource' | 'pdf' | 'evidence'; problemId?: string }) => void;
  onOpenUpgrade: () => void;
  onSelectProblem: (p: ProblemItem) => void;
  onSelectSolution: (s: SolutionItem) => void;
  onToggleUpvote: (id: string) => void;
  onToggleProblemBookmark: (id: string) => void;
  onToggleSolutionBookmark: (id: string) => void;
  onToggleMatchBookmark: (id: string) => void;
  onSubmitMatchFeedback?: (matchId: string, feedback: MatchUserFeedback, note?: string) => void;
  onSubmitHumanVerification?: (payload: {
    problemId: string;
    decision: VerificationStatus;
    comment: string;
    humanConfirmationChecked: boolean;
  }) => void;
  onAddEvidence?: (payload: {
    problemId: string;
    sourceTitle: string;
    sourceUrl?: string;
    documentName?: string;
    extractedReference: string;
    supportingEvidence: string;
    evidenceType: EvidenceType;
  }) => void;
  onRetrySubmission?: (submissionId: string) => void;
  onShareProblem: (p: ProblemItem) => void;
  onToggleConnect: (id: string) => void;
  onStartMessageWith: (person: ContributorItem) => void;
  onSelectThread: (threadId: string | null) => void;
  onSendMessage: (threadId: string, text: string, attachments?: ChatAttachment[]) => void;
  onSummarizeMessageLink: (
    threadId: string,
    messageId: string,
    attachmentId: string,
    url: string
  ) => void;
  onMarkAllNotificationsRead: () => void;
  onNotificationClick: (n: NotificationItem) => void;
  onUpdateProfile: (updates: {
    name?: string;
    role?: string;
    location?: string;
    emailDigest?: boolean;
  }) => void;
  onUploadPhoto: (dataUrl: string) => void;
  onRemovePhoto: () => void;
  onRequireAuth?: (actionLabel: string) => void;
  onToast: (msg: string) => void;
}

const formatChatFileSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const extractDomainLabel = (rawUrl: string) => {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '');
  } catch {
    return rawUrl;
  }
};

const extractUrlsFromText = (text: string): string[] => {
  const found = text.match(/https?:\/\/[^\s<>"']+/gi) || [];
  return Array.from(new Set(found));
};

export const SecondaryViews: React.FC<SecondaryViewsProps> = ({
  activeView,
  searchQuery,
  regionFilter,
  problems,
  solutions,
  matches,
  submissions,
  startups,
  contributors,
  regions,
  messages,
  notifications,
  activeProblemDetail,
  activeThreadId,
  authenticatedUser,
  isPro,
  profileName,
  profileRole,
  profileLocation,
  profilePhotoUrl,
  emailDigest,
  preferences,
  settingsTab,
  legalDocId,
  supportTab,
  onSelectSettingsTab,
  onSelectLegalDoc,
  onSelectSupportTab,
  onUpdatePreferences,
  onRequestSignOut,
  onRequestDeleteAccount,
  onSelectView,
  onBackFromProblem,
  onOpenSubmit,
  onOpenUpgrade,
  onSelectProblem,
  onSelectSolution,
  onToggleUpvote,
  onToggleProblemBookmark,
  onToggleSolutionBookmark,
  onToggleMatchBookmark,
  onSubmitMatchFeedback,
  onSubmitHumanVerification,
  onAddEvidence,
  onRetrySubmission,
  onShareProblem,
  onToggleConnect,
  onStartMessageWith,
  onSelectThread,
  onSendMessage,
  onSummarizeMessageLink,
  onMarkAllNotificationsRead,
  onNotificationClick,
  onUpdateProfile,
  onUploadPhoto,
  onRemovePhoto,
  onRequireAuth,
  onToast,
}) => {
  const [discoverTab, setDiscoverTab] = useState<'problems' | 'batches' | 'solutions' | 'startups'>('problems');
  const [discoverStatusFilter, setDiscoverStatusFilter] = useState<'All' | ProblemSolutionStatus>('All');
  const [discoverIndustryFilter, setDiscoverIndustryFilter] = useState<string>('All');
  const [discoverRegionFilter, setDiscoverRegionFilter] = useState<RegionFilter>('Global');
  const [discoverCountryFilter, setDiscoverCountryFilter] = useState<string>('All');
  const [discoverSeverityFilter, setDiscoverSeverityFilter] = useState<'All' | ImpactSeverityLevel>('All');
  const [discoverVerificationFilter, setDiscoverVerificationFilter] = useState<'All' | VerificationStatus>('All');
  const [discoverResourceTypeFilter, setDiscoverResourceTypeFilter] = useState<'All' | ResourceKind>('All');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [previewPdfSubmissionId, setPreviewPdfSubmissionId] = useState<string | null>(null);
  const [showBackendContracts, setShowBackendContracts] = useState(false);

  const [problemStatusFilter, setProblemStatusFilter] = useState<'All' | ProblemSolutionStatus>('All');
  const [solutionStatusFilter, setSolutionStatusFilter] = useState<'All' | SolutionStatus>('All');
  const [solutionCategoryFilter, setSolutionCategoryFilter] = useState<string>('All');
  const [startupStageFilter, setStartupStageFilter] = useState<string>('All');

  // Rankings filters
  const [rankingTab, setRankingTab] = useState<'solvers' | 'innovators' | 'startups' | 'solutions'>('solvers');
  const [rankingRegion, setRankingRegion] = useState<RegionFilter>('Global');
  const [rankingCountry, setRankingCountry] = useState<string>('All');
  const [rankingCategory, setRankingCategory] = useState<string>('All');

  // Distribution & Analytics
  const [selectedRegionId, setSelectedRegionId] = useState('reg-na');
  const [analyticsRange, setAnalyticsRange] = useState<'7D' | '30D' | '90D'>('30D');

  // Community, Messaging & Notifications
  const [communityCategory, setCommunityCategory] = useState<string>('All');
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');
  const [contactSearch, setContactSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const [stagedAttachments, setStagedAttachments] = useState<ChatAttachment[]>([]);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [chatLinkUrl, setChatLinkUrl] = useState('');
  const [chatLinkTitle, setChatLinkTitle] = useState('');
  const [chatLinkError, setChatLinkError] = useState('');
  const [previewImageAttachment, setPreviewImageAttachment] = useState<{
    url: string;
    title?: string;
  } | null>(null);
  const chatImageInputRef = useRef<HTMLInputElement>(null);
  const chatPdfInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [profileTab, setProfileTab] = useState<'overview' | 'problems' | 'solutions' | 'saved' | 'upvotes'>('overview');
  const photoInputRef = useRef<HTMLInputElement>(null);

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

  const q = searchQuery.trim().toLowerCase();
  const filterRegion = <T extends { region: string }>(items: T[]) =>
    regionFilter === 'Global' ? items : items.filter((item) => item.region === regionFilter);

  const filteredProblems = filterRegion(problems).filter(
    (p) =>
      (!q ||
        p.title.toLowerCase().includes(q) ||
        p.industry.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q)) &&
      (problemStatusFilter === 'All' || p.solutionStatus === problemStatusFilter)
  );

  const discoverProblems = filterRegion(problems).filter(
    (p) =>
      (!q ||
        p.title.toLowerCase().includes(q) ||
        p.industry.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q)) &&
      (discoverStatusFilter === 'All' || p.solutionStatus === discoverStatusFilter) &&
      (discoverIndustryFilter === 'All' ||
        p.category === discoverIndustryFilter ||
        p.industry === discoverIndustryFilter) &&
      (discoverRegionFilter === 'Global' || p.region === discoverRegionFilter) &&
      (discoverCountryFilter === 'All' || p.country === discoverCountryFilter) &&
      (discoverSeverityFilter === 'All' ||
        p.severity === discoverSeverityFilter ||
        p.impact === discoverSeverityFilter) &&
      (discoverVerificationFilter === 'All' ||
        (p.verificationStatus || 'AI Identified') === discoverVerificationFilter) &&
      (discoverResourceTypeFilter === 'All' ||
        p.resourceTypes?.includes(discoverResourceTypeFilter) ||
        p.sourceEvidence.sourceType === discoverResourceTypeFilter)
  );

  const filteredSolutions = filterRegion(solutions).filter(
    (s) =>
      (!q ||
        s.name.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.evidenceSummary.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))) &&
      (solutionCategoryFilter === 'All' || s.category === solutionCategoryFilter) &&
      (solutionStatusFilter === 'All' || s.status === solutionStatusFilter)
  );

  const filteredStartups = filterRegion(startups).filter(
    (st) =>
      (!q ||
        st.name.toLowerCase().includes(q) ||
        st.sector.toLowerCase().includes(q) ||
        st.country.toLowerCase().includes(q)) &&
      (startupStageFilter === 'All' || st.stage === startupStageFilter)
  );

  const filteredContributors = filterRegion(contributors).filter(
    (c) =>
      (!q ||
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)) &&
      (communityCategory === 'All' || c.category === communityCategory)
  );

  const activeThread = activeThreadId
    ? messages.find((m) => m.id === activeThreadId) || null
    : null;

  const handleChatImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onToast('Please choose a valid picture (PNG, JPG, WebP, or GIF).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      onToast('Picture exceeds the 10 MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const attachment: ChatAttachment = {
          id: `att-img-${Date.now()}`,
          type: 'image',
          url: reader.result,
          title: file.name,
          fileSizeBytes: file.size,
        };
        setStagedAttachments((prev) => [...prev, attachment]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChatPdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      onToast('Please select a valid PDF document (.pdf).');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      onToast('PDF exceeds the 25 MB limit.');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const attachment: ChatAttachment = {
      id: `att-pdf-${Date.now()}`,
      type: 'pdf',
      url: objectUrl,
      title: file.name,
      fileSizeBytes: file.size,
    };
    setStagedAttachments((prev) => [...prev, attachment]);
  };

  const handleAttachChatLink = () => {
    const raw = chatLinkUrl.trim();
    if (!raw) {
      setChatLinkError('Enter a product or resource URL.');
      return;
    }
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      const parsed = new URL(candidate);
      if (!parsed.hostname.includes('.')) {
        setChatLinkError('Enter a valid domain URL (e.g., https://example.com).');
        return;
      }
      const attachment: ChatAttachment = {
        id: `att-link-${Date.now()}`,
        type: 'link',
        url: parsed.toString(),
        title: chatLinkTitle.trim() || extractDomainLabel(parsed.toString()),
        linkSummary: { status: 'idle' },
      };
      setStagedAttachments((prev) => [...prev, attachment]);
      setChatLinkUrl('');
      setChatLinkTitle('');
      setChatLinkError('');
      setShowLinkInput(false);
    } catch {
      setChatLinkError('Enter a valid URL starting with https:// or http://.');
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread) return;

    const trimmed = replyText.trim();
    const detectedUrls = extractUrlsFromText(trimmed);
    const existingUrls = new Set(
      stagedAttachments.filter((a) => a.type === 'link' && a.url).map((a) => a.url)
    );
    const autoLinkAttachments: ChatAttachment[] = detectedUrls
      .filter((u) => !existingUrls.has(u))
      .map((u, idx) => ({
        id: `att-autolink-${Date.now()}-${idx}`,
        type: 'link',
        url: u,
        title: extractDomainLabel(u),
        linkSummary: { status: 'idle' },
      }));

    const finalAttachments = [...stagedAttachments, ...autoLinkAttachments];
    if (!trimmed && finalAttachments.length === 0) return;

    if (!authenticatedUser) {
      onRequireAuth?.('send direct messages and attachments');
      return;
    }

    onSendMessage(
      activeThread.id,
      trimmed,
      finalAttachments.length > 0 ? finalAttachments : undefined
    );
    setReplyText('');
    setStagedAttachments([]);
    setShowLinkInput(false);
    setChatLinkUrl('');
    setChatLinkTitle('');
    setChatLinkError('');
  };

  // =========================================================
  // 1. PROBLEM DETAIL PAGE
  // =========================================================
  if (activeView === 'problem-detail') {
    return (
      <ProblemDetailView
        problem={activeProblemDetail}
        solutions={solutions}
        matches={matches}
        isAuthenticated={Boolean(authenticatedUser)}
        reviewerName={profileName || 'Reviewer'}
        onRequireAuth={onRequireAuth}
        onBack={onBackFromProblem}
        onOpenSubmitEvidence={(problemId) => onOpenSubmit({ kind: 'evidence', problemId })}
        onOpenMatches={() => onSelectView('matches')}
        onSelectSolution={onSelectSolution}
        onToggleUpvote={onToggleUpvote}
        onToggleBookmark={onToggleProblemBookmark}
        onShareProblem={onShareProblem}
        onSubmitHumanVerification={onSubmitHumanVerification}
        onAddEvidence={onAddEvidence}
      />
    );
  }

  // =========================================================
  // 1B. MATCHES SCREEN
  // =========================================================
  if (activeView === 'matches') {
    return (
      <MatchesView
        matches={matches}
        problems={problems}
        contributors={contributors}
        searchQuery={searchQuery}
        regionFilter={regionFilter}
        onSelectProblem={onSelectProblem}
        onOpenSubmitResource={() => onOpenSubmit({ kind: 'resource' })}
        onOpenSubmitEvidence={(problemId) => onOpenSubmit({ kind: 'evidence', problemId })}
        onToggleMatchBookmark={onToggleMatchBookmark}
        onSubmitMatchFeedback={onSubmitMatchFeedback}
        onToggleConnect={onToggleConnect}
        onStartMessageWith={onStartMessageWith}
      />
    );
  }

  // =========================================================
  // 1C. SETTINGS, SUPPORT & LEGAL SCREENS
  // =========================================================
  if (activeView === 'settings') {
    return (
      <SettingsView
        activeTab={settingsTab}
        onSelectTab={onSelectSettingsTab}
        authenticatedUser={authenticatedUser}
        isPro={isPro}
        profileName={profileName}
        profileRole={profileRole}
        profileLocation={profileLocation}
        profilePhotoUrl={profilePhotoUrl}
        preferences={preferences}
        savedProblems={problems.filter((p) => p.bookmarked)}
        savedSolutions={solutions.filter((s) => s.bookmarked)}
        savedMatches={matches.filter((m) => m.bookmarked)}
        onUpdateProfile={onUpdateProfile}
        onUploadPhoto={onUploadPhoto}
        onRemovePhoto={onRemovePhoto}
        onUpdatePreferences={onUpdatePreferences}
        onOpenUpgrade={onOpenUpgrade}
        onOpenSupport={(subTab) => {
          if (subTab) onSelectSupportTab(subTab);
          onSelectView('support');
        }}
        onOpenLegal={(docId) => {
          if (docId) onSelectLegalDoc(docId);
          onSelectView('legal');
        }}
        onSelectProblem={onSelectProblem}
        onSelectSolution={onSelectSolution}
        onToggleProblemBookmark={onToggleProblemBookmark}
        onToggleSolutionBookmark={onToggleSolutionBookmark}
        onToggleMatchBookmark={onToggleMatchBookmark}
        onRequestSignOut={onRequestSignOut}
        onRequestDeleteAccount={onRequestDeleteAccount}
        onRequireAuth={onRequireAuth}
        onToast={onToast}
      />
    );
  }

  if (activeView === 'legal') {
    return (
      <LegalDocumentView
        activeDocId={legalDocId}
        onSelectDoc={onSelectLegalDoc}
        onBack={() => onSelectView('settings')}
        backLabel="Back to Settings"
      />
    );
  }

  if (activeView === 'support') {
    return (
      <SupportView
        activeTab={supportTab}
        onSelectTab={onSelectSupportTab}
        userEmail={authenticatedUser?.email}
        onBack={() => onSelectView('settings')}
        onOpenLegal={(docId) => {
          onSelectLegalDoc(docId);
          onSelectView('legal');
        }}
        onToast={onToast}
      />
    );
  }

  // =========================================================
  // 2. DISCOVER SCREEN (AI-Identified Problems + Batch Queue)
  // =========================================================
  if (activeView === 'discover') {
    const solutionStatuses: readonly ('All' | ProblemSolutionStatus)[] = [
      'All',
      'Awaiting Solution',
      'Under Review',
      'Partially Solved',
      'Verification Required',
      'Solved',
    ];

    return (
      <div className="space-y-6 pb-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Discover Global Intelligence</h2>
            <p className="text-xs text-slate-400 mt-1">
              AI-identified problems across {regionFilter} · {discoverProblems.length} problems ·{' '}
              {submissions.length} queued batch submissions
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0A1633] border border-[#1E386E] rounded-xl self-start">
            {(
              [
                { id: 'problems', label: `AI Problems (${discoverProblems.length})` },
                { id: 'batches', label: `Batch Queue (${submissions.length})` },
                { id: 'solutions', label: `Solutions (${filteredSolutions.length})` },
                { id: 'startups', label: `Startups (${filteredStartups.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDiscoverTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  discoverTab === tab.id ? 'btn-royal text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {discoverTab === 'problems' && (
          <section className="space-y-4">
            {/* Filters */}
            <div className="glass-card p-3.5 rounded-2xl space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1 p-1 bg-[#060E22] border border-[#1E386E] rounded-xl">
                  {solutionStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setDiscoverStatusFilter(status)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition whitespace-nowrap cursor-pointer ${
                        discoverStatusFilter === status
                          ? 'btn-royal text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedFilters((p) => !p)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                      showAdvancedFilters
                        ? 'bg-[#0D2B63] border-sky-400/60 text-white'
                        : 'bg-[#040A1A] border-[#1E386E] text-slate-200 hover:border-sky-400/50'
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>All Global Filters</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenSubmit({ kind: 'pdf' })}
                    className="px-3 py-1.5 rounded-xl bg-[#0A1633] border border-[#1E386E] hover:border-sky-400/50 text-sky-300 text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    Upload PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenSubmit({ kind: 'resource' })}
                    className="px-3.5 py-1.5 rounded-xl btn-royal text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    + Submit URL
                  </button>
                </div>
              </div>

              {showAdvancedFilters && (
                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                      Region
                    </label>
                    <select
                      value={discoverRegionFilter}
                      onChange={(e) => setDiscoverRegionFilter(e.target.value as RegionFilter)}
                      className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                    >
                      <option value="Global">Global (All Regions)</option>
                      {CONTINENTS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                      Country (A–Z)
                    </label>
                    <CountrySelector
                      value={discoverCountryFilter}
                      onChange={setDiscoverCountryFilter}
                      includeAllOption
                      allOptionLabel="All Countries"
                      compact
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                      Industry / Category
                    </label>
                    <select
                      value={discoverIndustryFilter}
                      onChange={(e) => setDiscoverIndustryFilter(e.target.value)}
                      className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                    >
                      <option value="All">All Industries</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                      Severity &amp; Impact
                    </label>
                    <select
                      value={discoverSeverityFilter}
                      onChange={(e) =>
                        setDiscoverSeverityFilter(e.target.value as 'All' | ImpactSeverityLevel)
                      }
                      className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                    >
                      <option value="All">All Severities</option>
                      {IMPACT_SEVERITY_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                      Verification Status
                    </label>
                    <select
                      value={discoverVerificationFilter}
                      onChange={(e) =>
                        setDiscoverVerificationFilter(e.target.value as 'All' | VerificationStatus)
                      }
                      className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                    >
                      <option value="All">All Verification States</option>
                      {VERIFICATION_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                      Resource &amp; Source Type
                    </label>
                    <select
                      value={discoverResourceTypeFilter}
                      onChange={(e) =>
                        setDiscoverResourceTypeFilter(e.target.value as 'All' | ResourceKind)
                      }
                      className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                    >
                      <option value="All">All Resource Types</option>
                      {ALL_RESOURCE_FILTER_TYPES.map((rt) => (
                        <option key={rt} value={rt}>
                          {rt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {discoverProblems.length === 0 ? (
              <div className="glass-card p-8 rounded-2xl text-center space-y-3">
                <p className="text-sm font-bold text-white">
                  {problems.length === 0
                    ? '0 AI-identified problems yet'
                    : 'No AI-identified problems match'}
                </p>
                <p className="text-xs text-slate-400">
                  {problems.length === 0
                    ? 'Submit a website URL, PDF document, research paper, or technical docs to queue a scheduled batch.'
                    : 'Reset filters or submit a resource URL or PDF to queue a new batch.'}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {problems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setDiscoverStatusFilter('All');
                        setDiscoverIndustryFilter('All');
                        setDiscoverRegionFilter('Global');
                        setDiscoverCountryFilter('All');
                        setDiscoverSeverityFilter('All');
                        setDiscoverVerificationFilter('All');
                        setDiscoverResourceTypeFilter('All');
                      }}
                      className="px-4 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenSubmit({ kind: 'pdf' })}
                    className="px-4 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-sky-300 text-xs font-bold cursor-pointer"
                  >
                    Upload PDF Document
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenSubmit({ kind: 'resource' })}
                    className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
                  >
                    Submit Resource URL
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {discoverProblems.map((prob) => {
                  const problemMatchCount = matches.filter((m) => m.problemId === prob.id).length;
                  const probVerif: VerificationStatus = prob.verificationStatus || 'AI Identified';
                  return (
                    <div
                      key={prob.id}
                      className="glass-card p-5 rounded-2xl hover:border-sky-400/40 transition flex flex-col justify-between space-y-3.5"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-3 min-w-0">
                            <ProblemThumbnail theme={prob.theme} size="md" />
                            <div className="min-w-0">
                              <div className="text-[11px] font-bold text-[#38BDF8] truncate">
                                {prob.industry}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {prob.country}, {prob.region}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${verificationStatusBadge(
                                probVerif
                              )}`}
                            >
                              {probVerif}
                            </span>
                            {prob.severity && (
                              <span
                                className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${severityBadge(
                                  prob.severity
                                )}`}
                              >
                                {prob.severity}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setDiscoverStatusFilter(prob.solutionStatus)}
                              className={`px-2 py-0.5 rounded-md border text-[10px] font-bold whitespace-nowrap cursor-pointer ${problemSolutionStatusBadge(
                                prob.solutionStatus
                              )}`}
                            >
                              {prob.solutionStatus}
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onSelectProblem(prob)}
                          className="text-left block w-full cursor-pointer hover:text-[#38BDF8] transition"
                        >
                          <h4 className="text-sm font-extrabold text-white leading-snug">
                            {prob.title}
                          </h4>
                        </button>
                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                          {prob.summary}
                        </p>

                        {/* Source Evidence */}
                        <div className="p-2.5 rounded-xl bg-[#040A1A]/85 border border-[#1E386E] flex items-center justify-between gap-2 text-[11px]">
                          <span className="text-slate-400 truncate">
                            Source:{' '}
                            <strong className="text-slate-200">{prob.sourceEvidence.label}</strong>
                          </span>
                          <a
                            href={prob.sourceEvidence.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#38BDF8] font-semibold flex items-center space-x-1 shrink-0 hover:underline"
                          >
                            <span>Evidence</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                        <button
                          type="button"
                          onClick={() => onSelectView('matches')}
                          className="flex items-center space-x-1.5 text-slate-300 hover:text-[#38BDF8] font-semibold cursor-pointer tabular-nums"
                        >
                          <Network className="w-3.5 h-3.5 text-[#38BDF8]" />
                          <span>
                            {problemMatchCount === 0
                              ? '0 matches yet'
                              : `${problemMatchCount} potential ${
                                  problemMatchCount === 1 ? 'match' : 'matches'
                                }`}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectProblem(prob)}
                          className="text-[#38BDF8] font-bold hover:underline cursor-pointer"
                        >
                          Inspect Brief &amp; Review →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {discoverTab === 'batches' && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-300">
                  Submitted URLs &amp; PDFs enter processing queues. Actual PDF extraction, OCR, and AI discovery execute strictly via the backend service.
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Backend status: <strong className="text-amber-300">{getBackendStatusLabel()}</strong>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBackendContracts((p) => !p)}
                  className="px-3.5 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] hover:border-sky-400/50 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Server className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>{showBackendContracts ? 'Hide API Contracts' : 'Backend API Contracts'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenSubmit({ kind: 'pdf' })}
                  className="px-3.5 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] hover:border-sky-400/50 text-sky-300 text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenSubmit({ kind: 'resource' })}
                  className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
                >
                  + Queue URL
                </button>
              </div>
            </div>

            {showBackendContracts && (
              <div className="glass-card p-5 rounded-2xl border border-sky-400/25 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Server className="w-4 h-4 text-[#38BDF8]" />
                      <span>Gloweave {APP_VERSION} — Modular Backend API Contracts</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Frontend components use these documented contracts cleanly and surface Awaiting Backend states when <code className="text-sky-300">VITE_BACKEND_API_URL</code> is not configured.
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold ${
                      isBackendConfigured()
                        ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                        : 'bg-amber-500/15 border-amber-400/35 text-amber-300'
                    }`}
                  >
                    {isBackendConfigured() ? 'Backend Configured' : 'Awaiting Backend Integration'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px]">
                  {BACKEND_API_CONTRACTS.map((spec) => (
                    <div
                      key={spec.id}
                      className="p-3 rounded-xl bg-[#040A1A] border border-[#1E386E] space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white">{spec.capability}</span>
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-400/30 font-mono text-[10px] text-[#38BDF8]">
                          {spec.method} {spec.path}
                        </span>
                      </div>
                      <p className="text-slate-400">{spec.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {submissions.length === 0 ? (
              <div className="glass-card p-8 rounded-2xl text-center space-y-3">
                <p className="text-sm font-bold text-white">No URLs or PDFs queued yet</p>
                <p className="text-xs text-slate-400">
                  Submit a website URL, research paper, technical documentation, product site, or PDF document to start batch analysis.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenSubmit({ kind: 'pdf' })}
                    className="px-4 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-sky-300 text-xs font-bold cursor-pointer"
                  >
                    Upload PDF Document
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenSubmit({ kind: 'resource' })}
                    className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
                  >
                    Submit Resource URL
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {submissions.map((sub) => {
                  const isPdf = sub.submissionFormat === 'pdf';
                  const isPreviewOpen = previewPdfSubmissionId === sub.id;
                  return (
                    <div key={sub.id} className="glass-card p-5 rounded-2xl space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#0A1633] border border-[#1E386E] text-[11px] font-bold text-[#38BDF8]">
                          {sub.kind}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${
                              sub.backendSyncState === 'synced'
                                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                                : sub.backendSyncState === 'error'
                                ? 'bg-rose-500/15 border-rose-400/40 text-rose-300'
                                : 'bg-amber-500/15 border-amber-400/35 text-amber-300'
                            }`}
                          >
                            {sub.backendSyncState === 'synced'
                              ? 'Synced'
                              : sub.backendSyncState === 'error'
                              ? 'Sync Error'
                              : 'Awaiting Backend'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/35 text-[11px] font-bold text-sky-300 flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{sub.status}</span>
                          </span>
                        </div>
                      </div>

                      <div>
                        {isPdf && sub.pdfMeta ? (
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center space-x-2 min-w-0">
                                <FileText className="w-4 h-4 text-[#38BDF8] shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-white truncate">
                                    {sub.pdfMeta.fileName}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {(sub.pdfMeta.fileSizeBytes / 1024).toFixed(1)} KB ·{' '}
                                    {sub.pdfMeta.mimeType}
                                    {sub.pdfMeta.pageCount ? ` · ${sub.pdfMeta.pageCount} pages` : ''}
                                  </div>
                                </div>
                              </div>
                              {sub.pdfMeta.previewObjectUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewPdfSubmissionId(isPreviewOpen ? null : sub.id)
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-[#0A1633] border border-[#1E386E] text-[11px] font-semibold text-[#38BDF8] flex items-center space-x-1 shrink-0 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>{isPreviewOpen ? 'Close' : 'Preview'}</span>
                                </button>
                              )}
                            </div>

                            {isPreviewOpen && sub.pdfMeta.previewObjectUrl && (
                              <div className="rounded-xl overflow-hidden border border-[#1E386E] bg-slate-950 h-56">
                                <iframe
                                  src={sub.pdfMeta.previewObjectUrl}
                                  title={`PDF Preview ${sub.pdfMeta.fileName}`}
                                  className="w-full h-full"
                                />
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="p-2 rounded-lg bg-[#040A1A] border border-[#1E386E]">
                                <span className="text-slate-400 block">PDF Extraction</span>
                                <strong className="text-amber-300">
                                  {sub.extractionStatus || 'Awaiting Backend Service'}
                                </strong>
                              </div>
                              <div className="p-2 rounded-lg bg-[#040A1A] border border-[#1E386E]">
                                <span className="text-slate-400 block">OCR Status</span>
                                <strong className="text-sky-300">
                                  {sub.ocrStatus || 'Awaiting Backend Service'}
                                </strong>
                              </div>
                            </div>

                            <div className="p-2.5 rounded-xl bg-[#040A1A]/85 border border-[#1E386E] text-[11px]">
                              <span className="font-semibold text-slate-300 block mb-0.5">
                                Extracted Content Review
                              </span>
                              {sub.extractedPreviewText ? (
                                <p className="text-slate-300 whitespace-pre-wrap max-h-28 overflow-y-auto">
                                  {sub.extractedPreviewText}
                                </p>
                              ) : (
                                <p className="text-slate-400">
                                  No extracted text available yet — real PDF text extraction and OCR run strictly on the backend worker (`GET /api/submissions/:id/extraction`).
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <a
                            href={sub.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-mono text-white hover:text-[#38BDF8] break-all flex items-center space-x-1.5"
                          >
                            <Link2 className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                            <span>{sub.url}</span>
                          </a>
                        )}
                        {sub.optionalContext && (
                          <p className="text-xs text-slate-300 mt-2">{sub.optionalContext}</p>
                        )}
                        {sub.errorMessage && (
                          <div className="mt-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-300 flex items-center space-x-2">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{sub.errorMessage}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>{sub.batchWindow}</span>
                          <span className="text-white font-semibold tabular-nums">
                            {sub.progressPercent}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#040A1A] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#0066FF] to-[#22D3EE]"
                            style={{ width: `${sub.progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                        <span>Submitted {sub.submittedAt}</span>
                        <div className="flex items-center gap-2">
                          {isPdf && onRetrySubmission && (
                            <button
                              type="button"
                              onClick={() => onRetrySubmission(sub.id)}
                              className="px-2.5 py-1 rounded-lg bg-[#0A1633] border border-[#1E386E] hover:border-sky-400/50 text-[#38BDF8] font-semibold flex items-center space-x-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Check / Retry Extraction</span>
                            </button>
                          )}
                          <span className="text-[#38BDF8] font-semibold">{sub.etaLabel}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {discoverTab === 'solutions' && (
          <section className="space-y-3">
            {filteredSolutions.length === 0 ? (
              <div className="glass-card p-6 rounded-2xl text-xs text-slate-400">
                0 solutions published in {regionFilter}.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSolutions.map((sol) => (
                  <button
                    key={sol.id}
                    type="button"
                    onClick={() => onSelectSolution(sol)}
                    className="text-left glass-card p-4 rounded-2xl hover:border-sky-400/40 transition cursor-pointer flex flex-col justify-between space-y-3"
                  >
                    <SolutionVisualBanner theme={sol.theme} name={sol.name} verified={sol.verified} />
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-white truncate">{sol.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded border text-[10px] font-bold shrink-0 ${solutionStatusBadge(
                            sol.status
                          )}`}
                        >
                          {sol.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2">{sol.tagline}</p>
                    </div>
                    <div className="w-full flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                      <span>{sol.country}</span>
                      <span className="text-amber-400 font-bold tabular-nums">★ {sol.rating}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {discoverTab === 'startups' && (
          <section className="space-y-3">
            {filteredStartups.length === 0 ? (
              <div className="glass-card p-6 rounded-2xl text-xs text-slate-400">
                0 startups listed in {regionFilter}.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStartups.map((st) => (
                  <div
                    key={st.id}
                    className="glass-card p-4 rounded-2xl flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{st.name}</h4>
                        <span className="text-[11px] text-cyan-400 font-medium">{st.stage}</span>
                      </div>
                      <p className="text-xs text-slate-400">{st.description}</p>
                      <p className="text-[11px] text-slate-500">
                        {st.sector} · {st.country}, {st.region}
                      </p>
                    </div>
                    <a
                      href={st.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-cyan-400 hover:border-sky-400/50 shrink-0"
                      aria-label={`Visit ${st.name}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    );
  }

  // =========================================================
  // 3. PROBLEMS DIRECTORY
  // =========================================================
  if (activeView === 'problems') {
    const statusTabs: readonly ('All' | ProblemSolutionStatus)[] = [
      'All',
      'Awaiting Solution',
      'Under Review',
      'Partially Solved',
      'Verification Required',
      'Solved',
    ];

    return (
      <div className="space-y-6 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white">AI-Identified Global Problems</h2>
            <p className="text-xs text-slate-400 mt-1">
              {filteredProblems.length} problems tracked in {regionFilter}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenSubmit({ kind: 'resource' })}
            className="px-4 py-2.5 rounded-xl btn-royal text-white font-bold text-xs flex items-center space-x-1.5 whitespace-nowrap cursor-pointer self-start"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Resource Link</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0A1633] border border-[#1E386E] rounded-xl w-fit">
          {statusTabs.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setProblemStatusFilter(status)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition whitespace-nowrap cursor-pointer ${
                problemStatusFilter === status ? 'btn-royal text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredProblems.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl text-center space-y-3">
              <p className="text-xs text-slate-400">
                {problems.length === 0
                  ? '0 problems discovered yet.'
                  : 'No problems match the current search or solution status filter.'}
              </p>
              {problems.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setProblemStatusFilter('All')}
                  className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
                >
                  Show All Problems
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenSubmit({ kind: 'resource' })}
                  className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
                >
                  Submit Resource Link
                </button>
              )}
            </div>
          ) : (
            filteredProblems.map((prob) => (
              <div
                key={prob.id}
                className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-sky-400/35 transition"
              >
                <button
                  type="button"
                  onClick={() => onSelectProblem(prob)}
                  className="flex items-start space-x-3.5 text-left cursor-pointer flex-1"
                >
                  <ProblemThumbnail theme={prob.theme} size="md" />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{prob.title}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${problemSolutionStatusBadge(
                          prob.solutionStatus
                        )}`}
                      >
                        {prob.solutionStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {prob.summary}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-1">
                      <span className="text-[#38BDF8] font-medium">{prob.industry}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {prob.country}, {prob.region}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{prob.potentialMatchesCount} matches</span>
                      <span aria-hidden="true">·</span>
                      <span>{prob.sourceEvidence.label}</span>
                    </div>
                  </div>
                </button>

                <div className="flex items-center space-x-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleUpvote(prob.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition tabular-nums cursor-pointer ${
                      prob.upvoted
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                        : 'bg-[#0A1633] border-[#1E386E] text-slate-300 hover:border-sky-400/40'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{prob.upvotes}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectProblem(prob)}
                    className="px-3.5 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 hover:border-sky-400/40 transition cursor-pointer"
                  >
                    Open Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // =========================================================
  // 4. SOLUTIONS & EVIDENCE ASSESSMENT DIRECTORY
  // =========================================================
  if (activeView === 'solutions') {
    const solutionStatuses: readonly ('All' | SolutionStatus)[] = [
      'All',
      'Submitted',
      'Under review',
      'Partially solved',
      'Fully solved',
      'Verification required',
    ];

    return (
      <div className="space-y-6 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Solutions &amp; Evidence Links</h2>
            <p className="text-xs text-slate-400 mt-1">
              Submit evidence links demonstrating real-world progress against discovered problems.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={solutionCategoryFilter}
              onChange={(e) => setSolutionCategoryFilter(e.target.value)}
              className="bg-[#0A1633] border border-[#1E386E] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
            >
              <option value="All">All Industries</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onOpenSubmit({ kind: 'evidence' })}
              className="px-4 py-2 rounded-xl btn-royal text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit Solution Evidence</span>
            </button>
          </div>
        </div>

        {/* Interactive 5-Status Filter Bar */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0A1633] border border-[#1E386E] rounded-xl w-fit">
          {solutionStatuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSolutionStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                solutionStatusFilter === status ? 'btn-royal text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {filteredSolutions.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center space-y-3">
            <p className="text-xs text-slate-400">
              {solutions.length === 0
                ? '0 solution evidence links submitted yet.'
                : 'No solution evidence matches the selected status or industry filter.'}
            </p>
            <div className="flex justify-center gap-2">
              {solutions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSolutionStatusFilter('All');
                    setSolutionCategoryFilter('All');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-white text-xs font-bold cursor-pointer"
                >
                  Show All Statuses
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenSubmit({ kind: 'evidence' })}
                className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
              >
                Submit Evidence Link
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSolutions.map((sol) => {
              const targetProb = problems.find((p) => p.id === sol.problemId);
              return (
                <div
                  key={sol.id}
                  className="glass-card p-5 rounded-2xl border border-sky-400/15 hover:border-sky-400/40 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => onSelectSolution(sol)}
                      className="w-full text-left space-y-3 cursor-pointer"
                    >
                      <SolutionVisualBanner theme={sol.theme} name={sol.name} verified={sol.verified} />
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-white">{sol.name}</h3>
                          <p className="text-xs text-[#38BDF8] mt-0.5">{sol.tagline}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-bold whitespace-nowrap ${solutionStatusBadge(
                              sol.status
                            )}`}
                          >
                            {sol.status}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded border text-[9px] font-bold whitespace-nowrap ${verificationStatusBadge(
                              sol.humanReviewStatus || (sol.verified ? 'Verified' : 'Awaiting Review')
                            )}`}
                          >
                            Human: {sol.humanReviewStatus || (sol.verified ? 'Verified' : 'Awaiting Review')}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {sol.addressExplanation || sol.evidenceSummary}
                      </p>
                      <div className="text-[11px] text-slate-400">
                        AI Assessment:{' '}
                        <strong className="text-amber-300">
                          {sol.aiAssessmentStatus || 'Pending Batch Assessment'}
                        </strong>
                        {sol.supportingDocumentName ? ` · PDF: ${sol.supportingDocumentName}` : ''}
                      </div>
                    </button>

                    {targetProb && (
                      <button
                        type="button"
                        onClick={() => onSelectProblem(targetProb)}
                        className="w-full text-left px-3 py-2 rounded-xl bg-[#040A1A] border border-[#1E386E] hover:border-sky-400/50 text-[11px] text-slate-300 flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <span className="truncate">
                          Problem: <strong className="text-white">{targetProb.title}</strong>
                        </span>
                        <span className="text-[#38BDF8] font-semibold shrink-0">View →</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-400">
                      {sol.country} · Submitted {sol.submittedAt}
                    </span>
                    <div className="flex items-center space-x-2">
                      {sol.evidenceUrl && (
                        <a
                          href={sol.evidenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-sky-300 flex items-center space-x-1"
                        >
                          <span>Evidence</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => onToggleSolutionBookmark(sol.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                          sol.bookmarked
                            ? 'bg-sky-500/20 border-sky-400/40 text-sky-300'
                            : 'bg-[#0A1633] border-[#1E386E] text-slate-300'
                        }`}
                      >
                        {sol.bookmarked ? 'Saved ✓' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // 5. STARTUPS DIRECTORY
  // =========================================================
  if (activeView === 'startups') {
    const backendFeaturedStartups = startups
      .filter((st) => st.featuredByBackend)
      .sort((a, b) => (b.usefulnessScore || 0) - (a.usefulnessScore || 0));

    return (
      <div className="space-y-6 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Startups Directory</h2>
            <p className="text-xs text-slate-400 mt-1">
              {filteredStartups.length} active startups indexed in {regionFilter}
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={startupStageFilter}
              onChange={(e) => setStartupStageFilter(e.target.value)}
              className="bg-[#0A1633] border border-[#1E386E] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
            >
              <option value="All">All Stages</option>
              <option value="Seed">Seed</option>
              <option value="Series A">Series A</option>
              <option value="Series B">Series B</option>
              <option value="Bootstrapped">Bootstrapped</option>
            </select>
            <button
              type="button"
              onClick={() => onOpenSubmit({ kind: 'resource' })}
              className="px-4 py-2 rounded-xl btn-royal text-white font-bold text-xs flex items-center space-x-1.5 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit Startup URL</span>
            </button>
          </div>
        </div>

        {backendFeaturedStartups.length > 0 && (
          <div className="glass-card rounded-2xl p-5 border border-amber-400/25 bg-gradient-to-br from-[#0A1838]/95 via-[#07122B] to-[#0B1C3A]/95 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/35 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 text-amber-300" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Featured Startups · Ranked by Impact &amp; Usefulness
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Selected automatically by Gloweave backend usefulness scoring (verified evidence &amp; confirmed problem solves). Founders cannot self-feature listings.
                  </p>
                </div>
              </div>
              <span className="self-start sm:self-center px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/30 text-[10px] font-bold text-amber-300 whitespace-nowrap">
                Backend Ranked
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {backendFeaturedStartups.map((st, idx) => (
                <div
                  key={st.id}
                  className="p-4 rounded-xl bg-[#050D22]/90 border border-[#1E386E] flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-400/30 text-[10px] font-bold text-amber-300">
                        #{idx + 1} Featured
                      </span>
                      <span className="text-[11px] font-bold text-emerald-400 tabular-nums">
                        {st.usefulnessScore ?? 90}/100 usefulness
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{st.name}</h4>
                      <p className="text-[11px] text-[#38BDF8] mt-0.5">
                        {st.sector} · {st.stage} · {st.country}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {st.featuredReason || st.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-[11px]">
                    <span className="text-slate-400 font-medium">Indexed {st.submittedAt}</span>
                    <a
                      href={st.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#38BDF8] font-bold flex items-center gap-1 hover:underline"
                    >
                      <span>Visit</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredStartups.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center space-y-3">
            <p className="text-xs text-slate-400">
              {startups.length === 0
                ? '0 startups indexed yet.'
                : 'No startups match the selected stage or search.'}
            </p>
            {startups.length > 0 ? (
              <button
                type="button"
                onClick={() => setStartupStageFilter('All')}
                className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
              >
                Show All Stages
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenSubmit({ kind: 'resource' })}
                className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
              >
                Submit Startup URL
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStartups.map((st) => (
              <div key={st.id} className="glass-card p-5 rounded-2xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{st.name}</h3>
                    <p className="text-xs text-[#38BDF8] mt-0.5">
                      {st.sector} · {st.stage} · {st.country}, {st.region}
                    </p>
                  </div>
                  {st.featuredByBackend && typeof st.usefulnessScore === 'number' ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/35 text-[10px] font-bold text-amber-300 shrink-0 tabular-nums">
                      {st.usefulnessScore}% useful
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-[#0A1633] border border-[#1E386E] text-[10px] font-semibold text-sky-300 shrink-0">
                      {st.stage}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{st.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-500">Submitted {st.submittedAt}</span>
                  <a
                    href={st.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#38BDF8] font-semibold flex items-center space-x-1 hover:underline"
                  >
                    <span>Visit Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // 6. RANKINGS SCREEN (with Global, Country, Region, Category filters)
  // =========================================================
  if (activeView === 'rankings') {
    const rankedContributors = contributors
      .filter((c) => {
        if (rankingTab === 'solvers' && c.kind !== 'solver') return false;
        if (rankingTab === 'innovators' && c.kind !== 'innovator') return false;
        if (rankingRegion !== 'Global' && c.region !== rankingRegion) return false;
        if (rankingCountry !== 'All' && c.country !== rankingCountry) return false;
        if (rankingCategory !== 'All' && c.category !== rankingCategory) return false;
        return true;
      })
      .sort((a, b) => b.score - a.score);

    const rankedStartups = startups
      .filter((st) => {
        if (rankingRegion !== 'Global' && st.region !== rankingRegion) return false;
        if (rankingCountry !== 'All' && st.country !== rankingCountry) return false;
        if (rankingCategory !== 'All' && st.sector !== rankingCategory) return false;
        return true;
      })
      .sort(
        (a, b) =>
          (b.usefulnessScore || 0) - (a.usefulnessScore || 0) ||
          (b.featuredByBackend ? 1 : 0) - (a.featuredByBackend ? 1 : 0)
      );

    const rankedSolutions = solutions
      .filter((s) => {
        if (rankingRegion !== 'Global' && s.region !== rankingRegion) return false;
        if (rankingCountry !== 'All' && s.country !== rankingCountry) return false;
        if (rankingCategory !== 'All' && s.category !== rankingCategory) return false;
        return true;
      })
      .sort((a, b) => b.rating - a.rating || (b.verified ? 1 : 0) - (a.verified ? 1 : 0));

    const resetRankingFilters = () => {
      setRankingRegion('Global');
      setRankingCountry('All');
      setRankingCategory('All');
    };

    return (
      <div className="space-y-6 pb-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Global Rankings &amp; Leaderboards</h2>
            <p className="text-xs text-slate-400 mt-1">
              Filter by Global scope, Region, Country (A–Z), and Category
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 p-1 bg-[#0A1633] border border-[#1E386E] rounded-xl self-start">
            {(
              [
                { id: 'solvers', label: 'Problem Solvers' },
                { id: 'innovators', label: 'Innovators' },
                { id: 'startups', label: 'Startups' },
                { id: 'solutions', label: 'Popular Solutions' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRankingTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  rankingTab === tab.id ? 'btn-royal text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Multi-Filter Toolbar */}
        <div className="glass-card p-4 rounded-2xl flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-semibold text-slate-400">Region:</span>
            <select
              value={rankingRegion}
              onChange={(e) => setRankingRegion(e.target.value as RegionFilter)}
              className="bg-[#040A1A] border border-[#1E386E] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="Global">Global</option>
              {CONTINENTS.map((continent) => (
                <option key={continent} value={continent}>
                  {continent}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2 min-w-[200px]">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0">Country:</span>
            <div className="flex-1 min-w-[165px]">
              <CountrySelector
                value={rankingCountry}
                onChange={setRankingCountry}
                includeAllOption
                allOptionLabel="All Countries"
                compact
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-semibold text-slate-400">Category:</span>
            <select
              value={rankingCategory}
              onChange={(e) => setRankingCategory(e.target.value)}
              className="bg-[#040A1A] border border-[#1E386E] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          {(rankingRegion !== 'Global' || rankingCountry !== 'All' || rankingCategory !== 'All') && (
            <button
              type="button"
              onClick={resetRankingFilters}
              className="ml-auto text-xs font-semibold text-[#38BDF8] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {(rankingTab === 'solvers' || rankingTab === 'innovators') && (
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-slate-800/80">
            {rankedContributors.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-xs text-slate-400">
                  {contributors.length === 0
                    ? '0 ranked contributors yet.'
                    : 'No contributors match the selected filters.'}
                </p>
                {contributors.length > 0 && (
                  <button
                    type="button"
                    onClick={resetRankingFilters}
                    className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              rankedContributors.map((person, idx) => (
                <div
                  key={person.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition"
                >
                  <div className="flex items-center space-x-3.5">
                    <span className="w-7 text-center font-extrabold text-sm text-amber-400 tabular-nums">
                      #{idx + 1}
                    </span>
                    <AvatarBadge
                      initials={person.initials}
                      accentFrom={person.accentFrom}
                      accentTo={person.accentTo}
                      size="lg"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-white">{person.name}</h3>
                      <p className="text-xs text-slate-400">
                        {person.role} · {person.country}, {person.region} · {person.category} · Solving{' '}
                        {person.problemsSolved} problems
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-emerald-400 tabular-nums flex items-center space-x-1">
                        <span>{person.score}</span>
                        <ArrowUp className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-[10px] text-slate-500 tabular-nums">{person.trend} pts</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleConnect(person.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        person.connected
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                          : 'bg-[#0A1633] border border-[#1E386E] text-slate-200 hover:border-sky-400/50'
                      }`}
                    >
                      {person.connected ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {rankingTab === 'startups' && (
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-slate-800/80">
            {rankedStartups.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-xs text-slate-400">
                  {startups.length === 0
                    ? '0 ranked startups yet.'
                    : 'No startups match the selected filters.'}
                </p>
                {startups.length > 0 && (
                  <button
                    type="button"
                    onClick={resetRankingFilters}
                    className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              rankedStartups.map((st, idx) => (
                <div
                  key={st.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3.5">
                    <span className="w-7 text-center font-extrabold text-sm text-amber-400 tabular-nums">
                      #{idx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">{st.name}</h3>
                      <p className="text-xs text-slate-400">
                        {st.sector} · {st.stage} · {st.country}, {st.region}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {typeof st.usefulnessScore === 'number' ? (
                      <span className="text-xs font-bold text-amber-300 tabular-nums">
                        {st.usefulnessScore}% useful
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">{st.stage}</span>
                    )}
                    <a
                      href={st.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-[#38BDF8]"
                    >
                      Visit ↗
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {rankingTab === 'solutions' && (
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-slate-800/80">
            {rankedSolutions.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-xs text-slate-400">
                  {solutions.length === 0
                    ? '0 ranked solutions yet.'
                    : 'No solutions match the selected filters.'}
                </p>
                {solutions.length > 0 && (
                  <button
                    type="button"
                    onClick={resetRankingFilters}
                    className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              rankedSolutions.map((sol, idx) => (
                <button
                  key={sol.id}
                  type="button"
                  onClick={() => onSelectSolution(sol)}
                  className="w-full text-left p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition cursor-pointer"
                >
                  <div className="flex items-center space-x-3.5">
                    <span className="w-7 text-center font-extrabold text-sm text-amber-400 tabular-nums">
                      #{idx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">{sol.name}</h3>
                      <p className="text-xs text-slate-400">
                        {sol.category} · {sol.country}, {sol.region} · {sol.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-amber-400 tabular-nums">
                      ★ {sol.rating} ({sol.reviewsCount})
                    </span>
                    <span className="text-xs font-semibold text-[#38BDF8]">Inspect →</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // 7. COMMUNITY DIRECTORY
  // =========================================================
  if (activeView === 'community') {
    return (
      <div className="space-y-6 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Innovator Community</h2>
            <p className="text-xs text-slate-400 mt-1">
              {contributors.length} active contributors across {new Set(contributors.map((c) => c.country)).size} countries
            </p>
          </div>
          <select
            value={communityCategory}
            onChange={(e) => setCommunityCategory(e.target.value)}
            className="bg-[#0A1633] border border-[#1E386E] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none self-start"
          >
            <option value="All">All Specialties</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {filteredContributors.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center space-y-3">
            <p className="text-xs text-slate-400">
              {contributors.length === 0
                ? '0 community members joined yet.'
                : 'No community members match the selected specialty or search.'}
            </p>
            {contributors.length > 0 && (
              <button
                type="button"
                onClick={() => setCommunityCategory('All')}
                className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
              >
                Show All Specialties
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredContributors.map((person) => (
              <div
                key={person.id}
                className="glass-card p-5 rounded-2xl flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3.5">
                    <AvatarBadge
                      initials={person.initials}
                      accentFrom={person.accentFrom}
                      accentTo={person.accentTo}
                      size="lg"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-white">{person.name}</h3>
                      <p className="text-xs text-slate-400">{person.role}</p>
                      <p className="text-[11px] text-[#38BDF8] mt-0.5">
                        {person.country}, {person.region} · {person.category}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-400 tabular-nums">
                    {person.score} ↑
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-2">
                  <span className="text-xs text-slate-400">
                    {person.problemsSolved} problems solved
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => onStartMessageWith(person)}
                      className="px-3 py-1.5 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 hover:border-sky-400/50 cursor-pointer"
                    >
                      Message
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleConnect(person.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        person.connected
                          ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                          : 'btn-royal text-white'
                      }`}
                    >
                      {person.connected ? 'Connected ✓' : 'Connect'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // 8. DISTRIBUTION & ANALYTICS
  // =========================================================
  if (activeView === 'distribution' || activeView === 'analytics') {
    const activeRegion = regions.find((r) => r.id === selectedRegionId) || regions[0];
    const hasActivity = problems.length + solutions.length + startups.length > 0;
    const seriesByRange = hasActivity
      ? {
          '7D': [0, 0, 0, 0, 0, 0, Math.min(100, (problems.length + solutions.length + startups.length) * 15)],
          '30D': [0, 0, 0, 0, 0, 0, Math.min(100, (problems.length + solutions.length + startups.length) * 15)],
          '90D': [0, 0, 0, 0, 0, 0, Math.min(100, (problems.length + solutions.length + startups.length) * 15)],
        }[analyticsRange]
      : [0, 0, 0, 0, 0, 0, 0];

    const totalCountries = new Set(
      [
        ...problems.map((p) => p.country),
        ...solutions.map((s) => s.country),
        ...startups.map((st) => st.country),
        ...contributors.map((c) => c.country),
        ...matches.map((m) => m.country),
        ...(profileLocation ? [profileLocation] : []),
      ]
        .map((c) => c.trim())
        .filter(Boolean)
    ).size;
    const totalNodes = regions.reduce((sum, r) => sum + r.activeNodes, 0);

    return (
      <div className="space-y-6 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white">
              {activeView === 'distribution'
                ? 'Global Regions & Country Distribution'
                : 'Platform Analytics'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Regional intelligence across {totalCountries} countries and {totalNodes} active nodes
            </p>
          </div>
          {activeView === 'analytics' && (
            <div className="flex items-center gap-1 p-1 bg-[#0A1633] border border-[#1E386E] rounded-xl self-start">
              {(['7D', '30D', '90D'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setAnalyticsRange(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    analyticsRange === r ? 'btn-royal text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 glass-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Globe className="w-4 h-4 text-[#38BDF8]" />
                <span>
                  {activeView === 'distribution'
                    ? 'Interactive Regional Mesh'
                    : `Global Problem & Solution Velocity (${analyticsRange})`}
                </span>
              </h3>
              <span className="text-xs text-sky-300 font-semibold tabular-nums">
                {activeRegion.flag} {activeRegion.name}: {activeRegion.percentage}%
              </span>
            </div>

            {activeView === 'distribution' ? (
              <DottedWorldMap
                selectedRegionId={selectedRegionId}
                onSelectRegion={setSelectedRegionId}
              />
            ) : (
              <div className="h-40 rounded-xl bg-[#040A1A] border border-[#1E386E] p-4 flex items-end justify-between gap-3">
                {seriesByRange.map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-[#0066FF] to-[#22D3EE]"
                      style={{ height: `${val}%` }}
                    />
                    <span className="text-[10px] text-slate-400 tabular-nums">W{idx + 1}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#040A1A] border border-[#1E386E]">
                <div className="text-[11px] text-slate-400">Active Nodes</div>
                <div className="text-lg font-extrabold text-white tabular-nums mt-0.5">
                  {activeRegion.activeNodes}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#040A1A] border border-[#1E386E]">
                <div className="text-[11px] text-slate-400">Startups</div>
                <div className="text-lg font-extrabold text-[#38BDF8] tabular-nums mt-0.5">
                  {activeRegion.startupsCount}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#040A1A] border border-[#1E386E]">
                <div className="text-[11px] text-slate-400">Leading Sector</div>
                <div className="text-xs font-bold text-white mt-1.5">{activeRegion.topSector}</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Regional Share Breakdown</h3>
            <div className="space-y-3">
              {regions.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRegionId(r.id)}
                  className="w-full text-left space-y-1.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-semibold">
                      {r.flag} {r.name}
                    </span>
                    <span className="text-white font-bold tabular-nums">{r.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#040A1A] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        r.id === selectedRegionId
                          ? 'bg-gradient-to-r from-[#0066FF] to-[#22D3EE]'
                          : 'bg-slate-600'
                      }`}
                      style={{ width: `${Math.min(100, r.percentage * 3)}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // 9. MESSAGES (Contact List -> Drill-In Single Contact Chat Room)
  // =========================================================
  if (activeView === 'messages') {
    const filteredContacts = messages.filter((thread) => {
      const cq = contactSearch.trim().toLowerCase();
      if (!cq) return true;
      return (
        thread.senderName.toLowerCase().includes(cq) ||
        thread.senderRole.toLowerCase().includes(cq) ||
        thread.messages.some((m) => m.text.toLowerCase().includes(cq))
      );
    });

    const getLastMessagePreview = (thread: MessageThread) => {
      const last = thread.messages[thread.messages.length - 1];
      if (!last) return 'Tap to start chatting';
      if (last.text) return last.text;
      const firstAtt = last.attachments?.[0];
      if (!firstAtt) return 'Attachment shared';
      if (firstAtt.type === 'image') return `Shared a picture${firstAtt.title ? `: ${firstAtt.title}` : ''}`;
      if (firstAtt.type === 'pdf') return `Shared PDF: ${firstAtt.title || 'Document.pdf'}`;
      return `Shared link: ${firstAtt.title || firstAtt.url || 'Resource'}`;
    };

    return (
      <div className="space-y-5 pb-10">
        {!activeThread ? (
          <>
            {/* SCREEN A: CONTACTS / CONVERSATIONS LIST */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-white">Messages</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Tap any contact to open their message room and share pictures, PDFs, or product links
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectView('community')}
                className="px-4 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] hover:border-sky-400/50 text-xs font-bold text-[#38BDF8] flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message Someone from Community</span>
              </button>
            </div>

            {!authenticatedUser && (
              <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-400/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-slate-200">
                  <strong className="text-[#38BDF8]">Review Mode:</strong> You can open and read
                  conversations freely. Sign in before sending messages, uploading pictures/PDFs, or summarizing shared links.
                </p>
                <button
                  type="button"
                  onClick={() => onRequireAuth?.('send direct messages and attachments')}
                  className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold shrink-0 cursor-pointer"
                >
                  Sign In to Message
                </button>
              </div>
            )}

            {messages.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center space-y-3">
                <p className="text-sm font-bold text-white">0 conversations yet</p>
                <p className="text-xs text-slate-400">
                  Open the Community directory to message a solver, founder, or researcher.
                </p>
                <button
                  type="button"
                  onClick={() => onSelectView('community')}
                  className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
                >
                  Browse Community
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    placeholder="Search contacts by name, role, or message..."
                    className="w-full bg-[#061028] border border-[#1E386E] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div className="glass-card rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
                  {filteredContacts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No contacts match "{contactSearch}".
                    </div>
                  ) : (
                    filteredContacts.map((thread) => {
                      const lastMsg = thread.messages[thread.messages.length - 1];
                      const attCount = lastMsg?.attachments?.length || 0;
                      return (
                        <button
                          key={thread.id}
                          type="button"
                          onClick={() => onSelectThread(thread.id)}
                          className="w-full text-left p-4 flex items-center gap-3.5 hover:bg-white/[0.04] transition cursor-pointer group"
                        >
                          <AvatarBadge
                            initials={thread.senderInitials}
                            accentFrom={thread.accentFrom}
                            accentTo={thread.accentTo}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm font-bold text-white truncate">
                                  {thread.senderName}
                                </span>
                                {thread.unread && (
                                  <span className="px-1.5 py-0.5 rounded bg-sky-500/20 border border-sky-400/40 text-[10px] font-bold text-[#38BDF8] shrink-0">
                                    New
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 shrink-0">
                                {thread.timestamp}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#38BDF8] truncate mt-0.5">
                              {thread.senderRole}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-slate-400 truncate flex-1">
                                {getLastMessagePreview(thread)}
                              </p>
                              {attCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-[#0A1633] border border-[#1E386E] text-[10px] text-slate-300 shrink-0">
                                  {attCount} {attCount === 1 ? 'attachment' : 'attachments'}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition shrink-0" />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* SCREEN B: INSIDE DEDICATED CONTACT MESSAGE ROOM */}
            <div className="glass-card rounded-2xl overflow-hidden flex flex-col min-h-[70vh] max-h-[82vh]">
              {/* Room Header */}
              <div className="px-4 sm:px-5 py-3.5 border-b border-slate-800/80 bg-[#07122B]/90 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectThread(null);
                      setShowLinkInput(false);
                      setChatLinkError('');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-[#0A1633] border border-[#1E386E] hover:border-sky-400/50 text-xs font-bold text-slate-200 flex items-center gap-1.5 shrink-0 cursor-pointer"
                    aria-label="Back to contacts list"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Contacts</span>
                  </button>
                  <AvatarBadge
                    initials={activeThread.senderInitials}
                    accentFrom={activeThread.accentFrom}
                    accentTo={activeThread.accentTo}
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-white truncate">
                      {activeThread.senderName}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate">
                      {activeThread.senderRole}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!authenticatedUser && (
                    <button
                      type="button"
                      onClick={() => onRequireAuth?.('send direct messages and attachments')}
                      className="px-3 py-1.5 rounded-lg btn-royal text-white text-[11px] font-bold cursor-pointer"
                    >
                      Sign In to Reply
                    </button>
                  )}
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto bg-[#040B1B]/60">
                {activeThread.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.fromSelf ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[90%] sm:max-w-lg rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-2.5 ${
                        m.fromSelf
                          ? 'bg-gradient-to-br from-[#0055E5] to-[#0077FF] text-white shadow-lg shadow-blue-950/40'
                          : 'bg-[#08132D] border border-[#1E386E] text-slate-200'
                      }`}
                    >
                      {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}

                      {/* Rich Attachments inside Bubble */}
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="space-y-2.5 pt-0.5">
                          {m.attachments.map((att) => {
                            if (att.type === 'image' && att.url) {
                              return (
                                <div
                                  key={att.id}
                                  className="rounded-xl overflow-hidden border border-white/15 bg-black/25"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewImageAttachment({
                                        url: att.url!,
                                        title: att.title,
                                      })
                                    }
                                    className="block w-full text-left cursor-pointer group"
                                  >
                                    <img
                                      src={att.url}
                                      alt={att.title || 'Shared image'}
                                      className="max-h-60 w-full object-cover group-hover:opacity-95 transition"
                                    />
                                    <div className="px-2.5 py-1.5 flex items-center justify-between text-[10px] text-slate-200 bg-black/40">
                                      <span className="truncate flex items-center gap-1">
                                        <ImageIcon className="w-3 h-3 text-sky-300 shrink-0" />
                                        <span className="truncate">{att.title || 'Picture'}</span>
                                      </span>
                                      <span className="text-sky-300 font-semibold shrink-0 ml-2">
                                        {formatChatFileSize(att.fileSizeBytes) || 'Preview'}
                                      </span>
                                    </div>
                                  </button>
                                </div>
                              );
                            }

                            if (att.type === 'pdf') {
                              return (
                                <div
                                  key={att.id}
                                  className="p-3 rounded-xl bg-[#050D22]/85 border border-sky-400/25 flex items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-400/30 flex items-center justify-center shrink-0">
                                      <FileText className="w-4 h-4 text-rose-300" />
                                    </span>
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-bold text-white truncate">
                                        {att.title || 'Document.pdf'}
                                      </p>
                                      <p className="text-[10px] text-slate-400">
                                        PDF Document
                                        {att.fileSizeBytes
                                          ? ` · ${formatChatFileSize(att.fileSizeBytes)}`
                                          : ''}
                                      </p>
                                    </div>
                                  </div>
                                  {att.url ? (
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2.5 py-1.5 rounded-lg bg-[#0A1A3F] border border-sky-400/35 text-[10px] font-bold text-[#38BDF8] hover:bg-[#102452] shrink-0 flex items-center gap-1"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>Open PDF</span>
                                    </a>
                                  ) : (
                                    <span className="px-2 py-1 rounded-md bg-slate-800/80 text-[10px] text-slate-300 shrink-0">
                                      PDF Attached
                                    </span>
                                  )}
                                </div>
                              );
                            }

                            if (att.type === 'link' && att.url) {
                              const summaryState = att.linkSummary?.status || 'idle';
                              return (
                                <div
                                  key={att.id}
                                  className="p-3 rounded-xl bg-[#050D22]/90 border border-sky-400/30 space-y-2.5"
                                >
                                  <div className="flex items-start justify-between gap-2.5">
                                    <div className="flex items-start gap-2 min-w-0">
                                      <span className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center shrink-0 mt-0.5">
                                        <Link2 className="w-3.5 h-3.5 text-[#38BDF8]" />
                                      </span>
                                      <div className="min-w-0">
                                        <p className="text-[11px] font-bold text-white truncate">
                                          {att.title || extractDomainLabel(att.url)}
                                        </p>
                                        <a
                                          href={att.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[10px] text-[#38BDF8] hover:underline break-all flex items-center gap-1"
                                        >
                                          <span className="truncate">{att.url}</span>
                                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                        </a>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={summaryState === 'loading'}
                                      onClick={() =>
                                        onSummarizeMessageLink(
                                          activeThread.id,
                                          m.id,
                                          att.id,
                                          att.url!
                                        )
                                      }
                                      className="px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-400/40 hover:bg-sky-500/25 text-[11px] font-bold text-[#38BDF8] flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                                    >
                                      {summaryState === 'loading' ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Sparkles className="w-3 h-3" />
                                      )}
                                      <span>
                                        {summaryState === 'loading'
                                          ? 'Summarizing Inner Link...'
                                          : summaryState === 'ready'
                                          ? 'Refresh Inner Link Summary'
                                          : 'Summarize Inner Link'}
                                      </span>
                                    </button>
                                  </div>

                                  {summaryState === 'ready' && att.linkSummary?.summary && (
                                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-400/30 space-y-1.5 text-[11px]">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-bold text-emerald-300">
                                          Backend Link Summary
                                        </span>
                                        {att.linkSummary.pageTitle && (
                                          <span className="text-[10px] text-slate-300 truncate">
                                            {att.linkSummary.pageTitle}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-slate-200 leading-relaxed">
                                        {att.linkSummary.summary}
                                      </p>
                                      {att.linkSummary.keyPoints &&
                                        att.linkSummary.keyPoints.length > 0 && (
                                          <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-slate-300">
                                            {att.linkSummary.keyPoints.map((kp, i) => (
                                              <li key={i}>{kp}</li>
                                            ))}
                                          </ul>
                                        )}
                                    </div>
                                  )}

                                  {summaryState === 'awaiting-backend' && (
                                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-400/30 space-y-1 text-[10px] text-amber-200">
                                      <p className="font-bold text-amber-300">
                                        Awaiting Backend Integration
                                      </p>
                                      <p className="text-slate-300">
                                        {att.linkSummary?.errorMessage ||
                                          'Backend link summarization endpoint (POST /api/messages/summarize-link) is not connected yet.'}
                                      </p>
                                    </div>
                                  )}

                                  {summaryState === 'error' && (
                                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-400/30 space-y-1 text-[10px] text-rose-200">
                                      <p className="font-bold">Could not summarize link</p>
                                      <p>{att.linkSummary?.errorMessage || 'Backend request failed.'}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            return null;
                          })}
                        </div>
                      )}

                      <p className="text-[10px] opacity-75 text-right">{m.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Composer Area */}
              <div className="p-3.5 sm:p-4 border-t border-slate-800/80 bg-[#07122B]/95 space-y-3">
                {/* Staged Attachments Preview */}
                {stagedAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {stagedAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#040B1B] border border-sky-400/35 text-[11px] text-slate-200 max-w-full"
                      >
                        {att.type === 'image' && att.url && (
                          <img
                            src={att.url}
                            alt={att.title || 'Staged picture'}
                            className="w-6 h-6 rounded object-cover shrink-0"
                          />
                        )}
                        {att.type === 'pdf' && (
                          <FileText className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                        )}
                        {att.type === 'link' && (
                          <Link2 className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                        )}
                        <span className="truncate max-w-[180px]">
                          {att.title || att.url || 'Attachment'}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setStagedAttachments((prev) => prev.filter((a) => a.id !== att.id))
                          }
                          className="text-slate-400 hover:text-white cursor-pointer"
                          aria-label="Remove staged attachment"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Collapsible Share Product / Resource Link Bar */}
                {showLinkInput && (
                  <div className="p-3 rounded-xl bg-[#040B1B] border border-[#1E386E] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#38BDF8]">
                        Share Product or Resource Link
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowLinkInput(false);
                          setChatLinkError('');
                        }}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="url"
                        value={chatLinkUrl}
                        onChange={(e) => {
                          setChatLinkUrl(e.target.value);
                          setChatLinkError('');
                        }}
                        placeholder="https://product-or-resource-link.com"
                        className="bg-[#08132D] border border-[#1E386E] rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                      />
                      <input
                        type="text"
                        value={chatLinkTitle}
                        onChange={(e) => setChatLinkTitle(e.target.value)}
                        placeholder="Product / link name (optional)"
                        className="bg-[#08132D] border border-[#1E386E] rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                      />
                    </div>
                    {chatLinkError && <p className="text-[11px] text-rose-400">{chatLinkError}</p>}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] text-slate-400">
                        Recipients can tap "Summarize Inner Link" to inspect what is inside via backend.
                      </p>
                      <button
                        type="button"
                        onClick={handleAttachChatLink}
                        className="px-3 py-1.5 rounded-lg btn-royal text-white text-[11px] font-bold shrink-0 cursor-pointer"
                      >
                        Attach Link
                      </button>
                    </div>
                  </div>
                )}

                {/* Attachment Buttons + Input Form */}
                <input
                  ref={chatImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleChatImageSelect}
                  className="hidden"
                />
                <input
                  ref={chatPdfInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleChatPdfSelect}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!authenticatedUser) {
                        onRequireAuth?.('share pictures in messages');
                        return;
                      }
                      chatImageInputRef.current?.click();
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#0A1633] border border-[#1E386E] hover:border-sky-400/50 text-[11px] font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                    <span>Picture</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!authenticatedUser) {
                        onRequireAuth?.('share PDF files in messages');
                        return;
                      }
                      chatPdfInputRef.current?.click();
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#0A1633] border border-[#1E386E] hover:border-sky-400/50 text-[11px] font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-400" />
                    <span>PDF File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!authenticatedUser) {
                        onRequireAuth?.('share product links in messages');
                        return;
                      }
                      setShowLinkInput((prev) => !prev);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer ${
                      showLinkInput
                        ? 'bg-sky-500/20 border-sky-400/60 text-[#38BDF8]'
                        : 'bg-[#0A1633] border-[#1E386E] hover:border-sky-400/50 text-slate-200'
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Product / Link</span>
                  </button>
                </div>

                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Message ${activeThread.senderName} or paste a product link...`}
                    className="flex-1 bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl btn-royal text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shrink-0"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </>
        )}

        {/* Lightbox Preview for Shared Pictures */}
        {previewImageAttachment && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewImageAttachment(null)}
          >
            <div
              className="max-w-3xl w-full bg-[#07122B] border border-[#1E386E] rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate">
                  {previewImageAttachment.title || 'Shared Picture'}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewImageAttachment(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-300 cursor-pointer"
                  aria-label="Close picture preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 bg-black/40 flex items-center justify-center">
                <img
                  src={previewImageAttachment.url}
                  alt={previewImageAttachment.title || 'Shared picture'}
                  className="max-h-[75vh] w-auto object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // 10. NOTIFICATIONS
  // =========================================================
  if (activeView === 'notifications') {
    const displayedNotifs =
      notifFilter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

    return (
      <div className="space-y-6 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Notifications</h2>
            <p className="text-xs text-slate-400 mt-1">
              Click any update to mark read and jump to the corresponding screen
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-[#0A1633] border border-[#1E386E] rounded-xl">
              {(['all', 'unread'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setNotifFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                    notifFilter === f ? 'btn-royal text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onMarkAllNotificationsRead}
              className="px-4 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-[#38BDF8] hover:border-sky-400/50 flex items-center space-x-1.5 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          </div>
        </div>

        <div className="glass-card rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
          {displayedNotifs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              All caught up — no unread notifications.
            </div>
          ) : (
            displayedNotifs.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => onNotificationClick(n)}
                className={`w-full text-left p-4 flex items-start justify-between gap-4 transition cursor-pointer ${
                  n.read ? 'opacity-70 hover:opacity-100' : 'bg-[#0066FF]/10 hover:bg-[#0066FF]/15'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#040A1A] border border-[#1E386E] flex items-center justify-center text-[#38BDF8] shrink-0">
                    {n.type === 'message' ? (
                      <MessageSquare className="w-4 h-4" />
                    ) : n.type === 'ranking' ? (
                      <Trophy className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{n.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{n.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[11px] text-slate-500">{n.time}</span>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // =========================================================
  // 11. PROFILE & ACCOUNT MANAGEMENT
  // =========================================================
  const myProblems = problems.filter((p) => p.submittedByMe);
  const mySolutions = solutions.filter((s) => s.submittedByMe);
  const savedProblems = problems.filter((p) => p.bookmarked);
  const savedSolutions = solutions.filter((s) => s.bookmarked);
  const upvotedProblems = problems.filter((p) => p.upvoted);

  return (
    <div className="space-y-6 pb-10">
      {!authenticatedUser && (
        <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-400/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-200 leading-relaxed">
            <strong className="text-[#38BDF8]">Guest Review Mode:</strong> You can explore Gloweave
            freely. Sign in or create an account to personalize your profile, save items, post, or
            message members.
          </p>
          <button
            type="button"
            onClick={() => onRequireAuth?.('manage your Gloweave profile')}
            className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold shrink-0 cursor-pointer"
          >
            Sign In / Create Account
          </button>
        </div>
      )}

      <div className="glass-card p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <button
              type="button"
              onClick={() => {
                if (!authenticatedUser) {
                  onRequireAuth?.('upload a profile photo');
                  return;
                }
                photoInputRef.current?.click();
              }}
              aria-label="Upload profile picture"
              className="relative block rounded-full cursor-pointer focus:outline-none"
            >
              <AvatarBadge
                photoUrl={profilePhotoUrl}
                alt={profileName || 'Profile picture'}
                size="lg"
                accentFrom="#0066FF"
                accentTo="#22D3EE"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0066FF] border border-sky-300 text-white flex items-center justify-center shadow">
                <Camera className="w-3 h-3" />
              </span>
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoFileChange}
              className="hidden"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-white">
                {authenticatedUser ? profileName || 'Your Profile' : 'Guest Reviewer'}
              </h2>
              {isPro && authenticatedUser && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold">
                  PRO
                </span>
              )}
            </div>
            {(profileRole || profileLocation) && (
              <p className="text-xs text-slate-300 mt-0.5">
                {[profileRole, profileLocation].filter(Boolean).join(' · ')}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => {
                  if (!authenticatedUser) {
                    onRequireAuth?.('upload a profile photo');
                    return;
                  }
                  photoInputRef.current?.click();
                }}
                className="text-[11px] font-semibold text-[#38BDF8] hover:underline cursor-pointer"
              >
                {profilePhotoUrl ? 'Change photo' : 'Upload real photo'}
              </button>
              {profilePhotoUrl && (
                <button
                  type="button"
                  onClick={onRemovePhoto}
                  className="text-[11px] font-semibold text-rose-400 hover:underline cursor-pointer"
                >
                  Remove photo
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
              {myProblems.length} submitted problems · {mySolutions.length} submitted solutions ·{' '}
              {savedProblems.length + savedSolutions.length} saved · {upvotedProblems.length} upvotes
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            type="button"
            onClick={() => {
              onSelectSettingsTab('account');
              onSelectView('settings');
            }}
            className="px-3.5 py-2.5 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 hover:border-sky-400/50 flex items-center space-x-1.5 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Settings</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectView('support')}
            className="px-3.5 py-2.5 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 hover:border-sky-400/50 flex items-center space-x-1.5 cursor-pointer"
          >
            <LifeBuoy className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Support</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectView('legal')}
            className="px-3.5 py-2.5 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 hover:border-sky-400/50 flex items-center space-x-1.5 cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Legal</span>
          </button>
          <button
            type="button"
            onClick={onOpenUpgrade}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] text-slate-950 font-extrabold text-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>{isPro ? 'Manage Pro Access' : 'Upgrade to Pro'}</span>
          </button>
        </div>
      </div>

      {/* Profile Sub-Navigation */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-[#0A1633] border border-[#1E386E] rounded-xl w-fit">
        {(
          [
            { id: 'overview', label: 'Account Settings' },
            { id: 'problems', label: `Submitted Problems (${myProblems.length})` },
            { id: 'solutions', label: `Submitted Solutions (${mySolutions.length})` },
            { id: 'saved', label: `Saved Items (${savedProblems.length + savedSolutions.length})` },
            { id: 'upvotes', label: `Upvotes (${upvotedProblems.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setProfileTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              profileTab === t.id ? 'btn-royal text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {profileTab === 'overview' && (
        <div className="glass-card p-6 rounded-2xl space-y-5 max-w-2xl">
          <h3 className="text-sm font-bold text-white">Profile &amp; Account Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => onUpdateProfile({ name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Location</label>
              <input
                type="text"
                value={profileLocation}
                onChange={(e) => onUpdateProfile({ location: e.target.value })}
                placeholder="Enter your city & country"
                className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Role / Bio</label>
            <input
              type="text"
              value={profileRole}
              onChange={(e) => onUpdateProfile({ role: e.target.value })}
              placeholder="Enter your role or bio"
              className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
            />
          </div>
          <label className="flex items-center justify-between p-3 rounded-xl bg-[#040A1A] border border-[#1E386E] cursor-pointer">
            <span className="text-xs text-slate-200 font-medium">
              Weekly Global Intelligence Digest
            </span>
            <input
              type="checkbox"
              checked={emailDigest}
              onChange={(e) => onUpdateProfile({ emailDigest: e.target.checked })}
              className="accent-[#19C8FF]"
            />
          </label>
          <div className="flex items-center justify-end pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                if (!authenticatedUser) {
                  onRequireAuth?.('save profile settings');
                  return;
                }
                onToast('Profile settings saved.');
              }}
              className="px-5 py-2 rounded-xl btn-royal text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      )}

      {profileTab === 'problems' && (
        <div className="space-y-3">
          {myProblems.length === 0 ? (
            <div className="glass-card p-6 rounded-2xl text-center space-y-3">
              <p className="text-xs text-slate-300">
                Submit a startup, research, or website URL to queue it for Gloweave batch discovery.
              </p>
              <button
                type="button"
                onClick={() => onOpenSubmit({ kind: 'resource' })}
                className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
              >
                Submit Resource Link
              </button>
            </div>
          ) : (
            myProblems.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProblem(p)}
                className="w-full text-left glass-card p-4 rounded-2xl flex items-center justify-between hover:border-sky-400/40 transition cursor-pointer"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{p.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {p.category} · {p.country}, {p.region}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#38BDF8]">Inspect →</span>
              </button>
            ))
          )}
        </div>
      )}

      {profileTab === 'solutions' && (
        <div className="space-y-3">
          {mySolutions.length === 0 ? (
            <div className="glass-card p-6 rounded-2xl text-center space-y-3">
              <p className="text-xs text-slate-300">
                You haven&apos;t submitted solution evidence in this session yet.
              </p>
              <button
                type="button"
                onClick={() => onOpenSubmit({ kind: 'evidence' })}
                className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
              >
                Submit Solution Evidence
              </button>
            </div>
          ) : (
            mySolutions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectSolution(s)}
                className="w-full text-left glass-card p-4 rounded-2xl flex items-center justify-between hover:border-sky-400/40 transition cursor-pointer"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{s.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{s.tagline}</p>
                </div>
                <span className="text-xs font-semibold text-[#38BDF8]">Inspect →</span>
              </button>
            ))
          )}
        </div>
      )}

      {profileTab === 'saved' && (
        <div className="space-y-3">
          {savedProblems.length === 0 && savedSolutions.length === 0 ? (
            <div className="glass-card p-6 rounded-2xl text-center space-y-3">
              <p className="text-xs text-slate-300">
                No saved problems or solutions yet. Save items from Discover or Solution details.
              </p>
              <button
                type="button"
                onClick={() => onSelectView('discover')}
                className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold"
              >
                Browse Discover
              </button>
            </div>
          ) : (
            <>
              {savedProblems.map((p) => (
                <div
                  key={p.id}
                  className="glass-card p-4 rounded-2xl flex items-center justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => onSelectProblem(p)}
                    className="text-left flex-1 cursor-pointer"
                  >
                    <span className="text-[10px] font-bold text-purple-300">SAVED PROBLEM</span>
                    <h4 className="text-sm font-bold text-white">{p.title}</h4>
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
                  className="glass-card p-4 rounded-2xl flex items-center justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => onSelectSolution(s)}
                    className="text-left flex-1 cursor-pointer"
                  >
                    <span className="text-[10px] font-bold text-emerald-300">SAVED SOLUTION</span>
                    <h4 className="text-sm font-bold text-white">{s.name}</h4>
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
            </>
          )}
        </div>
      )}

      {profileTab === 'upvotes' && (
        <div className="space-y-3">
          {upvotedProblems.length === 0 ? (
            <div className="glass-card p-6 rounded-2xl text-center space-y-3">
              <p className="text-xs text-slate-300">
                You haven't upvoted any problems yet.
              </p>
              <button
                type="button"
                onClick={() => onSelectView('problems')}
                className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold"
              >
                Explore Problems
              </button>
            </div>
          ) : (
            upvotedProblems.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProblem(p)}
                className="w-full text-left glass-card p-4 rounded-2xl flex items-center justify-between hover:border-sky-400/40 transition cursor-pointer"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{p.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {p.category} · {p.country} · {p.upvotes} upvotes
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-400">Upvoted ✓</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
