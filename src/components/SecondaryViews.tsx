import React, { useRef, useState } from 'react';
import {
  ArrowUp,
  Bell,
  Camera,
  Check,
  CheckCheck,
  Clock,
  Crown,
  ExternalLink,
  Globe,
  Lightbulb,
  Link2,
  MessageSquare,
  Network,
  Plus,
  Rocket,
  Send,
  Sparkles,
  Star,
  ThumbsUp,
  Trophy,
} from 'lucide-react';
import { CATEGORIES } from '../data/gloweaveData';
import { CONTINENTS } from '../data/countries';
import {
  ContributorItem,
  MatchItem,
  MessageThread,
  NavView,
  NotificationItem,
  ProblemItem,
  ProblemSolutionStatus,
  RegionFilter,
  RegionInsight,
  ResourceSubmission,
  SolutionItem,
  SolutionStatus,
  StartupItem,
} from '../types/gloweave';
import { CountrySelector } from './CountrySelector';
import { MatchesView } from './MatchesView';
import {
  ProblemDetailView,
  problemSolutionStatusBadge,
  solutionStatusBadge,
} from './ProblemDetailView';
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
  activeThreadId: string;
  isPro: boolean;
  profileName: string;
  profileRole: string;
  profileLocation: string;
  profilePhotoUrl: string | null;
  emailDigest: boolean;
  onSelectView: (view: NavView) => void;
  onBackFromProblem: () => void;
  onOpenSubmit: (opts?: { kind?: 'resource' | 'evidence'; problemId?: string }) => void;
  onOpenUpgrade: () => void;
  onSelectProblem: (p: ProblemItem) => void;
  onSelectSolution: (s: SolutionItem) => void;
  onToggleUpvote: (id: string) => void;
  onToggleProblemBookmark: (id: string) => void;
  onToggleSolutionBookmark: (id: string) => void;
  onToggleMatchBookmark: (id: string) => void;
  onShareProblem: (p: ProblemItem) => void;
  onToggleConnect: (id: string) => void;
  onStartMessageWith: (person: ContributorItem) => void;
  onSelectThread: (threadId: string) => void;
  onSendMessage: (threadId: string, text: string) => void;
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
  onToast: (msg: string) => void;
}

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
  isPro,
  profileName,
  profileRole,
  profileLocation,
  profilePhotoUrl,
  emailDigest,
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
  onShareProblem,
  onToggleConnect,
  onStartMessageWith,
  onSelectThread,
  onSendMessage,
  onMarkAllNotificationsRead,
  onNotificationClick,
  onUpdateProfile,
  onUploadPhoto,
  onRemovePhoto,
  onToast,
}) => {
  const [discoverTab, setDiscoverTab] = useState<'problems' | 'batches' | 'solutions' | 'startups'>('problems');
  const [discoverStatusFilter, setDiscoverStatusFilter] = useState<'All' | ProblemSolutionStatus>('All');
  const [discoverIndustryFilter, setDiscoverIndustryFilter] = useState<string>('All');
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

  // Community & Notifications
  const [communityCategory, setCommunityCategory] = useState<string>('All');
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');
  const [replyText, setReplyText] = useState('');

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
      (discoverIndustryFilter === 'All' || p.category === discoverIndustryFilter)
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

  const activeThread = messages.find((m) => m.id === activeThreadId) || messages[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThread) return;
    onSendMessage(activeThread.id, replyText.trim());
    setReplyText('');
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
        onBack={onBackFromProblem}
        onOpenSubmitEvidence={(problemId) => onOpenSubmit({ kind: 'evidence', problemId })}
        onOpenMatches={() => onSelectView('matches')}
        onSelectSolution={onSelectSolution}
        onToggleUpvote={onToggleUpvote}
        onToggleBookmark={onToggleProblemBookmark}
        onShareProblem={onShareProblem}
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
        onToggleConnect={onToggleConnect}
        onStartMessageWith={onStartMessageWith}
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
            <div className="glass-card p-3.5 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-3">
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

              <div className="flex items-center gap-2">
                <select
                  value={discoverIndustryFilter}
                  onChange={(e) => setDiscoverIndustryFilter(e.target.value)}
                  className="bg-[#040A1A] border border-[#1E386E] rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                >
                  <option value="All">All Industries</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onOpenSubmit({ kind: 'resource' })}
                  className="px-3.5 py-1.5 rounded-xl btn-royal text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                >
                  + Submit Link
                </button>
              </div>
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
                    ? 'Submit a startup, product, research, or website URL to queue a scheduled batch.'
                    : 'Reset filters or submit a startup, research, or website URL to queue a new batch.'}
                </p>
                <div className="flex justify-center gap-2">
                  {problems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setDiscoverStatusFilter('All');
                        setDiscoverIndustryFilter('All');
                      }}
                      className="px-4 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 cursor-pointer"
                    >
                      Show All Problems
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenSubmit({ kind: 'resource' })}
                    className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
                  >
                    Submit Resource Link
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {discoverProblems.map((prob) => {
                  const problemMatchCount = matches.filter((m) => m.problemId === prob.id).length;
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
                          <button
                            type="button"
                            onClick={() => setDiscoverStatusFilter(prob.solutionStatus)}
                            className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold shrink-0 whitespace-nowrap cursor-pointer ${problemSolutionStatusBadge(
                              prob.solutionStatus
                            )}`}
                          >
                            {prob.solutionStatus}
                          </button>
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
                          Inspect Brief →
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
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Submitted resource links are processed in scheduled batches with a 24–48h feedback
                window.
              </p>
              <button
                type="button"
                onClick={() => onOpenSubmit({ kind: 'resource' })}
                className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
              >
                + Queue Resource Link
              </button>
            </div>

            {submissions.length === 0 ? (
              <div className="glass-card p-8 rounded-2xl text-center space-y-3">
                <p className="text-sm font-bold text-white">No resource links queued yet</p>
                <p className="text-xs text-slate-400">
                  Submit a startup, product, research paper, or website URL to start batch analysis.
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {submissions.map((sub) => (
                  <div key={sub.id} className="glass-card p-5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#0A1633] border border-[#1E386E] text-[11px] font-bold text-[#38BDF8]">
                        {sub.kind}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/35 text-[11px] font-bold text-sky-300 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{sub.status}</span>
                      </span>
                    </div>
                    <div>
                      <a
                        href={sub.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-mono text-white hover:text-[#38BDF8] break-all flex items-center space-x-1.5"
                      >
                        <Link2 className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                        <span>{sub.url}</span>
                      </a>
                      {sub.optionalContext && (
                        <p className="text-xs text-slate-300 mt-2">{sub.optionalContext}</p>
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
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>Submitted {sub.submittedAt}</span>
                      <span className="text-[#38BDF8] font-semibold">{sub.etaLabel}</span>
                    </div>
                  </div>
                ))}
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
                      <span>{sol.usersCount}</span>
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
                        {st.sector} · {st.country} · {st.users}
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
                        <span
                          className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold shrink-0 whitespace-nowrap ${solutionStatusBadge(
                            sol.status
                          )}`}
                        >
                          {sol.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{sol.evidenceSummary}</p>
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
                  <span className="text-xs font-bold text-emerald-400 tabular-nums">
                    {st.users} users
                  </span>
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
      .sort((a, b) => b.usersNum - a.usersNum);

    const rankedSolutions = solutions
      .filter((s) => {
        if (rankingRegion !== 'Global' && s.region !== rankingRegion) return false;
        if (rankingCountry !== 'All' && s.country !== rankingCountry) return false;
        if (rankingCategory !== 'All' && s.category !== rankingCategory) return false;
        return true;
      })
      .sort((a, b) => b.rating - a.rating || b.usersNum - a.usersNum);

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
                    <span className="text-xs font-bold text-emerald-400 tabular-nums">
                      {st.users} users
                    </span>
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
                        {sol.category} · {sol.country}, {sol.region} · {sol.usersCount}
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
      [...problems.map((p) => p.country), ...solutions.map((s) => s.country), ...startups.map((st) => st.country)].filter(Boolean)
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
  // 9. MESSAGES
  // =========================================================
  if (activeView === 'messages') {
    return (
      <div className="space-y-6 pb-10">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Messages</h2>
          <p className="text-xs text-slate-400 mt-1">
            Direct collaboration threads with global contributors
          </p>
        </div>

        {messages.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center space-y-2">
            <p className="text-sm font-bold text-white">0 conversations yet</p>
            <p className="text-xs text-slate-400">
              Start a conversation from the Community directory when contributors join.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 glass-card rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
              {messages.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => onSelectThread(thread.id)}
                  className={`w-full text-left p-4 flex items-start space-x-3 transition cursor-pointer ${
                    activeThread?.id === thread.id ? 'bg-[#0066FF]/20' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <AvatarBadge
                    initials={thread.senderInitials}
                    accentFrom={thread.accentFrom}
                    accentTo={thread.accentTo}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">
                        {thread.senderName}
                      </span>
                      <span className="text-[10px] text-slate-500">{thread.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-1">
                      {thread.messages[thread.messages.length - 1]?.text}
                    </p>
                  </div>
                  {thread.unread && <span className="w-2 h-2 rounded-full bg-[#38BDF8] mt-1.5" />}
                </button>
              ))}
            </div>

            <div className="lg:col-span-8 glass-card rounded-2xl p-5 flex flex-col justify-between min-h-[380px]">
              {activeThread && (
                <>
                  <div className="pb-4 border-b border-slate-800/80 flex items-center space-x-3">
                    <AvatarBadge
                      initials={activeThread.senderInitials}
                      accentFrom={activeThread.accentFrom}
                      accentTo={activeThread.accentTo}
                    />
                    <div>
                      <h3 className="text-sm font-bold text-white">{activeThread.senderName}</h3>
                      <p className="text-[11px] text-slate-400">{activeThread.senderRole}</p>
                    </div>
                  </div>

                  <div className="flex-1 py-4 space-y-3 overflow-y-auto">
                    {activeThread.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.fromSelf ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                            m.fromSelf
                              ? 'btn-royal text-white'
                              : 'bg-[#040A1A] border border-[#1E386E] text-slate-200'
                          }`}
                        >
                          <p>{m.text}</p>
                          <p className="text-[10px] opacity-70 mt-1 text-right">{m.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSend} className="pt-3 border-t border-slate-800/80 flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${activeThread.senderName}...`}
                      className="flex-1 bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl btn-royal text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
                    >
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </>
              )}
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
      <div className="glass-card p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
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
                {profileName || 'Your Profile'}
              </h2>
              {isPro && (
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
                onClick={() => photoInputRef.current?.click()}
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
        <button
          type="button"
          onClick={onOpenUpgrade}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] text-slate-950 font-extrabold text-xs flex items-center space-x-1.5 self-start cursor-pointer"
        >
          <Crown className="w-3.5 h-3.5" />
          <span>{isPro ? 'Manage Pro Access' : 'Upgrade to Pro'}</span>
        </button>
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
              onClick={() => onToast('Profile settings saved.')}
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
