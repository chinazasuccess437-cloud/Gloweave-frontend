import React from 'react';
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileSearch,
  Globe,
  History,
  Network,
  Share2,
  ShieldAlert,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import { MatchItem, ProblemItem, SolutionItem, SolutionStatus } from '../types/gloweave';
import { ProblemThumbnail, SolutionVisualBanner } from './VisualThumbnails';

interface ProblemDetailViewProps {
  problem: ProblemItem | null;
  solutions: SolutionItem[];
  matches: MatchItem[];
  onBack: () => void;
  onOpenSubmitEvidence: (problemId: string) => void;
  onOpenMatches: () => void;
  onSelectSolution: (solution: SolutionItem) => void;
  onToggleUpvote: (problemId: string) => void;
  onToggleBookmark: (problemId: string) => void;
  onShareProblem: (problem: ProblemItem) => void;
}

export const solutionStatusBadge = (status: SolutionStatus) => {
  switch (status) {
    case 'Fully solved':
      return 'bg-emerald-500/20 border-emerald-400/45 text-emerald-300';
    case 'Partially solved':
      return 'bg-sky-500/20 border-sky-400/45 text-sky-300';
    case 'Under review':
      return 'bg-purple-500/20 border-purple-400/45 text-purple-300';
    case 'Verification required':
      return 'bg-amber-500/20 border-amber-400/45 text-amber-300';
    default:
      return 'bg-slate-700/40 border-slate-500/40 text-slate-200';
  }
};

export const problemSolutionStatusBadge = (status: ProblemItem['solutionStatus']) => {
  switch (status) {
    case 'Solved':
      return 'bg-emerald-500/20 border-emerald-400/45 text-emerald-300';
    case 'Partially Solved':
      return 'bg-sky-500/20 border-sky-400/45 text-sky-300';
    case 'Under Review':
      return 'bg-purple-500/20 border-purple-400/45 text-purple-300';
    case 'Verification Required':
      return 'bg-amber-500/20 border-amber-400/45 text-amber-300';
    default:
      return 'bg-rose-500/15 border-rose-400/40 text-rose-300';
  }
};

export const ProblemDetailView: React.FC<ProblemDetailViewProps> = ({
  problem,
  solutions,
  matches,
  onBack,
  onOpenSubmitEvidence,
  onOpenMatches,
  onSelectSolution,
  onToggleUpvote,
  onToggleBookmark,
  onShareProblem,
}) => {
  if (!problem) {
    return (
      <div className="glass-card p-8 rounded-2xl text-center space-y-3">
        <p className="text-sm font-bold text-white">Problem details unavailable</p>
        <p className="text-xs text-slate-400">
          Select any AI-discovered problem from Home, Discover, or Matches.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
        >
          Back
        </button>
      </div>
    );
  }

  const linkedSolutions = solutions.filter((s) => s.problemId === problem.id);
  const linkedMatches = matches.filter((m) => m.problemId === problem.id);

  return (
    <div className="space-y-6 pb-10">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-[#38BDF8] hover:underline cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </button>

      {/* Main Problem Brief */}
      <div className="glass-card rounded-3xl p-6 md:p-8 border border-sky-400/25 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start space-x-4">
            <ProblemThumbnail theme={problem.theme} size="md" />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[#38BDF8] font-bold">{problem.industry}</span>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span className="text-slate-300">
                  {problem.country}, {problem.region}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-md border text-[11px] font-bold ${problemSolutionStatusBadge(
                    problem.solutionStatus
                  )}`}
                >
                  {problem.solutionStatus}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                {problem.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenSubmitEvidence(problem.id)}
            className="px-5 py-2.5 rounded-xl btn-royal text-white font-bold text-xs flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Submit Solution Evidence</span>
          </button>
        </div>

        {/* Summary & Extended Context */}
        <div className="space-y-3">
          <p className="text-sm text-slate-100 leading-relaxed max-w-3xl">{problem.summary}</p>
          <div className="p-4 rounded-2xl bg-[#040A1A]/85 border border-[#1E386E] space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#38BDF8] flex items-center space-x-1.5">
              <FileSearch className="w-3.5 h-3.5" />
              <span>AI Discovery Context</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{problem.context}</p>
          </div>
        </div>

        {/* Source Evidence + Affected Region Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#040A1A]/85 border border-[#1E386E] space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Source Evidence
            </div>
            <div className="text-xs font-bold text-white">{problem.sourceEvidence.label}</div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <span>
                {problem.sourceEvidence.sourceType} · {problem.sourceEvidence.discoveredAt}
              </span>
              <a
                href={problem.sourceEvidence.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-[#38BDF8] font-semibold hover:underline"
              >
                <span>Open Source</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#040A1A]/85 border border-[#1E386E] grid grid-cols-3 gap-2">
            <div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                <Globe className="w-3 h-3 text-[#38BDF8]" />
                <span>Affected Region</span>
              </div>
              <div className="text-xs font-bold text-white mt-1">
                {problem.country}, {problem.region}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                <Eye className="w-3 h-3 text-sky-400" />
                <span>Views</span>
              </div>
              <div className="text-sm font-extrabold text-white mt-1 tabular-nums">
                {problem.viewsNum.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                <Network className="w-3 h-3 text-emerald-400" />
                <span>Matches</span>
              </div>
              <div className="text-sm font-extrabold text-emerald-400 mt-1 tabular-nums">
                {linkedMatches.length}
              </div>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#172B54]">
          <button
            type="button"
            onClick={() => onToggleUpvote(problem.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 border transition cursor-pointer ${
              problem.upvoted
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                : 'bg-[#0A1633] border-[#1E386E] text-white hover:border-sky-400/50'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>
              {problem.upvoted ? `Upvoted (${problem.upvotes})` : `Upvote (${problem.upvotes})`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onToggleBookmark(problem.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 border transition cursor-pointer ${
              problem.bookmarked
                ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                : 'bg-[#0A1633] border-[#1E386E] text-slate-200 hover:border-sky-400/50'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{problem.bookmarked ? 'Saved' : 'Save Problem'}</span>
          </button>

          <button
            type="button"
            onClick={() => onShareProblem(problem)}
            className="px-4 py-2.5 rounded-xl bg-[#0A1633] border border-[#1E386E] text-slate-200 hover:border-sky-400/50 text-xs font-bold flex items-center space-x-2 transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Potential Matches */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Network className="w-4 h-4 text-[#38BDF8]" />
            <span>Potential Matches ({linkedMatches.length})</span>
          </h3>
          <button
            type="button"
            onClick={onOpenMatches}
            className="text-xs font-semibold text-[#38BDF8] hover:underline cursor-pointer"
          >
            Open Matchmaking Hub →
          </button>
        </div>

        {linkedMatches.length === 0 ? (
          <div className="glass-card p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-amber-400/25">
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>No suitable solution match identified yet</span>
              </p>
              <p className="text-xs text-slate-400">
                Gloweave’s AI batch matcher hasn’t found a confirmed startup or product for this
                problem yet. Submit an evidence link or resource URL to help resolve it.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenSubmitEvidence(problem.id)}
              className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold shrink-0 cursor-pointer"
            >
              Submit Evidence
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {linkedMatches.map((match) => (
              <div
                key={match.id}
                className="glass-card p-4 rounded-2xl border border-[#1E386E] space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white">{match.candidateName}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${
                      match.verification === 'verified'
                        ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                        : 'bg-sky-500/15 border-sky-400/40 text-[#38BDF8]'
                    }`}
                  >
                    {match.verification === 'verified' ? 'Verified Match' : 'AI-Suggested'}
                  </span>
                </div>
                <p className="text-[11px] text-[#38BDF8]">{match.candidateSubtitle}</p>
                <p className="text-xs text-slate-300 leading-relaxed">{match.rationale}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>{match.statusNote}</span>
                  {match.sourceUrl && (
                    <a
                      href={match.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#38BDF8] font-semibold hover:underline shrink-0 ml-2"
                    >
                      Source ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Submitted Solutions */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">
            Submitted Solutions &amp; Evidence ({linkedSolutions.length})
          </h3>
          <button
            type="button"
            onClick={() => onOpenSubmitEvidence(problem.id)}
            className="text-xs font-semibold text-[#38BDF8] hover:underline cursor-pointer"
          >
            + Submit evidence link
          </button>
        </div>

        {linkedSolutions.length === 0 ? (
          <div className="glass-card p-6 rounded-2xl text-center space-y-3">
            <p className="text-xs text-slate-300">
              No solution evidence links have been submitted for this problem yet.
            </p>
            <button
              type="button"
              onClick={() => onOpenSubmitEvidence(problem.id)}
              className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
            >
              Submit First Evidence Link
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {linkedSolutions.map((sol) => (
              <div
                key={sol.id}
                onClick={() => onSelectSolution(sol)}
                className="glass-card p-4 rounded-2xl hover:border-sky-400/40 transition cursor-pointer space-y-3"
              >
                <SolutionVisualBanner theme={sol.theme} name={sol.name} verified={sol.verified} />
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-white">{sol.name}</h4>
                    <p className="text-xs text-slate-300 mt-1">{sol.evidenceSummary}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md border text-[10px] font-bold shrink-0 whitespace-nowrap ${solutionStatusBadge(
                      sol.status
                    )}`}
                  >
                    {sol.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/70">
                  <span>Submitted {sol.submittedAt}</span>
                  <span className="text-[#38BDF8] font-semibold">Inspect Evidence →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Assessment History */}
      <section className="glass-card p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <History className="w-4 h-4 text-[#38BDF8]" />
            <span>Assessment History</span>
          </h3>
          <span className="text-[11px] text-slate-400 tabular-nums">
            {problem.assessmentHistory.length} recorded checkpoints
          </span>
        </div>

        <div className="space-y-3">
          {problem.assessmentHistory.map((ev) => (
            <div
              key={ev.id}
              className="p-3.5 rounded-xl bg-[#040A1A]/85 border border-[#1E386E] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  {ev.actor === 'Verification Panel' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                  )}
                  <span className="font-bold text-white">{ev.status}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-[#38BDF8] font-medium">{ev.actor}</span>
                </div>
                <p className="text-xs text-slate-300 pl-5">{ev.note}</p>
              </div>
              <span className="text-[11px] text-slate-400 tabular-nums shrink-0 pl-5 sm:pl-0">
                {ev.date}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
