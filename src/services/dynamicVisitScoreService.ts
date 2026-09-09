import {
  Pandal,
  DynamicVisitScore,
  LocationWeather,
  PandalCrowdLiveStatus,
} from '../types';
import { getPandalCrowdStatus } from './crowdIntelligenceService';
import { getCachedWeatherSync, isRainLikelySoon } from './weatherService';

/**
 * Calculates the Dynamic "Worth Visiting Now" Score (Current Visit Score)
 * while keeping the permanent Pandal Quality (Worth Score) strictly separate!
 *
 * Base Quality Score: 0 to 10 (e.g. 9.4/10) - Permanent Artistic & Architectural Quality
 * Current Visit Score: 0 to 10 (e.g. 6.8/10) - Temporary condition-adjusted score
 */
export function calculateDynamicVisitScore(
  pandal: Pandal,
  crowdStatus?: PandalCrowdLiveStatus,
  weather?: LocationWeather
): DynamicVisitScore {
  const baseQuality = pandal.overallQualityScore; // Permanent e.g. 9.4
  const liveCrowd = crowdStatus || getPandalCrowdStatus(pandal.id, pandal);
  const liveWeather = weather || getCachedWeatherSync(pandal.city);

  let currentVisitScore = baseQuality;
  const reasons: string[] = [];
  const bengaliReasons: string[] = [];

  let queueDeduction = 0;
  let crowdDeduction = 0;
  let weatherDeduction = 0;
  let trendAdjustment = 0;

  // 1. Queue Time Penalties
  // Normal queue <= 15 min = 0 deduction
  // 16 - 30 min = -0.4
  // 31 - 45 min = -1.0
  // 46 - 65 min = -1.8
  // > 65 min = -2.6
  if (liveCrowd.queueWaitMinutes > 65) {
    queueDeduction = 2.6;
    reasons.push(`Long queue (~${liveCrowd.queueWaitMinutes} min wait)`);
    bengaliReasons.push(`দীর্ঘ লাইন (প্রায় ${liveCrowd.queueWaitMinutes} মিনিট অপেক্ষা)`);
  } else if (liveCrowd.queueWaitMinutes > 45) {
    queueDeduction = 1.8;
    reasons.push(`Significant queue (~${liveCrowd.queueWaitMinutes} min wait)`);
    bengaliReasons.push(`বড় লাইন (প্রায় ${liveCrowd.queueWaitMinutes} মিনিট অপেক্ষা)`);
  } else if (liveCrowd.queueWaitMinutes > 30) {
    queueDeduction = 1.0;
    reasons.push(`Moderate queue (~${liveCrowd.queueWaitMinutes} min wait)`);
    bengaliReasons.push(`মাঝারি লাইন (~${liveCrowd.queueWaitMinutes} মিনিট)`);
  } else if (liveCrowd.queueWaitMinutes > 15) {
    queueDeduction = 0.4;
  } else if (liveCrowd.queueWaitMinutes <= 10) {
    // Fast queue bonus
    queueDeduction = -0.3; // bonus
    reasons.push(`Fast queue (~${liveCrowd.queueWaitMinutes} min)`);
    bengaliReasons.push(`দ্রুত দর্শন (~${liveCrowd.queueWaitMinutes} মিনিট)`);
  }

  // 2. Crowd Level Penalties
  if (liveCrowd.crowdLevel === 'extreme' || liveCrowd.crowdLevel === 'peak_surge') {
    crowdDeduction = 1.2;
    reasons.push('Crowd is extreme right now');
    bengaliReasons.push('মণ্ডপে এখন অত্যধিক ভিড়');
  } else if (liveCrowd.crowdLevel === 'high') {
    crowdDeduction = 0.6;
    reasons.push('High crowd density');
    bengaliReasons.push('ঘন ভিড়ের চাপ');
  } else if (liveCrowd.crowdLevel === 'low') {
    crowdDeduction = -0.4; // bonus for peace
    reasons.push('Low gathering — peaceful viewing');
    bengaliReasons.push('স্বল্প ভিড় — শান্তিতে দর্শনীয়');
  }

  // 3. Crowd Trend Adjustments
  if (liveCrowd.trend === 'increasing') {
    trendAdjustment = -0.3;
    reasons.push('Crowd trend is ↗ increasing');
    bengaliReasons.push('ভিড় দ্রুত বাড়ছে ↗');
  } else if (liveCrowd.trend === 'decreasing') {
    trendAdjustment = 0.3;
    reasons.push('Crowd trend is ↘ easing up');
    bengaliReasons.push('ভিড় কমছে ↘');
  }

  // 4. Weather & Rain Penalties
  const rainInfo = isRainLikelySoon(liveWeather, 45);
  let isRainApproaching = false;

  if (rainInfo.likely) {
    isRainApproaching = true;
    // If pandal has long outdoor queue, rain is a heavy disadvantage right now
    if (liveCrowd.queueWaitMinutes > 25) {
      weatherDeduction = 1.5;
      reasons.push(`Rain approaching in ~${rainInfo.inMinutes || 35}m (wet outdoor queue)`);
      bengaliReasons.push(`প্রায় ${rainInfo.inMinutes || 35} মিনিটে বৃষ্টির সম্ভাবনা`);
    } else {
      weatherDeduction = 0.8;
      reasons.push(`Rain likely soon in this sector`);
      bengaliReasons.push(`এই এলাকায় শীঘ্রই বৃষ্টির সম্ভাবনা`);
    }
  }

  // Calculate Net Current Visit Score
  currentVisitScore = baseQuality - queueDeduction - crowdDeduction - weatherDeduction + trendAdjustment;

  // Clamp within 1.0 to 10.0
  currentVisitScore = Math.max(1.0, Math.min(10.0, Math.round(currentVisitScore * 10) / 10));

  // Determine if recommended RIGHT NOW
  const isRecommendedRightNow = currentVisitScore >= 7.5;

  let summaryBadge = 'Good to Visit Now';
  if (currentVisitScore >= 8.8) summaryBadge = 'Prime Visit Window ⭐';
  else if (currentVisitScore >= 7.5) summaryBadge = 'Favorable Now';
  else if (currentVisitScore >= 6.0) summaryBadge = 'Heavy Queue Delay';
  else summaryBadge = 'Wait for Queue to Ease';

  return {
    pandalId: pandal.id,
    baseQualityScore: baseQuality,
    currentVisitScore,
    queueWaitMinutes: liveCrowd.queueWaitMinutes,
    crowdLevel: liveCrowd.crowdLevel,
    crowdTrend: liveCrowd.trend,
    rainProbability: liveWeather.rainProbability,
    isRainApproaching,
    scoreBreakdown: {
      basePoints: baseQuality,
      queueDeduction: Math.round(queueDeduction * 10) / 10,
      crowdDeduction: Math.round(crowdDeduction * 10) / 10,
      weatherDeduction: Math.round(weatherDeduction * 10) / 10,
      trendAdjustment: Math.round(trendAdjustment * 10) / 10,
    },
    reasons: reasons.length > 0 ? reasons : ['Normal flow and steady queue'],
    bengaliReasons: bengaliReasons.length > 0 ? bengaliReasons : ['স্বাভাবিক গতি ও সাধারণ লাইন'],
    isRecommendedRightNow,
    summaryBadge,
  };
}
