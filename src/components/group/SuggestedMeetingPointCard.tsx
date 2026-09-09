import React, { useState } from 'react';
import { SuggestedMeetingPoint } from '../../types';
import { Target, Users, MapPin, Compass, ArrowRight, ChevronDown, ChevronUp, Sparkles, Navigation, Info } from 'lucide-react';
import { playKanshorBell } from '../../utils/audioSynth';

interface SuggestedMeetingPointCardProps {
  meetingPoint: SuggestedMeetingPoint;
  onLocateOnMap?: () => void;
  onNavigateToPoint?: (lat: number, lng: number, name: string) => void;
  isDarkMode?: boolean;
}

export const SuggestedMeetingPointCard: React.FC<SuggestedMeetingPointCardProps> = ({
  meetingPoint,
  onLocateOnMap,
  onNavigateToPoint,
  isDarkMode = false,
}) => {
  const [showMemberDetails, setShowMemberDetails] = useState(false);

  return (
    <div
      id="suggested-meeting-point-card"
      className={`p-4 rounded-3xl border shadow-sm transition-all ${
        isDarkMode
          ? 'bg-gradient-to-r from-[#281B23] to-[#1C1418] border-amber-500/40 text-white'
          : 'bg-gradient-to-r from-[#FFFBEB] to-[#FEF3C7]/60 border-[#D97706]/30 text-stone-900'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#D97706] to-[#DC2626] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <Target className="w-6 h-6 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#DC2626] bg-[#DC2626]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Smart Meeting Point</span>
              </span>
              <span className="text-micro text-stone-500 dark:text-stone-400 font-medium">
                ({meetingPoint.activeMemberCount} squad members connected)
              </span>
            </div>

            <h4 className="font-display font-black text-h3 text-stone-900 dark:text-white mt-1">
              {meetingPoint.nearestLandmarkName}
            </h4>

            {meetingPoint.bengaliLandmarkName && (
              <p className="font-bengali text-small text-[#DC2626] dark:text-amber-300 font-bold">
                {meetingPoint.bengaliLandmarkName}
              </p>
            )}

            <p className="text-micro text-stone-500 dark:text-stone-400 mt-1">
              Calculated central midpoint • Avg. ~{meetingPoint.formattedAverageDistance} walking distance
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          {onNavigateToPoint ? (
            <button
              onClick={() => {
                playKanshorBell(0.6);
                onNavigateToPoint(
                  meetingPoint.latitude,
                  meetingPoint.longitude,
                  meetingPoint.nearestLandmarkName
                );
              }}
              className="px-3.5 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-small font-bold shadow-sm transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Meet Here</span>
            </button>
          ) : (
            onLocateOnMap && (
              <button
                onClick={onLocateOnMap}
                className="px-3.5 py-2 rounded-xl bg-[#DC2626] text-white text-small font-bold shadow-xs hover:bg-[#991B1B] transition-all flex items-center gap-1"
              >
                <span>Map</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )
          )}

          {meetingPoint.memberDistances && meetingPoint.memberDistances.length > 0 && (
            <button
              onClick={() => setShowMemberDetails(!showMemberDetails)}
              className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-micro font-bold flex items-center justify-center gap-1 hover:bg-stone-200"
            >
              <span>{showMemberDetails ? 'Hide' : 'Member Times'}</span>
              {showMemberDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Member walking times breakdown */}
      {showMemberDetails && meetingPoint.memberDistances && (
        <div className="mt-3.5 pt-3 border-t border-amber-200 dark:border-amber-900/50 space-y-2">
          <span className="text-micro font-bold uppercase text-stone-500 dark:text-stone-400">
            Estimated Walking Distance & Direction per Member:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {meetingPoint.memberDistances.map((m) => (
              <div
                key={m.userId}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-small ${
                  m.isCurrentUser
                    ? 'bg-amber-100/80 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 font-bold'
                    : 'bg-white/80 dark:bg-black/30 border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{m.userAvatar || '👤'}</span>
                  <span className="truncate">
                    {m.userName} {m.isCurrentUser && '(You)'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-micro">
                  <span className="text-stone-500 font-mono">{m.formattedDistance}</span>
                  <span className="px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold flex items-center gap-0.5">
                    <span>{m.arrowIcon}</span>
                    <span>{m.direction}</span>
                  </span>
                  <span className="text-stone-500">~{m.estimatedWalkingMinutes}m</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-micro flex items-start gap-2 text-stone-600 dark:text-stone-400 mt-2">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p>
              {meetingPoint.disclaimer ||
                'Meeting point is calculated algorithmically. Follow local police crowd gates and pedestrian walkways.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
