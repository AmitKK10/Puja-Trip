import React, { useState, useEffect } from 'react';
import { DhakIcon } from './BengaliMotifs';
import {
  isDhakRhythmPlaying,
  playFestiveDhakRhythm,
  stopFestiveDhakRhythm,
  subscribeDhakState,
  setDhakLoopVolume,
  getDhakLoopVolume,
} from '../../utils/audioSynth';
import { UserPreferences } from '../../types';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Music,
  Sliders,
} from 'lucide-react';

interface DhakAudioControllerProps {
  userPrefs: UserPreferences;
  onUpdatePrefs?: (updater: (prev: UserPreferences) => UserPreferences) => void;
  isDarkMode?: boolean;
}

export const DhakAudioController: React.FC<DhakAudioControllerProps> = ({
  userPrefs,
  onUpdatePrefs,
  isDarkMode = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBeat, setActiveBeat] = useState(0);
  const [volume, setVolume] = useState(() => getDhakLoopVolume());
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Sync with audio engine state
  useEffect(() => {
    const unsubscribe = subscribeDhakState((playing, beat, currentVol) => {
      setIsPlaying(playing);
      setActiveBeat(beat);
      setVolume(currentVol);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Handle global sound mute
  useEffect(() => {
    if (!userPrefs.soundEnabled && isPlaying) {
      stopFestiveDhakRhythm();
    }
  }, [userPrefs.soundEnabled, isPlaying]);

  const toggleDhak = () => {
    setHasInteracted(true);
    if (isPlaying) {
      stopFestiveDhakRhythm();
    } else {
      if (!userPrefs.soundEnabled && onUpdatePrefs) {
        onUpdatePrefs((prev) => ({ ...prev, soundEnabled: true }));
      }
      playFestiveDhakRhythm(undefined, volume);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setDhakLoopVolume(newVol);
    if (onUpdatePrefs) {
      onUpdatePrefs((prev) => ({ ...prev, dhakVolume: newVol }));
    }
  };

  // Traditional rhythm labels: 15-step pattern
  const beatNames = ['Dha', 'Kanshor', 'Ta', 'Khi', 'Ta', 'Khi', 'Dha', 'Kanshor', 'Tin', 'Tin', 'Ta', 'Khi', 'Dha', 'Dha', 'Kanshor'];
  const currentBeatName = beatNames[activeBeat % beatNames.length] || 'Dha';

  return (
    <div
      id="persistent-dhak-controller"
      className="fixed bottom-20 right-3 sm:right-6 z-40 select-none print:hidden"
    >
      {/* Expanded Control Card */}
      {isExpanded && (
        <div
          id="dhak-controller-expanded-panel"
          className={`mb-2 w-72 sm:w-80 rounded-3xl p-4 border shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            isDarkMode
              ? 'bg-[#1C1418]/95 border-amber-500/40 text-white shadow-black/60'
              : 'bg-[#FFFDF9]/95 border-amber-300 text-stone-900 shadow-stone-900/20'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm transition-all ${
                  isPlaying
                    ? 'bg-gradient-to-br from-[#DC2626] to-[#991B1B] animate-pulse'
                    : 'bg-stone-500'
                }`}
              >
                <DhakIcon size={18} />
              </div>
              <div>
                <h4 className="font-display font-black text-btn leading-tight flex items-center gap-1.5">
                  <span>Dhak Soundscape</span>
                  {isPlaying && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  )}
                </h4>
                <p className="font-bengali text-micro text-[#DC2626] dark:text-[#FEF08A] font-bold">
                  শারদীয় ঐতিহ্যবাহী ঢাকের বাদ্য
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors"
              title="Minimize Controller"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Real-time Rhythm Equalizer Visualizer */}
          <div className="my-3 p-2.5 rounded-2xl bg-black/5 dark:bg-black/30 border border-stone-200/60 dark:border-stone-800/80">
            <div className="flex items-center justify-between text-micro font-bold mb-1.5 text-stone-600 dark:text-stone-300">
              <span className="flex items-center gap-1">
                <Music className="w-3 h-3 text-[#DC2626]" />
                <span>Rhythm Beat:</span>
              </span>
              <span className="font-mono text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                {isPlaying ? currentBeatName : 'Paused'}
              </span>
            </div>

            {/* 15 animated visualizer bars */}
            <div className="flex items-end justify-between gap-1 h-8 px-1">
              {beatNames.map((name, idx) => {
                const isActive = isPlaying && activeBeat % beatNames.length === idx;
                const isHeavy = name === 'Dha' || name === 'Kanshor';
                return (
                  <div
                    key={idx}
                    className="flex-1 rounded-full transition-all duration-75"
                    style={{
                      height: isActive
                        ? '100%'
                        : isPlaying
                        ? isHeavy
                          ? '45%'
                          : '25%'
                        : '15%',
                      backgroundColor: isActive
                        ? '#DC2626'
                        : isPlaying
                        ? isHeavy
                          ? isDarkMode ? '#F59E0B' : '#B45309'
                          : isDarkMode ? '#6B7280' : '#D1D5DB'
                        : isDarkMode ? '#374151' : '#E5E7EB',
                    }}
                    title={name}
                  />
                );
              })}
            </div>
          </div>

          {/* Volume Slider */}
          <div className="space-y-1.5 mb-3.5">
            <div className="flex items-center justify-between text-micro font-semibold text-stone-600 dark:text-stone-300">
              <span className="flex items-center gap-1">
                <Sliders className="w-3 h-3 text-stone-500" />
                <span>Volume</span>
              </span>
              <span className="tabular-nums font-bold text-stone-900 dark:text-stone-100">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newV = volume > 0.05 ? 0 : 0.75;
                  setVolume(newV);
                  setDhakLoopVolume(newV);
                }}
                className="text-stone-500 hover:text-stone-900 dark:hover:text-white"
                title={volume === 0 ? 'Unmute' : 'Mute'}
              >
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full accent-[#DC2626] h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Big Play / Stop Button */}
          <button
            id="btn-dhak-toggle-expanded"
            onClick={toggleDhak}
            className={`w-full py-2.5 px-4 rounded-2xl font-bold text-btn flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
              isPlaying
                ? 'bg-gradient-to-r from-stone-800 to-stone-900 hover:bg-black text-white border border-stone-700'
                : 'bg-gradient-to-r from-[#991B1B] to-[#DC2626] hover:brightness-110 text-white shadow-red-900/20'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>Pause Dhak Soundscape</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Start Festive Dhak Loop (ঢাক শুরু)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Floating Mini Pill / Toggle Button */}
      <div
        className={`flex items-center gap-1 rounded-full p-1.5 shadow-xl border transition-all ${
          isDarkMode
            ? 'bg-[#1C1418] border-amber-500/40 text-white'
            : 'bg-white border-stone-300 text-stone-900'
        } ${isPlaying ? 'ring-2 ring-[#DC2626]/50 ring-offset-2' : ''}`}
      >
        {/* Main Quick Play/Stop Action */}
        <button
          id="btn-dhak-quick-pill"
          onClick={toggleDhak}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full font-bold text-btn transition-all active:scale-95 shadow-xs ${
            isPlaying
              ? 'bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white shadow-md'
              : isDarkMode
              ? 'bg-stone-800 hover:bg-stone-700 text-amber-200'
              : 'bg-amber-50 hover:bg-amber-100 text-stone-900 border border-amber-300/80'
          }`}
          title={isPlaying ? 'Pause Dhak music loop' : 'Play traditional Dhak music loop'}
        >
          <div className={`relative ${isPlaying ? 'animate-bounce' : ''}`}>
            <DhakIcon size={18} />
          </div>

          <div className="flex flex-col items-start leading-none">
            <span className="text-micro font-bengali font-bold">
              {isPlaying ? 'ঢাক বাজছে...' : 'শারদ ঢাক'}
            </span>
            <span className="text-[10px] font-mono opacity-90">
              {isPlaying ? 'Playing Loop' : 'Play Loop'}
            </span>
          </div>

          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 ml-1 fill-white" />
          ) : (
            <Play className="w-3.5 h-3.5 ml-1 fill-current" />
          )}
        </button>

        {/* Expand/Collapse Toggle */}
        <button
          id="btn-dhak-expand-panel"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-2 rounded-full transition-colors ${
            isDarkMode
              ? 'text-stone-300 hover:text-white hover:bg-stone-800'
              : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100'
          }`}
          title={isExpanded ? 'Minimize sound options' : 'Open Dhak volume & visualizer'}
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
