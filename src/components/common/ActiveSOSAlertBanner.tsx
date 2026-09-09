import React from 'react';
import { TripSOSAlert, UserPreferences } from '../../types';
import { formatTimeAgo } from '../../utils/geoUtils';
import { AlertOctagon, Navigation, ShieldCheck, X, Radio } from 'lucide-react';
import { cancelGroupSOS } from '../../services/safetyAndUtilitiesService';
import { getCurrentUserProfile } from '../../services/friendGroupService';

interface ActiveSOSAlertBannerProps {
  alerts: TripSOSAlert[];
  tripId: string;
  onOpenSOSModal: () => void;
  onNavigateToCoords?: (lat: number, lng: number, name: string) => void;
  userPrefs: UserPreferences;
}

export const ActiveSOSAlertBanner: React.FC<ActiveSOSAlertBannerProps> = ({
  alerts,
  tripId,
  onOpenSOSModal,
  onNavigateToCoords,
}) => {
  if (!alerts || alerts.length === 0) return null;

  const currentUser = getCurrentUserProfile();
  const mostRecent = alerts[0];
  const isMyAlert = mostRecent.userId === currentUser.id;

  return (
    <div
      id="active-sos-alert-banner"
      className="mb-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#B91C1C] text-white shadow-lg border-2 border-red-300/60 animate-bounce"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-xl shrink-0">
            🚨
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-black/30 text-amber-200 text-micro uppercase font-black tracking-wider flex items-center gap-1">
                <Radio className="w-3 h-3 text-red-300 animate-ping" />
                <span>Emergency SOS Active</span>
              </span>
              <span className="text-micro opacity-90">
                {formatTimeAgo(mostRecent.timestamp)}
              </span>
            </div>

            <h4 className="font-display font-black text-h3 text-white mt-1">
              {isMyAlert ? 'Your SOS is Alerting the Squad' : `${mostRecent.userName} Activated Emergency SOS!`}
            </h4>

            <p className="text-small text-amber-100 mt-0.5">
              {mostRecent.isLocationAvailable
                ? `Location: ${mostRecent.nearestLandmark || `${mostRecent.latitude.toFixed(4)}, ${mostRecent.longitude.toFixed(4)}`}`
                : 'GPS Location Unavailable'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isMyAlert ? (
            <button
              onClick={() => cancelGroupSOS(tripId, mostRecent.id)}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-[#991B1B] font-bold text-small shadow-md flex items-center gap-1.5 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>I'm Safe</span>
            </button>
          ) : (
            mostRecent.isLocationAvailable &&
            onNavigateToCoords && (
              <button
                onClick={() =>
                  onNavigateToCoords(mostRecent.latitude, mostRecent.longitude, mostRecent.userName)
                }
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-[#991B1B] font-bold text-small shadow-md flex items-center gap-1.5 transition-all"
              >
                <Navigation className="w-4 h-4 text-[#DC2626]" />
                <span>Navigate</span>
              </button>
            )
          )}

          <button
            onClick={onOpenSOSModal}
            className="px-3 py-1.5 rounded-xl bg-black/25 hover:bg-black/40 text-white font-bold text-micro border border-white/20"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};
