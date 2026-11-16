import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Link2,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { CONTINENTS } from '../data/countries';
import { SUBMISSION_RESOURCE_TYPES, VERIFICATION_STATUSES } from '../data/gloweaveData';
import { isBackendConfigured } from '../lib/backendApi';
import {
  ProblemItem,
  RegionFilter,
  ResourceKind,
  ResourceSubmission,
  SolutionItem,
  VerificationStatus,
} from '../types/gloweave';
import { CountrySelector } from './CountrySelector';
import { solutionStatusBadge, verificationStatusBadge } from './ProblemDetailView';
import { SolutionVisualBanner } from './VisualThumbnails';

export type SubmitKind = 'resource' | 'pdf' | 'evidence';

const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25 MB

const PDF_RESOURCE_KINDS: ResourceKind[] = [
  'PDF Document',
  'Research Paper / Report',
  'Technical Documentation',
  'Other Resource',
];

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

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
  }) => Promise<ResourceSubmission> | ResourceSubmission;
  onSubmitPdfDocument?: (payload: {
    file: File;
    kind: ResourceKind;
    ocrRequested: boolean;
    optionalContext?: string;
    region?: Exclude<RegionFilter, 'Global'>;
    country?: string;
    previewObjectUrl: string;
  }) => Promise<ResourceSubmission> | ResourceSubmission;
  onSubmitSolutionEvidence: (payload: {
    problemId: string;
    name: string;
    evidenceUrl: string;
    productUrl?: string;
    addressExplanation?: string;
    supportingFile?: File | null;
    optionalNotes?: string;
  }) => Promise<void> | void;
}

export const SubmitResourceModal: React.FC<SubmitResourceModalProps> = ({
  open,
  initialKind = 'resource',
  initialProblemId = '',
  initialUrl = '',
  problems,
  onClose,
  onSubmitResourceUrl,
  onSubmitPdfDocument,
  onSubmitSolutionEvidence,
}) => {
  const [mode, setMode] = useState<SubmitKind>(initialKind);
  const [step, setStep] = useState<'form' | 'processing' | 'error' | 'confirmed'>('form');

  // Resource URL Submission
  const [resourceKind, setResourceKind] = useState<ResourceKind>('Website URL');
  const [resourceUrl, setResourceUrl] = useState(initialUrl);
  const [optionalContext, setOptionalContext] = useState('');
  const [region, setRegion] = useState<Exclude<RegionFilter, 'Global'> | ''>('');
  const [country, setCountry] = useState('');

  // PDF Upload + OCR State
  const [pdfKind, setPdfKind] = useState<ResourceKind>('PDF Document');
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('');
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [ocrRequested, setOcrRequested] = useState(true);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Solution Proposal & Evidence Submission
  const [linkedProblemId, setLinkedProblemId] = useState(problems[0]?.id || '');
  const [solutionName, setSolutionName] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [addressExplanation, setAddressExplanation] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [solutionPdfFile, setSolutionPdfFile] = useState<File | null>(null);
  const [evidenceNotes, setEvidenceNotes] = useState('');

  const [error, setError] = useState('');
  const [createdSubmission, setCreatedSubmission] = useState<ResourceSubmission | null>(null);
  const [confirmedEvidenceTitle, setConfirmedEvidenceTitle] = useState('');

  useEffect(() => {
    if (open) {
      setMode(initialKind);
      setStep('form');
      setError('');
      setResourceKind('Website URL');
      setResourceUrl(initialUrl || '');
      setOptionalContext('');
      setRegion('');
      setCountry('');
      setPdfKind('PDF Document');
      setSelectedPdfFile(null);
      setPdfPreviewUrl('');
      setShowPdfPreview(false);
      setOcrRequested(true);
      setUploadPercent(0);
      setLinkedProblemId(initialProblemId || problems[0]?.id || '');
      setSolutionName('');
      setProductUrl('');
      setAddressExplanation('');
      setEvidenceUrl('');
      setSolutionPdfFile(null);
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

  const validatePdfSelection = (file: File): string | null => {
    const isPdfMime = file.type === 'application/pdf';
    const hasPdfExtension = file.name.toLowerCase().endsWith('.pdf');
    if (!isPdfMime && !hasPdfExtension) {
      return 'Invalid file type. Only PDF documents (.pdf) are supported.';
    }
    if (file.size === 0) {
      return 'The selected PDF file appears to be empty (0 bytes).';
    }
    if (file.size > MAX_PDF_BYTES) {
      return `PDF exceeds the 25 MB upload limit (${formatFileSize(file.size)} selected).`;
    }
    return null;
  };

  const handleSelectPdfFile = (file: File | undefined) => {
    if (!file) return;
    const validationErr = validatePdfSelection(file);
    if (validationErr) {
      setError(validationErr);
      return;
    }
    setError('');
    setSelectedPdfFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPdfPreviewUrl(objectUrl);
  };

  const handleSelectSolutionPdf = (file: File | undefined) => {
    if (!file) return;
    const validationErr = validatePdfSelection(file);
    if (validationErr) {
      setError(validationErr);
      return;
    }
    setError('');
    setSolutionPdfFile(file);
  };

  const executeSubmission = async () => {
    setError('');

    if (mode === 'resource') {
      if (!isValidUrl(resourceUrl)) {
        setError('Please enter a valid website, startup, product, documentation, or research URL.');
        return;
      }

      const normalized = normalizeUrl(resourceUrl);
      setStep('processing');
      try {
        const sub = await onSubmitResourceUrl({
          url: normalized,
          kind: resourceKind,
          optionalContext: optionalContext.trim() || undefined,
          region: region || undefined,
          country: country.trim() || undefined,
        });
        setCreatedSubmission(sub);
        setStep('confirmed');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to submit resource URL.');
        setStep('error');
      }
      return;
    }

    if (mode === 'pdf') {
      if (!selectedPdfFile) {
        setError('Please select or drop a PDF document (.pdf) to upload.');
        return;
      }
      const validationErr = validatePdfSelection(selectedPdfFile);
      if (validationErr) {
        setError(validationErr);
        return;
      }

      setStep('processing');
      setUploadPercent(35);

      try {
        window.setTimeout(() => setUploadPercent(75), 180);
        if (onSubmitPdfDocument) {
          const sub = await onSubmitPdfDocument({
            file: selectedPdfFile,
            kind: pdfKind,
            ocrRequested,
            optionalContext: optionalContext.trim() || undefined,
            region: region || undefined,
            country: country.trim() || undefined,
            previewObjectUrl: pdfPreviewUrl,
          });
          setUploadPercent(100);
          setCreatedSubmission(sub);
          setStep('confirmed');
        } else {
          setError('PDF submission handler is not connected.');
          setStep('error');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'PDF upload failed.');
        setStep('error');
      }
      return;
    }

    // Solution Proposal & Evidence submission
    if (!linkedProblemId) {
      setError('Select a target problem before proposing a solution.');
      return;
    }
    if (solutionName.trim().length < 2) {
      setError('Enter the proposed solution or product name.');
      return;
    }
    if (addressExplanation.trim().length < 10) {
      setError('Explain how this solution addresses the identified problem (min 10 characters).');
      return;
    }
    if (!isValidUrl(evidenceUrl) && !isValidUrl(productUrl) && !solutionPdfFile) {
      setError('Provide a product/service URL, supporting evidence URL, or supporting PDF document.');
      return;
    }
    if (productUrl.trim() && !isValidUrl(productUrl)) {
      setError('Product or service URL is invalid.');
      return;
    }
    if (evidenceUrl.trim() && !isValidUrl(evidenceUrl)) {
      setError('Supporting evidence URL is invalid.');
      return;
    }

    const normalizedEvidence = evidenceUrl.trim()
      ? normalizeUrl(evidenceUrl)
      : productUrl.trim()
      ? normalizeUrl(productUrl)
      : '';
    const normalizedProduct = productUrl.trim() ? normalizeUrl(productUrl) : normalizedEvidence;

    setStep('processing');
    try {
      await onSubmitSolutionEvidence({
        problemId: linkedProblemId,
        name: solutionName.trim(),
        evidenceUrl: normalizedEvidence,
        productUrl: normalizedProduct,
        addressExplanation: addressExplanation.trim(),
        supportingFile: solutionPdfFile,
        optionalNotes: evidenceNotes.trim() || undefined,
      });
      setConfirmedEvidenceTitle(solutionName.trim());
      setStep('confirmed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit solution proposal.');
      setStep('error');
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    void executeSubmission();
  };

  const linkedProblemTitle =
    problems.find((p) => p.id === linkedProblemId)?.title || 'Selected Problem';
  const backendReady = isBackendConfigured();

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Submit to Gloweave"
    >
      <div
        className="w-full max-w-xl glass-card rounded-2xl p-6 border border-sky-400/30 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-[#38BDF8] flex items-center justify-center">
              {mode === 'resource' ? (
                <Link2 className="w-4 h-4" />
              ) : mode === 'pdf' ? (
                <FileText className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {step === 'processing'
                  ? mode === 'pdf'
                    ? 'Preparing PDF Package...'
                    : 'Queuing Submission...'
                  : step === 'error'
                  ? 'Submission Interrupted'
                  : step === 'confirmed'
                  ? mode === 'pdf'
                    ? 'PDF Queued for Backend Extraction & OCR'
                    : mode === 'resource'
                    ? 'Resource Queued for Batch Analysis'
                    : 'Solution Proposal Submitted'
                  : mode === 'resource'
                  ? 'Submit Resource URL'
                  : mode === 'pdf'
                  ? 'Upload PDF Document'
                  : 'Propose Solution & Evidence'}
              </h3>
              <p className="text-xs text-slate-400">
                {step === 'confirmed'
                  ? mode === 'evidence'
                    ? 'Pending AI assessment & human review · Never auto-verified'
                    : backendReady
                    ? 'Synced with Gloweave processing backend'
                    : 'Recorded in local queue · Awaiting backend processing service'
                  : 'Submit URLs, PDFs, or solution evidence for AI analysis & human verification'}
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
            {/* 3-Tab Mode Switcher */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#060E22] rounded-xl border border-[#1E386E]">
              <button
                type="button"
                onClick={() => {
                  setMode('resource');
                  setError('');
                }}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  mode === 'resource'
                    ? 'btn-royal text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Submit URL
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('pdf');
                  setError('');
                }}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  mode === 'pdf'
                    ? 'btn-royal text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Upload PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('evidence');
                  setError('');
                }}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  mode === 'evidence'
                    ? 'btn-royal text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Propose Solution
              </button>
            </div>

            {!backendReady && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-[11px] text-amber-100 leading-relaxed flex items-start space-x-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-amber-300">Backend Integration Pending:</strong>{' '}
                  {mode === 'pdf'
                    ? 'Real PDF text extraction and OCR require the backend processing service. Selected PDFs are validated and previewed locally without faking extraction.'
                    : 'Submissions are validated and queued in this session cleanly until the backend ingestion API is connected.'}
                </span>
              </div>
            )}

            {mode === 'resource' && (
              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Resource Classification
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {SUBMISSION_RESOURCE_TYPES.map((kind) => (
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
                    placeholder="https://example.org/research-docs-or-product"
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
                    placeholder="Optional note on target region, problem area, or technical scope"
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
                    Queue Resource URL →
                  </button>
                </div>
              </form>
            )}

            {mode === 'pdf' && (
              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Document Category
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PDF_RESOURCE_KINDS.map((kind) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => setPdfKind(kind)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          pdfKind === kind
                            ? 'bg-[#0D2B63] border-sky-400/60 text-white'
                            : 'bg-[#040A1A] border-[#1E386E] text-slate-300 hover:border-sky-400/40'
                        }`}
                      >
                        {kind}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dropzone */}
                <div>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      handleSelectPdfFile(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      handleSelectPdfFile(e.dataTransfer.files?.[0]);
                    }}
                    onClick={() => pdfInputRef.current?.click()}
                    className={`rounded-2xl border-2 border-dashed p-5 text-center transition cursor-pointer ${
                      dragOver
                        ? 'border-sky-400 bg-sky-500/15'
                        : 'border-[#1E386E] bg-[#040A1A]/85 hover:border-sky-400/50'
                    }`}
                  >
                    <Upload className="w-6 h-6 text-[#38BDF8] mx-auto mb-2" />
                    <p className="text-xs font-bold text-white">
                      {selectedPdfFile ? selectedPdfFile.name : 'Click or drop a PDF document here'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Supports research papers, technical documentation, and reports (.pdf · max 25 MB)
                    </p>
                  </div>
                </div>

                {selectedPdfFile && (
                  <div className="p-3.5 rounded-xl bg-[#040A1A] border border-[#1E386E] space-y-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{selectedPdfFile.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {formatFileSize(selectedPdfFile.size)} · {selectedPdfFile.type || 'application/pdf'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {pdfPreviewUrl && (
                          <button
                            type="button"
                            onClick={() => setShowPdfPreview((p) => !p)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#0A1633] border border-[#1E386E] text-[11px] font-semibold text-[#38BDF8] flex items-center space-x-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{showPdfPreview ? 'Hide Preview' : 'Preview PDF'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPdfFile(null);
                            setPdfPreviewUrl('');
                            setShowPdfPreview(false);
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 border border-[#1E386E] text-slate-400 hover:text-rose-300 cursor-pointer"
                          aria-label="Remove selected PDF"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {showPdfPreview && pdfPreviewUrl && (
                      <div className="rounded-xl overflow-hidden border border-[#1E386E] bg-slate-950 h-52">
                        <iframe
                          src={pdfPreviewUrl}
                          title={`Preview of ${selectedPdfFile.name}`}
                          className="w-full h-full"
                        />
                      </div>
                    )}
                  </div>
                )}

                <label className="flex items-start space-x-2.5 p-3 rounded-xl bg-[#040A1A] border border-[#1E386E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ocrRequested}
                    onChange={(e) => setOcrRequested(e.target.checked)}
                    className="mt-0.5 accent-[#38BDF8]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Enable OCR if document is scanned or image-based
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Backend worker will run OCR only when text layer is unavailable or incomplete.
                    </span>
                  </div>
                </label>

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
                    <CountrySelector value={country} onChange={setCountry} placeholder="Optional country" />
                  </div>
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
                    Upload &amp; Queue PDF →
                  </button>
                </div>
              </form>
            )}

            {mode === 'evidence' && (
              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Problem *
                  </label>
                  {problems.length === 0 ? (
                    <div className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-slate-400">
                      No AI-discovered problems available yet. Queue a URL or PDF first so a target problem exists.
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <label htmlFor="product-url" className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Product / Service URL
                    </label>
                    <input
                      id="product-url"
                      type="text"
                      value={productUrl}
                      onChange={(e) => {
                        setProductUrl(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="https://product-site.org"
                      className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address-explanation" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    How It Addresses the Problem *
                  </label>
                  <textarea
                    id="address-explanation"
                    rows={2}
                    value={addressExplanation}
                    onChange={(e) => {
                      setAddressExplanation(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Explain the mechanism, measurable deployment outcome, or technical fit..."
                    className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="evidence-url" className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Supporting Evidence Link
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
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Supporting PDF <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <label className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#040A1A] border border-[#1E386E] hover:border-sky-400/50 text-xs text-slate-300 cursor-pointer">
                      <span className="truncate">
                        {solutionPdfFile ? solutionPdfFile.name : 'Attach PDF report (.pdf)'}
                      </span>
                      <Upload className="w-3.5 h-3.5 text-[#38BDF8] shrink-0 ml-2" />
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          handleSelectSolutionPdf(e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="evidence-notes" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Additional Notes <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="evidence-notes"
                    type="text"
                    value={evidenceNotes}
                    onChange={(e) => setEvidenceNotes(e.target.value)}
                    placeholder="Geography, limitations, or reviewer context"
                    className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
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
                    Submit Solution Proposal →
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
            <div className="space-y-2 max-w-sm mx-auto">
              <p className="text-sm font-bold text-white">
                {mode === 'pdf'
                  ? 'Validating PDF & preparing extraction job...'
                  : mode === 'resource'
                  ? 'Validating link & adding to scheduled batch...'
                  : 'Recording solution proposal & evidence...'}
              </p>
              {mode === 'pdf' && (
                <div className="space-y-1">
                  <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0066FF] to-[#22D3EE] transition-all"
                      style={{ width: `${uploadPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 tabular-nums">{uploadPercent}% packaged</p>
                </div>
              )}
              <p className="text-xs text-slate-400">
                Gloweave never fabricates extraction, OCR output, or verification approval.
              </p>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/35 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-rose-300">Submission Error</p>
                <p className="text-xs text-slate-200">{error || 'An unexpected error occurred.'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="px-4 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 cursor-pointer"
              >
                Edit Form
              </button>
              <button
                type="button"
                onClick={() => void executeSubmission()}
                className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Submission</span>
              </button>
            </div>
          </div>
        )}

        {step === 'confirmed' && (
          <div className="py-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400/40 text-[#38BDF8] flex items-center justify-center shrink-0">
                {mode === 'evidence' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white">
                  {mode === 'pdf'
                    ? `${createdSubmission?.pdfMeta?.fileName || 'PDF'} Queued`
                    : mode === 'resource'
                    ? `${createdSubmission?.kind || 'Resource'} Queued in Batch`
                    : `"${confirmedEvidenceTitle}" Recorded as Unverified Proposal`}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {mode === 'evidence'
                    ? `Linked to ${linkedProblemTitle} · AI Assessment: Pending · Human Review: Awaiting Review`
                    : createdSubmission?.etaLabel}
                </p>
              </div>
            </div>

            {createdSubmission && (mode === 'resource' || mode === 'pdf') ? (
              <div className="p-4 rounded-xl bg-[#040A1A] border border-[#1E386E] space-y-3 text-xs">
                <div className="flex items-center justify-between gap-2 text-slate-300">
                  <span className="truncate font-mono text-[11px] text-[#38BDF8]">
                    {createdSubmission.submissionFormat === 'pdf'
                      ? `${createdSubmission.pdfMeta?.fileName} (${formatFileSize(
                          createdSubmission.pdfMeta?.fileSizeBytes || 0
                        )})`
                      : createdSubmission.url}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-400/35 text-sky-300 font-bold text-[10px] shrink-0">
                    {createdSubmission.status}
                  </span>
                </div>

                {createdSubmission.submissionFormat === 'pdf' && (
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-[#091533] border border-[#1E386E]">
                      <span className="text-slate-400 block">Extraction Status</span>
                      <strong className="text-amber-300">{createdSubmission.extractionStatus}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#091533] border border-[#1E386E]">
                      <span className="text-slate-400 block">OCR Status</span>
                      <strong className="text-sky-300">{createdSubmission.ocrStatus}</strong>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {createdSubmission.backendSyncState === 'synced'
                    ? 'Submitted to Gloweave backend worker for extraction, OCR (if scanned), AI discovery, and candidate matching.'
                    : 'Stored in local queue awaiting backend service connection. Actual PDF extraction, OCR, and AI findings will appear once processed by the backend.'}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#040A1A] border border-[#1E386E] space-y-2 text-xs text-slate-300">
                <p>
                  Your solution proposal is stored with AI Assessment{' '}
                  <strong className="text-amber-300">Pending Batch Assessment</strong> and Human
                  Review <strong className="text-sky-300">Awaiting Review</strong>. Proposed
                  solutions never become Verified automatically.
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
  onReviewSolution?: (
    solutionId: string,
    decision: VerificationStatus,
    notes: string
  ) => void;
}

export const SolutionDetailModal: React.FC<SolutionDetailModalProps> = ({
  solution,
  linkedProblem,
  onClose,
  onToggleBookmark,
  onOpenProblem,
  onReviewSolution,
}) => {
  const [reviewDecision, setReviewDecision] = useState<VerificationStatus>('Awaiting Review');
  const [reviewNote, setReviewNote] = useState('');
  const [confirmResolve, setConfirmResolve] = useState(false);

  useEffect(() => {
    if (solution) {
      setReviewDecision(solution.humanReviewStatus || 'Awaiting Review');
      setReviewNote(solution.humanReviewerNotes || '');
      setConfirmResolve(false);
    }
  }, [solution]);

  if (!solution) return null;

  const humanStatus = solution.humanReviewStatus || (solution.verified ? 'Verified' : 'Awaiting Review');

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onReviewSolution) return;
    if (reviewDecision === 'Resolved' && !confirmResolve) return;
    onReviewSolution(solution.id, reviewDecision, reviewNote.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={solution.name}
    >
      <div
        className="w-full max-w-lg glass-card rounded-2xl p-6 border border-sky-400/30 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
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

        {solution.addressExplanation && (
          <div className="p-3.5 rounded-xl bg-[#040A1A] border border-[#1E386E] space-y-1 text-xs">
            <div className="text-[11px] font-bold text-sky-300">How This Solution Addresses the Problem</div>
            <p className="text-slate-300 leading-relaxed">{solution.addressExplanation}</p>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-[#040A1A] border border-[#1E386E] space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-[#38BDF8]">Assessment &amp; Human Review Status</span>
            <span
              className={`px-2 py-0.5 rounded border text-[10px] font-bold ${verificationStatusBadge(
                humanStatus
              )}`}
            >
              Human: {humanStatus}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            AI Assessment:{' '}
            <strong className="text-amber-300">
              {solution.aiAssessmentStatus || 'Pending Batch Assessment'}
            </strong>
          </div>
          <p className="text-slate-300">{solution.evidenceSummary}</p>
          {solution.supportingDocumentName && (
            <div className="text-[11px] text-slate-300 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Attached Supporting PDF: {solution.supportingDocumentName}</span>
            </div>
          )}
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

        {onReviewSolution && (
          <form
            onSubmit={handleSaveReview}
            className="p-3.5 rounded-xl bg-[#06122E] border border-[#1E386E] space-y-2.5 text-xs"
          >
            <div className="text-[11px] font-bold text-white flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Human Verification Review</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={reviewDecision}
                onChange={(e) => setReviewDecision(e.target.value as VerificationStatus)}
                className="bg-[#040A1A] border border-[#1E386E] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
              >
                {VERIFICATION_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Reviewer verification notes..."
                className="bg-[#040A1A] border border-[#1E386E] rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
            {reviewDecision === 'Resolved' && (
              <label className="flex items-start space-x-2 text-[11px] text-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmResolve}
                  onChange={(e) => setConfirmResolve(e.target.checked)}
                  className="mt-0.5 accent-[#38BDF8]"
                />
                <span>Confirm independent human verification before marking Resolved.</span>
              </label>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                {isBackendConfigured() ? 'Syncs with backend' : 'Session review · Awaiting backend'}
              </span>
              <button
                type="submit"
                disabled={reviewDecision === 'Resolved' && !confirmResolve}
                className="px-3 py-1.5 rounded-lg btn-royal text-white text-[11px] font-bold cursor-pointer disabled:opacity-45"
              >
                Record Human Review
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Submitted {solution.submittedAt}</span>
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

interface AuthRequiredModalProps {
  open: boolean;
  actionLabel: string | null;
  onClose: () => void;
  onSignIn: () => void;
  onCreateAccount: () => void;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
  open,
  actionLabel,
  onClose,
  onSignIn,
  onCreateAccount,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Sign in required"
    >
      <div
        className="w-full max-w-md glass-card rounded-3xl p-6 space-y-5 border border-sky-400/35 shadow-[0_24px_60px_rgba(0,40,120,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0066FF]/25 to-[#22D3EE]/20 border border-sky-400/40 text-[#38BDF8] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
                Account Required to Act
              </span>
              <h3 className="text-base font-extrabold text-white mt-0.5">
                Sign in to {actionLabel || 'continue'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in prompt"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          You can review problems, matches, startups, solutions, and analytics without an account. To{' '}
          <span className="text-white font-semibold">{actionLabel || 'perform this action'}</span>,
          please sign in or complete quick onboarding to create your Gloweave account.
        </p>

        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={onSignIn}
            className="w-full py-2.5 px-4 rounded-xl btn-royal text-white text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Existing Account</span>
          </button>
          <button
            type="button"
            onClick={onCreateAccount}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0A1633] border border-sky-400/35 hover:border-sky-300/60 text-[#38BDF8] text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Get Started (Onboarding &amp; Sign Up)</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            Continue Reviewing Without Signing In
          </button>
        </div>
      </div>
    </div>
  );
};

