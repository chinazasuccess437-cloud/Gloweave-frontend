/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { HomeDashboard } from './components/HomeDashboard';
import {
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
  clearOnboardingDraft,
  createInitialDraft,
  loadOnboardingDraft,
  saveOnboardingDraft,
} from './data/onboardingOptions';
import {
  fetchUserProfile,
  PersistedUserProfile,
  supabase,
} from './lib/supabase';
import {
  ContributorItem,
  MatchItem,
  MessageThread,
  NavView,
  NotificationItem,
  OnboardingDraft,
  ProblemItem,
  RegionFilter,
  ResourceKind,
  ResourceSubmission,
  SolutionItem,
  StartupItem,
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
  const [emailDigest, setEmailDigest] = useState(true);

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitKind, setSubmitKind] = useState<SubmitKind>('resource');
  const [submitProblemId, setSubmitProblemId] = useState<string>('');
  const [prefillSubmitUrl, setPrefillSubmitUrl] = useState('');

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [activeProblemId, setActiveProblemId] = useState<string | null>(null);
  const [selectedSolution, setSelectedSolution] = useState<SolutionItem | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string>(INITIAL_MESSAGES[0]?.id || '');
  const [draft, setDraft] = useState<OnboardingDraft>(() => loadOnboardingDraft());
  const [authenticatedUser, setAuthenticatedUser] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [guestPreviewMode, setGuestPreviewMode] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
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
    setGuestPreviewMode(false);
    setDraft(loadOnboardingDraft());
    setActiveView('home');
    showToast(authenticatedUser ? 'Signed out of Gloweave.' : 'Returned to onboarding.');
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
    setSubmitKind(opts?.kind || 'resource');
    setSubmitProblemId(opts?.problemId || '');
    setPrefillSubmitUrl(opts?.prefillUrl || '');
    setSubmitModalOpen(true);
  };

  const handleSubmitResourceUrl = (payload: {
    url: string;
    kind: ResourceKind;
    optionalContext?: string;
    region?: Exclude<RegionFilter, 'Global'>;
    country?: string;
  }): ResourceSubmission => {
    const newSubmission: ResourceSubmission = {
      id: `sub-${Date.now()}`,
      url: payload.url,
      kind: payload.kind,
      optionalContext: payload.optionalContext,
      region: payload.region,
      country: payload.country,
      submittedAt: 'Just now',
      batchWindow: 'Batch #15 · Scheduled Next Window',
      etaLabel: 'Est. feedback in 24–48 hours',
      progressPercent: 25,
      status: 'Queued for Batch',
    };

    setSubmissions((prev) => [newSubmission, ...prev]);
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: `${payload.kind} link queued for Batch #15`,
        description: `${payload.url} scheduled for AI extraction & matching (24–48h turnaround).`,
        time: 'Just now',
        type: 'system',
        targetView: 'discover',
        read: false,
      },
      ...prev,
    ]);
    showToast(`${payload.kind} queued in scheduled batch (24–48h turnaround).`);
    return newSubmission;
  };

  const handleQuickUrlSubmit = (url: string, kind: ResourceKind) => {
    handleSubmitResourceUrl({ url, kind });
  };

  const handleSubmitSolutionEvidence = (payload: {
    problemId: string;
    name: string;
    evidenceUrl: string;
    optionalNotes?: string;
  }) => {
    const targetProblem = problems.find((p) => p.id === payload.problemId);
    const category = targetProblem?.category || 'Clean Energy';
    const newSolution: SolutionItem = {
      id: `sol-${Date.now()}`,
      problemId: payload.problemId,
      name: payload.name,
      tagline: payload.optionalNotes || 'Community-submitted solution evidence link',
      description:
        payload.optionalNotes ||
        `Evidence link submitted for "${targetProblem?.title || 'discovered problem'}".`,
      category,
      tags: [category, 'Submitted Evidence'],
      usersCount: 'Pending review',
      usersNum: 0,
      rating: 0,
      reviewsCount: '0',
      verified: false,
      status: 'Submitted',
      evidenceUrl: payload.evidenceUrl,
      evidenceSummary:
        payload.optionalNotes || 'Evidence link queued for Gloweave verification assessment.',
      submittedAt: 'Just now',
      websiteUrl: payload.evidenceUrl,
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
                  note: `${payload.name} evidence link submitted (${payload.evidenceUrl}) — awaiting review.`,
                },
                ...p.assessmentHistory,
              ],
            }
          : p
      )
    );
    showToast(`Solution evidence "${payload.name}" submitted (pending assessment).`);
  };

  const handleToggleMatchBookmark = (matchId: string) => {
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
    navigateTo('messages');
  };

  const handleSelectThread = (threadId: string) => {
    setActiveThreadId(threadId);
    setMessages((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, unread: false } : t))
    );
  };

  const handleSendMessage = (threadId: string, text: string) => {
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
                { id: `m-${Date.now()}`, fromSelf: true, text, time: now },
              ],
            }
          : t
      )
    );
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read.');
  };

  const handleNotificationClick = (n: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
    );
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
    if (updates.name !== undefined) setProfileName(updates.name);
    if (updates.role !== undefined) setProfileRole(updates.role);
    if (updates.location !== undefined) setProfileLocation(updates.location);
    if (updates.emailDigest !== undefined) setEmailDigest(updates.emailDigest);
  };

  const handleUploadPhoto = (dataUrl: string) => {
    setProfilePhotoUrl(dataUrl);
    showToast('Profile picture updated.');
  };

  const handleRemovePhoto = () => {
    setProfilePhotoUrl(null);
    showToast('Profile picture removed.');
  };

  if (!authenticatedUser && !guestPreviewMode) {
    return (
      <>
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
        {toastMessage && (
          <div
            role="status"
            className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#091533] border border-sky-400/50 text-xs font-semibold text-white shadow-2xl"
          >
            {toastMessage}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen text-slate-100 antialiased selection:bg-[#19C8FF] selection:text-slate-900">
      {/* Mobile Top Header */}
      <MobileHeader
        onOpenMenu={() => setMobileMenuOpen(true)}
        unreadNotifications={unreadNotificationsCount}
        onOpenNotifications={() => navigateTo('notifications')}
        onGoHome={() => navigateTo('home')}
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
          onSignOut={handleSignOut}
        />

        <main className="md:ml-64 flex-1 p-4 md:p-6 pb-24 md:pb-8 space-y-6 max-w-[1440px]">
          <DesktopHeader
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            region={regionFilter}
            onRegionChange={handleRegionChange}
            unreadNotifications={unreadNotificationsCount}
            profileName={profileName}
            profilePhotoUrl={profilePhotoUrl}
            onOpenNotifications={() => navigateTo('notifications')}
            onOpenProfile={() => navigateTo('profile')}
          />

          {activeView === 'home' ? (
            <HomeDashboard
              problems={problems}
              solutions={solutions}
              matches={matches}
              submissions={submissions}
              featuredSolution={featuredSolution}
              regions={REGION_INSIGHTS}
              isPro={isPro}
              profileName={profileName}
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
              isPro={isPro}
              profileName={profileName}
              profileRole={profileRole}
              profileLocation={profileLocation}
              profilePhotoUrl={profilePhotoUrl}
              emailDigest={emailDigest}
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
              onShareProblem={handleShareProblem}
              onToggleConnect={handleToggleConnect}
              onStartMessageWith={handleStartMessageWith}
              onSelectThread={handleSelectThread}
              onSendMessage={handleSendMessage}
              onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
              onNotificationClick={handleNotificationClick}
              onUpdateProfile={handleUpdateProfile}
              onUploadPhoto={handleUploadPhoto}
              onRemovePhoto={handleRemovePhoto}
              onToast={showToast}
            />
          )}
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
        onSignOut={handleSignOut}
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
        onSubmitSolutionEvidence={handleSubmitSolutionEvidence}
      />

      <UpgradeProModal
        open={upgradeModalOpen}
        isPro={isPro}
        onClose={() => setUpgradeModalOpen(false)}
        onActivatePro={() => {
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
      />

      {/* Non-blocking Toast */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 px-4 py-3 rounded-xl bg-[#091533] border border-sky-400/50 text-xs font-semibold text-white shadow-2xl"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
