'use client';

/**
 * Карта Таро.
 * 3D-флип версия с вращением по Y-оси и глоу-подсветкой (как в Taroyal).
 */

import { useCallback, useState } from 'react';
import type { TarotCard } from '@/lib/tarot/types';
import { CARD_BACK } from '@/lib/tarot/deck';
import { getCardImageUrl } from '@/lib/tarot/decks';

interface Card3DProps {
  card?: TarotCard;
  faceUp: boolean;
  reversed?: boolean;
  interactive?: boolean;
  dealDelay?: number;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  label?: string;
  hint?: string;
  deckId?: string;
}

const sizeMap = {
  sm: { w: 'w-20 h-32', imgH: 'h-32' },
  md: { w: 'w-28 h-44', imgH: 'h-44' },
  lg: { w: 'w-36 h-56', imgH: 'h-56' },
};

export default function Card3D({
  card,
  faceUp,
  reversed = false,
  interactive = false,
  dealDelay = 0,
  size = 'md',
  onClick,
  label,
  hint,
  deckId,
}: Card3DProps) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!interactive) return;
      const r = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      setMousePos({ x: px, y: py });

      const pxOffset = px - 0.5;
      const pyOffset = py - 0.5;
      const multiplier = faceUp ? -1 : 1;
      setTilt({ rx: -pyOffset * 16, ry: pxOffset * 16 * multiplier });
    },
    [interactive, faceUp],
  );

  const sizeStyles = size === 'sm'
    ? { '--tarot-w': '96px', '--tarot-h': '165px', '--tarot-glow-inset': '-15px', '--tarot-glow-blur': '10px', '--tarot-star-size': '18px' } as React.CSSProperties
    : size === 'md'
    ? { '--tarot-w': '144px', '--tarot-h': '248px', '--tarot-glow-inset': '-20px', '--tarot-glow-blur': '15px', '--tarot-star-size': '24px' } as React.CSSProperties
    : { '--tarot-w': '220px', '--tarot-h': '380px', '--tarot-glow-inset': '-30px', '--tarot-glow-blur': '20px', '--tarot-star-size': '32px' } as React.CSSProperties;

  return (
    <div
      className="flex flex-col items-center gap-2"
      style={{
        animation: 'rise 0.5s ease-out forwards',
        animationDelay: `${dealDelay}ms`,
        opacity: 0,
      }}
    >
      <div
        className={`tarot-flip ${onClick ? 'cursor-pointer' : ''} ${
          faceUp ? 'is-flipped' : ''
        }`}
        style={{
          ...sizeStyles,
          '--mx': `${mousePos.x * 100}%`,
          '--my': `${mousePos.y * 100}%`,
          transform: interactive && isHovered
            ? `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(-14px) scale(1.05)`
            : undefined,
          transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.4s ease-in-out',
        } as React.CSSProperties}
        onMouseMove={handleMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setTilt({ rx: 0, ry: 0 });
        }}
        onClick={onClick}
      >
        {/* Glow-эффект сзади карты */}
        <div className="tarot-flip__glow" />

        {/* Поднимающиеся частицы при наведении */}
        {interactive && isHovered && (
          <div className="laid-card-hover-dust">
            <span style={{ left: '10%', animationDelay: '0s' }} />
            <span style={{ left: '30%', animationDelay: '0.4s' }} />
            <span style={{ left: '50%', animationDelay: '0.8s' }} />
            <span style={{ left: '70%', animationDelay: '1.2s' }} />
            <span style={{ left: '90%', animationDelay: '1.6s' }} />
          </div>
        )}

        <div className="tarot-flip__inner">
          {/* Рубашка карты */}
          <div className="tarot-flip__face tarot-flip__back relative">
            <div className="laid-card-frame" />
            <div className="laid-card-holo" />
            <div className="tarot-flip__pattern" />
            <span className="tarot-flip__star absolute z-10">✦</span>
          </div>

          {/* Лицевая сторона карты */}
          <div className="tarot-flip__face tarot-flip__front relative">
            <div className="laid-card-frame" />
            <div className="laid-card-holo" />
            {card ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getCardImageUrl(card.id, deckId || 'deviant-moon')}
                  alt={card.name}
                  className="h-full w-full object-cover"
                  draggable={false}
                  style={{ transform: reversed ? 'rotate(180deg)' : undefined }}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-void/90 to-transparent p-1.5">
                  <span className="block text-center font-display text-[11px] leading-tight text-gold-bright">
                    {card.name}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-midnight" />
            )}
          </div>
        </div>
      </div>

      {label && (
        <div className="text-center mt-1">
          <div className="font-display text-xs font-medium text-moon">{label}</div>
          {hint && <div className="text-[10px] text-moon/50">{hint}</div>}
        </div>
      )}
    </div>
  );
}
