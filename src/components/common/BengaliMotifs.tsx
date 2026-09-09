import React from 'react';

/**
 * Durga Third Eye & Eyebrows (Trinayan Motif)
 */
export const DurgaThirdEye: React.FC<{ className?: string; size?: number; color?: string }> = ({
  className = '',
  size = 28,
  color = '#991B1B',
}) => (
  <svg
    width={size}
    height={size * 0.75}
    viewBox="0 0 100 75"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
  >
    {/* Left Eye */}
    <path
      d="M10 38 C 22 20, 38 20, 48 38 C 38 52, 22 52, 10 38 Z"
      stroke={color}
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="#FFFDF9"
    />
    <circle cx="29" cy="36" r="6.5" fill={color} />
    <circle cx="31" cy="34" r="2.2" fill="#F59E0B" />

    {/* Left Eyebrow Arch */}
    <path
      d="M8 26 C 20 12, 38 14, 46 25"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />

    {/* Right Eye */}
    <path
      d="M52 38 C 62 20, 78 20, 90 38 C 78 52, 62 52, 52 38 Z"
      stroke={color}
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="#FFFDF9"
    />
    <circle cx="71" cy="36" r="6.5" fill={color} />
    <circle cx="69" cy="34" r="2.2" fill="#F59E0B" />

    {/* Right Eyebrow Arch */}
    <path
      d="M54 25 C 62 14, 80 12, 92 26"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />

    {/* Third Eye (Trinayan) in the Forehead */}
    <path
      d="M50 8 C 44 17, 44 24, 50 30 C 56 24, 56 17, 50 8 Z"
      stroke="#DC2626"
      strokeWidth="2.8"
      fill="#F59E0B"
    />
    <circle cx="50" cy="19" r="2.8" fill="#991B1B" />

    {/* Sindoor Tika on forehead */}
    <circle cx="50" cy="4" r="2.5" fill="#991B1B" />
  </svg>
);

/**
 * PujaTrip Brand Logo:
 * Merging Durga Eye, Route Pathway & Golden Kalash Aura
 */
export const PujaTripLogo: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark' | 'brand';
  showSubtitle?: boolean;
}> = ({ size = 'md', variant = 'brand', showSubtitle = true }) => {
  const isDark = variant === 'dark';
  
  const iconSize = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Visual Emblem */}
      <div
        className="relative flex items-center justify-center rounded-2xl shadow-md transition-transform active:scale-95 overflow-hidden"
        style={{
          width: iconSize,
          height: iconSize,
          background: 'linear-gradient(135deg, #991B1B 0%, #DC2626 50%, #B45309 100%)',
          border: '1.5px solid rgba(245, 158, 11, 0.4)',
        }}
      >
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.35),transparent_70%)]" />
        
        {/* Inner SVG Emblem */}
        <svg
          viewBox="0 0 44 44"
          className="w-7 h-7 relative z-10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Lotus Petal base */}
          <path
            d="M12 30 C 18 34, 26 34, 32 30 C 28 27, 16 27, 12 30 Z"
            fill="#FDE68A"
          />
          {/* Stylized Devi Eye & Trip Path */}
          <path
            d="M8 22 C 16 11, 28 11, 36 22 C 28 30, 16 30, 8 22 Z"
            stroke="#FFFDF9"
            strokeWidth="2.2"
            fill="#881337"
          />
          <circle cx="22" cy="21.5" r="4.5" fill="#F59E0B" />
          <circle cx="22" cy="21.5" r="2.2" fill="#7F1D1D" />
          <circle cx="23" cy="20.5" r="0.8" fill="#FFFDF9" />
          {/* Top Sindoor Bindi */}
          <circle cx="22" cy="7.5" r="2.2" fill="#FEF08A" />
          <path d="M22 10 L22 13" stroke="#FEF08A" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`font-display font-black tracking-tight ${
              size === 'sm' ? 'text-[16px]' : size === 'lg' ? 'text-h1' : 'text-h2'
            } ${isDark ? 'text-[#FFFDF9]' : 'text-[#881337]'}`}
          >
            Puja<span className="text-[#D97706]">Trip</span>
          </span>
          <span className="font-bengali font-bold text-h4 tracking-wide text-[#DC2626] opacity-95">
            পূজাত্রিপ
          </span>
        </div>
        {showSubtitle && (
          <span className="text-micro font-medium tracking-wider uppercase text-[#78716C] mt-0.5">
            Kolkata & Contai • <span className="font-bengali">শারদ পরিক্রমা</span>
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Traditional Bengali Dhak Drum Icon
 */
export const DhakIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block ${className}`}
  >
    {/* Kash Phool Feathers on Dhak */}
    <path
      d="M12 12 C 8 4, 16 2, 20 8"
      stroke="#D97706"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M10 8 C 6 2, 12 0, 16 6"
      stroke="#E5E7EB"
      strokeWidth="1.8"
      strokeLinecap="round"
    />

    {/* Dhak Main Barrel */}
    <ellipse cx="24" cy="26" rx="14" ry="17" fill="#78350F" />
    <path
      d="M10 26 C 10 16, 38 16, 38 26 C 38 36, 10 36, 10 26 Z"
      fill="#B45309"
    />
    {/* Red Cloth Wrap on Dhak */}
    <rect x="14" y="20" width="20" height="12" rx="3" fill="#DC2626" />
    
    {/* Tension Cords (Dori) */}
    <line x1="12" y1="12" x2="36" y2="40" stroke="#FDE68A" strokeWidth="1.5" />
    <line x1="36" y1="12" x2="12" y2="40" stroke="#FDE68A" strokeWidth="1.5" />
    <line x1="24" y1="10" x2="24" y2="42" stroke="#FDE68A" strokeWidth="1.2" />

    {/* Drum Head Rims */}
    <ellipse cx="12" cy="26" rx="3" ry="11" fill="#F3F4F6" stroke="#4B5563" strokeWidth="1.5" />
    <ellipse cx="36" cy="26" rx="3" ry="11" fill="#F3F4F6" stroke="#4B5563" strokeWidth="1.5" />

    {/* Kathi (Bamboo Sticks) */}
    <path d="M40 18 L32 24" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M38 32 L30 27" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

/**
 * Smoking Fragrant Dhunuchi Icon
 */
export const DhunuchiIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block ${className}`}
  >
    {/* Rising Smoke Curves */}
    <path
      d="M20 12 C 18 8, 22 6, 20 2"
      stroke="#D1D5DB"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="animate-dhunuchi"
    />
    <path
      d="M26 10 C 24 6, 28 4, 26 1"
      stroke="#E5E7EB"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="animate-dhunuchi"
    />

    {/* Glowing Embers in Bowl */}
    <ellipse cx="24" cy="16" rx="14" ry="4" fill="#EA580C" />
    <ellipse cx="24" cy="15" rx="9" ry="2.5" fill="#FBBF24" />

    {/* Clay Dhunuchi Bowl */}
    <path
      d="M10 16 C 11 26, 18 30, 21 31 L 21 38 C 17 39, 15 42, 14 45 L 34 45 C 33 42, 31 39, 27 38 L 27 31 C 30 30, 37 26, 38 16 Z"
      fill="#B45309"
      stroke="#78350F"
      strokeWidth="1.5"
    />

    {/* Extended Clay Handle */}
    <path
      d="M27 34 L 43 40 C 45 41, 45 43, 43 44 L 27 37"
      fill="#9A3412"
      stroke="#78350F"
      strokeWidth="1.2"
    />
  </svg>
);

/**
 * Sacred Shankha (Conch Shell)
 */
export const ShankhaIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block ${className}`}
  >
    <path
      d="M14 14 C 18 8, 32 8, 36 16 C 40 24, 34 36, 26 42 C 20 40, 18 36, 18 32 C 12 30, 10 22, 14 14 Z"
      fill="#FFFDF9"
      stroke="#D97706"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M20 18 C 24 14, 30 14, 33 18"
      stroke="#D97706"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M22 24 C 26 21, 30 22, 32 26"
      stroke="#D97706"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="28" cy="18" r="1.5" fill="#DC2626" />
  </svg>
);

/**
 * Authentic Bengali Alpana Divider
 */
export const AlpanaDivider: React.FC<{ className?: string; color?: string }> = ({
  className = '',
  color = '#D97706',
}) => (
  <div className={`flex items-center justify-center gap-2 my-4 opacity-75 ${className}`}>
    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#D97706]/40 to-[#D97706]" />
    <svg width="64" height="18" viewBox="0 0 64 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="9" r="4.5" fill={color} />
      <circle cx="32" cy="9" r="2" fill="#FFFDF9" />
      {/* Petals */}
      <path d="M32 1 C30 4, 34 4, 32 1 Z" fill={color} />
      <path d="M32 17 C30 14, 34 14, 32 17 Z" fill={color} />
      <path d="M22 9 C25 7, 25 11, 22 9 Z" fill={color} />
      <path d="M42 9 C39 7, 39 11, 42 9 Z" fill={color} />
      {/* Outer dots */}
      <circle cx="12" cy="9" r="2" fill={color} opacity="0.8" />
      <circle cx="4" cy="9" r="1.2" fill={color} opacity="0.5" />
      <circle cx="52" cy="9" r="2" fill={color} opacity="0.8" />
      <circle cx="60" cy="9" r="1.2" fill={color} opacity="0.5" />
    </svg>
    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#D97706]/40 to-[#D97706]" />
  </div>
);

/**
 * Corner Alpana Motif for Card Frames
 */
export const AlpanaCorner: React.FC<{
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
  size?: number;
  color?: string;
}> = ({ position = 'top-left', className = '', size = 36, color = '#D97706' }) => {
  const transform =
    position === 'top-right'
      ? 'scale(-1, 1)'
      : position === 'bottom-left'
      ? 'scale(1, -1)'
      : position === 'bottom-right'
      ? 'scale(-1, -1)'
      : 'none';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform }}
      className={`pointer-events-none opacity-60 ${className}`}
    >
      <path
        d="M2 2 L 20 2 C 20 12, 12 20, 2 20 Z"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="8" cy="8" r="3" fill={color} opacity="0.7" />
      <circle cx="2" cy="2" r="2" fill="#DC2626" />
      <path d="M2 28 C 14 28, 28 14, 28 2" stroke={color} strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  );
};
