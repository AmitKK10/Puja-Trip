import React from 'react';

/**
 * Standard fallback image for PujaTrip cards if an external image fails to load.
 * High-resolution authentic Durga Puja celebration photograph.
 */
export const DEFAULT_PUJA_FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%237F1D1D"/><stop offset="50%" stop-color="%23991B1B"/><stop offset="100%" stop-color="%23450A0A"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23bg)"/><circle cx="400" cy="270" r="110" fill="none" stroke="%23FBBF24" stroke-width="2" opacity="0.4"/><circle cx="400" cy="270" r="85" fill="none" stroke="%23F59E0B" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.5"/><path d="M400 200 L418 245 L465 245 L428 275 L442 320 L400 290 L358 320 L372 275 L335 245 L382 245 Z" fill="%23FEF08A" opacity="0.85"/><text x="400" y="420" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="%23FEF08A" text-anchor="middle" letter-spacing="1">শারদোৎসব ২০২৬ • PUJATRIP</text><text x="400" y="450" font-family="system-ui, sans-serif" font-size="13" fill="%23FDE68A" text-anchor="middle" opacity="0.8">Pandal Darshan</text></svg>';

/**
 * Safe image fallback handler to prevent broken-image icons or empty grey boxes.
 * Preserves object-cover and card dimensions.
 */
export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackSrc: string = DEFAULT_PUJA_FALLBACK_IMAGE
) => {
  const target = e.currentTarget;
  if (target && target.src !== fallbackSrc) {
    target.src = fallbackSrc;
  }
};
