import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  Crown,
  Flame,
  Globe,
  Lightbulb,
  Loader2,
  Network,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import { HERO_STATS, KPI_METRICS } from '../data/gloweaveData';
import {
  MatchItem,
  NavView,
  ProblemItem,
  RegionInsight,
  ResourceKind,
  ResourceSubmission,
  SolutionItem,
} from '../types/gloweave';
import { problemSolutionStatusBadge } from './ProblemDetailView';
import {
  DottedWorldMap,
  GlowingSparkline,
  HeroGlobeGraphic,
  ProblemThumbnail,
  SolutionVisualBanner,
} from './VisualThumbnails';

interface HomeDashboardProps {
  problems: ProblemItem[];
  solutions: SolutionItem[];
  matches: MatchItem[];
  submissions: ResourceSubmission[];
  featuredSolution: SolutionItem | null;
  regions: RegionInsight[];
  isPro: boolean;
  profileName?: string;
  onNavigate: (view: NavView) => void;
  onOpenSubmit: (opts?: { kind?: 'resource' | 'evidence'; prefillUrl?: string; problemId?: string }) => void;
  onOpenUpgrade: () => void;
  onSelectProblem: (problem: ProblemItem) => void;
  onSelectSolution: (solution: SolutionItem) => void;
  onQuickUrlSubmit: (url: string, kind: ResourceKind) => void;
}

const QUICK_RESOURCE_KINDS: ResourceKind[] = [
  'Startup',
  'Product',
  'Research',
  'Website',
  'Other Resource',
];

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  problems,
  solutions,
  matches,
  submissions,
  featuredSolution,
  regions,
  isPro,
  profileName,
  onNavigate,
  onOpenSubmit,
  onOpenUpgrade,
  onSelectProblem,
  onSelectSolution,
  onQuickUrlSubmit,
}) => {
  const [quickUrl, setQuickUrl] = useState('');
  const [quickKind, setQuickKind] = useState<ResourceKind>('Startup');
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [problemTab, setProblemTab] = useState<'discovered' | 'awaiting'>('discovered');
  const [selectedRegionId, setSelectedRegionId] = useState(regions[0]?.id || 'reg-af');
  const [urlError, setUrlError] = useState('');

  const awaitingProblems = problems.filter((p) => p.solutionStatus === 'Awaiting Solution');
  const verifiedSolutions = solutions.filter(
    (s) => s.verified || s.status === 'Fully solved' || s.status === 'Partially solved'
  );
  const displayedProblems = (problemTab === 'awaiting' ? awaitingProblems : problems).slice(0, 3);
  const topThreeMatches = matches.slice(0, 3);
  const activeRegion = regions.find((r) => r.id === selectedRegionId) || regions[0];
  const latestVerified =
    featuredSolution && (featuredSolution.verified || featuredSolution.status === 'Fully solved')
      ? featuredSolution
      : verifiedSolutions[0] || null;

  const liveHeroStats = HERO_STATS.map((stat) => {
    if (stat.id === 'problems') return { ...stat, value: String(problems.length) };
    if (stat.id === 'matches') return { ...stat, value: String(matches.length) };
    return { ...stat, value: String(awaitingProblems.length) };
  });

  const liveKpiMetrics = KPI_METRICS.map((kpi) => {
    const count =
      kpi.id === 'problems'
        ? problems.length
        : kpi.id === 'matches'
        ? matches.length
        : kpi.id === 'awaiting'
        ? awaitingProblems.length
        : verifiedSolutions.length;
    const peak = Math.min(100, count * 20);
    return {
      ...kpi,
      value: String(count),
      delta: count === 0 ? '0' : `+${count} live`,
      bars: count === 0 ? [0, 0, 0, 0, 0, 0] : [0, 0, 0, 0, Math.round(peak * 0.5), peak],
    };
  });

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickUrl.trim();
    if (!trimmed) {
      setUrlError('Enter a startup, product, research, or website URL.');
      return;
    }
    const candidate = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    try {
      const parsed = new URL(candidate);
      if (!parsed.hostname || !parsed.hostname.includes('.')) {
        setUrlError('Enter a valid URL (e.g. https://example.org).');
        return;
      }
    } catch {
      setUrlError('Enter a valid URL (e.g. https://example.org).');
      return;
    }

    setUrlError('');
    setQuickSubmitting(true);
    window.setTimeout(() => {
      onQuickUrlSubmit(candidate, quickKind);
      setQuickUrl('');
      setQuickSubmitting(false);
    }, 650);
  };

  return (
    <div className="space-y-5">
      {/* =================================================
          MOBILE HOME LAYOUT (< 768px)
         ================================================= */}
      <div className="block md:hidden space-y-5">
        <section className="relative pt-2 pb-3 overflow-hidden">
          <HeroGlobeGraphic variant="mobile" />

          <div className="relative z-10 pr-8">
            {profileName && (
              <p className="text-[11px] font-bold text-[#38BDF8] mb-1.5">
                Welcome, {profileName}
              </p>
            )}
            <h2 className="text-3xl font-extrabold tracking-tight leading-[1.12] mb-3 text-white">
              A Smarter, <br />
              More <span className="text-[#22D3EE]">Connected</span> <br />
              World
            </h2>
            <p className="text-slate-300/90 text-xs leading-relaxed mb-5 max-w-[245px]">
              Submit links in seconds. Gloweave identifies global problems, matches solutions, and
              tracks real-world progress.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('discover')}
              className="w-full py-3.5 px-6 rounded-full btn-royal text-white font-bold text-sm flex items-center justify-center space-x-2 active:scale-[0.98] transition"
            >
              <span>Explore Global Intelligence</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Quick Stats Card */}
          <div className="relative z-10 glass-card rounded-2xl p-3.5 mt-5 grid grid-cols-3 divide-x divide-[#1E3A6E]/60">
            {liveHeroStats.map((stat) => {
              const IconComp =
                stat.tone === 'cyan' ? Lightbulb : stat.tone === 'blue' ? Network : Clock;
              const target: NavView =
                stat.id === 'problems'
                  ? 'discover'
                  : stat.id === 'matches'
                  ? 'matches'
                  : 'problems';
              return (
                <button
                  key={stat.id}
                  type="button"
                  onClick={() => onNavigate(target)}
                  className="text-center px-2 py-1 rounded-lg hover:bg-white/[0.04] transition cursor-pointer"
                >
                  <div className="flex justify-center mb-1.5">
                    <IconComp className="w-4 h-4 text-[#38BDF8]" />
                  </div>
                  <div className="text-base font-extrabold text-white tabular-nums">{stat.value}</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5 leading-tight">
                    {stat.label}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Mobile Problems Discovered / Awaiting Solutions */}
        <section className="glass-card p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
              <h3 className="font-bold text-sm text-white">
                {problemTab === 'awaiting' ? 'Awaiting Solutions' : 'Problems Discovered'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('discover')}
              className="text-xs text-[#38BDF8] font-semibold"
            >
              See all →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1 p-1 bg-[#060E22] rounded-xl border border-[#1E386E]">
            <button
              type="button"
              onClick={() => setProblemTab('discovered')}
              className={`py-1.5 rounded-lg text-[11px] font-semibold transition ${
                problemTab === 'discovered' ? 'btn-royal text-white' : 'text-slate-400'
              }`}
            >
              Discovered ({problems.length})
            </button>
            <button
              type="button"
              onClick={() => setProblemTab('awaiting')}
              className={`py-1.5 rounded-lg text-[11px] font-semibold transition ${
                problemTab === 'awaiting' ? 'btn-royal text-white' : 'text-slate-400'
              }`}
            >
              Awaiting ({awaitingProblems.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {displayedProblems.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#0B1734]/85 border border-[#1D3668]/60 text-center space-y-2">
                <p className="text-xs text-slate-400">No problems in this queue yet</p>
                <button
                  type="button"
                  onClick={() => onOpenSubmit({ kind: 'resource' })}
                  className="text-xs font-semibold text-[#38BDF8] hover:underline"
                >
                  Submit Resource URL +
                </button>
              </div>
            ) : (
              displayedProblems.slice(0, 2).map((prob) => (
                <button
                  key={prob.id}
                  type="button"
                  onClick={() => onSelectProblem(prob)}
                  className="w-full text-left p-2.5 rounded-xl bg-[#0B1734]/85 border border-[#1D3668]/60 flex items-center justify-between gap-2.5 hover:border-sky-400/40 transition"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <ProblemThumbnail theme={prob.theme} size="md" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{prob.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
                        {prob.country} · {prob.potentialMatchesCount} matches
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-lg border text-[10px] font-semibold shrink-0 whitespace-nowrap ${problemSolutionStatusBadge(
                      prob.solutionStatus
                    )}`}
                  >
                    {prob.solutionStatus}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Mobile Potential Solution Matches */}
        <section className="glass-card p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Network className="w-4 h-4 text-[#38BDF8]" />
              <h3 className="font-bold text-sm text-white">Potential Solution Matches</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('matches')}
              className="text-xs text-[#38BDF8] font-semibold"
            >
              Matches →
            </button>
          </div>
          {topThreeMatches.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#0B1734]/85 border border-[#1D3668]/60 text-center space-y-2">
              <p className="text-xs text-slate-400">No solution matches generated yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topThreeMatches.slice(0, 2).map((match) => (
                <button
                  key={match.id}
                  type="button"
                  onClick={() => onNavigate('matches')}
                  className="w-full text-left p-3 rounded-xl bg-[#0B1734]/85 border border-[#1D3668]/60 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{match.candidateName}</div>
                    <div className="text-[10px] text-slate-400 truncate">{match.fitLabel}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 border ${
                      match.verification === 'verified'
                        ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300'
                        : 'bg-sky-500/15 border-sky-400/35 text-[#38BDF8]'
                    }`}
                  >
                    {match.verification === 'verified' ? 'Verified' : 'AI-Suggested'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Mobile Recently Verified Solution */}
        <section className="glass-card p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <h3 className="font-bold text-sm text-white">Recently Verified Solutions</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('solutions')}
              className="text-xs text-[#38BDF8] font-semibold"
            >
              See all →
            </button>
          </div>
          {latestVerified ? (
            <button
              type="button"
              onClick={() => onSelectSolution(latestVerified)}
              className="w-full text-left space-y-2.5"
            >
              <SolutionVisualBanner
                theme={latestVerified.theme}
                name={latestVerified.name}
                verified={latestVerified.verified}
              />
              <p className="text-xs font-bold text-slate-100">{latestVerified.tagline}</p>
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-[#0B1734]/85 border border-[#1D3668]/60 text-center space-y-2">
              <p className="text-xs text-slate-400">No verified solutions yet</p>
              <button
                type="button"
                onClick={() => onOpenSubmit({ kind: 'evidence' })}
                className="text-xs font-semibold text-[#38BDF8] hover:underline"
              >
                Submit Solution Evidence →
              </button>
            </div>
          )}
        </section>
      </div>

      {/* =================================================
          DESKTOP / LAPTOP LAYOUT (>= 768px)
         ================================================= */}
      <div className="hidden md:block space-y-5">
        {/* Hero Banner with Radiant Blue-Gold Earth Globe */}
        <section className="relative rounded-3xl overflow-hidden hero-glass p-7 lg:p-8">
          <HeroGlobeGraphic variant="desktop" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-3.5">
              {profileName && (
                <p className="text-xs font-bold text-[#38BDF8]">Welcome back, {profileName}</p>
              )}
              <h2 className="text-5xl lg:text-[54px] font-extrabold tracking-tight leading-none text-white">
                Glow<span className="text-[#38BDF8]">eave</span>
              </h2>
              <h3 className="text-2xl lg:text-[26px] font-extrabold tracking-tight text-white">
                A Smarter, <span className="text-[#22D3EE]">More Connected World</span>
              </h3>
              <p className="text-slate-300/90 text-sm leading-relaxed max-w-lg">
                AI-powered global problem discovery, batch analysis, and solution matching. Submit a
                resource link and receive structured feedback within 24–48 hours.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('discover')}
                  className="px-6 py-3 rounded-full btn-royal text-white font-bold text-xs flex items-center space-x-2 transition whitespace-nowrap cursor-pointer"
                >
                  <span>Explore Global Intelligence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenSubmit({ kind: 'resource' })}
                  className="px-6 py-3 rounded-full bg-[#09142E]/85 border border-sky-300/25 text-white font-bold text-xs hover:bg-[#11244D] transition whitespace-nowrap cursor-pointer"
                >
                  Submit a Resource Link +
                </button>
              </div>
            </div>

            {/* Right Frosted Stats Stack */}
            <div className="lg:col-span-4 flex items-center justify-end">
              <div className="w-full max-w-[250px] rounded-2xl bg-[#091533]/80 border border-sky-400/25 backdrop-blur-md p-4 space-y-3.5 shadow-[0_12px_36px_rgba(0,80,220,0.28)]">
                {liveHeroStats.map((stat) => {
                  const IconComp =
                    stat.tone === 'cyan' ? Lightbulb : stat.tone === 'blue' ? Network : Clock;

                  return (
                    <button
                      key={stat.id}
                      type="button"
                      onClick={() =>
                        onNavigate(
                          stat.id === 'problems'
                            ? 'discover'
                            : stat.id === 'matches'
                            ? 'matches'
                            : 'problems'
                        )
                      }
                      className="w-full text-left flex items-center space-x-3.5 px-2 py-1 rounded-xl hover:bg-white/[0.04] transition cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#0D2352] border border-sky-400/30 text-[#38BDF8] flex items-center justify-center shrink-0">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xl font-extrabold text-white tabular-nums leading-tight">
                          {stat.value}
                        </div>
                        <div className="text-[11px] text-slate-300 font-medium">{stat.label}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 4 KPI Metrics Row with Smooth Glowing SVG Sparklines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {liveKpiMetrics.map((kpi) => {
            const colorMap = {
              purple: {
                box: 'bg-purple-500/20 border-purple-400/35 text-purple-300',
                stroke: '#A855F7',
                Icon: Lightbulb,
                target: 'discover' as NavView,
              },
              cyan: {
                box: 'bg-sky-500/20 border-sky-400/35 text-sky-300',
                stroke: '#38BDF8',
                Icon: Network,
                target: 'matches' as NavView,
              },
              amber: {
                box: 'bg-amber-500/20 border-amber-400/35 text-amber-300',
                stroke: '#F59E0B',
                Icon: Clock,
                target: 'problems' as NavView,
              },
              emerald: {
                box: 'bg-emerald-500/20 border-emerald-400/35 text-emerald-300',
                stroke: '#10B981',
                Icon: ShieldCheck,
                target: 'solutions' as NavView,
              },
            }[kpi.color];

            const Icon = colorMap.Icon;

            return (
              <button
                key={kpi.id}
                type="button"
                onClick={() => onNavigate(colorMap.target)}
                className="text-left glass-card px-4 py-3.5 rounded-2xl flex items-center justify-between gap-2 hover:border-sky-400/35 transition cursor-pointer"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${colorMap.box}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl font-extrabold text-white tabular-nums leading-tight">
                      {kpi.value}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium truncate">{kpi.label}</div>
                    <div className="text-sky-300 text-[11px] font-bold tabular-nums mt-0.5">
                      {kpi.delta}
                    </div>
                  </div>
                </div>
                <GlowingSparkline id={kpi.id} points={kpi.bars} color={colorMap.stroke} />
              </button>
            );
          })}
        </div>

        {/* Middle 3-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Problems Discovered / Awaiting Solutions (4 Cols) */}
          <div className="lg:col-span-4 glass-card p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                  <h3 className="font-bold text-sm text-white">Problems &amp; Open Calls</h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(problemTab === 'awaiting' ? 'problems' : 'discover')}
                  className="text-xs text-[#38BDF8] font-semibold hover:underline cursor-pointer"
                >
                  See all →
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1 p-1 bg-[#060E22] rounded-xl border border-[#1E386E] mb-3">
                <button
                  type="button"
                  onClick={() => setProblemTab('discovered')}
                  className={`py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    problemTab === 'discovered'
                      ? 'btn-royal text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Discovered ({problems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProblemTab('awaiting')}
                  className={`py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    problemTab === 'awaiting'
                      ? 'btn-royal text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Awaiting ({awaitingProblems.length})
                </button>
              </div>

              <div className="space-y-2.5">
                {displayedProblems.length === 0 ? (
                  <div className="p-5 rounded-xl bg-[#0A1735]/80 border border-[#1A3160]/70 text-center space-y-2">
                    <p className="text-xs text-slate-400">No problems in this filter yet</p>
                    <button
                      type="button"
                      onClick={() => onOpenSubmit({ kind: 'resource' })}
                      className="text-xs font-semibold text-[#38BDF8] hover:underline cursor-pointer"
                    >
                      Submit a Resource Link +
                    </button>
                  </div>
                ) : (
                  displayedProblems.map((prob, index) => (
                    <button
                      key={prob.id}
                      type="button"
                      onClick={() => onSelectProblem(prob)}
                      className="w-full text-left p-2.5 rounded-xl bg-[#0A1735]/80 border border-[#1A3160]/70 hover:border-sky-400/40 flex items-center justify-between gap-2 transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="text-xs font-extrabold text-slate-400 w-3.5 tabular-nums shrink-0">
                          {index + 1}
                        </div>
                        <ProblemThumbnail theme={prob.theme} size="sm" />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{prob.title}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
                            {prob.country} · {prob.potentialMatchesCount} matches
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold shrink-0 whitespace-nowrap ${problemSolutionStatusBadge(
                          prob.solutionStatus
                        )}`}
                      >
                        {prob.solutionStatus}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recently Verified Solutions (4 Cols) */}
          <div className="lg:col-span-4 glass-card p-5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <h3 className="font-bold text-sm text-white">Recently Verified Solutions</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('solutions')}
                className="text-xs text-[#38BDF8] font-semibold hover:underline cursor-pointer"
              >
                See all →
              </button>
            </div>

            {latestVerified ? (
              <div className="grid grid-cols-12 gap-3.5 items-stretch flex-1">
                <button
                  type="button"
                  onClick={() => onSelectSolution(latestVerified)}
                  className="col-span-5 text-left block cursor-pointer"
                >
                  <SolutionVisualBanner
                    theme={latestVerified.theme}
                    name={latestVerified.name}
                    verified={latestVerified.verified}
                    compact
                  />
                </button>

                <div className="col-span-7 flex flex-col justify-between space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between gap-1.5">
                      <h4 className="text-sm font-extrabold text-white truncate">
                        {latestVerified.name}
                      </h4>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/35 text-[9px] font-bold shrink-0">
                        {latestVerified.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                      {latestVerified.tagline}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {latestVerified.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-[#0E2046] border border-[#1E3A6E] text-[10px] text-sky-200 font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-1.5 text-[11px] text-amber-400 font-bold tabular-nums">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{latestVerified.usersCount}</span>
                      <span className="text-slate-400 font-normal ml-1">
                        · {latestVerified.country}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectSolution(latestVerified)}
                      className="w-full py-2 rounded-xl btn-royal text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                    >
                      <span>Inspect Evidence</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-5 rounded-xl bg-[#0A1735]/80 border border-[#1A3160]/70 text-center space-y-2">
                <p className="text-xs text-slate-400">No verified solutions confirmed yet</p>
                <button
                  type="button"
                  onClick={() => onOpenSubmit({ kind: 'evidence' })}
                  className="px-4 py-2 rounded-xl btn-royal text-white font-bold text-xs cursor-pointer"
                >
                  Submit Evidence Link
                </button>
              </div>
            )}
          </div>

          {/* Potential Solution Matches (4 Cols) */}
          <div className="lg:col-span-4 glass-card p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Network className="w-4 h-4 text-[#38BDF8]" />
                  <h3 className="font-bold text-sm text-white">Potential Solution Matches</h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('matches')}
                  className="text-xs text-[#38BDF8] font-semibold hover:underline cursor-pointer"
                >
                  Open Hub →
                </button>
              </div>

              <div className="space-y-2.5">
                {topThreeMatches.length === 0 ? (
                  <div className="p-5 rounded-xl bg-[#0A1735]/80 border border-[#1A3160]/70 text-center space-y-2">
                    <p className="text-xs text-slate-400">No candidate matches generated yet</p>
                    <button
                      type="button"
                      onClick={() => onNavigate('matches')}
                      className="text-xs font-semibold text-[#38BDF8] hover:underline cursor-pointer"
                    >
                      View Matchmaking →
                    </button>
                  </div>
                ) : (
                  topThreeMatches.map((match) => {
                    const prob = problems.find((p) => p.id === match.problemId);
                    const isVerified = match.verification === 'verified';
                    return (
                      <button
                        key={match.id}
                        type="button"
                        onClick={() => (prob ? onSelectProblem(prob) : onNavigate('matches'))}
                        className="w-full text-left p-2.5 rounded-xl bg-[#0A1735]/80 border border-[#1A3160]/70 hover:border-sky-400/40 flex items-center justify-between gap-2 transition cursor-pointer"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center space-x-1.5">
                            {isVerified ? (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                            )}
                            <h4 className="text-xs font-bold text-white truncate">
                              {match.candidateName}
                            </h4>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate pl-5">
                            {prob ? `For: ${prob.title}` : match.candidateSubtitle}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md border text-[10px] font-bold shrink-0 whitespace-nowrap ${
                            isVerified
                              ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300'
                              : 'bg-sky-500/15 border-sky-400/35 text-[#38BDF8]'
                          }`}
                        >
                          {isVerified ? 'Verified' : 'AI-Suggested'}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom 3-Card Color Showcase Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pb-6 items-stretch">
          {/* Global Innovation Activity (5 Cols) */}
          <div className="lg:col-span-5 glass-card p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-[#38BDF8]" />
                  <h3 className="font-bold text-sm text-white">Global Innovation Activity</h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('distribution')}
                  className="text-xs text-[#38BDF8] font-semibold hover:underline cursor-pointer"
                >
                  Details →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
                <div className="sm:col-span-7 space-y-1.5">
                  <DottedWorldMap
                    selectedRegionId={selectedRegionId}
                    onSelectRegion={setSelectedRegionId}
                  />
                  {activeRegion && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
                      <span>
                        {activeRegion.flag} {activeRegion.name} · {activeRegion.topSector}
                      </span>
                      <span className="text-sky-300 font-semibold tabular-nums">
                        {activeRegion.startupsCount === '0' ? '0 active' : activeRegion.startupsCount}
                      </span>
                    </div>
                  )}
                </div>

                {/* Top Regions */}
                <div className="sm:col-span-5 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-300 mb-1">Active Regions</div>
                  <div className="space-y-1 text-xs">
                    {regions.map((region) => {
                      const active = region.id === selectedRegionId;
                      return (
                        <button
                          key={region.id}
                          type="button"
                          onClick={() => setSelectedRegionId(region.id)}
                          className={`w-full flex items-center justify-between px-2 py-1 rounded-lg transition cursor-pointer ${
                            active ? 'bg-sky-500/15 text-white' : 'hover:bg-white/[0.04]'
                          }`}
                        >
                          <span className="flex items-center space-x-1.5 text-slate-200 truncate">
                            <span>{region.flag}</span>
                            <span className="truncate">{region.name}</span>
                          </span>
                          <span className="font-bold text-white tabular-nums">
                            {region.percentage}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Resource Link Card (4 Cols — Signature Ice-Cyan/Mint Card!) */}
          <div className="lg:col-span-4 rounded-2xl p-5 flex flex-col justify-between bg-gradient-to-br from-[#DDF6FF] via-[#ECF9FF] to-[#D4F6ED] border border-[#7DD3FC]/70 shadow-[0_12px_32px_-12px_rgba(56,189,248,0.4)] text-[#09152B]">
            <div>
              <div className="flex items-start space-x-2.5 mb-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0A1936] text-[#38BDF8] flex items-center justify-center shrink-0 mt-0.5">
                  <Rocket className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#071327] leading-snug">
                    Submit a Startup, Research or Resource Link
                  </h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                    Gloweave analyses links in scheduled batches. Feedback turnaround: 24–48 hours.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {QUICK_RESOURCE_KINDS.map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setQuickKind(kind)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                      quickKind === kind
                        ? 'bg-[#0A1936] text-white'
                        : 'bg-white/80 text-slate-700 border border-sky-200 hover:bg-white'
                    }`}
                  >
                    {kind}
                  </button>
                ))}
              </div>

              <form onSubmit={handleQuickSubmit} className="mt-2.5">
                <div className="flex items-center bg-white rounded-xl p-1 border border-sky-200 shadow-sm">
                  <input
                    type="text"
                    value={quickUrl}
                    onChange={(e) => {
                      setQuickUrl(e.target.value);
                      if (urlError) setUrlError('');
                    }}
                    placeholder="https://your-resource-url.com"
                    className="flex-1 min-w-0 bg-transparent px-2.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={quickSubmitting}
                    className="px-3.5 py-2 rounded-lg btn-royal text-white font-bold text-xs flex items-center space-x-1 shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    {quickSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>Queue</span>
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
                {urlError && <p className="text-[10px] text-rose-600 font-semibold mt-1">{urlError}</p>}
              </form>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-sky-200/80 text-[10px] font-semibold text-slate-700">
              <button
                type="button"
                onClick={() => onNavigate('discover')}
                className="flex items-center space-x-1 text-[#005CE6] hover:underline cursor-pointer"
              >
                <Clock className="w-3 h-3" />
                <span className="tabular-nums">{submissions.length} queued in batch</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenSubmit({ kind: 'resource', prefillUrl: quickUrl })}
                className="flex items-center space-x-1 hover:underline cursor-pointer"
              >
                <span>Add optional context →</span>
              </button>
            </div>
          </div>

          {/* Go Pro – Get More Reach (3 Cols — Deep Royal Violet + Gold Bars & Crown!) */}
          <div className="lg:col-span-3 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#4320A8] via-[#28136E] to-[#120A38] border border-purple-400/40 glow-purple">
            <div
              className="absolute right-2 bottom-2 flex items-end space-x-1.5 opacity-45 pointer-events-none"
              aria-hidden="true"
            >
              <div className="w-2.5 h-6 rounded-t bg-gradient-to-t from-purple-700 to-purple-400" />
              <div className="w-2.5 h-9 rounded-t bg-gradient-to-t from-purple-700 to-purple-300" />
              <div className="w-2.5 h-12 rounded-t bg-gradient-to-t from-purple-600 to-amber-300" />
              <div className="w-2.5 h-16 rounded-t bg-gradient-to-t from-amber-600 to-amber-300" />
            </div>
            <div
              className="absolute right-3 bottom-14 w-16 h-16 bg-amber-400/20 rounded-full blur-xl pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-300/30 text-amber-300 flex items-center justify-center">
                  <Crown className="w-4 h-4 fill-amber-400 text-amber-300" />
                </div>
                <h3 className="font-extrabold text-sm text-white">Go Pro – Get More Reach</h3>
              </div>

              <ul className="space-y-1.5 text-[11px] text-purple-100/90 mt-3">
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  <span>Priority batch analysis &amp; feedback</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  <span>Expanded solution matching insights</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  <span>Advanced regional &amp; sector analytics</span>
                </li>
              </ul>
            </div>

            <div className="relative z-10 pt-4">
              <button
                type="button"
                onClick={onOpenUpgrade}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] text-slate-950 font-extrabold text-xs shadow-[0_6px_20px_-4px_rgba(245,158,11,0.55)] hover:brightness-105 transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>{isPro ? 'Pro Membership Active ✓' : 'Upgrade to Pro →'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
