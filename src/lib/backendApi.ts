import { ALLOWED_COMMENT_REACTIONS } from '../data/gloweaveData';
import {
  CommentItem,
  CommentReactionEmoji,
  CommentReactionSummary,
  CommentReportReason,
  CommentStatus,
  CommentTargetType,
  CommunityFeedFilterState,
  CommunityFeedItem,
  DiscoveryFilterState,
  EvidenceItem,
  MatchItem,
  MatchUserFeedback,
  PlatformFootprintStats,
  RegionFilter,
  ResourceKind,
  ResourceSubmission,
  SolutionItem,
  UserSettingsPreferences,
  VerificationStatus,
} from '../types/gloweave';
import { supabase } from './supabase';

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
  statusCode?: number;
  message: string;
  data?: T;
}

export interface ApiContractSpec {
  id: string;
  capability: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  authRequired: boolean;
  requestSchema: string;
  responseSchema: string;
  notes: string;
}

/**
 * Modular API integration contracts documenting backend dependencies required
 * by Gloweave. Frontend components check `isBackendConfigured()` and display
 * honest `Awaiting Backend Integration` states when unconfigured — never faking
 * extraction, OCR, AI findings, multi-user comments, upvotes, or verification approvals.
 */
export const BACKEND_API_CONTRACTS: ApiContractSpec[] = [
  {
    id: 'submit-url',
    capability: 'Resource URL Submission & Batch Queue',
    method: 'POST',
    path: '/api/submissions/url',
    authRequired: true,
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
    authRequired: true,
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
    authRequired: true,
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
    authRequired: true,
    requestSchema: '{ ocrRequested?: boolean }',
    responseSchema: '{ extractionStatus: PdfExtractionStatus, ocrStatus: OcrStatus }',
    notes: 'Re-enqueues extraction or OCR worker when transient errors occur.',
  },
  {
    id: 'problem-ai-analysis',
    capability: 'AI-Powered Problem Discovery Breakdown & Evidence Traceability',
    method: 'GET',
    path: '/api/problems/:problemId/analysis',
    authRequired: false,
    requestSchema: 'Path param: problemId',
    responseSchema:
      '{ explicitProblems: string[], inferredProblems: string[], unmetNeeds: string[], affectedGroups: string[], geographicRelevance: string, impactLevel: ImpactSeverityLevel, severityLevel: ImpactSeverityLevel, existingSolutionsAndLimitations: string[], sourceTraceability?: { sourceUrl: string, publishedAt?: string, extractedPassage?: string, identificationReasoning?: string } }',
    notes: 'Returns clearly separated AI-derived analysis and source traceability; never conflated with human verification.',
  },
  {
    id: 'evidence-management',
    capability: 'Evidence Management & Source References',
    method: 'POST',
    path: '/api/problems/:problemId/evidence',
    authRequired: true,
    requestSchema:
      '{ sourceUrl?: string, documentFile?: File, sourceTitle: string, publishedAt?: string, extractedPassage?: string, identificationReasoning?: string, extractedReferences: string[], supportingEvidence: string, evidenceType: EvidenceType }',
    responseSchema: '{ evidence: EvidenceItem }',
    notes: 'Stores linked evidence with initial reviewStatus = "Awaiting Review".',
  },
  {
    id: 'human-verification',
    capability: 'Human Verification & Status Confirmation',
    method: 'POST',
    path: '/api/verifications',
    authRequired: true,
    requestSchema:
      '{ targetType: "problem" | "evidence" | "solution" | "match", targetId: string, decision: VerificationStatus, comment: string, humanConfirmationChecked: boolean }',
    responseSchema: '{ feedback: VerificationFeedback, updatedStatus: VerificationStatus }',
    notes:
      'Server enforces authorised human reviewer role. AI services are prohibited from invoking "Resolved" or "Verified" transitions.',
  },
  {
    id: 'list-matches',
    capability: 'Problem-Solution Matches & Structured AI Coverage Query',
    method: 'GET',
    path: '/api/matches',
    authRequired: false,
    requestSchema:
      'Query params: problemId?, kind?, verification?, region?, industry?, cursor?, limit? (max 50)',
    responseSchema:
      '{ matches: MatchItem[] (includes coveragePercent, coverageStatus, identifiedGaps, supportingEvidenceSummary, matchStartupUpvotes, startupUpvotedByMe), nextCursor: string | null, totalCount: number }',
    notes:
      'Replaces client-only match refresh. Returns upvotedByMe when Bearer token is provided. Coverage percentage never auto-resolves problems.',
  },
  {
    id: 'match-feedback',
    capability: 'Problem-Resource Matchmaking & User Feedback',
    method: 'POST',
    path: '/api/matches/:matchId/feedback',
    authRequired: true,
    requestSchema: '{ feedback: "helpful" | "needs-evidence" | "not-relevant", note?: string }',
    responseSchema: '{ matchId: string, reviewStatus: VerificationStatus }',
    notes: 'Captures human feedback on AI-suggested and verified matches.',
  },
  {
    id: 'match-startup-upvote',
    capability: 'Problem-Contextual Startup Endorsement (Per-Match Upvote)',
    method: 'POST',
    path: '/api/matches/:matchId/startup-upvote',
    authRequired: true,
    requestSchema: '{ action?: "upvote" | "remove" }',
    responseSchema:
      '{ matchId: string, problemId: string, startupId: string, matchStartupUpvotes: number, upvotedByMe: boolean, startupAggregateUpvotes: number }',
    notes:
      'Validates match, associated problem, and startup before recording a single contextual upvote per account per match. Never alters verification/resolution status.',
  },
  {
    id: 'solution-proposal',
    capability: 'Structured Solution Proposal & Assessment Workflow',
    method: 'POST',
    path: '/api/solutions',
    authRequired: true,
    requestSchema:
      '{ problemId: string, name: string, productUrl: string, addressExplanation: string, evidenceUrl?: string, supportingDocument?: File }',
    responseSchema:
      '{ solution: SolutionItem (aiAssessmentStatus: "Pending Batch Assessment", humanReviewStatus: "Awaiting Review", verified: false) }',
    notes: 'Proposed solutions remain structured entities distinct from comments and always begin unverified.',
  },
  {
    id: 'global-discover',
    capability: 'Multi-Axis Global Discovery Query',
    method: 'GET',
    path: '/api/discover',
    authRequired: false,
    requestSchema:
      'Query params: region, country, industry, problemCategory, severity, verificationStatus, resourceType, q',
    responseSchema: '{ problems: ProblemItem[], totalCount: number }',
    notes: 'Supports server-side filtering across all global discovery axes including niche/forum sources.',
  },
  {
    id: 'summarize-chat-link',
    capability: 'Direct Message Inner-Link Summarizer',
    method: 'POST',
    path: '/api/messages/summarize-link',
    authRequired: true,
    requestSchema: '{ threadId: string, messageId: string, url: string }',
    responseSchema: '{ pageTitle?: string, summary: string, keyPoints: string[] }',
    notes: 'Safely fetches and summarizes shared product/resource URLs inside user chats.',
  },
  {
    id: 'featured-startups',
    capability: 'Backend-Computed Featured Startups Ranking',
    method: 'GET',
    path: '/api/startups/featured',
    authRequired: false,
    requestSchema: 'Optional query params: region, sector, limit',
    responseSchema: '{ startups: StartupItem[] }',
    notes: 'Computed strictly server-side from usefulness score, verified evidence, and active adoption. Users cannot self-feature.',
  },
  {
    id: 'list-comments',
    capability: 'Fetch Threaded Community Comments & Sanitized Attribution',
    method: 'GET',
    path: '/api/comments',
    authRequired: false,
    requestSchema:
      'Query params: targetType ("problem"|"startup"|"solution"|"match"), targetId, sort? ("top"|"recent"), cursor?, limit? (max 50)',
    responseSchema: '{ comments: CommentItem[], nextCursor: string | null, totalCount: number }',
    notes:
      'Backend resolves sanitized author attribution (displayName, role, privacy-filtered country; never email) and returns upvotedByMe/reactedByMe if authenticated.',
  },
  {
    id: 'create-comment',
    capability: 'Post Community Comment or 1-Level Reply',
    method: 'POST',
    path: '/api/comments',
    authRequired: true,
    requestSchema:
      '{ targetType: CommentTargetType, targetId: string, parentId?: string | null, body: string (2..2000 chars) }',
    responseSchema: '{ comment: CommentItem }',
    notes: 'Validates target existence, enforces max nesting depth = 1, applies rate limiting, and attaches sanitized author.',
  },
  {
    id: 'delete-comment',
    capability: 'Delete Own Comment (or Moderator Removal)',
    method: 'DELETE',
    path: '/api/comments/:commentId',
    authRequired: true,
    requestSchema: 'Path param: commentId',
    responseSchema: '{ commentId: string, status: "deleted" }',
    notes: 'Author or moderator only. Soft-deletes when child replies exist.',
  },
  {
    id: 'upvote-comment',
    capability: 'Toggle Upvote on Community Comment',
    method: 'POST',
    path: '/api/comments/:commentId/upvote',
    authRequired: true,
    requestSchema: 'Path param: commentId; optional body {}',
    responseSchema: '{ commentId: string, upvotesCount: number, upvotedByMe: boolean }',
    notes: 'Enforces 1 upvote per account per comment. Strictly separate from startup and problem upvotes.',
  },
  {
    id: 'react-comment',
    capability: 'Toggle Approved Emoji Reaction on Community Comment',
    method: 'POST',
    path: '/api/comments/:commentId/reactions',
    authRequired: true,
    requestSchema: '{ emoji: "👍" | "💡" | "🔍" | "🤝" | "⚠️" | "🚀" }',
    responseSchema: '{ commentId: string, reactions: CommentReactionSummary[] }',
    notes: 'Enforces exact 6-emoji allowlist server-side and unique constraint per (comment_id, user_id, emoji).',
  },
  {
    id: 'report-comment',
    capability: 'Report Comment for Abuse / Misinformation Review',
    method: 'POST',
    path: '/api/comments/:commentId/report',
    authRequired: true,
    requestSchema:
      '{ reason: "spam" | "harassment" | "misinformation" | "off-topic" | "other", details?: string }',
    responseSchema: '{ reportId: string, status: "queued_for_review" }',
    notes: 'Unique per (comment_id, reporter_id) to prevent report flooding.',
  },
  {
    id: 'moderate-comment',
    capability: 'Moderator Action on Reported Comment',
    method: 'PATCH',
    path: '/api/moderation/comments/:commentId',
    authRequired: true,
    requestSchema: '{ status: "active" | "hidden_by_moderator", moderatorNote?: string }',
    responseSchema: '{ commentId: string, status: CommentStatus }',
    notes: 'Requires verified moderator/admin role on backend (HTTP 403 otherwise).',
  },
  {
    id: 'community-feed',
    capability: 'Scoped Community Activity & Discussions Feed',
    method: 'GET',
    path: '/api/community/feed',
    authRequired: false,
    requestSchema:
      'Query params: activityType? ("all"|"problem"|"startup"|"solution"|"discussion"|"verification"), industry?, region?, country?, cursor?, limit? (max 50)',
    responseSchema: '{ items: CommunityFeedItem[], nextCursor: string | null }',
    notes: 'Returns mission-aligned platform activity linked to real entities, with privacy-respecting actor attribution.',
  },
  {
    id: 'get-user-preferences',
    capability: 'Fetch Server-Enforced Notification & Privacy Preferences',
    method: 'GET',
    path: '/api/users/me/preferences',
    authRequired: true,
    requestSchema: 'Bearer JWT',
    responseSchema: '{ preferences: UserSettingsPreferences }',
    notes: 'Hydrates privacy settings enforced across comments, community feed attribution, and DM eligibility.',
  },
  {
    id: 'update-user-preferences',
    capability: 'Persist Server-Enforced Notification & Privacy Preferences',
    method: 'PATCH',
    path: '/api/users/me/preferences',
    authRequired: true,
    requestSchema: 'Partial<UserSettingsPreferences>',
    responseSchema: '{ preferences: UserSettingsPreferences }',
    notes: 'Updates profileVisibility, showCountry, allowDirectMessages, publicSubmissionAttribution, and notifications.',
  },
  {
    id: 'delete-user-account',
    capability: 'Permanent Account & Auth Record Deletion',
    method: 'DELETE',
    path: '/api/users/me',
    authRequired: true,
    requestSchema: 'Bearer JWT',
    responseSchema: '{ deleted: boolean }',
    notes: 'Deletes user records via Supabase Admin API / backend cascade as referenced in supabase.ts.',
  },
  {
    id: 'platform-footprint-stats',
    capability: 'Live Platform Footprint Counts',
    method: 'GET',
    path: '/api/stats/footprint',
    authRequired: false,
    requestSchema: 'None',
    responseSchema:
      '{ activeProblemsCount: number, verifiedSolutionsCount: number, indexedStartupsCount: number, verifiedResearchersCount: number }',
    notes: 'Replaces zeroed placeholder counters once backend is live.',
  },
];

async function getSupabaseAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function requestBackend<T>(
  path: string,
  init?: RequestInit,
  options?: { requireAuth?: boolean }
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

  const headers = new Headers(init?.headers);
  const accessToken = await getSupabaseAccessToken();

  if (options?.requireAuth && !accessToken) {
    return {
      ok: false,
      configured: true,
      awaitingBackend: false,
      endpoint: path,
      statusCode: 401,
      message: 'Authentication required. Please sign in with a verified Gloweave account.',
    };
  }

  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let parsedMessage = errorText;
      try {
        const parsed = JSON.parse(errorText) as { message?: string; error?: string };
        parsedMessage = parsed.message || parsed.error || errorText;
      } catch {
        // Use raw text fallback when backend error body is non-JSON
      }
      return {
        ok: false,
        configured: true,
        awaitingBackend: false,
        endpoint: path,
        statusCode: response.status,
        message: parsedMessage || `Backend returned HTTP ${response.status}`,
      };
    }

    const data = (await response.json().catch(() => undefined)) as T | undefined;
    return {
      ok: true,
      configured: true,
      awaitingBackend: false,
      endpoint: path,
      statusCode: response.status,
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
  return requestBackend<{ submissionId?: string }>(
    '/api/submissions/url',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    { requireAuth: true }
  );
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

  return requestBackend<Partial<ResourceSubmission>>(
    '/api/submissions/pdf',
    {
      method: 'POST',
      body: form,
    },
    { requireAuth: true }
  );
}

export async function fetchPdfExtractionFromBackend(submissionId: string) {
  return requestBackend<
    Pick<
      ResourceSubmission,
      'extractionStatus' | 'ocrStatus' | 'extractedPreviewText' | 'errorMessage'
    > & { pageCount?: number }
  >(
    `/api/submissions/${encodeURIComponent(submissionId)}/extraction`,
    { method: 'GET' },
    { requireAuth: true }
  );
}

export async function retryPdfExtractionOnBackend(
  submissionId: string,
  ocrRequested: boolean
) {
  return requestBackend<
    Pick<ResourceSubmission, 'extractionStatus' | 'ocrStatus' | 'errorMessage'>
  >(
    `/api/submissions/${encodeURIComponent(submissionId)}/retry`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ocrRequested }),
    },
    { requireAuth: true }
  );
}

export async function submitHumanVerificationToBackend(payload: {
  targetType: 'problem' | 'evidence' | 'solution' | 'match';
  targetId: string;
  decision: VerificationStatus;
  comment: string;
  reviewerName: string;
  humanConfirmationChecked: boolean;
}) {
  return requestBackend<{ updatedStatus?: VerificationStatus }>(
    '/api/verifications',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    { requireAuth: true }
  );
}

export async function fetchMatchesFromBackend(params?: {
  problemId?: string;
  kind?: MatchItem['kind'];
  verification?: MatchItem['verification'];
  region?: RegionFilter;
  industry?: string;
  cursor?: string;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.problemId) qs.set('problemId', params.problemId);
  if (params?.kind) qs.set('kind', params.kind);
  if (params?.verification) qs.set('verification', params.verification);
  if (params?.region && params.region !== 'Global') qs.set('region', params.region);
  if (params?.industry && params.industry !== 'All') qs.set('industry', params.industry);
  if (params?.cursor) qs.set('cursor', params.cursor);
  if (params?.limit) qs.set('limit', String(params.limit));
  const query = qs.toString();

  return requestBackend<{
    matches: MatchItem[];
    nextCursor: string | null;
    totalCount: number;
  }>(`/api/matches${query ? `?${query}` : ''}`, { method: 'GET' });
}

export async function toggleMatchStartupUpvoteOnBackend(
  matchId: string,
  action?: 'upvote' | 'remove'
) {
  return requestBackend<{
    matchId: string;
    problemId: string;
    startupId: string;
    matchStartupUpvotes: number;
    upvotedByMe: boolean;
    startupAggregateUpvotes: number;
  }>(
    `/api/matches/${encodeURIComponent(matchId)}/startup-upvote`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action ? { action } : {}),
    },
    { requireAuth: true }
  );
}

export async function submitMatchFeedbackToBackend(payload: {
  matchId: string;
  feedback: MatchUserFeedback;
  note?: string;
}) {
  return requestBackend<{ matchId: string }>(
    `/api/matches/${encodeURIComponent(payload.matchId)}/feedback`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: payload.feedback, note: payload.note }),
    },
    { requireAuth: true }
  );
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

  return requestBackend<{ solution?: SolutionItem }>(
    '/api/solutions',
    {
      method: 'POST',
      body: form,
    },
    { requireAuth: true }
  );
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
    },
    { requireAuth: true }
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
  }>(
    '/api/messages/summarize-link',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    { requireAuth: true }
  );
}

export async function fetchCommentsFromBackend(params: {
  targetType: CommentTargetType;
  targetId: string;
  sort?: 'top' | 'recent';
  cursor?: string;
  limit?: number;
}) {
  const qs = new URLSearchParams({
    targetType: params.targetType,
    targetId: params.targetId,
  });
  if (params.sort) qs.set('sort', params.sort);
  if (params.cursor) qs.set('cursor', params.cursor);
  if (params.limit) qs.set('limit', String(params.limit));

  return requestBackend<{
    comments: CommentItem[];
    nextCursor: string | null;
    totalCount: number;
  }>(`/api/comments?${qs.toString()}`, { method: 'GET' });
}

export async function postCommentToBackend(payload: {
  targetType: CommentTargetType;
  targetId: string;
  parentId?: string | null;
  body: string;
}) {
  const trimmed = payload.body.trim();
  if (trimmed.length < 2 || trimmed.length > 2000) {
    return {
      ok: false,
      configured: isBackendConfigured(),
      awaitingBackend: !isBackendConfigured(),
      endpoint: '/api/comments',
      statusCode: 400,
      message: 'Comment must be between 2 and 2,000 characters.',
    };
  }

  return requestBackend<{ comment: CommentItem }>(
    '/api/comments',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetType: payload.targetType,
        targetId: payload.targetId,
        parentId: payload.parentId ?? null,
        body: trimmed,
      }),
    },
    { requireAuth: true }
  );
}

export async function deleteCommentOnBackend(commentId: string) {
  return requestBackend<{ commentId: string; status: CommentStatus }>(
    `/api/comments/${encodeURIComponent(commentId)}`,
    { method: 'DELETE' },
    { requireAuth: true }
  );
}

export async function toggleCommentUpvoteOnBackend(commentId: string) {
  return requestBackend<{
    commentId: string;
    upvotesCount: number;
    upvotedByMe: boolean;
  }>(
    `/api/comments/${encodeURIComponent(commentId)}/upvote`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    },
    { requireAuth: true }
  );
}

export async function toggleCommentReactionOnBackend(
  commentId: string,
  emoji: CommentReactionEmoji
) {
  if (!ALLOWED_COMMENT_REACTIONS.includes(emoji)) {
    return {
      ok: false,
      configured: isBackendConfigured(),
      awaitingBackend: !isBackendConfigured(),
      endpoint: `/api/comments/${encodeURIComponent(commentId)}/reactions`,
      statusCode: 400,
      message: `Unsupported reaction emoji. Allowed set: ${ALLOWED_COMMENT_REACTIONS.join(' ')}`,
    };
  }

  return requestBackend<{
    commentId: string;
    reactions: CommentReactionSummary[];
  }>(
    `/api/comments/${encodeURIComponent(commentId)}/reactions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji }),
    },
    { requireAuth: true }
  );
}

export async function reportCommentOnBackend(payload: {
  commentId: string;
  reason: CommentReportReason;
  details?: string;
}) {
  return requestBackend<{ reportId: string; status: 'queued_for_review' }>(
    `/api/comments/${encodeURIComponent(payload.commentId)}/report`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: payload.reason,
        details: payload.details?.trim() || undefined,
      }),
    },
    { requireAuth: true }
  );
}

export async function moderateCommentOnBackend(payload: {
  commentId: string;
  status: Extract<CommentStatus, 'active' | 'hidden_by_moderator'>;
  moderatorNote?: string;
}) {
  return requestBackend<{ commentId: string; status: CommentStatus }>(
    `/api/moderation/comments/${encodeURIComponent(payload.commentId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: payload.status,
        moderatorNote: payload.moderatorNote?.trim() || undefined,
      }),
    },
    { requireAuth: true }
  );
}

export async function fetchCommunityFeedFromBackend(
  filters?: Partial<CommunityFeedFilterState> & { cursor?: string; limit?: number }
) {
  const qs = new URLSearchParams();
  if (filters?.activityType && filters.activityType !== 'all') {
    qs.set('activityType', filters.activityType);
  }
  if (filters?.industry && filters.industry !== 'All') qs.set('industry', filters.industry);
  if (filters?.region && filters.region !== 'Global') qs.set('region', filters.region);
  if (filters?.country && filters.country !== 'All') qs.set('country', filters.country);
  if (filters?.cursor) qs.set('cursor', filters.cursor);
  if (filters?.limit) qs.set('limit', String(filters.limit));
  const query = qs.toString();

  return requestBackend<{
    items: CommunityFeedItem[];
    nextCursor: string | null;
  }>(`/api/community/feed${query ? `?${query}` : ''}`, { method: 'GET' });
}

export async function fetchUserPreferencesFromBackend() {
  return requestBackend<{ preferences: UserSettingsPreferences }>(
    '/api/users/me/preferences',
    { method: 'GET' },
    { requireAuth: true }
  );
}

export async function updateUserPreferencesOnBackend(
  preferences: Partial<UserSettingsPreferences>
) {
  return requestBackend<{ preferences: UserSettingsPreferences }>(
    '/api/users/me/preferences',
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences),
    },
    { requireAuth: true }
  );
}

export async function deleteCurrentUserAccountOnBackend() {
  return requestBackend<{ deleted: boolean }>(
    '/api/users/me',
    { method: 'DELETE' },
    { requireAuth: true }
  );
}

export async function fetchPlatformFootprintStatsFromBackend() {
  return requestBackend<PlatformFootprintStats>('/api/stats/footprint', { method: 'GET' });
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
