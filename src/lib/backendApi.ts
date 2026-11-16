import {
  DiscoveryFilterState,
  EvidenceItem,
  MatchUserFeedback,
  RegionFilter,
  ResourceKind,
  ResourceSubmission,
  SolutionItem,
  VerificationStatus,
} from '../types/gloweave';

export const APP_VERSION = 'v1.2.4';

const RAW_BACKEND_URL = (import.meta.env.VITE_BACKEND_API_URL as string | undefined) || '';
export const BACKEND_API_BASE_URL = RAW_BACKEND_URL.trim().replace(/\/+$/, '');

export const isBackendConfigured = () => Boolean(BACKEND_API_BASE_URL);

export const getBackendStatusLabel = () =>
  isBackendConfigured()
    ? `Connected (${BACKEND_API_BASE_URL})`
    : 'Awaiting Backend Integration (VITE_BACKEND_API_URL not set)';

export interface BackendOperationResult<T = unknown> {
  ok: boolean;
  configured: boolean;
  awaitingBackend: boolean;
  endpoint: string;
  message: string;
  data?: T;
}

export interface ApiContractSpec {
  id: string;
  capability: string;
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  requestSchema: string;
  responseSchema: string;
  notes: string;
}

/**
 * Modular API integration contracts documenting backend dependencies required
 * by Gloweave v1.2.4. Frontend components check `isBackendConfigured()` and display
 * honest `Awaiting Backend Integration` states when unconfigured — never faking
 * extraction, OCR, AI findings, or verification approvals.
 */
export const BACKEND_API_CONTRACTS: ApiContractSpec[] = [
  {
    id: 'submit-url',
    capability: 'Resource URL Submission & Batch Queue',
    method: 'POST',
    path: '/api/submissions/url',
    requestSchema:
      '{ url: string, kind: ResourceKind, optionalContext?: string, region?: string, country?: string }',
    responseSchema:
      '{ submissionId: string, status: BatchProcessingStatus, batchWindow: string, etaLabel: string }',
    notes: 'Validates URL safety (SSRF guards), stores metadata, and enqueues scheduled batch job.',
  },
  {
    id: 'upload-pdf',
    capability: 'PDF Upload, Text Extraction & Scanned OCR',
    method: 'POST',
    path: '/api/submissions/pdf',
    requestSchema:
      'multipart/form-data { file: File (.pdf), kind: ResourceKind, ocrRequested: boolean, optionalContext?: string, region?: string, country?: string }',
    responseSchema:
      '{ submissionId: string, fileMeta: PdfDocumentMetadata, extractionStatus: PdfExtractionStatus, ocrStatus: OcrStatus }',
    notes: 'Performs virus/type checks, stores PDF in object storage, and triggers text extraction + OCR.',
  },
  {
    id: 'fetch-extraction',
    capability: 'Retrieve Extracted PDF Text & OCR Status',
    method: 'GET',
    path: '/api/submissions/:submissionId/extraction',
    requestSchema: 'Path param: submissionId',
    responseSchema:
      '{ extractionStatus: PdfExtractionStatus, ocrStatus: OcrStatus, pageCount?: number, extractedPreviewText: string | null, errorMessage?: string }',
    notes: 'Never simulated on client; returned strictly by backend PDF/OCR worker.',
  },
  {
    id: 'retry-extraction',
    capability: 'Retry Failed PDF Extraction / OCR Job',
    method: 'POST',
    path: '/api/submissions/:submissionId/retry',
    requestSchema: '{ ocrRequested?: boolean }',
    responseSchema: '{ extractionStatus: PdfExtractionStatus, ocrStatus: OcrStatus }',
    notes: 'Re-enqueues extraction or OCR worker when transient errors occur.',
  },
  {
    id: 'problem-ai-analysis',
    capability: 'AI-Powered Problem Discovery Breakdown',
    method: 'GET',
    path: '/api/problems/:problemId/analysis',
    requestSchema: 'Path param: problemId',
    responseSchema:
      '{ explicitProblems: string[], inferredProblems: string[], unmetNeeds: string[], affectedGroups: string[], geographicRelevance: string, impactLevel: ImpactSeverityLevel, severityLevel: ImpactSeverityLevel, existingSolutionsAndLimitations: string[] }',
    notes: 'Returns clearly separated AI-derived analysis; never conflated with human verification.',
  },
  {
    id: 'evidence-management',
    capability: 'Evidence Management & Source References',
    method: 'POST',
    path: '/api/problems/:problemId/evidence',
    requestSchema:
      '{ sourceUrl?: string, documentFile?: File, sourceTitle: string, extractedReferences: string[], supportingEvidence: string, evidenceType: EvidenceType }',
    responseSchema: '{ evidence: EvidenceItem }',
    notes: 'Stores linked evidence with initial reviewStatus = "Awaiting Review".',
  },
  {
    id: 'human-verification',
    capability: 'Human Verification & Status Confirmation',
    method: 'POST',
    path: '/api/verifications',
    requestSchema:
      '{ targetType: "problem" | "evidence" | "solution" | "match", targetId: string, decision: VerificationStatus, comment: string, humanConfirmationChecked: boolean }',
    responseSchema: '{ feedback: VerificationFeedback, updatedStatus: VerificationStatus }',
    notes:
      'Server enforces authorised human reviewer role. AI services are prohibited from invoking "Resolved" or "Verified" transitions.',
  },
  {
    id: 'match-feedback',
    capability: 'Problem-Resource Matchmaking & User Feedback',
    method: 'POST',
    path: '/api/matches/:matchId/feedback',
    requestSchema: '{ feedback: "helpful" | "needs-evidence" | "not-relevant", note?: string }',
    responseSchema: '{ matchId: string, reviewStatus: VerificationStatus }',
    notes: 'Captures human feedback on AI-suggested and verified matches.',
  },
  {
    id: 'solution-proposal',
    capability: 'Solution Proposal & Assessment Workflow',
    method: 'POST',
    path: '/api/solutions',
    requestSchema:
      '{ problemId: string, name: string, productUrl: string, addressExplanation: string, evidenceUrl?: string, supportingDocument?: File }',
    responseSchema:
      '{ solution: SolutionItem (aiAssessmentStatus: "Pending Batch Assessment", humanReviewStatus: "Awaiting Review", verified: false) }',
    notes: 'Proposed solutions always begin unverified pending AI batch assessment + human review.',
  },
  {
    id: 'global-discover',
    capability: 'Multi-Axis Global Discovery Query',
    method: 'GET',
    path: '/api/discover',
    requestSchema:
      'Query params: region, country, industry, problemCategory, severity, verificationStatus, resourceType, q',
    responseSchema: '{ problems: ProblemItem[], totalCount: number }',
    notes: 'Supports server-side filtering across all 6 global discovery axes.',
  },
  {
    id: 'summarize-chat-link',
    capability: 'Direct Message Inner-Link Summarizer',
    method: 'POST',
    path: '/api/messages/summarize-link',
    requestSchema: '{ threadId: string, messageId: string, url: string }',
    responseSchema: '{ pageTitle?: string, summary: string, keyPoints: string[] }',
    notes: 'Safely fetches and summarizes shared product/resource URLs inside user chats.',
  },
  {
    id: 'featured-startups',
    capability: 'Backend-Computed Featured Startups Ranking',
    method: 'GET',
    path: '/api/startups/featured',
    requestSchema: 'Optional query params: region, sector, limit',
    responseSchema: '{ startups: StartupItem[] }',
    notes: 'Computed strictly server-side from usefulness score, verified evidence, and active adoption. Users cannot self-feature.',
  },
];

async function requestBackend<T>(
  path: string,
  init?: RequestInit
): Promise<BackendOperationResult<T>> {
  if (!isBackendConfigured()) {
    return {
      ok: false,
      configured: false,
      awaitingBackend: true,
      endpoint: path,
      message: 'Awaiting backend integration (VITE_BACKEND_API_URL is not configured).',
    };
  }

  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}${path}`, init);
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return {
        ok: false,
        configured: true,
        awaitingBackend: false,
        endpoint: path,
        message: errorText || `Backend returned HTTP ${response.status}`,
      };
    }
    const data = (await response.json().catch(() => undefined)) as T | undefined;
    return {
      ok: true,
      configured: true,
      awaitingBackend: false,
      endpoint: path,
      message: 'Synced with Gloweave backend.',
      data,
    };
  } catch (err) {
    return {
      ok: false,
      configured: true,
      awaitingBackend: false,
      endpoint: path,
      message: err instanceof Error ? err.message : 'Network error reaching Gloweave backend.',
    };
  }
}

export async function submitResourceUrlToBackend(payload: {
  url: string;
  kind: ResourceKind;
  optionalContext?: string;
  region?: Exclude<RegionFilter, 'Global'>;
  country?: string;
}) {
  return requestBackend<{ submissionId?: string }>('/api/submissions/url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function uploadPdfToBackend(payload: {
  file: File;
  kind: ResourceKind;
  ocrRequested: boolean;
  optionalContext?: string;
  region?: Exclude<RegionFilter, 'Global'>;
  country?: string;
}) {
  const form = new FormData();
  form.append('file', payload.file);
  form.append('kind', payload.kind);
  form.append('ocrRequested', String(payload.ocrRequested));
  if (payload.optionalContext) form.append('optionalContext', payload.optionalContext);
  if (payload.region) form.append('region', payload.region);
  if (payload.country) form.append('country', payload.country);

  return requestBackend<Partial<ResourceSubmission>>('/api/submissions/pdf', {
    method: 'POST',
    body: form,
  });
}

export async function fetchPdfExtractionFromBackend(submissionId: string) {
  return requestBackend<
    Pick<
      ResourceSubmission,
      'extractionStatus' | 'ocrStatus' | 'extractedPreviewText' | 'errorMessage'
    > & { pageCount?: number }
  >(`/api/submissions/${encodeURIComponent(submissionId)}/extraction`, {
    method: 'GET',
  });
}

export async function retryPdfExtractionOnBackend(
  submissionId: string,
  ocrRequested: boolean
) {
  return requestBackend<
    Pick<ResourceSubmission, 'extractionStatus' | 'ocrStatus' | 'errorMessage'>
  >(`/api/submissions/${encodeURIComponent(submissionId)}/retry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ocrRequested }),
  });
}

export async function submitHumanVerificationToBackend(payload: {
  targetType: 'problem' | 'evidence' | 'solution' | 'match';
  targetId: string;
  decision: VerificationStatus;
  comment: string;
  reviewerName: string;
  humanConfirmationChecked: boolean;
}) {
  return requestBackend<{ updatedStatus?: VerificationStatus }>('/api/verifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function submitMatchFeedbackToBackend(payload: {
  matchId: string;
  feedback: MatchUserFeedback;
  note?: string;
}) {
  return requestBackend<{ matchId: string }>(`/api/matches/${encodeURIComponent(payload.matchId)}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedback: payload.feedback, note: payload.note }),
  });
}

export async function submitSolutionProposalToBackend(payload: {
  problemId: string;
  name: string;
  productUrl: string;
  addressExplanation: string;
  evidenceUrl?: string;
  supportingDocument?: File;
}) {
  const form = new FormData();
  form.append('problemId', payload.problemId);
  form.append('name', payload.name);
  form.append('productUrl', payload.productUrl);
  form.append('addressExplanation', payload.addressExplanation);
  if (payload.evidenceUrl) form.append('evidenceUrl', payload.evidenceUrl);
  if (payload.supportingDocument) form.append('supportingDocument', payload.supportingDocument);

  return requestBackend<{ solution?: SolutionItem }>('/api/solutions', {
    method: 'POST',
    body: form,
  });
}

export async function submitEvidenceToBackend(payload: {
  problemId: string;
  evidence: Omit<EvidenceItem, 'id' | 'submittedAt'>;
}) {
  return requestBackend<{ evidence?: EvidenceItem }>(
    `/api/problems/${encodeURIComponent(payload.problemId)}/evidence`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload.evidence),
    }
  );
}

export async function summarizeChatLinkOnBackend(payload: {
  threadId: string;
  messageId: string;
  url: string;
}) {
  return requestBackend<{
    pageTitle?: string;
    summary?: string;
    keyPoints?: string[];
  }>('/api/messages/summarize-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function buildDiscoverQueryString(filters: DiscoveryFilterState, q: string) {
  const params = new URLSearchParams();
  if (filters.region !== 'Global') params.set('region', filters.region);
  if (filters.country && filters.country !== 'All') params.set('country', filters.country);
  if (filters.industry !== 'All') params.set('industry', filters.industry);
  if (filters.problemCategory !== 'All') params.set('problemCategory', filters.problemCategory);
  if (filters.severity !== 'All') params.set('severity', filters.severity);
  if (filters.verificationStatus !== 'All') {
    params.set('verificationStatus', filters.verificationStatus);
  }
  if (filters.resourceType !== 'All') params.set('resourceType', filters.resourceType);
  if (q.trim()) params.set('q', q.trim());
  return params.toString();
}
