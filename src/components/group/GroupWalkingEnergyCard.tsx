import React, { useState, useEffect } from 'react';
import {
  GroupMemberLocation,
  TripMember,
  UserWalkingEnergyConfig,
  WalkingSessionStats,
  UserPreferences,
} from '../../types';
import {
  getWalkingSessionStats,
  getWalkingEnergyConfig,
  saveWalkingEnergyConfig,
  getGroupWalkingActivities,
  STEPS_PER_KM,
} from '../../services/walkingEnergyService';
import {
  Footprints,
  Eye,
  EyeOff,
  Users,
  Info,
  TrendingUp,
  Flame,
  Award,
} from 'lucide-react';

interface GroupWalkingEnergyCardProps {
  memberLocations?: GroupMemberLocation[];
  members?: TripMember[];
  currentUserId: string;
  tripId?: string;
  userPrefs: UserPreferences;
}

export const GroupWalkingEnergyCard: React.FC<GroupWalkingEnergyCardProps> = ({
  memberLocations,
  members,
  currentUserId,
  tripId = 'default-trip',
  userPrefs,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const [walkingStats, setWalkingStats] = useState<WalkingSessionStats>(() =>
    getWalkingSessionStats(tripId)
  );
  const [config, setConfig] = useState<UserWalkingEnergyConfig>(() =>
    getWalkingEnergyConfig()
  );

  useEffect(() => {
    const handleStatsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<WalkingSessionStats>;
      if (customEvent.detail) setWalkingStats(customEvent.detail);
      else setWalkingStats(getWalkingSessionStats(tripId));
    };

    const handleConfigChanged = (e: Event) => {
      const customEvent = e as CustomEvent<UserWalkingEnergyConfig>;
      if (customEvent.detail) setConfig(customEvent.detail);
      else setConfig(getWalkingEnergyConfig());
    };

    window.addEventListener('pujatrip_walking_stats_updated', handleStatsUpdated);
    window.addEventListener('pujatrip_walking_config_changed', handleConfigChanged);

    return () => {
      window.removeEventListener('pujatrip_walking_stats_updated', handleStatsUpdated);
      window.removeEventListener('pujatrip_walking_config_changed', handleConfigChanged);
    };
  }, [tripId]);

  const activities = React.useMemo(() => {
    const list = memberLocations || members || [];
    return getGroupWalkingActivities(list, currentUserId, walkingStats, config);
  }, [memberLocations, members, currentUserId, walkingStats, config]);

  const handleToggleMySharing = () => {
    const updated = saveWalkingEnergyConfig({ shareWalkingStats: !config.shareWalkingStats });
    setConfig(updated);
  };

  // Find squad highest walker (non-competitive recognition)
  const sortedActivities = [...activities].sort((a, b) => b.distanceKm - a.distanceKm);

  return (
    <div
      id="group-walking-energy-card"
      className={`p-4 rounded-3xl border shadow-sm space-y-3.5 ${
        isDarkMode
          ? 'bg-[#22161E] border-stone-800 text-white'
          : 'bg-white border-stone-200 text-stone-900'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Footprints className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-display font-bold text-h4 text-[#881337] dark:text-[#FEF08A]">
              Squad Walking & Energy View (দলগত পরিভ্রমণ)
            </h4>
            <p className="font-bengali text-micro text-stone-500">
              বন্ধু দলের মোট হাঁটার দূরত্ব ও আনুমানিক পদক্ষেপ
            </p>
          </div>
        </div>

        {/* Privacy Toggle for Current User */}
        <button
          onClick={handleToggleMySharing}
          className={`px-2.5 py-1 rounded-xl text-micro font-bold border transition-all flex items-center gap-1 ${
            config.shareWalkingStats
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-500'
          }`}
          title="Toggle sharing your walking metrics with friends"
        >
          {config.shareWalkingStats ? (
            <>
              <Eye className="w-3 h-3" />
              <span>Sharing Stats</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3 h-3" />
              <span>Stats Hidden</span>
            </>
          )}
        </button>
      </div>

      {/* Member Activity List */}
      <div className="space-y-2">
        {sortedActivities.map((act, index) => {
          const isMe = act.userId === currentUserId;
          const isSharing = act.isSharingStats;

          return (
            <div
              key={act.userId}
              className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                isMe
                  ? isDarkMode
                    ? 'bg-[#2D1B25] border-[#DC2626]/40'
                    : 'bg-amber-50/70 border-amber-300'
                  : isDarkMode
                  ? 'bg-stone-900/40 border-stone-800'
                  : 'bg-stone-50 border-stone-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-small shrink-0">
                  {act.userName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-small truncate">
                      {act.userName}
                    </span>
                    {isMe && (
                      <span className="px-1.5 py-0.2 rounded-md bg-[#DC2626] text-white text-[9px] font-bold">
                        YOU
                      </span>
                    )}
                    {index === 0 && isSharing && (
                      <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] font-bold flex items-center gap-0.5">
                        <Award className="w-2.5 h-2.5" />
                        <span>Pandal Marathon</span>
                      </span>
                    )}
                  </div>
                  {act.bengaliName && (
                    <p className="font-bengali text-micro text-stone-500 truncate">
                      {act.bengaliName}
                    </p>
                  )}
                </div>
              </div>

              {/* Walking Metrics or Hidden status */}
              <div className="text-right shrink-0">
                {isSharing ? (
                  <div>
                    <span className="font-display font-black text-small text-stone-900 dark:text-white tabular-nums">
                      🚶 {act.distanceKm} km
                    </span>
                    <span className="block text-[10px] text-stone-500 tabular-nums font-semibold">
                      ~{act.estimatedSteps.toLocaleString()} steps • {act.walkingMinutes}m
                    </span>
                  </div>
                ) : (
                  <span className="text-micro font-bold text-stone-400 italic">
                    Stats hidden
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Non-medical Disclaimer */}
      <div className="pt-1 flex items-center gap-1.5 text-[10px] text-stone-400">
        <Info className="w-3 h-3 shrink-0" />
        <span>
          Squad walking stats are approximate estimations based on location deltas and routing pacing. Non-medical.
        </span>
      </div>
    </div>
  );
};
