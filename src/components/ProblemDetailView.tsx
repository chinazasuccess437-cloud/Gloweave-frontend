import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck2,
  FileSearch,
  FileText,
  Globe,
  History,
  Layers,
  Network,
  Plus,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import { VERIFICATION_STATUSES } from '../data/gloweaveData';
import { isBackendConfigured } from '../lib/backendApi';
import {
  EvidenceItem,
  EvidenceType,
  ImpactSeverityLevel,
  MatchItem,
  ProblemItem,
  SolutionItem,
  SolutionStatus,
  VerificationStatus,
} from '../types/gloweave';
import { ProblemThumbnail, SolutionVisualBanner } from './VisualThumbnails';

interface ProblemDetailViewProps {
  problem: ProblemItem | null;
  solutions: SolutionItem[];
  matches: MatchItem[];
  isAuthenticated?: boolean;
  reviewerName?: string;
  onRequireAuth?: (actionLabel: string) => void;
  onBack: () => void;
  onOpenSubmitEvidence: (problemId: string) => void;
  onOpenMatches: () => void;
  onSelectSolution: (solution: SolutionItem) => void;
  onToggleUpvote: (problemId: string) => void;
  onToggleBookmark: (problemId: string) => void;
  onShareProblem: (problem: ProblemItem) => void;
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

export const verificationStatusBadge = (status: VerificationStatus) => {
  switch (status) {
    case 'Verified':
      return 'bg-emerald-500/20 border-emerald-400/45 text-emerald-300';
    case 'Resolved':
      return 'bg-teal-500/20 border-teal-400/45 text-teal-200';
    case 'Awaiting Review':
      return 'bg-purple-500/20 border-purple-400/45 text-purple-300';
    case 'More Evidence Required':
      return 'bg-amber-500/20 border-amber-400/45 text-amber-300';
    case 'Rejected':
      return 'bg-rose-500/20 border-rose-400/45 text-rose-300';
    case 'AI Identified':
    default:
      return 'bg-sky-500/20 border-sky-400/45 text-sky-300';
  }
};

export const severityBadge = (level?: ImpactSeverityLevel) => {
  switch (level) {
    case 'Critical':
      return 'bg-rose-500/20 border-rose-400/45 text-rose-300';
    case 'High':
      return 'bg-amber-500/20 border-amber-400/45 text-amber-300';
    case 'Medium':
      return 'bg-sky-500/20 border-sky-400/45 text-sky-300';
    case 'Low':
    default:
      return 'bg-slate-700/40 border-slate-500/40 text-slate-300';
  }
};

export const ProblemDetailView: React.FC<ProblemDetailViewProps> = ({
  problem,
  solutions,
  matches,
  isAuthenticated = false,
  reviewerName = 'Reviewer',
  onRequireAuth,
  onBack,
  onOpenSubmitEvidence,
  onOpenMatches,
  onSelectSolution,
  onToggleUpvote,
  onToggleBookmark,
  onShareProblem,
  onSubmitHumanVerification,
  onAddEvidence,
}) => {
  const [decision, setDecision] = useState<VerificationStatus>('Awaiting Review');
  const [reviewComment, setReviewComment] = useState('');
  const [confirmHumanCheck, setConfirmHumanCheck] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Inline Add Evidence form
  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [evTitle, setEvTitle] = useState('');
  const [evUrl, setEvUrl] = useState('');
  const [evType, setEvType] = useState<EvidenceType>('Primary Report');
  const [evRef, setEvRef] = useState('');
  const [evSummary, setEvSummary] = useState('');
  const [evError, setEvError] = useState('');

  useEffect(() => {
    if (problem) {
      setDecision(problem.verificationStatus || 'AI Identified');
      setReviewComment('');
      setConfirmHumanCheck(false);
      setReviewError('');
    }
  }, [problem]);

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
  const currentVerification: VerificationStatus = problem.verificationStatus || 'AI Identified';
  const evidenceItems: EvidenceItem[] = problem.evidences || [];
  const backendReady = isBackendConfigured();

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    if (!isAuthenticated) {
      onRequireAuth?.('submit a human verification review');
      return;
    }
    if (!onSubmitHumanVerification) return;
    if (reviewComment.trim().length < 6) {
      setReviewError('Please enter reviewer justification or findings (minimum 6 characters).');
      return;
    }
    if ((decision === 'Resolved' || decision === 'Verified') && !confirmHumanCheck) {
      setReviewError(
        `Human confirmation checkbox is required before marking a problem as ${decision}.`
      );
      return;
    }

    onSubmitHumanVerification({
      problemId: problem.id,
      decision,
      comment: reviewComment.trim(),
      humanConfirmationChecked: confirmHumanCheck,
    });
    setReviewComment('');
    setConfirmHumanCheck(false);
  };

  const handleAddEvidenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEvError('');
    if (!isAuthenticated) {
      onRequireAuth?.('attach supporting evidence');
      return;
    }
    if (!onAddEvidence) return;
    if (evTitle.trim().length < 2) {
      setEvError('Provide a source title or document name.');
      return;
    }
    if (!evSummary.trim()) {
      setEvError('Describe the supporting evidence or claim.');
      return;
    }
    onAddEvidence({
      problemId: problem.id,
      sourceTitle: evTitle.trim(),
      sourceUrl: evUrl.trim() || undefined,
      extractedReference: evRef.trim() || 'Submitted manually by contributor',
      supportingEvidence: evSummary.trim(),
      evidenceType: evType,
    });
    setEvTitle('');
    setEvUrl('');
    setEvRef('');
    setEvSummary('');
    setShowAddEvidence(false);
  };

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
                <span
                  className={`px-2.5 py-0.5 rounded-md border text-[11px] font-bold ${verificationStatusBadge(
                    currentVerification
                  )}`}
                >
                  Verification: {currentVerification}
                </span>
                {problem.severity && (
                  <span
                    className={`px-2.5 py-0.5 rounded-md border text-[11px] font-bold ${severityBadge(
                      problem.severity
                    )}`}
                  >
                    Severity: {problem.severity}
                  </span>
                )}
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
            <span>Propose Solution</span>
          </button>
        </div>

        {/* Summary & Extended AI Context */}
        <div className="space-y-3">
          <p className="text-sm text-slate-100 leading-relaxed max-w-3xl">{problem.summary}</p>
          <div className="p-4 rounded-2xl bg-[#040A1A]/85 border border-sky-400/25 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#38BDF8] flex items-center space-x-1.5">
                <FileSearch className="w-3.5 h-3.5" />
                <span>AI-Generated Discovery Summary (Unverified)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-400/35 text-[10px] font-bold text-sky-300">
                Automated AI Extraction
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{problem.context}</p>
          </div>
        </div>

        {/* Structured AI Problem Analysis (Explicitly Separated from Independently Verified Info) */}
        <div className="p-5 rounded-2xl bg-[#040A1A]/90 border border-[#1E386E] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#172B54]">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#38BDF8]" />
              <h3 className="text-sm font-bold text-white">
                AI-Powered Problem Analysis Breakdown
              </h3>
            </div>
            <span className="text-[11px] text-amber-300 font-semibold">
              AI-generated findings — distinct from independently verified facts
            </span>
          </div>

          {problem.aiAnalysis ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#091533]/75 border border-[#1E386E] space-y-1.5">
                <div className="text-[11px] font-bold text-[#38BDF8]">
                  Explicit Problems Described
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {problem.aiAnalysis.explicitProblems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="p-3.5 rounded-xl bg-[#091533]/75 border border-[#1E386E] space-y-1.5">
                <div className="text-[11px] font-bold text-purple-300">
                  Inferred / Underlying Problems
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {problem.aiAnalysis.inferredProblems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="p-3.5 rounded-xl bg-[#091533]/75 border border-[#1E386E] space-y-1.5">
                <div className="text-[11px] font-bold text-amber-300">Unmet Needs</div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {problem.aiAnalysis.unmetNeeds.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="p-3.5 rounded-xl bg-[#091533]/75 border border-[#1E386E] space-y-1.5">
                <div className="text-[11px] font-bold text-emerald-300">
                  Affected Industries, Communities &amp; Organisations
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {problem.aiAnalysis.affectedGroups.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="p-3.5 rounded-xl bg-[#091533]/75 border border-[#1E386E] space-y-1.5">
                <div className="text-[11px] font-bold text-sky-300">
                  Geographic Relevance, Impact &amp; Severity
                </div>
                <p className="text-slate-300">{problem.aiAnalysis.geographicRelevance}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span
                    className={`px-2 py-0.5 rounded border text-[10px] font-bold ${severityBadge(
                      problem.aiAnalysis.impactLevel
                    )}`}
                  >
                    Impact: {problem.aiAnalysis.impactLevel}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded border text-[10px] font-bold ${severityBadge(
                      problem.aiAnalysis.severityLevel
                    )}`}
                  >
                    Severity: {problem.aiAnalysis.severityLevel}
                  </span>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#091533]/75 border border-[#1E386E] space-y-1.5">
                <div className="text-[11px] font-bold text-rose-300">
                  Existing Solutions &amp; Limitations
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {problem.aiAnalysis.existingSolutionsAndLimitations.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#091533]/60 border border-[#1E386E] flex items-start space-x-3 text-xs text-slate-300">
              <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">
                  Structured AI problem breakdown awaiting backend analysis
                </p>
                <p className="text-slate-400 mt-1">
                  Explicit/inferred problems, unmet needs, affected groups, severity scores, and
                  existing solution limitations will populate when the backend analysis pipeline
                  processes this submission (`GET /api/problems/:id/analysis`).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Source Evidence + Affected Region Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#040A1A]/85 border border-[#1E386E] space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Primary Discovered Source
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

      {/* SECTION 4: Evidence Management */}
      <section className="glass-card p-6 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <FileCheck2 className="w-4 h-4 text-[#38BDF8]" />
              <span>Evidence Management ({evidenceItems.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Supporting records, source titles, and extracted references — never conflated with AI claims.
            </p>
          </div>
          {onAddEvidence && (
            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  onRequireAuth?.('attach supporting evidence');
                  return;
                }
                setShowAddEvidence((prev) => !prev);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] hover:border-sky-400/50 text-xs font-bold text-[#38BDF8] flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddEvidence ? 'Cancel Evidence Form' : 'Attach Evidence Record'}</span>
            </button>
          )}
        </div>

        {showAddEvidence && onAddEvidence && (
          <form
            onSubmit={handleAddEvidenceSubmit}
            className="p-4 rounded-2xl bg-[#040A1A] border border-sky-400/30 space-y-3 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={evTitle}
                onChange={(e) => setEvTitle(e.target.value)}
                placeholder="Source title or document name *"
                className="bg-[#091533] border border-[#1E386E] rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              />
              <select
                value={evType}
                onChange={(e) => setEvType(e.target.value as EvidenceType)}
                className="bg-[#091533] border border-[#1E386E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400"
              >
                <option value="Primary Report">Primary Report</option>
                <option value="Peer-Reviewed Research">Peer-Reviewed Research</option>
                <option value="Product Deployment">Product Deployment</option>
                <option value="Technical Documentation">Technical Documentation</option>
                <option value="PDF Upload">PDF Upload</option>
                <option value="Community Field Evidence">Community Field Evidence</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={evUrl}
                onChange={(e) => setEvUrl(e.target.value)}
                placeholder="Original source URL (https://...)"
                className="bg-[#091533] border border-[#1E386E] rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              />
              <input
                type="text"
                value={evRef}
                onChange={(e) => setEvRef(e.target.value)}
                placeholder="Extracted passage / section reference (e.g. Section 3.2, p.14)"
                className="bg-[#091533] border border-[#1E386E] rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              />
            </div>
            <textarea
              rows={2}
              value={evSummary}
              onChange={(e) => setEvSummary(e.target.value)}
              placeholder="Supporting evidence description *"
              className="w-full bg-[#091533] border border-[#1E386E] rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 resize-none"
            />
            {evError && <p className="text-rose-400 font-medium">{evError}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl btn-royal text-white font-bold cursor-pointer"
              >
                Save Evidence (Awaiting Review)
              </button>
            </div>
          </form>
        )}

        {evidenceItems.length === 0 ? (
          <div className="p-5 rounded-xl bg-[#040A1A]/85 border border-[#1E386E] text-xs text-slate-400">
            No structured evidence records attached beyond the primary discovered source link yet.
            Attach supporting reports, citations, or deployment records for human review.
          </div>
        ) : (
          <div className="space-y-3">
            {evidenceItems.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-xl bg-[#040A1A]/90 border border-[#1E386E] space-y-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span className="font-bold text-white">{ev.sourceTitle}</span>
                    <span className="px-2 py-0.5 rounded bg-[#0A1633] border border-[#1E386E] text-[10px] text-slate-300">
                      {ev.evidenceType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                        ev.isIndependentlyVerified
                          ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                          : 'bg-slate-800 border-slate-600 text-slate-300'
                      }`}
                    >
                      {ev.isIndependentlyVerified
                        ? 'Independently Verified'
                        : 'Unverified Source Record'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded border text-[10px] font-bold ${verificationStatusBadge(
                        ev.reviewStatus
                      )}`}
                    >
                      {ev.reviewStatus}
                    </span>
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed">{ev.supportingEvidence}</p>
                {ev.extractedReferences.length > 0 && (
                  <div className="text-[11px] text-slate-400">
                    References: {ev.extractedReferences.join(' · ')}
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>
                    {ev.documentName ? `Doc: ${ev.documentName} · ` : ''}Added {ev.submittedAt}
                  </span>
                  {ev.sourceUrl && (
                    <a
                      href={ev.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#38BDF8] font-semibold hover:underline flex items-center space-x-1"
                    >
                      <span>View Original Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 5: Human Verification & Review Workflow */}
      <section className="glass-card p-6 rounded-2xl border border-sky-400/20 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Human Verification &amp; Review</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Authorised human review is required to verify evidence or mark a problem Resolved.
              AI cannot independently mark any problem solved.
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-lg border text-xs font-bold ${verificationStatusBadge(
              currentVerification
            )}`}
          >
            Current Status: {currentVerification}
          </span>
        </div>

        {/* Status Pipeline Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {VERIFICATION_STATUSES.map((st) => {
            const active = currentVerification === st;
            return (
              <div
                key={st}
                className={`px-2.5 py-2 rounded-xl border text-center text-[11px] font-bold transition ${
                  active
                    ? verificationStatusBadge(st)
                    : 'bg-[#040A1A]/70 border-[#1E386E] text-slate-500'
                }`}
              >
                {st}
              </div>
            );
          })}
        </div>

        {onSubmitHumanVerification && (
          <form
            onSubmit={handleReviewSubmit}
            className="p-4 rounded-2xl bg-[#040A1A] border border-[#1E386E] space-y-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">Submit Reviewer Decision ({reviewerName})</span>
              <span className="text-[11px] text-slate-400">
                {backendReady ? 'Syncs to backend verification log' : 'Session review · Awaiting backend'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={decision}
                onChange={(e) => {
                  setDecision(e.target.value as VerificationStatus);
                  setReviewError('');
                }}
                className="bg-[#091533] border border-[#1E386E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400"
              >
                {VERIFICATION_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={reviewComment}
                onChange={(e) => {
                  setReviewComment(e.target.value);
                  if (reviewError) setReviewError('');
                }}
                placeholder="Reviewer findings, feedback, or evidence gap notes *"
                className="sm:col-span-2 bg-[#091533] border border-[#1E386E] rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              />
            </div>

            {(decision === 'Resolved' || decision === 'Verified') && (
              <label className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-[11px] text-amber-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmHumanCheck}
                  onChange={(e) => setConfirmHumanCheck(e.target.checked)}
                  className="mt-0.5 accent-[#38BDF8]"
                />
                <span>
                  I confirm as a human reviewer that independent supporting evidence justifies
                  transitioning this item to <strong className="text-white">{decision}</strong>.
                </span>
              </label>
            )}

            {reviewError && <p className="text-rose-400 font-medium">{reviewError}</p>}

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl btn-royal text-white font-bold cursor-pointer"
              >
                Submit Human Review
              </button>
            </div>
          </form>
        )}

        {problem.verificationHistory && problem.verificationHistory.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Human Review Log
            </div>
            {problem.verificationHistory.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-[#040A1A]/85 border border-[#1E386E] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-white">{item.reviewerName}</span>
                  <span className="text-slate-500 mx-1.5">→</span>
                  <span
                    className={`px-2 py-0.5 rounded border text-[10px] font-bold ${verificationStatusBadge(
                      item.decision
                    )}`}
                  >
                    {item.decision}
                  </span>
                  <p className="text-slate-300 mt-1">{item.comment}</p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">{item.createdAt}</span>
              </div>
            ))}
          </div>
        )}
      </section>

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
                problem yet. Propose a solution or submit supporting evidence.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenSubmitEvidence(problem.id)}
              className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold shrink-0 cursor-pointer"
            >
              Propose Solution
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
            + Propose solution
          </button>
        </div>

        {linkedSolutions.length === 0 ? (
          <div className="glass-card p-6 rounded-2xl text-center space-y-3">
            <p className="text-xs text-slate-300">
              No solution proposals have been submitted for this problem yet.
            </p>
            <button
              type="button"
              onClick={() => onOpenSubmitEvidence(problem.id)}
              className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
            >
              Propose First Solution
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
                    <p className="text-xs text-slate-300 mt-1">
                      {sol.addressExplanation || sol.evidenceSummary}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md border text-[10px] font-bold shrink-0 whitespace-nowrap ${verificationStatusBadge(
                      sol.humanReviewStatus || (sol.verified ? 'Verified' : 'Awaiting Review')
                    )}`}
                  >
                    {sol.humanReviewStatus || sol.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/70">
                  <span>Submitted {sol.submittedAt}</span>
                  <span className="text-[#38BDF8] font-semibold">Inspect &amp; Review →</span>
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
                  {ev.actor === 'Verification Panel' || ev.actor === 'Human Reviewer' ? (
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
