import {
  ContributorItem,
  MatchItem,
  MessageThread,
  NotificationItem,
  ProblemItem,
  RegionInsight,
  ResourceSubmission,
  SolutionItem,
  StartupItem,
} from '../types/gloweave';

export const HERO_STATS = [
  { id: 'problems', label: 'Problems Discovered', value: '0', tone: 'cyan' as const },
  { id: 'matches', label: 'Solution Matches', value: '0', tone: 'blue' as const },
  { id: 'awaiting', label: 'Awaiting Solutions', value: '0', tone: 'purple' as const },
];

export const KPI_METRICS = [
  {
    id: 'problems',
    label: 'Problems Discovered',
    value: '0',
    delta: '0',
    color: 'purple' as const,
    bars: [0, 0, 0, 0, 0, 0],
  },
  {
    id: 'matches',
    label: 'Potential Matches',
    value: '0',
    delta: '0',
    color: 'cyan' as const,
    bars: [0, 0, 0, 0, 0, 0],
  },
  {
    id: 'awaiting',
    label: 'Awaiting Solutions',
    value: '0',
    delta: '0',
    color: 'amber' as const,
    bars: [0, 0, 0, 0, 0, 0],
  },
  {
    id: 'verified',
    label: 'Verified Solutions',
    value: '0',
    delta: '0',
    color: 'emerald' as const,
    bars: [0, 0, 0, 0, 0, 0],
  },
];

export const CATEGORIES = [
  'Clean Energy',
  'Healthcare',
  'AgriTech',
  'Climate & Water',
  'EdTech',
] as const;

export const INITIAL_PROBLEMS: ProblemItem[] = [];

export const INITIAL_SOLUTIONS: SolutionItem[] = [];

export const INITIAL_MATCHES: MatchItem[] = [];

export const INITIAL_STARTUPS: StartupItem[] = [];

export const INITIAL_SUBMISSIONS: ResourceSubmission[] = [];

export const INITIAL_CONTRIBUTORS: ContributorItem[] = [];

export const REGION_INSIGHTS: RegionInsight[] = [
  {
    id: 'reg-af',
    name: 'Africa',
    flag: '🌍',
    percentage: 0,
    activeNodes: 0,
    topSector: 'None yet',
    startupsCount: '0',
    regionGroup: 'Africa',
  },
  {
    id: 'reg-as',
    name: 'Asia',
    flag: '🌏',
    percentage: 0,
    activeNodes: 0,
    topSector: 'None yet',
    startupsCount: '0',
    regionGroup: 'Asia',
  },
  {
    id: 'reg-sa',
    name: 'South America',
    flag: '🌎',
    percentage: 0,
    activeNodes: 0,
    topSector: 'None yet',
    startupsCount: '0',
    regionGroup: 'South America',
  },
  {
    id: 'reg-na',
    name: 'North America',
    flag: '🌎',
    percentage: 0,
    activeNodes: 0,
    topSector: 'None yet',
    startupsCount: '0',
    regionGroup: 'North America',
  },
  {
    id: 'reg-eu',
    name: 'Europe',
    flag: '🌍',
    percentage: 0,
    activeNodes: 0,
    topSector: 'None yet',
    startupsCount: '0',
    regionGroup: 'Europe',
  },
];

export const INITIAL_MESSAGES: MessageThread[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
