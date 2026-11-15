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

export type ResourceKind =
  | 'Startup'
  | 'Product'
  | 'Research'
  | 'Website'
  | 'Other Resource';

export type BatchProcessingStatus =
  | 'Queued for Batch'
  | 'Scheduled (Next Window)'
  | 'Under AI Analysis';

export interface ResourceSubmission {
  id: string;
  url: string;
  kind: ResourceKind;
  optionalContext?: string;
  country?: string;
  region?: Exclude<RegionFilter, 'Global'>;
  submittedAt: string;
  batchWindow: string;
  etaLabel: string;
  progressPercent: number;
  status: BatchProcessingStatus;
}

export interface AssessmentEvent {
  id: string;
  date: string;
  actor: 'Gloweave AI Batch' | 'Verification Panel' | 'Community Evidence';
  status: string;
  note: string;
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
    sourceType: 'Research' | 'Startup' | 'Product' | 'Website' | 'Report';
    discoveredAt: string;
  };
  views: string;
  viewsNum: number;
  status: 'High Priority' | 'Growing' | 'Trending';
  solutionStatus: ProblemSolutionStatus;
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
  category: string;
  tags: string[];
  usersCount: string;
  usersNum: number;
  rating: number;
  reviewsCount: string;
  verified: boolean;
  status: SolutionStatus;
  evidenceUrl: string;
  evidenceSummary: string;
  submittedAt: string;
  featured?: boolean;
  websiteUrl: string;
  region: Exclude<RegionFilter, 'Global'>;
  country: string;
  theme: 'solar' | 'health' | 'agri' | 'water' | 'fintech';
  bookmarked?: boolean;
  submittedByMe?: boolean;
}

export type MatchKind = 'startup' | 'product' | 'collaborator';
export type MatchVerification = 'ai-suggested' | 'verified';

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
  contributorId?: string;
  fitLabel: string;
  statusNote: string;
  bookmarked?: boolean;
}

export interface StartupItem {
  id: string;
  name: string;
  websiteUrl: string;
  sector: string;
  stage: 'Seed' | 'Series A' | 'Series B' | 'Bootstrapped';
  region: Exclude<RegionFilter, 'Global'>;
  country: string;
  users: string;
  usersNum: number;
  description: string;
  submittedAt: string;
  submittedByMe?: boolean;
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

export interface MessageThread {
  id: string;
  senderName: string;
  senderInitials: string;
  senderRole: string;
  unread: boolean;
  timestamp: string;
  accentFrom: string;
  accentTo: string;
  messages: {
    id: string;
    fromSelf: boolean;
    text: string;
    time: string;
  }[];
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
