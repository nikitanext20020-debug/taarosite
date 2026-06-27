'use client';

import React from 'react';

const EMOJI_MAPPING: Record<string, string> = {
  // Themes
  love: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f496/512.webp',
  career: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4bc/512.webp',
  money: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4b0/512.webp',
  self: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f52e/512.webp',
  general: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.webp',
  
  // Spreads
  'three-cards': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f552/512.webp',
  'five-cards': 'https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.webp',
  'cross': 'https://fonts.gstatic.com/s/e/notoemoji/latest/2795/512.webp',
  'yes-no': 'https://fonts.gstatic.com/s/e/notoemoji/latest/2696_fe0f/512.webp',
  'decision': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f500/512.webp',
  'horseshoe': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f9f2/512.webp',
  'celtic-cross': 'https://fonts.gstatic.com/s/e/notoemoji/latest/271f_fe0f/512.webp',
  'relationship': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f491/512.webp',
  'card-of-the-day': 'https://fonts.gstatic.com/s/e/notoemoji/latest/2600_fe0f/512.webp',
};

export default function AnimatedEmoji({
  id,
  fallback,
  className = 'w-6 h-6 object-contain inline-block',
}: {
  id: string;
  fallback: string;
  className?: string;
}) {
  const url = EMOJI_MAPPING[id];

  if (!url) {
    return <span className={className}>{fallback}</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={id}
      className={className}
      onError={(e) => {
        // Если вдруг отвалится CDN, показываем стандартный текстовый эмодзи
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const parent = target.parentElement;
        if (parent) {
          const textSpan = document.createElement('span');
          textSpan.className = className;
          textSpan.innerText = fallback;
          parent.appendChild(textSpan);
        }
      }}
    />
  );
}
