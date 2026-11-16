/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { HomeDashboard } from './components/HomeDashboard';
import {
  AuthRequiredModal,
  DeleteAccountConfirmModal,
  SignOutConfirmModal,
  SolutionDetailModal,
  SubmitKind,
  SubmitResourceModal,
  UpgradeProModal,
} from './components/Modals';
import {
  DesktopHeader,
  DesktopSidebar,
  MobileBottomNav,
  MobileDrawer,
  MobileHeader,
} from './components/Navigation';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { SecondaryViews } from './components/SecondaryViews';
import {
  INITIAL_CONTRIBUTORS,
  INITIAL_MATCHES,
  INITIAL_MESSAGES,
  INITIAL_NOTIFICATIONS,
  INITIAL_PROBLEMS,
  INITIAL_SOLUTIONS,
  INITIAL_STARTUPS,
  INITIAL_SUBMISSIONS,
  REGION_INSIGHTS,
} from './data/gloweaveData';
import {
  DEFAULT_USER_PREFERENCES,
  loadUserPreferences,
  saveUserPreferences,
} from './data/legalDocuments';
import {
  clearOnboardingDraft,
  createInitialDraft,
  loadOnboardingDraft,
  saveOnboardingDraft,
} from './data/onboardingOptions';
import {
  fetchUserProfile,
  PersistedUserProfile,
  requestAccountDeletion,
  supabase,
} from './lib/supabase';
import {
  fetchPdfExtractionFromBackend,
  retryPdfExtractionOnBackend,
  submitEvidenceToBackend,
  submitHumanVerificationToBackend,
  submitMatchFeedbackToBackend,
  submitResourceUrlToBackend,
  submitSolutionProposalToBackend,
  summarizeChatLinkOnBackend,
  uploadPdfToBackend,
} from './lib/backendApi';
import {
  ChatAttachment,
  ContributorItem,
  EvidenceItem,
  EvidenceType,
  LegalDocumentId,
  MatchItem,
  MatchUserFeedback,
  MessageThread,
  NavView,
  NotificationItem,
  OnboardingDraft,
  ProblemItem,
  RegionFilter,
  ResourceKind,
  ResourceSubmission,
  SettingsTabId,
  SolutionItem,
  StartupItem,
  SupportTabId,
  UserSettingsPreferences,
  VerificationStatus,
} from './types/gloweave';

export default function App() {
  const [activeView, setActiveView] = useState<NavView>('home');
  const [previousView, setPreviousView] = useState<NavView>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('Global');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [problems, setProblems] = useState<ProblemItem[]>(INITIAL_PROBLEMS);
  const [solutions, setSolutions] = useState<SolutionItem[]>(INITIAL_SOLUTIONS);
  const [matches, setMatches] = useState<MatchItem[]>(INITIAL_MATCHES);
  const [submissions, setSubmissions] = useState<ResourceSubmission[]>(INITIAL_SUBMISSIONS);
  const [startups] = useState<StartupItem[]>(INITIAL_STARTUPS);
  const [contributors, setContributors] = useState<ContributorItem[]>(INITIAL_CONTRIBUTORS);
  const [messages, setMessages] = useState<MessageThread[]>(INITIAL_MESSAGES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [isPro, setIsPro] = useState(false);

  const [profileName, setProfileName] = useState('');
  const [profileRole, setProfileRole] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserSettingsPreferences>(() =>
    loadUserPreferences()
  );
  const [emailDigest, setEmailDigest] = useState<boolean>(
    () => loadUserPreferences().notifications.weeklyDigest
  );
  const [settingsTab, setSettingsTab] = useState<SettingsTabId>('account');
  const [legalDocId, setLegalDocId] = useState<LegalDocumentId>('privacy');
  const [supportTab, setSupportTab] = useState<SupportTabId>('help-center');

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitKind, setSubmitKind] = useState<SubmitKind>('resource');
  const [submitProblemId, setSubmitProblemId] = useState<string>('');
  const [prefillSubmitUrl, setPrefillSubmitUrl] = useState('');

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [accountActionBusy, setAccountActionBusy] = useState(false);

  const [activeProblemId, setActiveProblemId] = useState<string | null>(null);
  const [selectedSolution, setSelectedSolution] = useState<SolutionItem | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [draft, setDraft] = useState<OnboardingDraft>(() => loadOnboardingDraft());
  const [authenticatedUser, setAuthenticatedUser] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [guestPreviewMode, setGuestPreviewMode] = useState(true);
  const [authModalAction, setAuthModalAction] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const requireAuth = (actionLabel: string): boolean => {
    if (authenticatedUser) return true;
    setAuthModalAction(actionLabel);
    return false;
  };

  const openAuthFlow = (targetPhase: 'welcome' | 'questions' | 'signin' = 'signin') => {
    setAuthModalAction(null);
    setSelectedSolution(null);
    setDraft((prev) => ({ ...prev, phase: targetPhase }));
    setGuestPreviewMode(false);
  };

  // Persist non-sensitive onboarding progress while unauthenticated
  useEffect(() => {
    if (!authenticatedUser) {
      saveOnboardingDraft(draft);
    }
  }, [draft, authenticatedUser]);

  // Hydrate authenticated Supabase session & PostgreSQL profile on mount
  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let active = true;

    const hydrateSession = async () => {
      const { data } = await client.auth.getSession();
      const user = data.session?.user;
      if (!active || !user) return;

      const profile = await fetchUserProfile(user.id);
      if (!active) return;

      if (profile?.onboarding_completed || user.user_metadata?.onboarding_completed) {
        setAuthenticatedUser({ id: user.id, email: user.email || '' });
        if (profile) {
          setProfileName(profile.display_name || '');
          setProfileRole(profile.role_identity || '');
          setProfileLocation(profile.country || '');
          if (profile.avatar_url) setProfilePhotoUrl(profile.avatar_url);
        } else {
          setProfileName((user.user_metadata?.display_name as string) || '');
          setProfileRole((user.user_metadata?.role_identity as string) || '');
          setProfileLocation((user.user_metadata?.country as string) || '');
        }
        clearOnboardingDraft();
      }
    };

    hydrateSession();

    return () => {
      active = false;
    };
  }, []);

  const handleRegistrationComplete = (profile: PersistedUserProfile) => {
    setAuthenticatedUser({ id: profile.id, email: profile.email });
    setProfileName(profile.display_name);
    setProfileRole(profile.role_identity);
    setProfileLocation(profile.country);
    if (profile.avatar_url) {
      setProfilePhotoUrl(profile.avatar_url);
    }
    clearOnboardingDraft();
    setDraft(createInitialDraft());
    setGuestPreviewMode(false);
    setActiveView('home');
    showToast(`Welcome to Gloweave, ${profile.display_name}!`);
  };

  const handleSignInComplete = async (
    email: string,
    profile: PersistedUserProfile | null
  ) => {
    let resolvedProfile = profile;
    let userId = profile?.id || '';

    if (!resolvedProfile && supabase) {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        userId = data.user.id;
        resolvedProfile = await fetchUserProfile(data.user.id);
        if (!resolvedProfile && data.user.user_metadata) {
          setProfileName((data.user.user_metadata.display_name as string) || '');
          setProfileRole((data.user.user_metadata.role_identity as string) || '');
          setProfileLocation((data.user.user_metadata.country as string) || '');
        }
      }
    }

    setAuthenticatedUser({ id: userId, email });
    if (resolvedProfile) {
      setProfileName(resolvedProfile.display_name || '');
      setProfileRole(resolvedProfile.role_identity || '');
      setProfileLocation(resolvedProfile.country || '');
      if (resolvedProfile.avatar_url) setProfilePhotoUrl(resolvedProfile.avatar_url);
    }
    clearOnboardingDraft();
    setGuestPreviewMode(false);
    setActiveView('home');
    showToast('Signed in to Gloweave.');
  };

  const handleSignOut = async () => {
    if (authenticatedUser && supabase) {
      await supabase.auth.signOut();
    }
    setAuthenticatedUser(null);
    setGuestPreviewMode(true);
    setDraft(loadOnboardingDraft());
    setActiveView('home');
    showToast('Signed out. You are now in Review Mode.');
  };

  const handleConfirmSignOut = async () => {
    setAccountActionBusy(true);
    try {
      await handleSignOut();
      setSignOutConfirmOpen(false);
    } finally {
      setAccountActionBusy(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    setAccountActionBusy(true);
    try {
      const result = await requestAccountDeletion();
      try {
        window.localStorage.removeItem('gloweave_user_preferences_v1');
      } catch {
        // ignore storage errors
      }
      clearOnboardingDraft();
      setDraft(createInitialDraft());
      setPreferences(DEFAULT_USER_PREFERENCES);
      setEmailDigest(DEFAULT_USER_PREFERENCES.notifications.weeklyDigest);
      setProfileName('');
      setProfileRole('');
      setProfileLocation('');
      setProfilePhotoUrl(null);
      setIsPro(false);
      setProblems((prev) => prev.map((p) => ({ ...p, bookmarked: false })));
      setSolutions((prev) => prev.map((s) => ({ ...s, bookmarked: false })));
      setMatches((prev) => prev.map((m) => ({ ...m, bookmarked: false })));
      setAuthenticatedUser(null);
      setGuestPreviewMode(false);
      setActiveView('home');
      setDeleteConfirmOpen(false);
      showToast(result.message);
    } finally {
      setAccountActionBusy(false);
    }
  };

  const unreadMessagesCount = useMemo(
    () => messages.filter((m) => m.unread).length,
    [messages]
  );

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const featuredSolution = useMemo(
    () => solutions.find((s) => s.featured) || solutions[0] || null,
    [solutions]
  );

  const activeProblemDetail = useMemo(
    () => problems.find((p) => p.id === activeProblemId) || null,
    [problems, activeProblemId]
  );

  const navigateTo = (view: NavView) => {
    if (view !== 'problem-detail') {
      setPreviousView(activeView === 'problem-detail' ? previousView : activeView);
    }
    if (view === 'messages') {
      setActiveThreadId(null);
    }
    setActiveView(view);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (q.trim().length > 0 && activeView === 'home') {
      navigateTo('discover');
    }
  };

  const handleRegionChange = (region: RegionFilter) => {
    setRegionFilter(region);
    showToast(`Region scope set to ${region}`);
  };

  const handleOpenProblemDetail = (problem: ProblemItem) => {
    setPreviousView(activeView === 'problem-detail' ? previousView : activeView);
    setActiveProblemId(problem.id);
    setProblems((prev) =>
      prev.map((p) =>
        p.id === problem.id
          ? {
              ...p,
              viewsNum: p.viewsNum + 1,
              views: `${((p.viewsNum + 1) / 1000).toFixed(1)}K views`,
            }
          : p
      )
    );
    setActiveView('problem-detail');
  };

  const handleOpenSubmit = (opts?: {
    kind?: SubmitKind;
    problemId?: string;
    prefillUrl?: string;
  }) => {
    if (!requireAuth('submit a resource, PDF, or solution evidence')) return;
    setSubmitKind(opts?.kind || 'resource');
    setSubmitProblemId(opts?.problemId || '');
    setPrefillSubmitUrl(opts?.prefillUrl || '');
    setSubmitModalOpen(true);
  };

  const handleSubmitResourceUrl = async (payload: {
    url: string;
    kind: ResourceKind;
    optionalContext?: string;
    region?: Exclude<RegionFilter, 'Global'>;
    country?: string;
  }): Promise<ResourceSubmission> => {
    const backendResult = await submitResourceUrlToBackend(payload);
    const submissionId = backendResult.data?.submissionId || `sub-${Date.now()}`;

    const newSubmission: ResourceSubmission = {
      id: submissionId,
      submissionFormat: 'url',
      url: payload.url,
      kind: payload.kind,
      optionalContext: payload.optionalContext,
      region: payload.region,
      country: payload.country,
      submittedAt: 'Just now',
      batchWindow: 'Batch #15 · Scheduled Next Window',
      etaLabel: backendResult.ok ? 'Est. feedback in 24–48 hours' : 'Awaiting backend processing service',
      progressPercent: backendResult.ok ? 25 : 0,
      uploadProgress: 100,
      status: backendResult.ok ? 'Queued for Batch' : 'Awaiting Backend Service',
      backendSyncState: backendResult.ok
        ? 'synced'
        : backendResult.awaitingBackend
        ? 'awaiting-backend'
        : 'error',
      errorMessage:
        !backendResult.ok && !backendResult.awaitingBackend ? backendResult.message : undefined,
    };

    setSubmissions((prev) => [newSubmission, ...prev]);
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: `${payload.kind} queued`,
        description: backendResult.ok
          ? `${payload.url} scheduled for AI extraction & matching (24–48h turnaround).`
          : `${payload.url} recorded locally (awaiting backend ingestion API).`,
        time: 'Just now',
        type: 'system',
        targetView: 'discover',
        read: false,
      },
      ...prev,
    ]);
    showToast(
      backendResult.ok
        ? `${payload.kind} queued in scheduled batch.`
        : `${payload.kind} queued locally (awaiting backend integration).`
    );
    return newSubmission;
  };

  const handleSubmitPdfDocument = async (payload: {
    file: File;
    kind: ResourceKind;
    ocrRequested: boolean;
    optionalContext?: string;
    region?: Exclude<RegionFilter, 'Global'>;
    country?: string;
    previewObjectUrl: string;
  }): Promise<ResourceSubmission> => {
    const backendResult = await uploadPdfToBackend(payload);
    const id = backendResult.data?.id || `pdf-${Date.now()}`;

    const newPdfSub: ResourceSubmission = {
      id,
      submissionFormat: 'pdf',
      kind: payload.kind,
      optionalContext: payload.optionalContext,
      region: payload.region,
      country: payload.country,
      submittedAt: 'Just now',
      batchWindow: 'Document Extraction & OCR Pipeline',
      etaLabel: backendResult.ok ? 'Extraction & OCR queued' : 'Awaiting backend extraction & OCR service',
      progressPercent: backendResult.ok ? 25 : 0,
      uploadProgress: 100,
      status: backendResult.ok ? 'Queued for Batch' : 'Awaiting Backend Service',
      pdfMeta: {
        fileName: payload.file.name,
        fileSizeBytes: payload.file.size,
        mimeType: payload.file.type || 'application/pdf',
        pageCount: backendResult.data?.pdfMeta?.pageCount,
        previewObjectUrl: payload.previewObjectUrl,
        ocrRequested: payload.ocrRequested,
      },
      extractionStatus: backendResult.data?.extractionStatus || 'Awaiting Backend Service',
      ocrStatus:
        backendResult.data?.ocrStatus ||
        (payload.ocrRequested ? 'Awaiting Backend Service' : 'Not Required'),
      extractedPreviewText: backendResult.data?.extractedPreviewText ?? null,
      backendSyncState: backendResult.ok
        ? 'synced'
        : backendResult.awaitingBackend
        ? 'awaiting-backend'
        : 'error',
      errorMessage:
        !backendResult.ok && !backendResult.awaitingBackend ? backendResult.message : undefined,
    };

    setSubmissions((prev) => [newPdfSub, ...prev]);
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: `PDF "${payload.file.name}" uploaded`,
        description: backendResult.ok
          ? 'Queued for backend PDF text extraction & OCR analysis.'
          : 'Validated & previewable locally; awaiting backend PDF extraction & OCR service.',
        time: 'Just now',
        type: 'system',
        targetView: 'discover',
        read: false,
      },
      ...prev,
    ]);
    showToast(
      backendResult.ok
        ? `PDF "${payload.file.name}" queued for backend extraction.`
        : `PDF "${payload.file.name}" staged locally (awaiting backend extraction & OCR).`
    );
    return newPdfSub;
  };

  const handleRetrySubmission = async (submissionId: string) => {
    if (!requireAuth('retry submission processing')) return;
    const target = submissions.find((s) => s.id === submissionId);
    if (!target) return;

    const statusRes = await fetchPdfExtractionFromBackend(submissionId);
    if (statusRes.awaitingBackend) {
      showToast('Backend PDF extraction & OCR service is not connected yet (VITE_BACKEND_API_URL unset).');
      return;
    }

    if (statusRes.ok && statusRes.data) {
      const data = statusRes.data;
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? {
                ...s,
                extractionStatus: data.extractionStatus || s.extractionStatus,
                ocrStatus: data.ocrStatus || s.ocrStatus,
                extractedPreviewText: data.extractedPreviewText ?? s.extractedPreviewText,
                errorMessage: data.errorMessage,
                backendSyncState: 'synced',
                pdfMeta: s.pdfMeta
                  ? { ...s.pdfMeta, pageCount: data.pageCount ?? s.pdfMeta.pageCount }
                  : s.pdfMeta,
              }
            : s
        )
      );
      showToast('Updated extraction & OCR status from backend.');
      return;
    }

    const retryRes = await retryPdfExtractionOnBackend(
      submissionId,
      Boolean(target.pdfMeta?.ocrRequested)
    );
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              extractionStatus: retryRes.data?.extractionStatus || s.extractionStatus,
              ocrStatus: retryRes.data?.ocrStatus || s.ocrStatus,
              errorMessage: retryRes.ok ? undefined : retryRes.message,
              backendSyncState: retryRes.ok ? 'synced' : 'error',
            }
          : s
      )
    );
    showToast(retryRes.ok ? 'Re-queued extraction job on backend.' : retryRes.message);
  };

  const handleQuickUrlSubmit = (url: string, kind: ResourceKind) => {
    if (!requireAuth('submit a resource URL')) return;
    void handleSubmitResourceUrl({ url, kind });
  };

  const handleSubmitSolutionEvidence = async (payload: {
    problemId: string;
    name: string;
    evidenceUrl: string;
    productUrl?: string;
    addressExplanation?: string;
    supportingFile?: File | null;
    optionalNotes?: string;
  }) => {
    const backendResult = await submitSolutionProposalToBackend({
      problemId: payload.problemId,
      name: payload.name,
      productUrl: payload.productUrl || payload.evidenceUrl,
      addressExplanation: payload.addressExplanation || payload.optionalNotes || '',
      evidenceUrl: payload.evidenceUrl,
      supportingDocument: payload.supportingFile || undefined,
    });

    const targetProblem = problems.find((p) => p.id === payload.problemId);
    const category = targetProblem?.category || 'Clean Energy';
    const newSolution: SolutionItem = {
      id: backendResult.data?.solution?.id || `sol-${Date.now()}`,
      problemId: payload.problemId,
      name: payload.name,
      tagline: payload.optionalNotes || 'Proposed solution awaiting assessment & human review',
      description:
        payload.optionalNotes ||
        `Proposed solution for "${targetProblem?.title || 'discovered problem'}".`,
      addressExplanation: payload.addressExplanation,
      category,
      tags: [category, 'Awaiting Review'],
      rating: 0,
      reviewsCount: '0',
      verified: false, // Never auto-verified
      status: 'Submitted',
      aiAssessmentStatus: 'Pending Batch Assessment',
      humanReviewStatus: 'Awaiting Review',
      evidenceUrl: payload.evidenceUrl,
      evidenceSummary:
        payload.optionalNotes ||
        'Submitted for AI assessment and mandatory human verification review.',
      supportingDocumentName: payload.supportingFile?.name,
      supportingDocumentSizeBytes: payload.supportingFile?.size,
      submittedAt: 'Just now',
      websiteUrl: payload.productUrl || payload.evidenceUrl,
      region: targetProblem?.region || 'North America',
      country: targetProblem?.country || 'Global',
      theme:
        category === 'Healthcare'
          ? 'health'
          : category === 'AgriTech'
          ? 'agri'
          : category === 'Climate & Water'
          ? 'water'
          : 'solar',
      submittedByMe: true,
    };

    setSolutions((prev) => [newSolution, ...prev]);
    setProblems((prev) =>
      prev.map((p) =>
        p.id === payload.problemId
          ? {
              ...p,
              solutionsCount: p.solutionsCount + 1,
              solutionStatus:
                p.solutionStatus === 'Awaiting Solution' ? 'Under Review' : p.solutionStatus,
              assessmentHistory: [
                {
                  id: `ah-${Date.now()}`,
                  date: 'Just now',
                  actor: 'Community Evidence',
                  status: 'Submitted',
                  note: `Proposed solution "${payload.name}" submitted — AI Assessment Pending · Human Review Awaiting.`,
                },
                ...p.assessmentHistory,
              ],
            }
          : p
      )
    );
    showToast(
      backendResult.ok
        ? `Solution "${payload.name}" submitted for assessment & human review.`
        : `Solution "${payload.name}" recorded locally (unverified · awaiting backend).`
    );
  };

  const handleSubmitHumanVerification = (payload: {
    problemId: string;
    decision: VerificationStatus;
    comment: string;
    humanConfirmationChecked: boolean;
  }) => {
    if (!requireAuth('submit a human verification review')) return;
    const reviewer = profileName || 'Human Reviewer';
    void submitHumanVerificationToBackend({
      targetType: 'problem',
      targetId: payload.problemId,
      decision: payload.decision,
      comment: payload.comment,
      reviewerName: reviewer,
      humanConfirmationChecked: payload.humanConfirmationChecked,
    }).then((res) => {
      const feedbackEntry = {
        id: `vf-${Date.now()}`,
        targetType: 'problem' as const,
        targetId: payload.problemId,
        reviewerName: reviewer,
        decision: payload.decision,
        comment: payload.comment,
        createdAt: 'Just now',
        backendSyncState: res.ok ? ('synced' as const) : ('awaiting-backend' as const),
      };

      setProblems((prev) =>
        prev.map((p) =>
          p.id === payload.problemId
            ? {
                ...p,
                verificationStatus: payload.decision,
                solutionStatus:
                  payload.decision === 'Resolved'
                    ? 'Solved'
                    : payload.decision === 'More Evidence Required'
                    ? 'Verification Required'
                    : p.solutionStatus,
                verificationHistory: [feedbackEntry, ...(p.verificationHistory || [])],
                assessmentHistory: [
                  {
                    id: `ah-${Date.now()}`,
                    date: 'Just now',
                    actor: 'Human Reviewer',
                    status: payload.decision,
                    note: `${reviewer}: ${payload.comment}`,
                  },
                  ...p.assessmentHistory,
                ],
              }
            : p
        )
      );
      showToast(
        res.ok
          ? `Verification updated to "${payload.decision}".`
          : `Human review "${payload.decision}" saved locally (awaiting backend).`
      );
    });
  };

  const handleAddEvidenceToProblem = (payload: {
    problemId: string;
    sourceTitle: string;
    sourceUrl?: string;
    documentName?: string;
    extractedReference: string;
    supportingEvidence: string;
    evidenceType: EvidenceType;
  }) => {
    if (!requireAuth('attach supporting evidence')) return;
    const newEvidence: EvidenceItem = {
      id: `ev-${Date.now()}`,
      relatedProblemId: payload.problemId,
      sourceTitle: payload.sourceTitle,
      sourceUrl: payload.sourceUrl,
      documentName: payload.documentName,
      extractedReferences: [payload.extractedReference],
      supportingEvidence: payload.supportingEvidence,
      evidenceType: payload.evidenceType,
      reviewStatus: 'Awaiting Review',
      isIndependentlyVerified: false,
      submittedAt: 'Just now',
    };

    void submitEvidenceToBackend({
      problemId: payload.problemId,
      evidence: newEvidence,
    });

    setProblems((prev) =>
      prev.map((p) =>
        p.id === payload.problemId
          ? { ...p, evidences: [newEvidence, ...(p.evidences || [])] }
          : p
      )
    );
    showToast(`Evidence "${payload.sourceTitle}" attached (Awaiting Review).`);
  };

  const handleSubmitMatchFeedback = (
    matchId: string,
    feedback: MatchUserFeedback,
    note?: string
  ) => {
    if (!requireAuth('submit match feedback')) return;
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? {
              ...m,
              userFeedback: feedback,
              userFeedbackNote: note ?? m.userFeedbackNote,
              reviewStatus:
                feedback === 'needs-evidence' ? 'More Evidence Required' : m.reviewStatus || 'Awaiting Review',
            }
          : m
      )
    );
    void submitMatchFeedbackToBackend({ matchId, feedback, note }).then((res) => {
      showToast(
        res.ok
          ? 'Match review feedback synced.'
          : 'Match feedback recorded locally (awaiting backend).'
      );
    });
  };

  const handleReviewSolution = (
    solutionId: string,
    decision: VerificationStatus,
    notes: string
  ) => {
    if (!requireAuth('record a solution verification review')) return;
    const reviewer = profileName || 'Human Reviewer';
    void submitHumanVerificationToBackend({
      targetType: 'solution',
      targetId: solutionId,
      decision,
      comment: notes || `Status updated to ${decision}`,
      reviewerName: reviewer,
      humanConfirmationChecked: decision === 'Resolved' || decision === 'Verified',
    });

    setSolutions((prev) =>
      prev.map((s) => {
        if (s.id !== solutionId) return s;
        const updated: SolutionItem = {
          ...s,
          humanReviewStatus: decision,
          humanReviewerNotes: notes,
          verified: decision === 'Verified' || decision === 'Resolved',
          status:
            decision === 'Resolved'
              ? 'Fully solved'
              : decision === 'Verified'
              ? 'Partially solved'
              : decision === 'More Evidence Required'
              ? 'Verification required'
              : 'Under review',
        };
        if (selectedSolution?.id === solutionId) setSelectedSolution(updated);
        return updated;
      })
    );
    showToast(`Solution review recorded as "${decision}".`);
  };

  const handleToggleMatchBookmark = (matchId: string) => {
    if (!requireAuth('save candidate matches')) return;
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        const next = !m.bookmarked;
        showToast(next ? `Saved match "${m.candidateName}"` : `Removed "${m.candidateName}" from saved`);
        return { ...m, bookmarked: next };
      })
    );
  };

  const handleToggleUpvote = (id: string) => {
    if (!requireAuth('upvote problems')) return;
    const target = problems.find((p) => p.id === id);
    if (!target) return;
    if (target.upvoted) {
      showToast('Your account has already upvoted this problem (1 vote per account).');
      return;
    }
    setProblems((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, upvoted: true, upvotes: p.upvotes + 1 } : p
      )
    );
    showToast(`Upvoted "${target.title}".`);
  };

  const handleToggleProblemBookmark = (id: string) => {
    if (!requireAuth('save problems to your account')) return;
    setProblems((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = !p.bookmarked;
        showToast(next ? `Saved "${p.title}" to Profile` : `Removed "${p.title}" from Saved`);
        return { ...p, bookmarked: next };
      })
    );
  };

  const handleToggleSolutionBookmark = (id: string) => {
    if (!requireAuth('save solutions to your account')) return;
    setSolutions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, bookmarked: !s.bookmarked };
        if (selectedSolution?.id === id) setSelectedSolution(updated);
        showToast(updated.bookmarked ? `Saved ${s.name}` : `Removed ${s.name} from saved`);
        return updated;
      })
    );
  };

  const handleShareProblem = async (problem: ProblemItem) => {
    const shareText = `${problem.title} (${problem.region}) — Gloweave Global Intelligence`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      }
      showToast('Problem summary copied to clipboard.');
    } catch {
      showToast(`Ready to share: ${problem.title}`);
    }
  };

  const handleToggleConnect = (id: string) => {
    if (!requireAuth('connect with community members')) return;
    setContributors((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const next = !c.connected;
        showToast(next ? `Connected with ${c.name}` : `Disconnected from ${c.name}`);
        return { ...c, connected: next };
      })
    );
  };

  const handleStartMessageWith = (person: ContributorItem) => {
    if (!requireAuth(`message ${person.name}`)) return;
    const existing = messages.find((m) => m.senderName === person.name);
    if (existing) {
      setActiveThreadId(existing.id);
      setMessages((prev) =>
        prev.map((t) => (t.id === existing.id ? { ...t, unread: false } : t))
      );
    } else {
      const newThread: MessageThread = {
        id: `msg-${Date.now()}`,
        senderName: person.name,
        senderInitials: person.initials,
        senderRole: person.role,
        unread: false,
        timestamp: 'Now',
        accentFrom: person.accentFrom,
        accentTo: person.accentTo,
        messages: [
          {
            id: `m-${Date.now()}`,
            fromSelf: false,
            text: `Hi ${profileName || 'there'}! Happy to collaborate on ${person.category} initiatives in ${person.region}.`,
            time: 'Now',
          },
        ],
      };
      setMessages((prev) => [newThread, ...prev]);
      setActiveThreadId(newThread.id);
    }
    setPreviousView(activeView === 'problem-detail' ? previousView : activeView);
    setActiveView('messages');
  };

  const handleSelectThread = (threadId: string | null) => {
    setActiveThreadId(threadId);
    if (threadId) {
      setMessages((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, unread: false } : t))
      );
    }
  };

  const handleSendMessage = (
    threadId: string,
    text: string,
    attachments?: ChatAttachment[]
  ) => {
    if (!requireAuth('send a direct message')) return;
    if (!text.trim() && (!attachments || attachments.length === 0)) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              unread: false,
              timestamp: 'Just now',
              messages: [
                ...t.messages,
                {
                  id: `m-${Date.now()}`,
                  fromSelf: true,
                  text,
                  time: now,
                  attachments: attachments && attachments.length > 0 ? attachments : undefined,
                },
              ],
            }
          : t
      )
    );
  };

  const handleSummarizeMessageLink = async (
    threadId: string,
    messageId: string,
    attachmentId: string,
    url: string
  ) => {
    if (!requireAuth('summarize a shared inner link')) return;

    const updateAttachmentSummary = (summary: NonNullable<ChatAttachment['linkSummary']>) => {
      setMessages((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                messages: t.messages.map((msg) =>
                  msg.id === messageId
                    ? {
                        ...msg,
                        attachments: msg.attachments?.map((att) =>
                          att.id === attachmentId ? { ...att, linkSummary: summary } : att
                        ),
                      }
                    : msg
                ),
              }
            : t
        )
      );
    };

    updateAttachmentSummary({ status: 'loading' });

    const res = await summarizeChatLinkOnBackend({ threadId, messageId, url });
    if (res.ok && res.data?.summary) {
      updateAttachmentSummary({
        status: 'ready',
        pageTitle: res.data.pageTitle,
        summary: res.data.summary,
        keyPoints: res.data.keyPoints,
      });
      showToast('Inner link summarized by backend.');
      return;
    }

    if (res.awaitingBackend) {
      updateAttachmentSummary({
        status: 'awaiting-backend',
        errorMessage: res.message,
      });
      showToast('Inner link summarization awaits backend endpoint (POST /api/messages/summarize-link).');
      return;
    }

    updateAttachmentSummary({
      status: 'error',
      errorMessage: res.message,
    });
    showToast(res.message || 'Could not summarize link.');
  };

  const handleMarkAllNotificationsRead = () => {
    if (!requireAuth('manage notifications')) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read.');
  };

  const handleNotificationClick = (n: NotificationItem) => {
    if (authenticatedUser) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
      );
    }
    if (n.targetView) {
      navigateTo(n.targetView);
    }
  };

  const handleUpdateProfile = (updates: {
    name?: string;
    role?: string;
    location?: string;
    emailDigest?: boolean;
  }) => {
    if (!requireAuth('update your profile')) return;
    if (updates.name !== undefined) setProfileName(updates.name);
    if (updates.role !== undefined) setProfileRole(updates.role);
    if (updates.location !== undefined) setProfileLocation(updates.location);
    if (updates.emailDigest !== undefined) {
      setEmailDigest(updates.emailDigest);
      setPreferences((prev) => {
        const next: UserSettingsPreferences = {
          ...prev,
          notifications: {
            ...prev.notifications,
            weeklyDigest: updates.emailDigest ?? prev.notifications.weeklyDigest,
          },
        };
        saveUserPreferences(next);
        return next;
      });
    }
  };

  const handleUpdatePreferences = (next: UserSettingsPreferences) => {
    if (!requireAuth('save account preferences')) return;
    setPreferences(next);
    setEmailDigest(next.notifications.weeklyDigest);
    saveUserPreferences(next);
  };

  const handleUploadPhoto = (dataUrl: string) => {
    if (!requireAuth('upload a profile photo')) return;
    setProfilePhotoUrl(dataUrl);
    showToast('Profile picture updated.');
  };

  const handleRemovePhoto = () => {
    if (!requireAuth('remove your profile photo')) return;
    setProfilePhotoUrl(null);
    showToast('Profile picture removed.');
  };

  if (!authenticatedUser && !guestPreviewMode) {
    return (
      <MotionConfig reducedMotion="user">
        <OnboardingFlow
          draft={draft}
          onDraftChange={setDraft}
          onRegistrationComplete={handleRegistrationComplete}
          onSignInComplete={handleSignInComplete}
          onEnterGuestPreview={() => {
            setGuestPreviewMode(true);
            setActiveView('home');
          }}
        />
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              role="status"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#091533] border border-sky-400/50 text-xs font-semibold text-white shadow-2xl"
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen text-slate-100 antialiased selection:bg-[#19C8FF] selection:text-slate-900">
      {/* Mobile Top Header */}
      <MobileHeader
        onOpenMenu={() => setMobileMenuOpen(true)}
        unreadNotifications={unreadNotificationsCount}
        isAuthenticated={Boolean(authenticatedUser)}
        onOpenNotifications={() => navigateTo('notifications')}
        onGoHome={() => navigateTo('home')}
        onOpenSignIn={() => openAuthFlow('signin')}
      />

      {/* Desktop + Main Container */}
      <div className="md:flex min-h-screen">
        <DesktopSidebar
          activeView={activeView === 'problem-detail' ? 'problems' : activeView}
          onSelectView={navigateTo}
          unreadMessages={unreadMessagesCount}
          unreadNotifications={unreadNotificationsCount}
          isPro={isPro}
          isAuthenticated={Boolean(authenticatedUser)}
          profileName={profileName}
          profilePhotoUrl={profilePhotoUrl}
          onOpenUpgrade={() => setUpgradeModalOpen(true)}
          onSignOut={() => {
            if (authenticatedUser) {
              setSignOutConfirmOpen(true);
            } else {
              openAuthFlow('signin');
            }
          }}
        />

        <main className="md:ml-64 flex-1 p-4 md:p-6 pb-24 md:pb-8 space-y-6 max-w-[1440px]">
          <DesktopHeader
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            region={regionFilter}
            onRegionChange={handleRegionChange}
            unreadNotifications={unreadNotificationsCount}
            isAuthenticated={Boolean(authenticatedUser)}
            profileName={profileName}
            profilePhotoUrl={profilePhotoUrl}
            onOpenNotifications={() => navigateTo('notifications')}
            onOpenProfile={() => navigateTo('profile')}
            onOpenSignIn={() => openAuthFlow('signin')}
            onOpenRegister={() => openAuthFlow('welcome')}
          />

          {!authenticatedUser && (
            <div className="rounded-2xl bg-gradient-to-r from-[#091A42]/95 via-[#081536]/95 to-[#09213D]/95 border border-sky-400/25 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="text-[11px] text-slate-200 leading-relaxed">
                <span className="inline-block px-2 py-0.5 rounded bg-sky-500/20 border border-sky-400/35 text-[#38BDF8] font-bold mr-2">
                  Review Mode
                </span>
                Explore problems, matches, startups, and solutions freely. Sign in to message, connect, post, vote, or save.
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openAuthFlow('signin')}
                  className="px-3 py-1.5 rounded-lg bg-[#0A1633] border border-sky-400/35 text-[11px] font-bold text-[#38BDF8] hover:bg-[#11244D] transition cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => openAuthFlow('welcome')}
                  className="px-3 py-1.5 rounded-lg btn-royal text-[11px] font-bold text-white transition cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeView === 'problem-detail' ? `${activeView}-${activeProblemId}` : activeView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeView === 'home' ? (
                <HomeDashboard
                  problems={problems}
                  solutions={solutions}
                  matches={matches}
                  submissions={submissions}
                  startups={startups}
                  contributors={contributors}
                  featuredSolution={featuredSolution}
                  regions={REGION_INSIGHTS}
                  isPro={isPro}
                  isAuthenticated={Boolean(authenticatedUser)}
                  profileName={profileName}
                  profileLocation={profileLocation}
                  onNavigate={navigateTo}
                  onOpenSubmit={(opts) => handleOpenSubmit(opts)}
                  onOpenUpgrade={() => setUpgradeModalOpen(true)}
                  onSelectProblem={handleOpenProblemDetail}
                  onSelectSolution={setSelectedSolution}
                  onQuickUrlSubmit={handleQuickUrlSubmit}
                />
              ) : (
                <SecondaryViews
                  activeView={activeView}
                  previousView={previousView}
                  searchQuery={searchQuery}
                  regionFilter={regionFilter}
                  problems={problems}
                  solutions={solutions}
                  matches={matches}
                  submissions={submissions}
                  startups={startups}
                  contributors={contributors}
                  regions={REGION_INSIGHTS}
                  messages={messages}
                  notifications={notifications}
                  activeProblemDetail={activeProblemDetail}
                  activeThreadId={activeThreadId}
                  authenticatedUser={authenticatedUser}
                  isPro={isPro}
                  profileName={profileName}
                  profileRole={profileRole}
                  profileLocation={profileLocation}
                  profilePhotoUrl={profilePhotoUrl}
                  emailDigest={emailDigest}
                  preferences={preferences}
                  settingsTab={settingsTab}
                  legalDocId={legalDocId}
                  supportTab={supportTab}
                  onSelectSettingsTab={setSettingsTab}
                  onSelectLegalDoc={setLegalDocId}
                  onSelectSupportTab={setSupportTab}
                  onUpdatePreferences={handleUpdatePreferences}
                  onRequestSignOut={() => {
                    if (authenticatedUser) {
                      setSignOutConfirmOpen(true);
                    } else {
                      openAuthFlow('signin');
                    }
                  }}
                  onRequestDeleteAccount={() => setDeleteConfirmOpen(true)}
                  onSelectView={navigateTo}
                  onBackFromProblem={() =>
                    setActiveView(previousView === 'problem-detail' ? 'discover' : previousView)
                  }
                  onOpenSubmit={(opts) => handleOpenSubmit(opts)}
                  onOpenUpgrade={() => setUpgradeModalOpen(true)}
                  onSelectProblem={handleOpenProblemDetail}
                  onSelectSolution={setSelectedSolution}
                  onToggleUpvote={handleToggleUpvote}
                  onToggleProblemBookmark={handleToggleProblemBookmark}
                  onToggleSolutionBookmark={handleToggleSolutionBookmark}
                  onToggleMatchBookmark={handleToggleMatchBookmark}
                  onSubmitMatchFeedback={handleSubmitMatchFeedback}
                  onSubmitHumanVerification={handleSubmitHumanVerification}
                  onAddEvidence={handleAddEvidenceToProblem}
                  onRetrySubmission={handleRetrySubmission}
                  onShareProblem={handleShareProblem}
                  onToggleConnect={handleToggleConnect}
                  onStartMessageWith={handleStartMessageWith}
                  onSelectThread={handleSelectThread}
                  onSendMessage={handleSendMessage}
                  onSummarizeMessageLink={handleSummarizeMessageLink}
                  onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
                  onNotificationClick={handleNotificationClick}
                  onUpdateProfile={handleUpdateProfile}
                  onUploadPhoto={handleUploadPhoto}
                  onRemovePhoto={handleRemovePhoto}
                  onRequireAuth={(label) => {
                    requireAuth(label);
                  }}
                  onToast={showToast}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeView={activeView === 'problem-detail' ? 'discover' : activeView}
        onSelectView={navigateTo}
        onOpenSubmit={() => handleOpenSubmit({ kind: 'resource' })}
      />

      {/* Mobile Slide-Out Drawer */}
      <MobileDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeView={activeView === 'problem-detail' ? 'discover' : activeView}
        onSelectView={navigateTo}
        unreadNotifications={unreadNotificationsCount}
        isPro={isPro}
        isAuthenticated={Boolean(authenticatedUser)}
        profileName={profileName}
        profilePhotoUrl={profilePhotoUrl}
        onOpenSubmit={() => handleOpenSubmit({ kind: 'resource' })}
        onOpenUpgrade={() => setUpgradeModalOpen(true)}
        onSignOut={() => {
          if (authenticatedUser) {
            setSignOutConfirmOpen(true);
          } else {
            openAuthFlow('signin');
          }
        }}
      />

      {/* Modals */}
      <SubmitResourceModal
        open={submitModalOpen}
        initialKind={submitKind}
        initialProblemId={submitProblemId}
        initialUrl={prefillSubmitUrl}
        problems={problems}
        onClose={() => setSubmitModalOpen(false)}
        onSubmitResourceUrl={handleSubmitResourceUrl}
        onSubmitPdfDocument={handleSubmitPdfDocument}
        onSubmitSolutionEvidence={handleSubmitSolutionEvidence}
      />

      <UpgradeProModal
        open={upgradeModalOpen}
        isPro={isPro}
        onClose={() => setUpgradeModalOpen(false)}
        onActivatePro={() => {
          if (!requireAuth('activate Gloweave Pro')) {
            setUpgradeModalOpen(false);
            return;
          }
          setIsPro(true);
          showToast('Gloweave Pro Access activated in local session.');
        }}
      />

      <SolutionDetailModal
        solution={selectedSolution}
        linkedProblem={
          selectedSolution?.problemId
            ? problems.find((p) => p.id === selectedSolution.problemId) || null
            : null
        }
        onClose={() => setSelectedSolution(null)}
        onToggleBookmark={handleToggleSolutionBookmark}
        onOpenProblem={handleOpenProblemDetail}
        onReviewSolution={handleReviewSolution}
      />

      <AuthRequiredModal
        open={Boolean(authModalAction)}
        actionLabel={authModalAction}
        onClose={() => setAuthModalAction(null)}
        onSignIn={() => openAuthFlow('signin')}
        onCreateAccount={() => openAuthFlow('welcome')}
      />

      <SignOutConfirmModal
        open={signOutConfirmOpen}
        isAuthenticated={Boolean(authenticatedUser)}
        busy={accountActionBusy}
        onCancel={() => setSignOutConfirmOpen(false)}
        onConfirm={handleConfirmSignOut}
      />

      <DeleteAccountConfirmModal
        open={deleteConfirmOpen}
        isAuthenticated={Boolean(authenticatedUser)}
        busy={accountActionBusy}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDeleteAccount}
      />

      {/* Non-blocking Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 px-4 py-3 rounded-xl bg-[#091533] border border-sky-400/50 text-xs font-semibold text-white shadow-2xl"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </MotionConfig>
  );
}
