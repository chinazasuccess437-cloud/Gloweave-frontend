export type NavView =
  | 'home'
  | 'discover'
  | 'matches'
  | 'problems'
  | 'problem-detail'
  | 'solutions'
  | 'startups'
  | 'rankings'
  | 'distribution'
  | 'analytics'
  | 'community'
  | 'messages'
  | 'notifications'
  | 'profile'
  | 'settings'
  | 'legal'
  | 'support';

export type LegalDocumentId = 'privacy' | 'terms' | 'guidelines' | 'data-ai';

export type SupportTabId = 'help-center' | 'faq' | 'contact' | 'report' | 'about';

export type SettingsTabId =
  | 'account'
  | 'profile'
  | 'email'
  | 'password'
  | 'notifications'
  | 'privacy'
  | 'language'
  | 'saved'
  | 'support'
  | 'legal';

export interface UserSettingsPreferences {
  notifications: {
    batchUpdates: boolean;
    solutionVerification: boolean;
    matchAlerts: boolean;
    weeklyDigest: boolean;
  };
  privacy: {
    profileVisibility: 'community' | 'private';
    showCountry: boolean;
    allowDirectMessages: boolean;
    publicSubmissionAttribution: boolean;
  };
  language: string;
}

export type RegionFilter =
  | 'Global'
  | 'Africa'
  | 'Antarctica'
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'Oceania'
  | 'South America';

export type SolutionStatus =
  | 'Submitted'
  | 'Under review'
  | 'Partially solved'
  | 'Fully solved'
  | 'Verification required';

export type ProblemSolutionStatus =
  | 'Awaiting Solution'
  | 'Under Review'
  | 'Partially Solved'
  | 'Verification Required'
  | 'Solved';

export type VerificationStatus =
  | 'AI Identified'
  | 'Awaiting Review'
  | 'Verified'
  | 'Rejected'
  | 'More Evidence Required'
  | 'Resolved';

export type ImpactSeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type ResourceKind =
  | 'Website URL'
  | 'PDF Document'
  | 'Research Paper / Report'
  | 'Technical Documentation'
  | 'Product / Service Website'
  | 'Startup'
  | 'Product'
  | 'Research'
  | 'Website'
  | 'Other Resource';

export type BatchProcessingStatus =
  | 'Queued for Batch'
  | 'Scheduled (Next Window)'
  | 'Under AI Analysis'
  | 'Awaiting Backend Service'
  | 'Failed';

export type PdfExtractionStatus =
  | 'Not Applicable'
  | 'Awaiting Backend Service'
  | 'Queued for Extraction'
  | 'Extracting Text'
  | 'OCR Processing'
  | 'Extracted'
  | 'Extraction Failed';

export type OcrStatus =
  | 'Not Required'
  | 'Pending Detection'
  | 'Awaiting Backend Service'
  | 'OCR Queued'
  | 'OCR Processing'
  | 'OCR Complete'
  | 'OCR Failed';

export interface PdfDocumentMetadata {
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  pageCount?: number;
  previewObjectUrl?: string;
  ocrRequested: boolean;
}

export interface ResourceSubmission {
  id: string;
  submissionFormat: 'url' | 'pdf';
  url?: string;
  kind: ResourceKind;
  optionalContext?: string;
  country?: string;
  region?: Exclude<RegionFilter, 'Global'>;
  submittedAt: string;
  batchWindow: string;
  etaLabel: string;
  progressPercent: number;
  uploadProgress: number;
  status: BatchProcessingStatus;
  pdfMeta?: PdfDocumentMetadata;
  extractionStatus?: PdfExtractionStatus;
  ocrStatus?: OcrStatus;
  extractedPreviewText?: string | null;
  errorMessage?: string;
  backendSyncState: 'awaiting-backend' | 'synced' | 'error';
}

export interface AssessmentEvent {
  id: string;
  date: string;
  actor: 'Gloweave AI Batch' | 'Verification Panel' | 'Community Evidence' | 'Human Reviewer';
  status: string;
  note: string;
}

export interface AiProblemAnalysis {
  explicitProblems: string[];
  inferredProblems: string[];
  unmetNeeds: string[];
  affectedGroups: string[];
  geographicRelevance: string;
  impactLevel: ImpactSeverityLevel;
  severityLevel: ImpactSeverityLevel;
  existingSolutionsAndLimitations: string[];
  aiGeneratedNote: string;
}

export type EvidenceType =
  | 'Primary Report'
  | 'Product Deployment'
  | 'Peer-Reviewed Research'
  | 'Technical Documentation'
  | 'PDF Upload'
  | 'Community Field Evidence';

export interface EvidenceItem {
  id: string;
  relatedProblemId: string;
  sourceUrl?: string;
  documentName?: string;
  sourceTitle: string;
  extractedReferences: string[];
  supportingEvidence: string;
  evidenceType: EvidenceType;
  reviewStatus: VerificationStatus;
  isIndependentlyVerified: boolean;
  reviewerNotes?: string;
  submittedAt: string;
}

export interface VerificationFeedback {
  id: string;
  targetType: 'problem' | 'evidence' | 'solution' | 'match';
  targetId: string;
  reviewerName: string;
  decision: VerificationStatus;
  comment: string;
  createdAt: string;
  backendSyncState: 'awaiting-backend' | 'synced';
}

export interface ProblemItem {
  id: string;
  rank: number;
  title: string;
  summary: string;
  context: string;
  category: string;
  industry: string;
  region: Exclude<RegionFilter, 'Global'>;
  country: string;
  referenceUrl?: string;
  sourceEvidence: {
    label: string;
    url: string;
    sourceType: 'Research' | 'Startup' | 'Product' | 'Website' | 'Report' | 'PDF';
    discoveredAt: string;
  };
  views: string;
  viewsNum: number;
  status: 'High Priority' | 'Growing' | 'Trending';
  solutionStatus: ProblemSolutionStatus;
  verificationStatus?: VerificationStatus;
  severity?: ImpactSeverityLevel;
  impact?: ImpactSeverityLevel;
  resourceTypes?: ResourceKind[];
  aiAnalysis?: AiProblemAnalysis;
  evidences?: EvidenceItem[];
  verificationHistory?: VerificationFeedback[];
  theme: 'energy' | 'healthcare' | 'agriculture' | 'water' | 'education';
  upvotes: number;
  solutionsCount: number;
  potentialMatchesCount: number;
  assessmentHistory: AssessmentEvent[];
  upvoted?: boolean;
  bookmarked?: boolean;
  submittedByMe?: boolean;
}

export interface SolutionItem {
  id: string;
  problemId?: string;
  name: string;
  tagline: string;
  description: string;
  addressExplanation?: string;
  category: string;
  tags: string[];
  rating: number;
  reviewsCount: string;
  verified: boolean;
  status: SolutionStatus;
  aiAssessmentStatus?:
    | 'Pending Batch Assessment'
    | 'AI Assessed (Unverified)'
    | 'Insufficient Evidence';
  humanReviewStatus?: VerificationStatus;
  humanReviewerNotes?: string;
  evidenceUrl: string;
  evidenceSummary: string;
  supportingDocumentName?: string;
  supportingDocumentSizeBytes?: number;
  submittedAt: string;
  featured?: boolean;
  websiteUrl: string;
  region: Exclude<RegionFilter, 'Global'>;
  country: string;
  theme: 'solar' | 'health' | 'agri' | 'water' | 'fintech';
  bookmarked?: boolean;
  submittedByMe?: boolean;
}

export type MatchKind = 'startup' | 'product' | 'collaborator' | 'proposed-solution';
export type MatchVerification = 'ai-suggested' | 'verified';
export type MatchUserFeedback = 'helpful' | 'needs-evidence' | 'not-relevant';

export interface MatchItem {
  id: string;
  problemId: string;
  kind: MatchKind;
  verification: MatchVerification;
  candidateName: string;
  candidateSubtitle: string;
  industry: string;
  region: Exclude<RegionFilter, 'Global'>;
  country: string;
  rationale: string;
  sourceUrl?: string;
  supportingEvidenceUrls?: string[];
  contributorId?: string;
  fitLabel: string;
  statusNote: string;
  reviewStatus?: VerificationStatus;
  userFeedback?: MatchUserFeedback | null;
  userFeedbackNote?: string;
  bookmarked?: boolean;
}

export interface DiscoveryFilterState {
  region: RegionFilter;
  country: string;
  industry: string;
  problemCategory: string;
  severity: 'All' | ImpactSeverityLevel;
  verificationStatus: 'All' | VerificationStatus;
  resourceType: 'All' | ResourceKind;
}

export interface StartupItem {
  id: string;
  name: string;
  websiteUrl: string;
  sector: string;
  stage: 'Seed' | 'Series A' | 'Series B' | 'Bootstrapped';
  region: Exclude<RegionFilter, 'Global'>;
  country: string;
  description: string;
  submittedAt: string;
  submittedByMe?: boolean;
  featuredByBackend?: boolean;
  usefulnessScore?: number;
  featuredReason?: string;
}

export interface ContributorItem {
  id: string;
  rank: number;
  name: string;
  initials: string;
  role: string;
  category: string;
  region: Exclude<RegionFilter, 'Global'>;
  country: string;
  kind: 'solver' | 'innovator';
  problemsSolved: number;
  score: number;
  trend: string;
  accentFrom: string;
  accentTo: string;
  connected?: boolean;
}

export interface RegionInsight {
  id: string;
  name: string;
  flag: string;
  percentage: number;
  activeNodes: number;
  topSector: string;
  startupsCount: string;
  regionGroup: Exclude<RegionFilter, 'Global'>;
}

export interface ChatLinkSummary {
  status: 'idle' | 'loading' | 'ready' | 'awaiting-backend' | 'error';
  pageTitle?: string;
  summary?: string;
  keyPoints?: string[];
  errorMessage?: string;
}

export interface ChatAttachment {
  id: string;
  type: 'image' | 'pdf' | 'link';
  url?: string;
  title?: string;
  fileSizeBytes?: number;
  linkSummary?: ChatLinkSummary;
}

export interface ChatMessageItem {
  id: string;
  fromSelf: boolean;
  text: string;
  time: string;
  attachments?: ChatAttachment[];
}

export interface MessageThread {
  id: string;
  senderName: string;
  senderInitials: string;
  senderRole: string;
  unread: boolean;
  timestamp: string;
  accentFrom: string;
  accentTo: string;
  messages: ChatMessageItem[];
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'solution' | 'ranking' | 'message' | 'system';
  targetView?: NavView;
  read: boolean;
}

export type OnboardingPhase =
  | 'welcome'
  | 'questions'
  | 'completion'
  | 'email'
  | 'verify'
  | 'password'
  | 'signin';

export interface OnboardingAnswers {
  role: string;
  otherRole: string;
  interests: string[];
  country: string;
  goal: string;
  contribution: string;
  displayName: string;
}

export interface OnboardingDraft {
  phase: OnboardingPhase;
  step: number; // 0..5 for the 6 onboarding questions
  email: string;
  verificationEmailSent: boolean;
  answers: OnboardingAnswers;
  updatedAt: string;
}
