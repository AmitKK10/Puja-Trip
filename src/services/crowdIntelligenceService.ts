import {
  CrowdLevel,
  CrowdTrend,
  CrowdDataReliability,
  CrowdReportRecord,
  PandalCrowdLiveStatus,
  Pandal,
} from '../types';
import { formatTimeAgo } from './weatherService';

const CROWD_REPORTS_STORAGE_KEY = 'pujatrip_crowd_reports_v1';
const CROWD_SIMULATION_OVERRIDES_KEY = 'pujatrip_crowd_overrides_v1';

// Seed sample crowd reports with realistic timestamps for key pandals
const INITIAL_DEMO_REPORTS: CrowdReportRecord[] = [
  {
    id: 'cr-tala-1',
    pandalId: 'tala-park-prattyay',
    userId: 'user-subrata',
    userName: 'Subrata Roy',
    crowdLevel: 'high',
    queueWaitMinutes: 40,
    reportedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(), // 4 min ago
    notes: 'Main gate queue moving at moderate pace. Evening queue growing.',
  },
  {
    id: 'cr-tala-2',
    pandalId: 'tala-park-prattyay',
    userId: 'user-tanima',
    userName: 'Tanima Sen',
    crowdLevel: 'high',
    queueWaitMinutes: 45,
    reportedAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(), // 11 min ago
  },
  {
    id: 'cr-tala-3',
    pandalId: 'tala-park-prattyay',
    userId: 'user-debo',
    userName: 'Debojyoti M.',
    crowdLevel: 'moderate',
    queueWaitMinutes: 30,
    reportedAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(), // 22 min ago
  },
  {
    id: 'cr-sreebhumi-1',
    pandalId: 'sreebhumi-sporting-club',
    userId: 'user-ananya',
    userName: 'Ananya Guha',
    crowdLevel: 'extreme',
    queueWaitMinutes: 60,
    reportedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    notes: 'VIP pass gate entry crowded. Main barricade queue reaches Lake Town clock tower.',
  },
  {
    id: 'cr-sreebhumi-2',
    pandalId: 'sreebhumi-sporting-club',
    userId: 'user-bikram',
    userName: 'Bikramjit C.',
    crowdLevel: 'extreme',
    queueWaitMinutes: 55,
    reportedAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
  },
  {
    id: 'cr-bagbazar-1',
    pandalId: 'bagbazar-sarbojanin',
    userId: 'user-sourav',
    userName: 'Sourav Ganguly Fan',
    crowdLevel: 'moderate',
    queueWaitMinutes: 20,
    reportedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    notes: 'Smooth darshan queue near ghat road.',
  },
  {
    id: 'cr-bagbazar-2',
    pandalId: 'bagbazar-sarbojanin',
    userId: 'user-priya',
    userName: 'Priya Mukherjee',
    crowdLevel: 'moderate',
    queueWaitMinutes: 22,
    reportedAt: new Date(Date.now() - 19 * 60 * 1000).toISOString(),
  },
  {
    id: 'cr-college-sq-1',
    pandalId: 'college-square-sarbojanin',
    userId: 'user-arnab',
    userName: 'Arnab Banerjee',
    crowdLevel: 'high',
    queueWaitMinutes: 35,
    reportedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    notes: 'Water illumination reflection crowd along pool barricade.',
  },
  {
    id: 'cr-ekdalia-1',
    pandalId: 'ekdalia-evergreen-club',
    userId: 'user-mou',
    userName: 'Moumita D.',
    crowdLevel: 'low',
    queueWaitMinutes: 12,
    reportedAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
    notes: 'Chandannagar illumination looking spectacular! Fast queue.',
  },
  {
    id: 'cr-maddox-1',
    pandalId: 'maddox-square',
    userId: 'user-koushik',
    userName: 'Koushik Roy',
    crowdLevel: 'moderate',
    queueWaitMinutes: 15,
    reportedAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(), // 55 min ago (near outdated)
  },
];

/**
 * In-Memory & Local Storage Manager
 */
function getStoredCrowdReports(): CrowdReportRecord[] {
  try {
    const raw = localStorage.getItem(CROWD_REPORTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CROWD_REPORTS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_REPORTS));
      return INITIAL_DEMO_REPORTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_DEMO_REPORTS;
  }
}

function saveStoredCrowdReports(reports: CrowdReportRecord[]) {
  try {
    localStorage.setItem(CROWD_REPORTS_STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error('Error saving crowd reports', e);
  }
}

interface SimulatedOverride {
  pandalId: string;
  crowdLevel: CrowdLevel;
  queueWaitMinutes: number;
  trend: CrowdTrend;
  updatedAt: string;
}

function getStoredOverrides(): Record<string, SimulatedOverride> {
  try {
    const raw = localStorage.getItem(CROWD_SIMULATION_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveStoredOverrides(overrides: Record<string, SimulatedOverride>) {
  try {
    localStorage.setItem(CROWD_SIMULATION_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.error('Error saving overrides', e);
  }
}

/**
 * Recency Weight Calculation
 * Gives more weight to recent reports (<15 min = 1.0, 15-30 min = 0.7, 30-60 min = 0.35, >60 min = 0.1)
 */
function getReportWeight(reportedAtIso: string): number {
  const ageMs = Date.now() - new Date(reportedAtIso).getTime();
  const ageMins = ageMs / (60 * 1000);

  if (ageMins <= 15) return 1.0;
  if (ageMins <= 30) return 0.7;
  if (ageMins <= 60) return 0.35;
  if (ageMins <= 120) return 0.15;
  return 0.05; // very old
}

const CROWD_LEVEL_NUMERIC: Record<CrowdLevel, number> = {
  low: 1,
  moderate: 2,
  high: 3,
  extreme: 4,
  peak_surge: 4,
};

function numericToCrowdLevel(val: number): CrowdLevel {
  if (val <= 1.5) return 'low';
  if (val <= 2.5) return 'moderate';
  if (val <= 3.5) return 'high';
  return 'extreme';
}

/**
 * Computes live crowd status for a pandal by blending recency-weighted community reports and base pandal data.
 */
export function getPandalCrowdStatus(pandalId: string, basePandal?: Pandal): PandalCrowdLiveStatus {
  const overrides = getStoredOverrides();
  const override = overrides[pandalId];

  // If there is an active simulation override (e.g. queue spike triggered by test or user)
  if (override) {
    const ageMins = (Date.now() - new Date(override.updatedAt).getTime()) / (60 * 1000);
    const isOutdated = ageMins > 60;
    const trendIcon = override.trend === 'increasing' ? '↗' : override.trend === 'decreasing' ? '↘' : '➡️';

    return {
      pandalId,
      crowdLevel: override.crowdLevel,
      queueWaitMinutes: override.queueWaitMinutes,
      trend: override.trend,
      trendIcon,
      lastUpdated: override.updatedAt,
      reportCount: 5,
      reliability: isOutdated ? 'outdated' : 'high',
      reliabilityLabel: isOutdated
        ? '⚠️ Crowd information may be outdated'
        : `Based on active reports (${formatTimeAgo(override.updatedAt)})`,
      isOutdated,
      recentReports: [],
    };
  }

  const allReports = getStoredCrowdReports();
  const pandalReports = allReports
    .filter((r) => r.pandalId === pandalId)
    .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());

  // If we have community reports
  if (pandalReports.length > 0) {
    const latestReport = pandalReports[0];
    const latestAgeMins = (Date.now() - new Date(latestReport.reportedAt).getTime()) / (60 * 1000);

    let totalWeight = 0;
    let weightedQueueSum = 0;
    let weightedLevelSum = 0;

    // Evaluate up to 5 recent reports
    const recentSample = pandalReports.slice(0, 5);
    recentSample.forEach((report) => {
      const weight = getReportWeight(report.reportedAt);
      totalWeight += weight;
      weightedQueueSum += report.queueWaitMinutes * weight;
      weightedLevelSum += (CROWD_LEVEL_NUMERIC[report.crowdLevel] || 2) * weight;
    });

    const avgQueue = totalWeight > 0 ? Math.round(weightedQueueSum / totalWeight) : latestReport.queueWaitMinutes;
    const avgLevelNum = totalWeight > 0 ? weightedLevelSum / totalWeight : 2;
    const crowdLevel = numericToCrowdLevel(avgLevelNum);

    // Derive trend by comparing latest report with older reports
    let trend: CrowdTrend = 'stable';
    if (recentSample.length >= 2) {
      const newestQueue = recentSample[0].queueWaitMinutes;
      const oldestQueue = recentSample[recentSample.length - 1].queueWaitMinutes;
      if (newestQueue - oldestQueue >= 10) trend = 'increasing';
      else if (oldestQueue - newestQueue >= 10) trend = 'decreasing';
    }

    const trendIcon = trend === 'increasing' ? '↗' : trend === 'decreasing' ? '↘' : '➡️';
    const isOutdated = latestAgeMins > 45;

    let reliability: CrowdDataReliability = 'high';
    let reliabilityLabel = `Based on ${pandalReports.length} recent reports (${formatTimeAgo(latestReport.reportedAt)})`;

    if (isOutdated) {
      reliability = 'outdated';
      reliabilityLabel = `⚠️ Crowd information may be outdated (${formatTimeAgo(latestReport.reportedAt)})`;
    } else if (pandalReports.length === 1) {
      reliability = 'low';
      reliabilityLabel = `🟡 1 recent report (${formatTimeAgo(latestReport.reportedAt)}) • Information may be uncertain`;
    } else if (pandalReports.length < 3) {
      reliability = 'moderate';
      reliabilityLabel = `Based on ${pandalReports.length} reports (${formatTimeAgo(latestReport.reportedAt)})`;
    }

    return {
      pandalId,
      crowdLevel,
      queueWaitMinutes: avgQueue,
      trend,
      trendIcon,
      lastUpdated: latestReport.reportedAt,
      reportCount: pandalReports.length,
      reliability,
      reliabilityLabel,
      isOutdated,
      recentReports: recentSample,
    };
  }

  // Fallback to base pandal record if no user report exists
  const fallbackQueue = basePandal?.queueWaitMinutes || 25;
  const fallbackLevel = basePandal?.crowdLevel || 'moderate';
  const simulatedTime = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  return {
    pandalId,
    crowdLevel: fallbackLevel,
    queueWaitMinutes: fallbackQueue,
    trend: 'stable',
    trendIcon: '➡️',
    lastUpdated: simulatedTime,
    reportCount: 1,
    reliability: 'moderate',
    reliabilityLabel: `Typical queue estimate (${formatTimeAgo(simulatedTime)})`,
    isOutdated: false,
    recentReports: [],
  };
}

/**
 * Submits a new user crowd report and stores it locally / dispatches event
 */
export function submitCrowdReport(
  pandalId: string,
  crowdLevel: CrowdLevel,
  queueWaitMinutes: number,
  userId: string = 'current_user',
  userName: string = 'You',
  notes?: string
): CrowdReportRecord {
  const newReport: CrowdReportRecord = {
    id: `cr-user-${Date.now()}`,
    pandalId,
    userId,
    userName,
    crowdLevel,
    queueWaitMinutes,
    reportedAt: new Date().toISOString(),
    notes,
  };

  const existing = getStoredCrowdReports();
  const updated = [newReport, ...existing];
  saveStoredCrowdReports(updated);

  // Clear any conflicting override for this pandal so user report takes immediate natural effect
  const overrides = getStoredOverrides();
  if (overrides[pandalId]) {
    delete overrides[pandalId];
    saveStoredOverrides(overrides);
  }

  return newReport;
}

/**
 * Test / Simulation helper: injects a crowd spike override
 * (e.g. Sreebhumi queue increases from 20 -> 55 min)
 */
export function simulateCrowdSpike(
  pandalId: string,
  queueMinutes: number,
  crowdLevel: CrowdLevel = 'extreme',
  trend: CrowdTrend = 'increasing'
) {
  const overrides = getStoredOverrides();
  overrides[pandalId] = {
    pandalId,
    crowdLevel,
    queueWaitMinutes: queueMinutes,
    trend,
    updatedAt: new Date().toISOString(),
  };
  saveStoredOverrides(overrides);
}

/**
 * Clears all simulation overrides
 */
export function resetCrowdSimulationOverrides() {
  localStorage.removeItem(CROWD_SIMULATION_OVERRIDES_KEY);
  localStorage.removeItem(CROWD_REPORTS_STORAGE_KEY);
}
