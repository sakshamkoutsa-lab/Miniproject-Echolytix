import React from 'react';

/** EchoLytix concentric-ring brand mark (inline SVG, no image asset needed). */
export const EchoLytixLogo: React.FC<{ size?: number; className?: string }> = ({ size = 40, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <circle cx="24" cy="24" r="21" stroke="#F4512A" strokeWidth="4" />
    <circle cx="24" cy="24" r="13.5" stroke="#F4512A" strokeWidth="4" />
    <circle cx="24" cy="24" r="6" fill="#F4512A" />
  </svg>
);
