import { LegalDocumentId, UserSettingsPreferences } from '../types/gloweave';

export interface LegalSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface LegalDocument {
  id: LegalDocumentId;
  title: string;
  shortTitle: string;
  statusBadge: string;
  lastUpdated: string;
  version: string;
  summary: string;
  sections: LegalSection[];
}

export const LEGAL_DOCUMENTS: Record<LegalDocumentId, LegalDocument> = {
  privacy: {
    id: 'privacy',
    title: 'Privacy Policy',
    shortTitle: 'Privacy Policy',
    statusBadge: 'Draft — Pending Legal Review',
    lastUpdated: 'November 15, 2026',
    version: 'Draft v0.1',
    summary:
      'Explains what account, onboarding, and submission information Gloweave collects in its current web application and how that information is stored.',
    sections: [
      {
        heading: '1. Draft Notice & Scope',
        paragraphs: [
          'This Privacy Policy is a preliminary draft prepared for product transparency while formal legal review is pending. It describes current data handling practices in the Gloweave web application and does not constitute a formal compliance certification or legal guarantee.',
        ],
      },
      {
        heading: '2. Information You Provide',
        paragraphs: [
          'When you complete Gloweave onboarding, create an account, or submit links, we may collect:',
        ],
        bullets: [
          'Onboarding preferences: your self-selected role, industries of interest, country, primary goal, contribution style, and preferred display name.',
          'Account details: email address and encrypted authentication credentials managed via our configured authentication provider (Supabase Auth, when active).',
          'Profile details: optional profile photo and bio/role edits you choose to save.',
          'Submissions: resource URLs (startups, products, research, websites), optional context notes, and solution evidence links you submit.',
        ],
      },
      {
        heading: '3. Local Browser Storage vs. Backend Persistence',
        paragraphs: [
          'Before registration completes, non-sensitive onboarding progress is stored in your browser localStorage so you do not lose your step. Passwords are never saved to localStorage.',
          'Certain interface preferences (such as notification toggles, privacy display toggles, and language selection) are currently stored locally in your browser while server-side preference synchronization is awaiting backend integration.',
        ],
      },
      {
        heading: '4. How Information Is Used',
        paragraphs: ['Information collected is used solely to operate and improve Gloweave workflows:'],
        bullets: [
          'Authenticating your session and verifying your email address.',
          'Personalising problem discovery, matchmaking, and regional relevance.',
          'Queuing submitted resource URLs and evidence links for scheduled batch review.',
        ],
      },
      {
        heading: '5. Account Access, Updates & Deletion',
        paragraphs: [
          'You can edit your display name, role, country, and profile picture from Account Settings. Email and password updates require an active authenticated session.',
          'Permanent server-side deletion of backend authentication records is currently awaiting a dedicated backend deletion endpoint. You can sign out and clear local session data at any time from Settings.',
        ],
      },
    ],
  },
  terms: {
    id: 'terms',
    title: 'Terms and Conditions',
    shortTitle: 'Terms & Conditions',
    statusBadge: 'Draft — Pending Legal Review',
    lastUpdated: 'November 15, 2026',
    version: 'Draft v0.1',
    summary:
      'Outlines draft rules for accessing Gloweave, submitting resource links and evidence, and understanding platform limitations.',
    sections: [
      {
        heading: '1. Draft Agreement Status',
        paragraphs: [
          'These Terms and Conditions are provided as a working draft pending formal legal review. By creating an account or using Gloweave, you acknowledge that platform features, batch processing schedules, and governance terms may evolve as Gloweave matures.',
        ],
      },
      {
        heading: '2. Platform Purpose & Eligibility',
        paragraphs: [
          'Gloweave is an AI-assisted global problem discovery, batch analysis, and solution-matching platform. You are responsible for maintaining the confidentiality of your account credentials and for all activity performed under your account.',
        ],
      },
      {
        heading: '3. Submitted Links & Evidence Accuracy',
        paragraphs: [
          'When submitting links to startups, products, research papers, websites, or solution evidence:',
        ],
        bullets: [
          'Only submit publicly accessible URLs or resources you have the right to share.',
          'Do not submit deceptive, malicious, or fabricated evidence claims.',
          'All newly submitted solution evidence enters as "Submitted" and remains subject to review before any verified status is assigned.',
        ],
      },
      {
        heading: '4. Batch Turnaround & Availability',
        paragraphs: [
          'Gloweave targets a 24–48-hour turnaround window for scheduled batch analysis of submitted resource links. Because analysis depends on queued batch pipelines and human/AI assessment, no guaranteed turnaround SLA or uptime warranty is offered in this draft.',
        ],
      },
      {
        heading: '5. Intellectual Property & Third-Party Links',
        paragraphs: [
          'External websites, research papers, startups, and product links remain the property of their respective owners. Gloweave does not claim ownership over third-party resources linked by community members.',
        ],
      },
    ],
  },
  guidelines: {
    id: 'guidelines',
    title: 'Community Guidelines',
    shortTitle: 'Community Guidelines',
    statusBadge: 'Draft — Pending Legal Review',
    lastUpdated: 'November 15, 2026',
    version: 'Draft v0.1',
    summary:
      'Standards for constructive collaboration, honest evidence reporting, and respectful engagement across the Gloweave community.',
    sections: [
      {
        heading: '1. Constructive, Evidence-First Collaboration',
        paragraphs: [
          'Gloweave connects founders, researchers, developers, and problem solvers to address real-world challenges. Keep discussions focused on verifiable context, practical feasibility, and respectful feedback.',
        ],
      },
      {
        heading: '2. Honest Representation of Solutions',
        paragraphs: ['To preserve trust in global matchmaking and verification:'],
        bullets: [
          'Distinguish clearly between early prototypes, pilot deployments, and broadly validated solutions.',
          'Do not misrepresent AI-suggested matches as verified deployments.',
          'Submit supporting documentation, telemetry summaries, or public reports when proposing solution evidence.',
        ],
      },
      {
        heading: '3. Prohibited Conduct',
        paragraphs: ['The following behaviours are not permitted on Gloweave:'],
        bullets: [
          'Spamming unrelated promotional links, affiliate traps, or repetitive URLs.',
          'Harassment, discrimination, or personal attacks against contributors or communities.',
          'Attempting to manipulate upvotes, verification statuses, or automated batch queues.',
          'Sharing private personal data of others without permission.',
        ],
      },
      {
        heading: '4. Reporting Issues',
        paragraphs: [
          'If you encounter broken links, misleading claims, or abusive behaviour, use the Report a Problem tool in Help & Support so it can be logged for moderation review once backend moderation queues are connected.',
        ],
      },
    ],
  },
  'data-ai': {
    id: 'data-ai',
    title: 'Data and AI Policy',
    shortTitle: 'Data & AI Policy',
    statusBadge: 'Draft — Pending Legal Review',
    lastUpdated: 'November 15, 2026',
    version: 'Draft v0.1',
    summary:
      'Describes how Gloweave separates AI-suggested discoveries and matches from evidence-verified outcomes, and how submitted URLs are processed.',
    sections: [
      {
        heading: '1. How Scheduled Batch AI Analysis Works',
        paragraphs: [
          'Gloweave processes submitted startup, product, research, and website URLs in scheduled batches targeting a 24–48-hour feedback window rather than fabricating instant synthetic responses in the browser.',
          'Until backend AI batch pipelines are fully connected to your environment, submitted URLs are queued transparently without inventing fake problem extractions or artificial match scores.',
        ],
      },
      {
        heading: '2. AI-Suggested vs. Verified Matches',
        paragraphs: [
          'Gloweave explicitly separates automated AI suggestions from human- or evidence-verified outcomes:',
        ],
        bullets: [
          'AI-Suggested Match: An automated candidate match between a discovered problem and a startup, product, or collaborator. It is an exploratory lead, not an endorsement.',
          'Verified Match / Verified Solution: Assigned only after supporting real-world evidence links are submitted and reviewed across Gloweave’s assessment states (Submitted → Under review → Verification required / Partially solved / Fully solved).',
        ],
      },
      {
        heading: '3. Limitations of Automated Analysis',
        paragraphs: [
          'AI summaries and capability matching can miss regional nuance, misinterpret technical constraints, or become outdated as external websites change. Users should inspect primary Source Evidence URLs independently before making operational, medical, financial, or engineering decisions.',
        ],
      },
      {
        heading: '4. Training & Data Handling Notice (Draft)',
        paragraphs: [
          'This draft policy does not establish formal regulatory certifications. Submitted public URLs and optional context notes are used to index problems and candidate matches inside Gloweave. Do not include confidential trade secrets, personal health information, or sensitive credentials in optional submission context fields.',
        ],
      },
    ],
  },
};

export const LEGAL_DOCUMENT_LIST: LegalDocument[] = [
  LEGAL_DOCUMENTS.privacy,
  LEGAL_DOCUMENTS.terms,
  LEGAL_DOCUMENTS.guidelines,
  LEGAL_DOCUMENTS['data-ai'],
];

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'Why does submitting a link queue for 24–48 hours instead of showing instant AI results?',
    answer:
      'Gloweave processes submitted startups, products, research papers, and websites in scheduled batches to extract problems, evaluate source evidence, and match potential solutions carefully rather than fabricating instant answers.',
  },
  {
    id: 'faq-2',
    question: 'What is the difference between an AI-Suggested Match and a Verified Match?',
    answer:
      'AI-Suggested Matches are candidate connections surfaced automatically during batch analysis. Verified Matches are backed by submitted deployment evidence links and verification assessment.',
  },
  {
    id: 'faq-3',
    question: 'What do the five solution statuses mean?',
    answer:
      'Solutions move across five transparent states: Submitted (newly queued evidence), Under review (currently being evaluated), Verification required (needs independent corroboration), Partially solved (validated in limited scope), and Fully solved (broadly verified).',
  },
  {
    id: 'faq-4',
    question: 'Why are some Settings preferences marked "Awaiting Backend Integration"?',
    answer:
      'Account authentication, email verification, password updates, and profile persistence work directly with Supabase Auth & PostgreSQL when configured. Features like support ticketing, automated push notifications, localisation packs, and permanent server-side account deletion are clearly labeled while their backend endpoints are being connected.',
  },
  {
    id: 'faq-5',
    question: 'Can I read Gloweave’s legal policies before creating an account?',
    answer:
      'Yes. Links to the draft Privacy Policy, Terms and Conditions, Community Guidelines, and Data and AI Policy are accessible directly throughout welcome, onboarding, and registration screens.',
  },
];

export const HELP_CENTER_GUIDES = [
  {
    title: 'Submitting a Resource Link',
    description:
      'Use Submit (+) or the home quick-submit card to share a Startup, Product, Research, or Website URL with optional context. Links enter the scheduled batch queue.',
  },
  {
    title: 'Reviewing Matches & Unmatched Problems',
    description:
      'Open Matches to inspect AI-suggested candidates, verified deployments, potential collaborators, and problems that still have no suitable solution identified.',
  },
  {
    title: 'Submitting Solution Evidence',
    description:
      'Open any discovered problem or Solutions to attach an evidence URL showing real-world impact. New evidence always enters as Submitted for assessment.',
  },
  {
    title: 'Managing Security & Preferences',
    description:
      'Visit Settings to edit your profile, request an email or password update (when authenticated), review saved items, or manage local privacy and notification toggles.',
  },
];

export const ABOUT_GLOWEAVE = {
  tagline: 'Discover • Connect • Innovate',
  summary:
    'Gloweave is an AI-powered global problem discovery, batch analysis, and solution-matching platform connecting real-world challenges with startups, products, research, and collaborators across every region.',
  version: 'Gloweave v1.2.4',
  workflowSteps: [
    'Submit links to startups, products, research, or websites with optional context.',
    'Gloweave queues submissions into scheduled batches targeting a 24–48-hour turnaround.',
    'AI identifies real-world problems and suggests candidate matches while keeping unverified leads distinct.',
    'Community members submit evidence links to assess and verify real-world resolution progress.',
  ],
};

const PREFS_STORAGE_KEY = 'gloweave_user_preferences_v1';

export const DEFAULT_USER_PREFERENCES: UserSettingsPreferences = {
  notifications: {
    batchUpdates: true,
    solutionVerification: true,
    matchAlerts: true,
    weeklyDigest: true,
  },
  privacy: {
    profileVisibility: 'community',
    showCountry: true,
    allowDirectMessages: true,
    publicSubmissionAttribution: true,
  },
  language: 'English (Default)',
};

export function loadUserPreferences(): UserSettingsPreferences {
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_USER_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<UserSettingsPreferences>;
    return {
      notifications: {
        ...DEFAULT_USER_PREFERENCES.notifications,
        ...(parsed.notifications || {}),
      },
      privacy: {
        ...DEFAULT_USER_PREFERENCES.privacy,
        ...(parsed.privacy || {}),
      },
      language: parsed.language || DEFAULT_USER_PREFERENCES.language,
    };
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
}

export function saveUserPreferences(prefs: UserSettingsPreferences): void {
  try {
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage quota errors
  }
}
