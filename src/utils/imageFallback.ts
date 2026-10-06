import React from 'react';

/**
 * Standard fallback image for PujaTrip cards, custom pandals, and details.
 * High-resolution authentic Maa Durga / Durga Devi festive artwork.
 */
export const DEFAULT_DURGA_DEVI_IMAGE = '/assets/share/durga-devi.png';
export const DEFAULT_PUJA_FALLBACK_IMAGE = DEFAULT_DURGA_DEVI_IMAGE;

/**
 * Returns a valid pandal image URL or falls back to the official Durga Devi visual.
 */
export const getPandalImageSrc = (url?: string | null): string => {
  if (!url || typeof url !== 'string' || url.trim() === '' || url === 'undefined' || url === 'null') {
    return DEFAULT_DURGA_DEVI_IMAGE;
  }
  return url;
};

/**
 * Safe image error handler to prevent broken-image icons or empty grey boxes.
 * Gracefully switches the image source to the Goddess Durga visual.
 */
export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackSrc: string = DEFAULT_DURGA_DEVI_IMAGE
) => {
  const target = e.currentTarget;
  if (target && target.src !== fallbackSrc) {
    target.src = fallbackSrc;
  }
};

