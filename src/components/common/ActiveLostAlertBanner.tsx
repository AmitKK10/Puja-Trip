import React from 'react';
import { TripLostAlert, UserPreferences } from '../../types';
import { formatTimeAgo } from '../../utils/geoUtils';
import { Compass, Navigation, CheckCircle, Radio } from 'lucide-react';
import { resolveImLostAlert } from '../../services/safetyAndUtilitiesService';
import { getCurrentUserProfile } from '../../services/friendGroupService';

interface ActiveLostAlertBannerProps {
  alerts: TripLostAlert[];
  tripId: string;
  onOpenLostModal: () => void;
  onNavigateToPoint?: (lat: number, lng: number, name: string) => void;
  userPrefs: UserPreferences;
}

export const ActiveLostAlertBanner: React.FC<ActiveLostAlertBannerProps> = ({
  alerts,
  tripId,
  onOpenLostModal,
  onNavigateToPoint,
}) => {
  if (!alerts || alerts.length === 0) return null;

  const currentUser = getCurrentUserProfile();
  const mostRecent = alerts[0];
  const isMyAlert = mostRecent.userId === currentUser.id;

  return (
    <div
      id="active-lost-alert-banner"
      className="mb-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#B45309] via-[#D97706] to-[#F59E0B] text-white shadow-lg border-2 border-amber-300/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-xl shrink-0">
            🧭
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-black/30 text-amber-200 text-micro uppercase font-black tracking-wider flex items-center gap-1">
                <Radio className="w-3 h-3 text-amber-300 animate-ping" />
                <span>Separated Squad Alert</span>
              </span>
              <span className="text-micro opacity-90">
                {formatTimeAgo(mostRecent.timestamp)}
              </span>
            </div>

            <h4 className="font-display font-black text-h3 text-white mt-1">
              {isMyAlert ? "You Sent an 'I'm Lost' Alert" : `${mostRecent.userName} is Separated from Squad`}
            </h4>

            <p className="text-small text-amber-100 mt-0.5">
              {mostRecent.formattedDistanceFromGroup
                ? `Distance: ~${mostRecent.formattedDistanceFromGroup} ${mostRecent.directionFromGroup || ''}`
                : mostRecent.nearestLandmark || 'Location updating...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isMyAlert ? (
            <button
              onClick={() => resolveImLostAlert(tripId, mostRecent.id)}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-[#92400E] font-bold text-small shadow-md flex items-center gap-1.5 transition-all"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Found Squad</span>
            </button>
          ) : (
            mostRecent.isLocationAvailable &&
            onNavigateToPoint && (
              <button
                onClick={() =>
                  onNavigateToPoint(mostRecent.latitude, mostRecent.longitude, mostRecent.userName)
                }
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-[#92400E] font-bold text-small shadow-md flex items-center gap-1.5 transition-all"
              >
                <Navigation className="w-4 h-4 text-[#D97706]" />
                <span>Locate</span>
              </button>
            )
          )}

          <button
            onClick={onOpenLostModal}
            className="px-3 py-1.5 rounded-xl bg-black/25 hover:bg-black/40 text-white font-bold text-micro border border-white/20"
          >
            Meet Spot
          </button>
        </div>
      </div>
    </div>
  );
};
