
import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 300 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <defs>
        <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0D2B45"/>
          <stop offset="60%" stopColor="#1A5F7A"/>
          <stop offset="100%" stopColor="#2E8FA5"/>
        </linearGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C9922A"/>
          <stop offset="100%" stopColor="#E8B84B"/>
        </linearGradient>
      </defs>

      {/* ICON (left side, 100x100 zone) */}
      <g transform="translate(10, 10)">
        {/* Outer hexagon */}
        <polygon 
          points="50,4 90,27 90,73 50,96 10,73 10,27"
          fill="none" 
          stroke="url(#iconGrad)" 
          strokeWidth="2" 
          opacity="0.2"
        />

        {/* Main circle */}
        <circle cx="50" cy="50" r="30" fill="none" stroke="url(#iconGrad)" strokeWidth="2.2"/>

        {/* 8 sun/shanyrak rays */}
        <g stroke="url(#goldGrad)" strokeWidth="1.8" strokeLinecap="round">
          <line x1="50" y1="14" x2="50" y2="22"/>
          <line x1="50" y1="78" x2="50" y2="86"/>
          <line x1="14" y1="50" x2="22" y2="50"/>
          <line x1="78" y1="50" x2="86" y2="50"/>
          <line x1="23.4" y1="23.4" x2="29.1" y2="29.1"/>
          <line x1="70.9" y1="70.9" x2="76.6" y2="76.6"/>
          <line x1="76.6" y1="23.4" x2="70.9" y2="29.1"/>
          <line x1="23.4" y1="76.6" x2="29.1" y2="70.9"/>
        </g>

        {/* Diamond (Kazakh motif) */}
        <polygon 
          points="50,26 64,50 50,74 36,50"
          fill="none" 
          stroke="url(#iconGrad)" 
          strokeWidth="2"
        />

        {/* 3 ascending dots (AI / knowledge growth) */}
        <circle cx="44" cy="57" r="4.5" fill="url(#iconGrad)"/>
        <circle cx="50" cy="50" r="5.2" fill="url(#iconGrad)"/>
        <circle cx="56" cy="43" r="3.5" fill="url(#goldGrad)"/>

        {/* Dashed connecting line */}
        <line 
          x1="44" y1="57" x2="56" y2="43"
          stroke="url(#goldGrad)" 
          strokeWidth="1.2" 
          strokeDasharray="2,2" 
          opacity="0.6"
        />

        {/* Corner accent dots */}
        <circle cx="36" cy="50" r="2" fill="url(#goldGrad)" opacity="0.7"/>
        <circle cx="64" cy="50" r="2" fill="url(#goldGrad)" opacity="0.7"/>
        <circle cx="50" cy="28" r="2" fill="url(#goldGrad)" opacity="0.7"/>
        <circle cx="50" cy="72" r="2" fill="url(#goldGrad)" opacity="0.7"/>
      </g>

      {/* TEXT (right side) */}
      <text 
        x="125" 
        y="62"
        fontFamily="'Cinzel', Georgia, serif"
        fontWeight="600"
        fontSize="38"
        letterSpacing="6"
        fill="#0D2B45"
        style={{ fontVariantCaps: 'small-caps' }}
      >
        BILGE
      </text>

      <text 
        x="127" 
        y="80"
        fontFamily="Georgia, serif"
        fontSize="10"
        letterSpacing="3.5"
        fill="#C9922A"
      >
        AI · БІЛІМ ПЛАТФОРМАСЫ
      </text>

      {/* Thin divider line between icon and text */}
      <line 
        x1="118" y1="20" x2="118" y2="100"
        stroke="#0D2B45" 
        strokeWidth="0.8" 
        opacity="0.12"
      />
    </svg>
  );
};
