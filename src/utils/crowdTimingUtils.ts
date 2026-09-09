import { CityId, Pandal } from '../types';
import { parseTimeToMinutes } from '../services/tripPlanningEngine';

export interface HistoricalTimingInsight {
  bestWindow: string;
  peakHours: string;
  timingStatus: 'optimal' | 'peak_rush' | 'moderate';
  statusLabel: string;
  statusBengali: string;
  historicalCycleNote: string;
  recommendedTimeWindow: string;
}

/**
 * Returns historical crowd cycle insights for a pandal in Kolkata or Contai,
 * and assesses if the user's planned arrival falls in an optimal or rush window.
 */
export function getHistoricalCrowdInsight(
  pandal: Pandal,
  city: CityId,
  plannedArrivalTime?: string
): HistoricalTimingInsight {
  const isKolkata = city === 'kolkata';
  const zone = pandal.zone?.toLowerCase() || '';
  const isSouthKolkata = zone.includes('south') || zone.includes('ballygunge') || zone.includes('chetla') || zone.includes('new alipore');
  const isNorthKolkata = zone.includes('north') || zone.includes('shyambazar') || zone.includes('bagbazar') || zone.includes('college square');
  const isSreebhumi = pandal.id.includes('sreebhumi');

  let defaultBest = pandal.bestTimeToVisit;
  let peak = pandal.peakHours || '6:00 PM - 11:30 PM';
  let historicalCycleNote = '';

  if (isKolkata) {
    if (isSreebhumi) {
      defaultBest = defaultBest || '06:00 AM - 09:30 AM (Morning daylight darshan avoids 3-hour VIP Road queues)';
      historicalCycleNote = 'Historical Cycle: Sreebhumi generates 2-4 hr queues after 4 PM due to airport corridor convergence.';
      peak = '04:30 PM - 03:00 AM';
    } else if (isNorthKolkata) {
      defaultBest = defaultBest || '07:00 AM - 10:30 AM or 01:30 AM - 04:00 AM';
      historicalCycleNote = 'North Kolkata Heritage Cycle: Morning Pushpanjali hours (7-10 AM) and post-midnight (1:30 AM+) have open lanes.';
      peak = '06:30 PM - 12:30 AM';
    } else if (isSouthKolkata) {
      defaultBest = defaultBest || '01:30 PM - 04:30 PM (Mid-day lull before evening carnival rush)';
      historicalCycleNote = 'South Kolkata Theme Cycle: Immense evening rushes starting 5 PM. 1:30 PM to 4:30 PM offers shortest queue times.';
      peak = '05:30 PM - 01:30 AM';
    } else {
      defaultBest = defaultBest || '08:00 AM - 11:00 AM or 12:30 AM - 03:30 AM';
      historicalCycleNote = 'Kolkata Citywide Cycle: Peak carnival crowds surge between 6 PM and 1 AM.';
      peak = '06:00 PM - 01:00 AM';
    }
  } else {
    // Contai (Kanthi, East Medinipur)
    defaultBest = defaultBest || '08:30 AM - 11:30 AM (Pushpanjali) or 10:00 PM - 12:30 AM';
    historicalCycleNote = 'Contai Historical Cycle: Evening Sandhya Aarti (6 PM - 9:30 PM) is peak family rush around Central Bus Stand & Darua.';
    peak = '06:00 PM - 09:30 PM';
  }

  // Assess arrival time if provided
  let timingStatus: 'optimal' | 'peak_rush' | 'moderate' = 'optimal';
  let statusLabel = 'Optimal Time Window';
  let statusBengali = 'সেরা সময়';

  if (plannedArrivalTime) {
    const arrivalMins = parseTimeToMinutes(plannedArrivalTime);
    
    // Parse peak hours start and end approx
    let peakStart = 18 * 60; // 6 PM
    let peakEnd = 23 * 60 + 30; // 11:30 PM
    if (isSouthKolkata) {
      peakStart = 17 * 60 + 30; // 5:30 PM
      peakEnd = 25 * 60; // 1:00 AM
    } else if (isSreebhumi) {
      peakStart = 16 * 60 + 30; // 4:30 PM
      peakEnd = 27 * 60; // 3:00 AM
    } else if (!isKolkata) {
      peakStart = 18 * 60;
      peakEnd = 21 * 60 + 30;
    }

    if (arrivalMins >= peakStart && arrivalMins <= peakEnd) {
      timingStatus = 'peak_rush';
      statusLabel = 'Peak Historical Rush';
      statusBengali = 'ভিড়ের সময়';
    } else if (
      (arrivalMins >= 7 * 60 && arrivalMins <= 11 * 60) || // Morning 7-11 AM
      (arrivalMins >= 13 * 60 + 30 && arrivalMins <= 16 * 60 + 30) || // Afternoon 1:30-4:30 PM
      arrivalMins >= 25 * 60 + 30 || arrivalMins <= 4 * 60 // Late night 1:30-4 AM
    ) {
      timingStatus = 'optimal';
      statusLabel = 'Best Visiting Window';
      statusBengali = 'সুবিধাজনক সময়';
    } else {
      timingStatus = 'moderate';
      statusLabel = 'Moderate Crowd Window';
      statusBengali = 'মাঝারি ভিড়';
    }
  }

  return {
    bestWindow: defaultBest,
    peakHours: peak,
    timingStatus,
    statusLabel,
    statusBengali,
    historicalCycleNote,
    recommendedTimeWindow: defaultBest,
  };
}
