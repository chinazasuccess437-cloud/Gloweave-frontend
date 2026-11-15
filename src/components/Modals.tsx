import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  ExternalLink,
  Globe,
  Link2,
  Loader2,
  LogOut,
  Rocket,
  Sparkles,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { CONTINENTS } from '../data/countries';
import {
  ProblemItem,
  RegionFilter,
  ResourceKind,
  ResourceSubmission,
  SolutionItem,
} from '../types/gloweave';
import { CountrySelector } from './CountrySelector';
import { solutionStatusBadge } from './ProblemDetailView';
import { SolutionVisualBanner } from './VisualThumbnails';

export type SubmitKind = 'resource' | 'evidence';

const RESOURCE_KINDS: ResourceKind[] = [
  'Startup',
  'Product',
  'Research',
  'Website',
  'Other Resource',
];

interface SubmitResourceModalProps {
  open: boolean;
  initialKind?: SubmitKind;
  initialProblemId?: string;
  initialUrl?: string;
  problems: ProblemItem[];
  onClose: () => void;
  onSubmitResourceUrl: (payload: {
    url: string;
    kind: ResourceKind;
    optionalContext?: string;
    region?: Exclude<RegionFilter, 'Global'>;
    country?: string;
  }) => ResourceSubmission;
  onSubmitSolutionEvidence: (payload: {
    problemId: string;
    name: string;
    evidenceUrl: string;
    optionalNotes?: string;
  }) => void;
}

export const SubmitResourceModal: React.FC<SubmitResourceModalProps> = ({
  open,
  initialKind = 'resource',
  initialProblemId = '',
  initialUrl = '',
  problems,
  onClose,
  onSubmitResourceUrl,
  onSubmitSolutionEvidence,
}) => {
  const [mode, setMode] = useState<SubmitKind>(initialKind);
  const [step, setStep] = useState<'form' | 'processing' | 'confirmed'>('form');

  // Resource Link Submission (simple URL + optional context)
  const [resourceKind, setResourceKind] = useState<ResourceKind>('Startup');
  const [resourceUrl, setResourceUrl] = useState(initialUrl);
  const [optionalContext, setOptionalContext] = useState('');
  const [region, setRegion] = useState<Exclude<RegionFilter, 'Global'> | ''>('');
  const [country, setCountry] = useState('');

  // Solution Evidence Link Submission
  const [linkedProblemId, setLinkedProblemId] = useState(problems[0]?.id || '');
  const [solutionName, setSolutionName] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');

  const [error, setError] = useState('');
  const [createdSubmission, setCreatedSubmission] = useState<ResourceSubmission | null>(null);
  const [confirmedEvidenceTitle, setConfirmedEvidenceTitle] = useState('');

  useEffect(() => {
    if (open) {
      setMode(initialKind);
      setStep('form');
      setError('');
      setResourceKind('Startup');
      setResourceUrl(initialUrl || '');
      setOptionalContext('');
      setRegion('');
      setCountry('');
      setLinkedProblemId(initialProblemId || problems[0]?.id || '');
      setSolutionName('');
      setEvidenceUrl('');
      setEvidenceNotes('');
      setCreatedSubmission(null);
      setConfirmedEvidenceTitle('');
    }
  }, [open, initialKind, initialProblemId, initialUrl, problems]);

  if (!open) return null;

  const isValidUrl = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return false;
    const candidate = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    try {
      const parsed = new URL(candidate);
      return Boolean(parsed.hostname && parsed.hostname.includes('.'));
    } catch {
      return false;
    }
  };

  const normalizeUrl = (val: string) => {
    const trimmed = val.trim();
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'resource') {
      if (!isValidUrl(resourceUrl)) {
        setError('Please enter a valid startup, product, research, or website URL.');
        return;
      }

      const normalized = normalizeUrl(resourceUrl);
      setStep('processing');
      window.setTimeout(() => {
        const sub = onSubmitResourceUrl({
          url: normalized,
          kind: resourceKind,
          optionalContext: optionalContext.trim() || undefined,
          region: region || undefined,
          country: country.trim() || undefined,
        });
        setCreatedSubmission(sub);
        setStep('confirmed');
      }, 800);
      return;
    }

    // Solution Evidence submission
    if (!linkedProblemId) {
      setError('Select an existing problem to link this solution evidence.');
      return;
    }
    if (solutionName.trim().length < 2) {
      setError('Enter the solution or project name.');
      return;
    }
    if (!isValidUrl(evidenceUrl)) {
      setError('Please enter a valid evidence link demonstrating the solution.');
      return;
    }

    const normalizedEvidence = normalizeUrl(evidenceUrl);
    setStep('processing');
    window.setTimeout(() => {
      onSubmitSolutionEvidence({
        problemId: linkedProblemId,
        name: solutionName.trim(),
        evidenceUrl: normalizedEvidence,
        optionalNotes: evidenceNotes.trim() || undefined,
      });
      setConfirmedEvidenceTitle(solutionName.trim());
      setStep('confirmed');
    }, 800);
  };

  const linkedProblemTitle =
    problems.find((p) => p.id === linkedProblemId)?.title || 'Selected Problem';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Submit to Gloweave"
    >
      <div
        className="w-full max-w-lg glass-card rounded-2xl p-6 border border-sky-400/30 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-[#38BDF8] flex items-center justify-center">
              {mode === 'resource' ? (
                <Link2 className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {step === 'processing'
                  ? 'Queuing Submission...'
                  : step === 'confirmed'
                  ? mode === 'resource'
                    ? 'Queued for Batch AI Analysis'
                    : 'Solution Evidence Submitted'
                  : mode === 'resource'
                  ? 'Submit a Resource Link'
                  : 'Submit Solution Evidence'}
              </h3>
              <p className="text-xs text-slate-400">
                {step === 'confirmed'
                  ? mode === 'resource'
                    ? 'Scheduled batch processing · 24–48h turnaround'
                    : 'Marked Submitted · Pending evidence verification'
                  : 'Paste a URL — Gloweave AI analyses submissions in scheduled batches'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'form' && (
          <>
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#060E22] rounded-xl border border-[#1E386E]">
              <button
                type="button"
                onClick={() => {
                  setMode('resource');
                  setError('');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  mode === 'resource'
                    ? 'btn-royal text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Submit Resource URL
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('evidence');
                  setError('');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  mode === 'evidence'
                    ? 'btn-royal text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Submit Solution Evidence
              </button>
            </div>

            {mode === 'resource' ? (
              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Resource Type
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {RESOURCE_KINDS.map((kind) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => setResourceKind(kind)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          resourceKind === kind
                            ? 'bg-[#0D2B63] border-sky-400/60 text-white'
                            : 'bg-[#040A1A] border-[#1E386E] text-slate-300 hover:border-sky-400/40'
                        }`}
                      >
                        {kind}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="resource-url" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Resource URL *
                  </label>
                  <input
                    id="resource-url"
                    type="text"
                    value={resourceUrl}
                    onChange={(e) => {
                      setResourceUrl(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="https://example.org/research-or-product"
                    className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label htmlFor="resource-context" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Optional Context <span className="text-slate-500 font-normal">(not required)</span>
                  </label>
                  <textarea
                    id="resource-context"
                    rows={2}
                    value={optionalContext}
                    onChange={(e) => setOptionalContext(e.target.value)}
                    placeholder="Optional note on target region, problem area, or why this link is relevant"
                    className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Region <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <select
                      value={region}
                      onChange={(e) =>
                        setRegion(e.target.value as Exclude<RegionFilter, 'Global'> | '')
                      }
                      className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
                    >
                      <option value="">Any / Global</option>
                      {CONTINENTS.map((continent) => (
                        <option key={continent} value={continent}>
                          {continent}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Country <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <CountrySelector
                      value={country}
                      onChange={setCountry}
                      placeholder="Optional country"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#040A1A] border border-[#1E386E] flex items-center justify-between text-[11px] text-slate-300">
                  <span className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Scheduled batch AI extraction &amp; matching</span>
                  </span>
                  <span className="text-[#38BDF8] font-bold">24–48h feedback</span>
                </div>

                {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 border border-[#1E386E] text-slate-300 text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl btn-royal text-white text-xs font-bold transition cursor-pointer"
                  >
                    Queue for Batch Analysis →
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Problem *
                  </label>
                  {problems.length === 0 ? (
                    <div className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-slate-400">
                      No problems discovered yet.
                    </div>
                  ) : (
                    <select
                      value={linkedProblemId}
                      onChange={(e) => setLinkedProblemId(e.target.value)}
                      className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
                    >
                      {problems.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.country})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label htmlFor="solution-name" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Solution or Product Name *
                  </label>
                  <input
                    id="solution-name"
                    type="text"
                    value={solutionName}
                    onChange={(e) => {
                      setSolutionName(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Name of solution, pilot, or product"
                    className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label htmlFor="evidence-url" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Evidence Link (Report, Deployment, Demo, or Repo) *
                  </label>
                  <input
                    id="evidence-url"
                    type="text"
                    value={evidenceUrl}
                    onChange={(e) => {
                      setEvidenceUrl(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="https://example.org/pilot-report"
                    className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label htmlFor="evidence-notes" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Optional Evidence Summary <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="evidence-notes"
                    rows={2}
                    value={evidenceNotes}
                    onChange={(e) => setEvidenceNotes(e.target.value)}
                    placeholder="Optional notes summarizing what this evidence demonstrates"
                    className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400 resize-none"
                  />
                </div>

                {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 border border-[#1E386E] text-slate-300 text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl btn-royal text-white text-xs font-bold transition cursor-pointer"
                  >
                    Submit Evidence Link →
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {step === 'processing' && (
          <div className="py-10 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-500/20 border border-sky-400/40 text-[#38BDF8] flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">
                {mode === 'resource'
                  ? 'Validating link & adding to scheduled batch...'
                  : 'Recording solution evidence link...'}
              </p>
              <p className="text-xs text-slate-400">
                Gloweave never fabricates instant AI findings — queuing safely for verification.
              </p>
            </div>
          </div>
        )}

        {step === 'confirmed' && (
          <div className="py-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400/40 text-[#38BDF8] flex items-center justify-center shrink-0">
                {mode === 'resource' ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white">
                  {mode === 'resource'
                    ? `${createdSubmission?.kind || 'Resource'} Queued in Scheduled Batch`
                    : `"${confirmedEvidenceTitle}" Marked Submitted`}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {mode === 'resource'
                    ? createdSubmission?.etaLabel
                    : `Linked to ${linkedProblemTitle} · Status: Submitted`}
                </p>
              </div>
            </div>

            {mode === 'resource' && createdSubmission ? (
              <div className="p-4 rounded-xl bg-[#040A1A] border border-[#1E386E] space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="truncate font-mono text-[11px] text-[#38BDF8]">
                    {createdSubmission.url}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-400/35 text-sky-300 font-bold text-[10px] shrink-0 ml-2">
                    {createdSubmission.status}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Batch Pipeline Progress</span>
                    <span className="tabular-nums text-white font-semibold">
                      {createdSubmission.progressPercent}% (Queued)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0066FF] to-[#22D3EE]"
                      style={{ width: `${createdSubmission.progressPercent}%` }}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Your link will be analysed during the next scheduled batch to identify real-world
                  problems, startup capabilities, and candidate matches. Estimated feedback: 24–48
                  hours.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#040A1A] border border-[#1E386E] space-y-2 text-xs text-slate-300">
                <p>
                  Your evidence link has been recorded with status{' '}
                  <strong className="text-white">Submitted</strong>. Gloweave updates problem
                  resolution status only after evidence assessment completes.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="px-4 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 flex items-center space-x-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Submit Another</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface UpgradeProModalProps {
  open: boolean;
  isPro: boolean;
  onClose: () => void;
  onActivatePro: () => void;
}

export const UpgradeProModal: React.FC<UpgradeProModalProps> = ({
  open,
  isPro,
  onClose,
  onActivatePro,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Gloweave Pro Access"
    >
      <div
        className="w-full max-w-md glass-card rounded-2xl p-6 border border-purple-500/40 glow-purple space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Gloweave Pro</h3>
              <p className="text-xs text-slate-400">Priority batch intelligence &amp; reach</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Pro modal"
            className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-[#040A1A] border border-[#1E386E] flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-extrabold text-white tabular-nums">$29</span>
            <span className="text-xs text-slate-400 ml-1">/ month</span>
          </div>
          <span className="text-xs font-semibold text-purple-300">Priority Intelligence Tier</span>
        </div>

        <ul className="space-y-2.5 text-xs text-slate-300">
          <li className="flex items-center space-x-2.5">
            <Check className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Priority batch analysis &amp; faster evidence assessment</span>
          </li>
          <li className="flex items-center space-x-2.5">
            <Check className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Expanded collaborator &amp; solution matchmaking insights</span>
          </li>
          <li className="flex items-center space-x-2.5">
            <Check className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Regional distribution &amp; sector analytics exports</span>
          </li>
        </ul>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-[#1E386E] text-slate-300 text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onActivatePro();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 transition cursor-pointer"
          >
            {isPro ? 'Pro Membership Active ✓' : 'Activate Pro Preview →'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface SolutionDetailModalProps {
  solution: SolutionItem | null;
  linkedProblem?: ProblemItem | null;
  onClose: () => void;
  onToggleBookmark: (id: string) => void;
  onOpenProblem?: (problem: ProblemItem) => void;
}

export const SolutionDetailModal: React.FC<SolutionDetailModalProps> = ({
  solution,
  linkedProblem,
  onClose,
  onToggleBookmark,
  onOpenProblem,
}) => {
  if (!solution) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={solution.name}
    >
      <div
        className="w-full max-w-lg glass-card rounded-2xl p-6 border border-sky-400/30 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-[#38BDF8]" />
            <span className="text-xs font-semibold text-[#38BDF8]">
              {solution.country}, {solution.region}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${solutionStatusBadge(
                solution.status
              )}`}
            >
              {solution.status}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close solution details"
              className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <SolutionVisualBanner theme={solution.theme} name={solution.name} verified={solution.verified} />

        <div>
          <h3 className="text-base font-bold text-white">{solution.name}</h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{solution.description}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#040A1A] border border-[#1E386E] space-y-1.5 text-xs">
          <div className="text-[11px] font-bold text-[#38BDF8]">Evidence Assessment Note</div>
          <p className="text-slate-300">{solution.evidenceSummary}</p>
          {linkedProblem && onOpenProblem && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenProblem(linkedProblem);
              }}
              className="text-[11px] font-semibold text-sky-300 hover:underline pt-1 inline-block cursor-pointer"
            >
              Linked Problem: {linkedProblem.title} →
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>{solution.usersCount}</span>
            </span>
            <span className="flex items-center space-x-1 text-amber-400 font-bold tabular-nums">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>
                {solution.rating} ({solution.reviewsCount})
              </span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onToggleBookmark(solution.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                solution.bookmarked
                  ? 'bg-sky-500/20 border-sky-400/40 text-sky-300'
                  : 'bg-slate-900 border-[#1E386E] text-slate-300 hover:bg-slate-800'
              }`}
            >
              {solution.bookmarked ? 'Saved ✓' : 'Save'}
            </button>
            {(solution.evidenceUrl || solution.websiteUrl) && (
              <a
                href={solution.evidenceUrl || solution.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl btn-royal text-white font-bold text-xs flex items-center space-x-1.5 transition"
              >
                <span>Open Evidence</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface SignOutConfirmModalProps {
  open: boolean;
  isAuthenticated: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const SignOutConfirmModal: React.FC<SignOutConfirmModalProps> = ({
  open,
  isAuthenticated,
  busy = false,
  onCancel,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Confirm sign out"
    >
      <div
        className="w-full max-w-md glass-card rounded-3xl p-6 space-y-5 border border-sky-400/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/35 text-[#38BDF8] flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {isAuthenticated ? 'Sign Out of Gloweave?' : 'Return to Onboarding?'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Confirmation required</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close sign out confirmation"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {isAuthenticated
            ? 'You will be signed out of your authenticated session on this device. You can sign back in anytime with your email and password.'
            : 'You will return to the Gloweave welcome and registration flow.'}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="px-5 py-2 rounded-xl btn-royal text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isAuthenticated ? 'Confirm Sign Out' : 'Continue'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface DeleteAccountConfirmModalProps {
  open: boolean;
  isAuthenticated: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteAccountConfirmModal: React.FC<DeleteAccountConfirmModalProps> = ({
  open,
  isAuthenticated,
  busy = false,
  onCancel,
  onConfirm,
}) => {
  const [confirmWord, setConfirmWord] = useState('');

  useEffect(() => {
    if (open) setConfirmWord('');
  }, [open]);

  if (!open) return null;

  const canDelete = confirmWord.trim().toUpperCase() === 'DELETE';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Confirm account deletion"
    >
      <div
        className="w-full max-w-md glass-card rounded-3xl p-6 space-y-5 border border-rose-500/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Delete Account</h3>
              <p className="text-xs text-rose-300 mt-0.5">Permanent action confirmation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close delete account confirmation"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/35 text-[11px] text-amber-100 flex items-start space-x-2.5 leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300">Backend Deletion Notice:</strong>{' '}
            {isAuthenticated
              ? 'Permanent server-side deletion of Supabase Auth records awaits a dedicated backend deletion endpoint. Confirming here will clear your local preferences, draft state, and sign you out.'
              : 'This will clear all local session data, saved preferences, and onboarding progress from this browser.'}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Type <code className="text-rose-300 font-bold">DELETE</code> to confirm
          </label>
          <input
            type="text"
            value={confirmWord}
            onChange={(e) => setConfirmWord(e.target.value)}
            placeholder="DELETE"
            className="w-full bg-[#040A1A] border border-rose-500/35 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canDelete || busy}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer disabled:opacity-45"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Clear &amp; Confirm</span>
          </button>
        </div>
      </div>
    </div>
  );
};

