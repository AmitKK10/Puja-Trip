import React, { useState, useEffect, useMemo } from 'react';
import { Pandal } from '../../types';
import { playDhakHit, playKanshorBell } from '../../utils/audioSynth';
import confetti from 'canvas-confetti';
import {
  Camera,
  Heart,
  Sparkles,
  Eye,
  Clock,
  User,
  Share2,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Filter,
  Check,
  Flame,
  Award,
  Maximize2,
  Tag,
  ThumbsUp,
  Image as ImageIcon,
} from 'lucide-react';

export type GalleryCategory = 'all' | 'idol' | 'architecture' | 'lighting' | 'ambiance';

export interface CommunityPhoto {
  id: string;
  pandalId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  caption: string;
  contributorName: string;
  contributorAvatar?: string;
  timeAgo: string;
  category: GalleryCategory;
  visualTag: string;
  likesCount: number;
  hasLiked?: boolean;
  impressivenessRating: number; // e.g. 9.8
  cameraInfo?: string;
  isUserUploaded?: boolean;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
}

interface CommunityGalleryProps {
  pandal: Pandal;
  isDarkMode: boolean;
  onOpenFestiveCamera?: () => void;
}

const STORAGE_KEY_PREFIX = 'pujatrip_community_photos_';

const SAMPLE_CONTRIBUTORS = [
  { name: 'Riddhima Das', time: '35m ago', camera: 'iPhone 15 Pro • 48MP' },
  { name: 'Sourav Banerjee', time: '1h ago', camera: 'Pixel 8 Pro • Night Sight' },
  { name: 'Ananya Mukherjee', time: '2h ago', camera: 'Sony Alpha A7 IV' },
  { name: 'Debjit Sanyal', time: 'Today 7:20 PM', camera: 'Samsung S24 Ultra' },
  { name: 'Priya Chakraborty', time: 'Today 5:45 PM', camera: 'Fujifilm X-T5' },
];

export const CommunityGallery: React.FC<CommunityGalleryProps> = ({
  pandal,
  isDarkMode,
  onOpenFestiveCamera,
}) => {
  const storageKey = `${STORAGE_KEY_PREFIX}${pandal.id}`;

  const [activeCategory, setActiveCategory] = useState<GalleryCategory>('all');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newVisualTag, setNewVisualTag] = useState('Sanctum View');
  const [newCategory, setNewCategory] = useState<GalleryCategory>('idol');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Initial photos builder using strictly verified pandal photos
  const initialPhotos = useMemo(() => {
    const baseItems: CommunityPhoto[] = [];
    const validPhotos =
      pandal.images && pandal.images.length > 0
        ? pandal.images
        : (pandal.photos && pandal.photos.length > 0 ? pandal.photos : [pandal.heroImage]);

    validPhotos.forEach((photoUrl, idx) => {
      const contributor = SAMPLE_CONTRIBUTORS[idx % SAMPLE_CONTRIBUTORS.length];
      const tags = ['Grand Facade', 'Sanctum Darshan', 'Illumination View', 'Artistic Details'];
      const cats: GalleryCategory[] = ['architecture', 'idol', 'lighting', 'architecture'];

      baseItems.push({
        id: `pandal_core_${idx}`,
        pandalId: pandal.id,
        imageUrl: photoUrl,
        caption:
          idx === 0
            ? `Official darshan view of ${pandal.name}. ${pandal.themeConcept ? `Theme: ${pandal.themeConcept}.` : ''}`
            : `Visitor perspective of ${pandal.name} capturing the intricate decorative work.`,
        contributorName: contributor.name,
        timeAgo: contributor.time,
        category: cats[idx % cats.length],
        visualTag: tags[idx % tags.length],
        likesCount: 124 + idx * 47,
        impressivenessRating: Math.min(
          9.9,
          Math.round(((pandal.themeQualityScore || 9.6) + (idx % 2 === 0 ? 0.1 : -0.1)) * 10) / 10
        ),
        cameraInfo: contributor.camera,
      });
    });

    return baseItems;
  }, [pandal]);

  // Persistent community photos with local storage merge (filter legacy unsplash URLs)
  const [photos, setPhotos] = useState<CommunityPhoto[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const userSaved = parsed.filter(
            (p: CommunityPhoto) =>
              p.isUserUploaded && p.imageUrl && !p.imageUrl.includes('unsplash.com')
          );
          if (userSaved.length > 0) {
            return [...userSaved, ...initialPhotos];
          }
        }
      }
    } catch {
      // fallback
    }
    return initialPhotos;
  });

  // Keep photos synchronized with current pandal
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const userSaved = parsed.filter(
            (p: CommunityPhoto) =>
              p.isUserUploaded && p.imageUrl && !p.imageUrl.includes('unsplash.com')
          );
          if (userSaved.length > 0) {
            setPhotos([...userSaved, ...initialPhotos]);
            return;
          }
        }
      }
    } catch {
      // fallback
    }
    setPhotos(initialPhotos);
  }, [pandal.id, initialPhotos, storageKey]);

  // Persist user-uploaded photos
  const saveUserPhotos = (updated: CommunityPhoto[]) => {
    setPhotos(updated);
    try {
      const userOnly = updated.filter((p) => p.isUserUploaded);
      localStorage.setItem(storageKey, JSON.stringify(userOnly));
    } catch (e) {
      console.warn('Failed to save community photos to localStorage:', e);
    }
  };

  // Toggle Like with festive feedback
  const handleToggleLike = (photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id === photoId) {
          const willLike = !p.hasLiked;
          if (willLike) {
            playKanshorBell(0.6);
            playDhakHit('tin', 0.5);
          }
          return {
            ...p,
            hasLiked: willLike,
            likesCount: willLike ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
          };
        }
        return p;
      })
    );
  };

  // Filtered Photos
  const filteredPhotos = useMemo(() => {
    if (activeCategory === 'all') return photos;
    return photos.filter((p) => p.category === activeCategory);
  }, [photos, activeCategory]);

  // Average visual score from community photos
  const visualImpressivenessAverage = useMemo(() => {
    if (photos.length === 0) return pandal.themeQualityScore || 9.5;
    const sum = photos.reduce((acc, p) => acc + p.impressivenessRating, 0);
    return Math.round((sum / photos.length) * 10) / 10;
  }, [photos, pandal.themeQualityScore]);

  // Quick preset images for contributing using verified pandal photography
  const CONTRIBUTION_PRESETS = [
    {
      label: 'Idol Darshan Sanctum',
      url: (pandal.images && pandal.images[0]) || pandal.photos[0] || pandal.heroImage,
      category: 'idol' as GalleryCategory,
      tag: 'Sanctum Idol View',
    },
    {
      label: 'Architecture & Illumination',
      url: (pandal.images && (pandal.images[1] || pandal.images[0])) || pandal.photos[1] || pandal.photos[0] || pandal.heroImage,
      category: 'lighting' as GalleryCategory,
      tag: 'Night Illumination',
    },
  ];

  // Submit User Photo
  const handleAddCommunityPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    const url = newImageUrl.trim() || CONTRIBUTION_PRESETS[0].url;
    const caption = newCaption.trim() || `My view of ${pandal.name} this year!`;

    const newPhoto: CommunityPhoto = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      pandalId: pandal.id,
      imageUrl: url,
      caption,
      contributorName: 'You (Puja Explorer)',
      timeAgo: 'Just now',
      category: newCategory,
      visualTag: newVisualTag || 'Community Darshan',
      likesCount: 1,
      hasLiked: true,
      impressivenessRating: 9.8,
      cameraInfo: 'Smartphone Camera',
      isUserUploaded: true,
    };

    saveUserPhotos([newPhoto, ...photos]);
    setShowUploadModal(false);
    setNewCaption('');
    setNewImageUrl('');

    playKanshorBell(0.8);
    playDhakHit('dha', 0.8);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#DC2626', '#F59E0B', '#FEF08A'],
    });
  };

  // Lightbox navigation
  const handlePrevPhoto = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((prev) =>
      prev === null ? null : (prev - 1 + filteredPhotos.length) % filteredPhotos.length
    );
  };

  const handleNextPhoto = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((prev) =>
      prev === null ? null : (prev + 1) % filteredPhotos.length
    );
  };

  const selectedPhoto =
    selectedPhotoIndex !== null ? filteredPhotos[selectedPhotoIndex] : null;

  return (
    <section
      id="community-gallery-section"
      className={`p-4 sm:p-5 rounded-3xl border shadow-sm space-y-4 transition-all ${
        isDarkMode
          ? 'bg-[#281B23] border-[#F59E0B]/20 text-white'
          : 'bg-white border-[#D97706]/20 text-stone-800'
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-[#DC2626] to-[#881337] text-white flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4 text-[#FEF08A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A] leading-tight">
                  Community Gallery (এই বছরের ছবি)
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#DC2626]/10 text-[#DC2626] dark:bg-[#FEF08A]/15 dark:text-[#FEF08A] border border-[#DC2626]/20">
                  2026 Edition
                </span>
              </div>
              <p className="text-micro text-stone-500 dark:text-stone-400 font-bengali">
                দর্শনার্থীদের তোলা লাইভ ছবি ও চাক্ষুষ অভিজ্ঞতার ঝলক
              </p>
            </div>
          </div>
        </div>

        {/* Impressiveness Badge */}
        <div className="text-right shrink-0 bg-stone-50 dark:bg-stone-800/80 p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
            Visual Score
          </span>
          <div className="flex items-center justify-end gap-1 text-[#DC2626] dark:text-[#FEF08A] font-black text-base tabular-nums">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>{visualImpressivenessAverage.toFixed(1)}/10</span>
          </div>
          <span className="text-[10px] text-stone-500 block">
            {photos.length} photos shared
          </span>
        </div>
      </div>

      {/* Visual Impressiveness Guide Card */}
      <div
        className={`p-3.5 rounded-2xl border ${
          isDarkMode
            ? 'bg-stone-900/60 border-stone-800 text-stone-200'
            : 'bg-amber-500/10 border-amber-500/20 text-stone-800'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <Award className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-small">
            <div className="flex items-center gap-2 flex-wrap">
              <strong className="font-bold text-[#881337] dark:text-[#FEF08A]">
                Visual Impressiveness Verdict:
              </strong>
              <span className="text-micro font-extrabold px-2 py-0.5 rounded-md bg-[#DC2626] text-white">
                {pandal.idolQualityScore >= 9.7 ? '★ Must-See Visual Marvel' : 'Top Artistic Installation'}
              </span>
            </div>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-micro sm:text-small">
              {pandal.category === 'chandannagar_lights'
                ? 'Known for jaw-dropping illuminations. Best visited after 7:30 PM to witness the dynamic LED gates.'
                : pandal.category === 'traditional_sabeki'
                ? 'World-renowned for pristine classical Daaker Saaj. The sanctum lighting is serene and sublime throughout the day.'
                : 'Architectural installation with 360° craftsmanship. The exterior illumination and sculpted sanctum ceiling create dramatic visual contrast.'}
            </p>
          </div>
        </div>

        {/* Visual Attributes Matrix */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-stone-200/60 dark:border-stone-800 text-center">
          <div className="p-1.5 rounded-xl bg-white/60 dark:bg-stone-800/40 border border-stone-200/50 dark:border-stone-700/50">
            <span className="text-[10px] text-stone-400 uppercase font-bold block">Artistry</span>
            <span className="text-small font-black text-[#DC2626] dark:text-amber-300 tabular-nums">
              {pandal.themeQualityScore.toFixed(1)}/10
            </span>
          </div>
          <div className="p-1.5 rounded-xl bg-white/60 dark:bg-stone-800/40 border border-stone-200/50 dark:border-stone-700/50">
            <span className="text-[10px] text-stone-400 uppercase font-bold block">Idol Glory</span>
            <span className="text-small font-black text-[#DC2626] dark:text-amber-300 tabular-nums">
              {pandal.idolQualityScore.toFixed(1)}/10
            </span>
          </div>
          <div className="p-1.5 rounded-xl bg-white/60 dark:bg-stone-800/40 border border-stone-200/50 dark:border-stone-700/50">
            <span className="text-[10px] text-stone-400 uppercase font-bold block">Night Lights</span>
            <span className="text-small font-black text-[#DC2626] dark:text-amber-300 tabular-nums">
              {Math.min(9.9, Math.round((pandal.popularityScore + 0.1) * 10) / 10)}/10
            </span>
          </div>
        </div>
      </div>

      {/* Category Tabs & Upload Action Button */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pt-1">
        <div className="flex items-center gap-1.5 shrink-0">
          {(
            [
              { id: 'all', label: 'All Photos', bengali: 'সব ছবি' },
              { id: 'idol', label: 'Idol', bengali: 'প্রতিমা' },
              { id: 'architecture', label: 'Architecture', bengali: 'মণ্ডপ' },
              { id: 'lighting', label: 'Lighting', bengali: 'আলোর সাজ' },
              { id: 'ambiance', label: 'Aarti & Mood', bengali: 'পরিবেশ' },
            ] as Array<{ id: GalleryCategory; label: string; bengali: string }>
          ).map((tab) => {
            const isSelected = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveCategory(tab.id);
                  playDhakHit('tin', 0.4);
                }}
                className={`px-3 py-1.5 rounded-xl text-micro font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#881337] text-[#FEF08A] border-[#881337] shadow-xs'
                    : isDarkMode
                    ? 'bg-stone-800/70 text-stone-300 border-stone-700 hover:border-stone-600'
                    : 'bg-stone-100 text-stone-700 border-stone-200 hover:border-stone-300'
                }`}
              >
                <span>{tab.label}</span>
                <span className="opacity-70 font-bengali text-[10px] ml-1">({tab.bengali})</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            id="btn-add-community-photo"
            onClick={() => {
              setShowUploadModal(true);
              playKanshorBell(0.4);
            }}
            className="px-2.5 py-1.5 rounded-xl text-micro font-bold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
            title="Contribute photo"
          >
            <Plus className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Add Photo</span>
          </button>
        </div>
      </div>

      {/* Community Gallery Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="py-8 text-center rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-6">
          <ImageIcon className="w-8 h-8 text-stone-400 mx-auto mb-2" />
          <p className="text-small font-bold text-stone-600 dark:text-stone-400">
            No photos in this category yet.
          </p>
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className="mt-2 text-micro font-bold text-[#DC2626] dark:text-amber-400 underline cursor-pointer"
          >
            View All Photos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {filteredPhotos.map((photo, idx) => (
            <div
              key={photo.id}
              onClick={() => {
                setSelectedPhotoIndex(idx);
                playDhakHit('tin', 0.4);
              }}
              className="group relative rounded-2xl overflow-hidden border border-stone-200/80 dark:border-stone-800 bg-stone-900 cursor-pointer shadow-xs hover:shadow-md transition-all hover:scale-[1.02] aspect-4/3 sm:aspect-square"
            >
              <img
                src={photo.imageUrl}
                alt={photo.caption}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

              {/* Top Visual Badge */}
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-amber-300 border border-white/20">
                  {photo.visualTag}
                </span>

                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white tabular-nums border border-white/15">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>{photo.impressivenessRating}</span>
                </div>
              </div>

              {/* Bottom Contributor & Upvote Info */}
              <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-1.5 text-white">
                <div className="min-w-0 flex-1">
                  <p className="text-micro font-bold truncate drop-shadow-sm">
                    {photo.contributorName}
                  </p>
                  <p className="text-[10px] text-stone-300 opacity-90 truncate flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{photo.timeAgo}</span>
                  </p>
                </div>

                {/* Like Button */}
                <button
                  type="button"
                  onClick={(e) => handleToggleLike(photo.id, e)}
                  className={`p-1.5 rounded-xl backdrop-blur-md flex items-center gap-1 text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                    photo.hasLiked
                      ? 'bg-[#DC2626] text-white shadow-xs scale-105'
                      : 'bg-black/50 text-stone-200 hover:bg-black/70'
                  }`}
                  title="Approve / Like photo"
                >
                  <Heart
                    className={`w-3 h-3 ${photo.hasLiked ? 'fill-white' : ''}`}
                  />
                  <span className="tabular-nums text-[10px]">{photo.likesCount}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Full-screen Photo Modal */}
      {selectedPhoto !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-6 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          {/* Lightbox Top Header */}
          <div
            className="flex items-center justify-between text-white pb-2 max-w-4xl mx-auto w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-micro font-bold uppercase px-2.5 py-1 rounded-full bg-[#DC2626] text-white">
                {selectedPhoto.visualTag}
              </span>
              <span className="text-small text-stone-300 truncate">
                {pandal.name} (2026 Live Darshan)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-micro text-stone-400 tabular-nums">
                {(selectedPhotoIndex ?? 0) + 1} / {filteredPhotos.length}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPhotoIndex(null)}
                className="p-2 rounded-full bg-white/15 hover:bg-white/30 text-white transition-colors cursor-pointer"
                title="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Main Image Canvas */}
          <div
            className="relative flex-1 flex items-center justify-center max-w-4xl mx-auto w-full my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.imageUrl}
              alt={selectedPhoto.caption}
              className="max-h-[68vh] sm:max-h-[75vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain border border-white/10"
              referrerPolicy="no-referrer"
            />

            {/* Left Nav Arrow */}
            {filteredPhotos.length > 1 && (
              <button
                type="button"
                onClick={handlePrevPhoto}
                className="absolute left-2 sm:-left-12 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer"
                title="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Right Nav Arrow */}
            {filteredPhotos.length > 1 && (
              <button
                type="button"
                onClick={handleNextPhoto}
                className="absolute right-2 sm:-right-12 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer"
                title="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Lightbox Bottom Details Bar */}
          <div
            className="bg-stone-900/90 border border-white/10 rounded-2xl p-4 max-w-4xl mx-auto w-full text-white space-y-2 mt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <p className="text-small sm:text-body text-stone-100 font-medium leading-relaxed">
                  "{selectedPhoto.caption}"
                </p>
                <div className="flex items-center gap-3 text-micro text-stone-400 pt-1 flex-wrap">
                  <span className="font-bold text-amber-400">
                    By {selectedPhoto.contributorName}
                  </span>
                  <span>•</span>
                  <span>{selectedPhoto.timeAgo}</span>
                  {selectedPhoto.cameraInfo && (
                    <>
                      <span>•</span>
                      <span className="font-mono">{selectedPhoto.cameraInfo}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 uppercase block font-bold">
                    Visual Score
                  </span>
                  <span className="font-display font-black text-amber-400 text-small">
                    {selectedPhoto.impressivenessRating}/10
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleLike(selectedPhoto.id)}
                  className={`px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold text-small transition-all cursor-pointer ${
                    selectedPhoto.hasLiked
                      ? 'bg-[#DC2626] text-white shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      selectedPhoto.hasLiked ? 'fill-white' : ''
                    }`}
                  />
                  <span>{selectedPhoto.likesCount}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contribute Photo Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className={`w-full max-w-md rounded-3xl p-5 border shadow-2xl space-y-4 ${
              isDarkMode ? 'bg-[#1F171C] text-white border-stone-700' : 'bg-white text-stone-800 border-stone-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#DC2626]" />
                <h4 className="font-display font-black text-h4 text-[#881337] dark:text-[#FEF08A]">
                  Share Your View of {pandal.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCommunityPhoto} className="space-y-3.5">
              {/* Presets Selector */}
              <div>
                <label className="block text-micro font-bold uppercase text-stone-500 mb-1.5">
                  Select Visual Perspective
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CONTRIBUTION_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNewImageUrl(preset.url);
                        setNewVisualTag(preset.tag);
                        setNewCategory(preset.category);
                      }}
                      className={`p-2 rounded-xl text-left border text-micro transition-all cursor-pointer ${
                        newImageUrl === preset.url
                          ? 'bg-amber-500/20 border-amber-500 font-bold text-[#881337] dark:text-[#FEF08A]'
                          : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      <span className="block font-bold">{preset.label}</span>
                      <span className="text-[10px] opacity-75">{preset.tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-micro font-bold uppercase text-stone-500 mb-1">
                  What impressed you most? (সংক্ষিপ্ত মতামত)
                </label>
                <textarea
                  required
                  rows={2}
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="e.g. The lighting reflection on the pond is stunning this year, definitely worth visiting at night!"
                  className="w-full px-3.5 py-2 rounded-xl border text-small bg-stone-50 dark:bg-stone-800/70 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>

              {/* Tag Selection */}
              <div>
                <label className="block text-micro font-bold uppercase text-stone-500 mb-1">
                  Visual Impression Tag
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Sanctum Idol View',
                    'Night Illumination',
                    'Architectural Marvel',
                    'Dhunuchi Aarti Glow',
                    'Artisan Craftsmanship',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setNewVisualTag(tag)}
                      className={`px-2 py-1 rounded-lg text-micro font-bold border transition-all cursor-pointer ${
                        newVisualTag === tag
                          ? 'bg-[#DC2626] text-white border-[#DC2626]'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Bar */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-small font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-small font-bold bg-gradient-to-r from-amber-600 via-[#DC2626] to-[#881337] text-white shadow-md hover:brightness-110 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Share Photo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
