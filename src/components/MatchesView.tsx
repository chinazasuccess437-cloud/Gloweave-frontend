import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  MessageSquare,
  Network,
  Plus,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Users,
} from 'lucide-react';
import { CATEGORIES } from '../data/gloweaveData';
import { isBackendConfigured } from '../lib/backendApi';
import {
  ContributorItem,
  MatchItem,
  MatchKind,
  MatchUserFeedback,
  MatchVerification,
  ProblemItem,
  RegionFilter,
} from '../types/gloweave';
import { verificationStatusBadge } from './ProblemDetailView';

interface MatchesViewProps {
  matches: MatchItem[];
  problems: ProblemItem[];
  contributors: ContributorItem[];
  searchQuery: string;
  regionFilter: RegionFilter;
  onSelectProblem: (problem: ProblemItem) => void;
  onOpenSubmitResource: () => void;
  onOpenSubmitEvidence: (problemId?: string) => void;
  onToggleMatchBookmark: (matchId: string) => void;
  onSubmitMatchFeedback?: (matchId: string, feedback: MatchUserFeedback, note?: string) => void;
  onToggleConnect: (contributorId: string) => void;
  onStartMessageWith: (person: ContributorItem) => void;
}

type MatchTab = 'all' | 'startup' | 'product' | 'proposed-solution' | 'collaborator' | 'unmatched';

export const MatchesView: React.FC<MatchesViewProps> = ({
  matches,
  problems,
  contributors,
  searchQuery,
  regionFilter,
  onSelectProblem,
  onOpenSubmitResource,
  onOpenSubmitEvidence,
  onToggleMatchBookmark,
  onSubmitMatchFeedback,
  onToggleConnect,
  onStartMessageWith,
}) => {
  const [activeTab, setActiveTab] = useState<MatchTab>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | MatchVerification>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});

  const q = searchQuery.trim().toLowerCase();

  const matchesByProblemId = new Map<string, MatchItem[]>();
  matches.forEach((m) => {
    const existing = matchesByProblemId.get(m.problemId) || [];
    existing.push(m);
    matchesByProblemId.set(m.problemId, existing);
  });

  const unmatchedProblems = problems.filter((p) => {
    const hasMatch = (matchesByProblemId.get(p.id)?.length || 0) > 0;
    const regionOk = regionFilter === 'Global' || p.region === regionFilter;
    const catOk = categoryFilter === 'All' || p.category === categoryFilter;
    const searchOk =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.country.toLowerCase().includes(q) ||
      p.industry.toLowerCase().includes(q);
    return !hasMatch && regionOk && catOk && searchOk;
  });

  const filteredMatches = matches.filter((m) => {
    const prob = problems.find((p) => p.id === m.problemId);
    if (activeTab !== 'all' && activeTab !== 'unmatched' && m.kind !== activeTab) return false;
    if (verificationFilter !== 'all' && m.verification !== verificationFilter) return false;
    if (regionFilter !== 'Global' && m.region !== regionFilter) return false;
    if (categoryFilter !== 'All' && prob?.category !== categoryFilter) return false;
    if (q) {
      const hay = `${m.candidateName} ${m.candidateSubtitle} ${m.rationale} ${m.country} ${
        prob?.title || ''
      }`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const aiCount = matches.filter((m) => m.verification === 'ai-suggested').length;
  const verifiedCount = matches.filter((m) => m.verification === 'verified').length;

  const handleRefreshIndex = () => {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 650);
  };

  const kindLabel = (kind: MatchKind) => {
    if (kind === 'startup') return 'Matched Startup';
    if (kind === 'product') return 'Existing Product';
    if (kind === 'proposed-solution') return 'Proposed Solution';
    return 'Potential Collaborator';
  };

  const kindIcon = (kind: MatchKind) => {
    if (kind === 'startup') return Rocket;
    if (kind === 'product' || kind === 'proposed-solution') return Sparkles;
    return Users;
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center space-x-2.5">
            <Network className="w-6 h-6 text-[#38BDF8]" />
            <span>Global Solution Matchmaking</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            AI-suggested candidates are explicitly separated from evidence-verified matches across{' '}
            {regionFilter}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefreshIndex}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 hover:border-sky-400/50 flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#38BDF8] ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing Matches...' : 'Sync Batch Matches'}</span>
          </button>
          <button
            type="button"
            onClick={onOpenSubmitResource}
            className="px-4 py-2 rounded-xl btn-royal text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Resource Link</span>
          </button>
        </div>
      </div>

      {/* Distinction Legend + Quick Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <button
          type="button"
          onClick={() =>
            setVerificationFilter((prev) => (prev === 'ai-suggested' ? 'all' : 'ai-suggested'))
          }
          className={`text-left glass-card p-4 rounded-2xl border transition cursor-pointer ${
            verificationFilter === 'ai-suggested'
              ? 'border-sky-400/70 bg-[#0A1D42]/90'
              : 'border-sky-400/20 hover:border-sky-400/45'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#38BDF8] flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-Suggested Matches</span>
            </span>
            <span className="text-lg font-extrabold text-white tabular-nums">{aiCount}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Automated candidates surfaced in scheduled batches — pending real-world verification.
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setVerificationFilter((prev) => (prev === 'verified' ? 'all' : 'verified'))
          }
          className={`text-left glass-card p-4 rounded-2xl border transition cursor-pointer ${
            verificationFilter === 'verified'
              ? 'border-emerald-400/70 bg-emerald-950/25'
              : 'border-emerald-400/20 hover:border-emerald-400/45'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Matches</span>
            </span>
            <span className="text-lg font-extrabold text-white tabular-nums">{verifiedCount}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Backed by submitted deployment evidence links and panel review.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab((prev) => (prev === 'unmatched' ? 'all' : 'unmatched'))}
          className={`text-left glass-card p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === 'unmatched'
              ? 'border-amber-400/70 bg-amber-950/20'
              : 'border-amber-400/20 hover:border-amber-400/45'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>No Solution Identified</span>
            </span>
            <span className="text-lg font-extrabold text-white tabular-nums">
              {unmatchedProblems.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Discovered problems with zero suitable startup or product match yet.
          </p>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-3.5 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 p-1 bg-[#060E22] border border-[#1E386E] rounded-xl">
          {(
            [
              { id: 'all', label: 'All Matches' },
              { id: 'startup', label: 'Matched Startups' },
              { id: 'product', label: 'Existing Products' },
              { id: 'proposed-solution', label: 'Proposed Solutions' },
              { id: 'collaborator', label: 'Collaborators' },
              { id: 'unmatched', label: `Unmatched Problems (${unmatchedProblems.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id ? 'btn-royal text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab !== 'unmatched' && (
            <div className="flex items-center gap-1 p-1 bg-[#060E22] border border-[#1E386E] rounded-xl">
              {(
                [
                  { id: 'all', label: 'All Types' },
                  { id: 'ai-suggested', label: 'AI-Suggested' },
                  { id: 'verified', label: 'Verified' },
                ] as const
              ).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVerificationFilter(v.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition whitespace-nowrap cursor-pointer ${
                    verificationFilter === v.id
                      ? 'bg-[#0D2B63] text-[#38BDF8] border border-sky-400/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#040A1A] border border-[#1E386E] rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
          >
            <option value="All">All Industries</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading skeleton */}
      {refreshing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="glass-card p-5 rounded-2xl space-y-3 border border-[#1E386E]/60 animate-pulse"
            >
              <div className="h-4 w-36 bg-slate-800 rounded" />
              <div className="h-5 w-3/4 bg-slate-800/80 rounded" />
              <div className="h-12 w-full bg-slate-800/50 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Match Cards Grid */}
          {activeTab !== 'unmatched' && (
            <section className="space-y-3">
              {filteredMatches.length === 0 ? (
                <div className="glass-card p-8 rounded-2xl text-center space-y-3">
                  <p className="text-sm font-bold text-white">
                    {matches.length === 0 ? '0 solution matches yet' : 'No matches in this filter'}
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {matches.length === 0
                      ? 'Submit a startup, product, research, or website URL to queue Gloweave’s next batch analysis.'
                      : 'Try switching between AI-Suggested and Verified filters, or submit a startup, product, or research link for Gloweave’s next batch analysis.'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2.5 pt-1">
                    {matches.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('all');
                          setVerificationFilter('all');
                          setCategoryFilter('All');
                        }}
                        className="px-4 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onOpenSubmitResource}
                      className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
                    >
                      Submit Resource Link
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMatches.map((match) => {
                    const targetProblem = problems.find((p) => p.id === match.problemId);
                    const linkedContributor = match.contributorId
                      ? contributors.find((c) => c.id === match.contributorId)
                      : undefined;
                    const Icon = kindIcon(match.kind);
                    const isVerified = match.verification === 'verified';

                    return (
                      <div
                        key={match.id}
                        className="glass-card p-5 rounded-2xl border border-sky-400/15 hover:border-sky-400/40 transition flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          {/* Verification & Match Type Row */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-slate-300">
                              <Icon className="w-3.5 h-3.5 text-[#38BDF8]" />
                              <span>{kindLabel(match.kind)}</span>
                            </span>

                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${
                                isVerified
                                  ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                                  : 'bg-sky-500/15 border-sky-400/40 text-[#38BDF8]'
                              }`}
                            >
                              {isVerified ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <Sparkles className="w-3 h-3" />
                              )}
                              <span>{isVerified ? 'Verified Match' : 'AI-Suggested Match'}</span>
                            </span>
                          </div>

                          {/* Candidate Title & Meta */}
                          <div>
                            <h3 className="text-base font-extrabold text-white">
                              {match.candidateName}
                            </h3>
                            <p className="text-xs text-[#38BDF8] mt-0.5">
                              {match.candidateSubtitle} · {match.fitLabel}
                            </p>
                          </div>

                          {/* Linked Problem Context */}
                          {targetProblem && (
                            <button
                              type="button"
                              onClick={() => onSelectProblem(targetProblem)}
                              className="w-full text-left p-3 rounded-xl bg-[#040A1A]/90 border border-[#1E386E] hover:border-sky-400/50 transition cursor-pointer"
                            >
                              <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <span className="font-semibold text-purple-300 flex items-center space-x-1">
                                  <Lightbulb className="w-3 h-3" />
                                  <span>Target Problem</span>
                                </span>
                                <span>
                                  {targetProblem.country}, {targetProblem.region}
                                </span>
                              </div>
                              <div className="text-xs font-bold text-white mt-1 flex items-center justify-between gap-2">
                                <span className="truncate">{targetProblem.title}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                              </div>
                            </button>
                          )}

                          <p className="text-xs text-slate-300 leading-relaxed">{match.rationale}</p>

                          {/* Supporting Evidence Links */}
                          {(match.sourceUrl ||
                            (match.supportingEvidenceUrls && match.supportingEvidenceUrls.length > 0)) && (
                            <div className="p-2.5 rounded-xl bg-[#040A1A]/75 border border-[#1E386E] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                              <span className="text-slate-400">Supporting Evidence</span>
                              <div className="flex flex-wrap gap-2">
                                {match.sourceUrl && (
                                  <a
                                    href={match.sourceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[#38BDF8] font-semibold hover:underline flex items-center space-x-1"
                                  >
                                    <span>Primary Source</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                                {match.supportingEvidenceUrls?.map((evUrl, idx) => (
                                  <a
                                    key={evUrl + idx}
                                    href={evUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sky-300 font-semibold hover:underline flex items-center space-x-1"
                                  >
                                    <span>Evidence #{idx + 1}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                            <span>{match.statusNote}</span>
                            {match.reviewStatus && (
                              <span
                                className={`px-2 py-0.5 rounded border text-[10px] font-bold ${verificationStatusBadge(
                                  match.reviewStatus
                                )}`}
                              >
                                {match.reviewStatus}
                              </span>
                            )}
                          </div>

                          {/* Match User Feedback & Review */}
                          {onSubmitMatchFeedback && (
                            <div className="p-3 rounded-xl bg-[#040A1A]/70 border border-[#1E386E] space-y-2 text-[11px]">
                              <div className="flex items-center justify-between text-slate-400">
                                <span className="font-semibold text-slate-300">
                                  User Feedback &amp; Match Review
                                </span>
                                <span>
                                  {isBackendConfigured() ? 'Backend sync active' : 'Session feedback'}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {(
                                  [
                                    { id: 'helpful', label: 'Helpful Match', icon: ThumbsUp },
                                    { id: 'needs-evidence', label: 'Needs Evidence', icon: AlertCircle },
                                    { id: 'not-relevant', label: 'Not Relevant', icon: ThumbsDown },
                                  ] as const
                                ).map((opt) => {
                                  const FeedbackIcon = opt.icon;
                                  const selected = match.userFeedback === opt.id;
                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() =>
                                        onSubmitMatchFeedback(
                                          match.id,
                                          opt.id,
                                          feedbackDrafts[match.id]?.trim() || undefined
                                        )
                                      }
                                      className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold flex items-center space-x-1 transition cursor-pointer ${
                                        selected
                                          ? 'bg-[#0D2B63] border-sky-400 text-white'
                                          : 'bg-[#091533] border-[#1E386E] text-slate-300 hover:border-sky-400/50'
                                      }`}
                                    >
                                      <FeedbackIcon className="w-3 h-3" />
                                      <span>{opt.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                              <input
                                type="text"
                                value={feedbackDrafts[match.id] ?? match.userFeedbackNote ?? ''}
                                onChange={(e) =>
                                  setFeedbackDrafts((prev) => ({
                                    ...prev,
                                    [match.id]: e.target.value,
                                  }))
                                }
                                placeholder="Optional reviewer note on match accuracy..."
                                className="w-full bg-[#091533] border border-[#1E386E] rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                              />
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onToggleMatchBookmark(match.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition cursor-pointer ${
                                match.bookmarked
                                  ? 'bg-sky-500/20 border-sky-400/45 text-sky-300'
                                  : 'bg-[#0A1633] border-[#1E386E] text-slate-300 hover:border-sky-400/45'
                              }`}
                            >
                              <Bookmark className="w-3 h-3" />
                              <span>{match.bookmarked ? 'Saved' : 'Save'}</span>
                            </button>

                            {linkedContributor ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onToggleConnect(linkedContributor.id)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                                    linkedContributor.connected
                                      ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                                      : 'bg-[#0A1633] border-[#1E386E] text-slate-200 hover:border-sky-400/45'
                                  }`}
                                >
                                  {linkedContributor.connected ? 'Connected ✓' : 'Connect'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onStartMessageWith(linkedContributor)}
                                  className="px-3 py-1.5 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 hover:border-sky-400/45 flex items-center space-x-1 cursor-pointer"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>Message</span>
                                </button>
                              </>
                            ) : (
                              match.sourceUrl && (
                                <a
                                  href={match.sourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-[#38BDF8] hover:border-sky-400/45 flex items-center space-x-1"
                                >
                                  <span>Source</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )
                            )}
                          </div>

                          {targetProblem && (
                            <button
                              type="button"
                              onClick={() => onOpenSubmitEvidence(targetProblem.id)}
                              className="px-3 py-1.5 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
                            >
                              Submit Evidence
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Unmatched Problems Section */}
          {(activeTab === 'all' || activeTab === 'unmatched') && (
            <section className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Problems With No Suitable Solution Identified</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Open problems where neither AI matching nor verified evidence has confirmed a
                    viable solution yet.
                  </p>
                </div>
              </div>

              {unmatchedProblems.length === 0 ? (
                <div className="glass-card p-6 rounded-2xl text-xs text-slate-400">
                  {problems.length === 0
                    ? `0 unmatched problems in ${regionFilter} yet. Submit a resource link to queue discovery.`
                    : `Every discovered problem in ${regionFilter} currently has at least one candidate or verified match.`}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unmatchedProblems.map((prob) => (
                    <div
                      key={prob.id}
                      className="glass-card p-5 rounded-2xl border border-amber-400/25 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="text-[#38BDF8] font-semibold">
                            {prob.industry} · {prob.country}, {prob.region}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/35 text-amber-300 font-bold">
                            No Suitable Match Yet
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectProblem(prob)}
                          className="text-left block hover:text-[#38BDF8] transition cursor-pointer"
                        >
                          <h4 className="text-sm font-bold text-white">{prob.title}</h4>
                        </button>
                        <p className="text-xs text-slate-300 leading-relaxed">{prob.summary}</p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => onSelectProblem(prob)}
                          className="text-xs font-semibold text-[#38BDF8] hover:underline cursor-pointer"
                        >
                          Inspect Problem Brief →
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={onOpenSubmitResource}
                            className="px-3 py-1.5 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 hover:border-sky-400/50 cursor-pointer"
                          >
                            Submit Startup / Research
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenSubmitEvidence(prob.id)}
                            className="px-3 py-1.5 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
                          >
                            Submit Evidence
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
};
