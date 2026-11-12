import React, { useId } from 'react';

interface BrandLogoIconProps {
  className?: string;
}

/**
 * Minimalist geometric shield with embedded legal document lines & verification checkmark
 * in a deep indigo-to-violet gradient (#4F46E5 -> #7C3AED).
 */
export const BrandLogoIcon: React.FC<BrandLogoIconProps> = ({
  className = 'w-7 h-7',
}) => {
  const gradId = useId();
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="2"
          y1="2"
          x2="34"
          y2="34"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      {/* Geometric Shield Base */}
      <path
        d="M18 2.5L5.5 7.8V17.2C5.5 25.1 10.8 31.9 18 34C25.2 31.9 30.5 25.1 30.5 17.2V7.8L18 2.5Z"
        fill={`url(#${gradId})`}
      />
      {/* Subtle Inner Shield Highlight */}
      <path
        d="M18 4.4L7.3 9V17.1C7.3 23.9 11.8 29.8 18 31.8C24.2 29.8 28.7 23.9 28.7 17.1V9L18 4.4Z"
        stroke="white"
        strokeOpacity="0.22"
        strokeWidth="1"
      />
      {/* Embedded Document Clauses */}
      <path
        d="M12.5 12.2H21.5M12.5 16H18.2"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.88"
      />
      {/* Verification Checkmark */}
      <path
        d="M13.2 21.8L16.6 25L23.6 18"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
