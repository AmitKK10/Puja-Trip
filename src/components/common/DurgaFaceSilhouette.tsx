import React from 'react';

interface DurgaFaceSilhouetteProps {
  className?: string;
  size?: number;
  variant?: 'gold' | 'monochrome' | 'full';
}

/**
 * Authentic Maa Durga Iconography / Silhouette:
 * Traditional Bengali Daaker Saaj / Mukut with crescent moon,
 * ornate Kundan Mukut tiers, Trinayan (third eye), Sindoor bindi,
 * arched eyes, and auspicious Nath (nose ring).
 */
export const DurgaFaceSilhouette: React.FC<DurgaFaceSilhouetteProps> = ({
  className = '',
  size = 40,
  variant = 'gold',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 select-none ${className}`}
      aria-label="Maa Durga Silhouette"
    >
      <defs>
        <radialGradient id="durgaAura" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.4" />
          <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#78350F" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="goldMukut" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* Radiant Golden Halo */}
      <circle cx="50" cy="50" r="46" fill="url(#durgaAura)" />
      <circle cx="50" cy="50" r="45" stroke="#FDE68A" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

      {/* Crown Apex / Kalash Shikhara */}
      <path
        d="M50 8 C48 13, 44 17, 50 22 C56 17, 52 13, 50 8 Z"
        fill="url(#goldMukut)"
        stroke="#FEF08A"
        strokeWidth="1.2"
      />
      <circle cx="50" cy="6" r="2" fill="#FEF08A" />

      {/* Mukut Top Arch (Tier 1) */}
      <path
        d="M32 28 C40 18, 60 18, 68 28 C62 25, 38 25, 32 28 Z"
        fill="url(#goldMukut)"
        stroke="#FEF08A"
        strokeWidth="1"
      />

      {/* Mukut Middle Tier with Filigree Kundan Petals */}
      <path
        d="M24 38 C34 26, 66 26, 76 38 C68 33, 32 33, 24 38 Z"
        fill="url(#goldMukut)"
        stroke="#FEF08A"
        strokeWidth="1.2"
      />

      {/* Mukut Jewels */}
      <circle cx="50" cy="25" r="2" fill="#DC2626" />
      <circle cx="42" cy="27" r="1.5" fill="#DC2626" />
      <circle cx="58" cy="27" r="1.5" fill="#DC2626" />
      <circle cx="50" cy="34" r="2.2" fill="#DC2626" />
      <circle cx="38" cy="35" r="1.6" fill="#FEF08A" />
      <circle cx="62" cy="35" r="1.6" fill="#FEF08A" />

      {/* Mukut Broad Brow Base */}
      <path
        d="M20 45 C32 40, 68 40, 80 45 C70 41, 30 41, 20 45 Z"
        fill="#FEF08A"
        stroke="#D97706"
        strokeWidth="1"
      />

      {/* Third Eye (Trinayan) on Forehead */}
      <path
        d="M50 37 C46 43, 46 47, 50 51 C54 47, 54 43, 50 37 Z"
        fill="#DC2626"
        stroke="#FEF08A"
        strokeWidth="1"
      />
      <circle cx="50" cy="44" r="1.5" fill="#FEF08A" />

      {/* Sacred Chandan Bindi & Tilak above Trinayan */}
      <circle cx="50" cy="33" r="1.5" fill="#DC2626" />

      {/* Left Eyebrow Arch */}
      <path
        d="M26 51 C34 44, 44 47, 47 52"
        stroke="#FEF08A"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Left Eye */}
      <path
        d="M28 56 C34 50, 44 50, 47 56 C43 60, 33 60, 28 56 Z"
        fill="#FFFDF9"
        stroke="#B45309"
        strokeWidth="1.4"
      />
      <circle cx="38" cy="55" r="3.2" fill="#78350F" />
      <circle cx="39" cy="54" r="1.2" fill="#FEF08A" />

      {/* Right Eyebrow Arch */}
      <path
        d="M74 51 C66 44, 56 47, 53 52"
        stroke="#FEF08A"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Right Eye */}
      <path
        d="M72 56 C66 50, 56 50, 53 56 C57 60, 67 60, 72 56 Z"
        fill="#FFFDF9"
        stroke="#B45309"
        strokeWidth="1.4"
      />
      <circle cx="62" cy="55" r="3.2" fill="#78350F" />
      <circle cx="61" cy="54" r="1.2" fill="#FEF08A" />

      {/* Sacred Nose Bridge & Nose Tip */}
      <path
        d="M50 51 L49 67 L53 67"
        stroke="#FDE68A"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* Golden Nath (Ornate Bengali Nose Ring) */}
      <circle
        cx="59"
        cy="69"
        r="9"
        stroke="#FEF08A"
        strokeWidth="1.8"
        fill="none"
      />
      {/* Nath Small Pendant Pearl Beads */}
      <circle cx="59" cy="78" r="1.8" fill="#DC2626" />
      <circle cx="64" cy="76" r="1.4" fill="#FEF08A" />
      {/* Nath Golden Connecting Chain to Ear / Mukut */}
      <path
        d="M67 67 C76 63, 82 56, 85 48"
        stroke="#FDE68A"
        strokeWidth="1.2"
        strokeDasharray="2 1.5"
      />

      {/* Auspicious Red Bengali Lips */}
      <path
        d="M44 76 C47 74, 53 74, 56 76 C52 79, 48 79, 44 76 Z"
        fill="#DC2626"
        stroke="#991B1B"
        strokeWidth="1"
      />

      {/* Decorative Shiuli Flower Sprigs at Mukut base */}
      <circle cx="18" cy="46" r="3" fill="#FFFDF9" />
      <circle cx="18" cy="46" r="1.2" fill="#EA580C" />
      <circle cx="82" cy="46" r="3" fill="#FFFDF9" />
      <circle cx="82" cy="46" r="1.2" fill="#EA580C" />
    </svg>
  );
};
