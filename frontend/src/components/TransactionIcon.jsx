import React from 'react';

const TransactionIcon = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer coin ring with gradient */}
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="url(#goldGradient)"
        stroke="url(#goldStroke)"
        strokeWidth="1"
      />
      {/* Inner coin body with metallic effect */}
      <circle cx="16" cy="16" r="12" fill="url(#coinGradient)" />
      {/* Currency symbol */}
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="16"
        fontWeight="bold"
        fill="url(#symbolGradient)"
      >
        $
      </text>
      {/* Subtle highlight */}
      <circle cx="16" cy="16" r="12" fill="url(#highlight)" opacity="0.3" />

      {/* Gradients */}
      <defs>
        {/* Main gold gradient */}
        <radialGradient id="goldGradient" cx="0.3" cy="0.3" r="0.8">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF8C00" />
        </radialGradient>

        {/* Stroke gradient */}
        <linearGradient id="goldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE55C" />
          <stop offset="100%" stopColor="#FF6B35" />
        </linearGradient>

        {/* Coin body gradient */}
        <radialGradient id="coinGradient" cx="0.4" cy="0.4" r="0.6">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="20%" stopColor="#FFA500" />
          <stop offset="60%" stopColor="#FF8C00" />
          <stop offset="100%" stopColor="#DAA520" />
        </radialGradient>

        {/* Symbol gradient */}
        <linearGradient id="symbolGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFF8DC" />
        </linearGradient>

        {/* Highlight overlay */}
        <radialGradient id="highlight" cx="0.3" cy="0.3" r="0.5">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
};

export default TransactionIcon;