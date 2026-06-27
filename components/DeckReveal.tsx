"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TarotCard } from "@/lib/tarot/types";
import { CARD_BACK } from "@/lib/tarot/deck";

/**
 * DeckReveal — 3D-колода Таро с анимацией расклада.
 *
 * Сценарий:
 * 1. Объёмная колода (много слоёв) слегка перемешивается.
 * 2. Карты достаются по одной в расклад и переворачиваются лицом вверх.
 * 3. Колода переворачивается, и карта со дна достаётся и откладывается.
 *
 * Использует картинки карт (card.image) и рубашку (cardBack).
 */

export interface RevealCard {
  card: TarotCard;
  reversed?: boolean;
  label?: string;
}

interface DeckRevealProps {
  /** Карты расклада (любое количество, оптимально 3–5). */
  spreadCards: RevealCard[];
  /** Карта «со дна колоды» — достаётся после переворота колоды. */
  bottomCard?: RevealCard | null;
  /** Автозапуск при монтировании (по умолчанию true). */
  autoPlay?: boolean;
  /** Колбэк по завершении анимации. */
  onComplete?: () => void;
  /**
   * URL рубашки карты. Если не передать — берётся CARD_BACK по умолчанию.
   * Передай getBackImageUrl(deckId) для поддержки нескольких колод.
   */
  cardBack?: string;
}

const DECK_POS = { x: -320, y: 0 };
const ASIDE = { x: 90, y: 185 };
const N_LAYERS = 16;
const EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";

interface Place {
  tx: number;
  ty: number;
  rot: number;
  sc: number;
  flipped: boolean;
  on: boolean;
}

const atDeck = (): Place => ({
  tx: DECK_POS.x,
  ty: DECK_POS.y,
  rot: 0,
  sc: 1,
  flipped: false,
  on: false,
});

export default function DeckReveal({
  spreadCards,
  bottomCard = null,
  autoPlay = true,
  onComplete,
  cardBack,
}: DeckRevealProps) {
  const backSrc = cardBack ?? CARD_BACK;
  const isVideoBack = backSrc.endsWith('.webm') || backSrc.endsWith('.mp4');

  const all: RevealCard[] = bottomCard
    ? [...spreadCards, bottomCard]
    : [...spreadCards];

  const [places, setPlaces] = useState<Place[]>(() => all.map(atDeck));
  const [layersLeft, setLayersLeft] = useState(N_LAYERS);
  const [deckRot, setDeckRot] = useState(0);
  const [deckFlipped, setDeckFlipped] = useState(false);
  const [running, setRunning] = useState(false);
  const aliveRef = useRef(true);

  // позиции расклада: центрируем справа от колоды
  const n = spreadCards.length;
  const GAP = n > 3 ? 150 : 175;
  const startX = 90 - ((n - 1) * GAP) / 2;
  const slots = spreadCards.map((_, i) => ({
    x: startX + i * GAP,
    y: -40,
    rot: (i - (n - 1) / 2) * 4,
  }));

  const patch = useCallback((i: number, p: Partial<Place>) => {
    setPlaces((prev) =>
      prev.map((pl, idx) => (idx === i ? { ...pl, ...p } : pl)),
    );
  }, []);

  const sleep = (ms: number) =>
    new Promise<void>((res) => setTimeout(res, ms));

  const reset = useCallback(() => {
    setPlaces(all.map(atDeck));
    setLayersLeft(N_LAYERS);
    setDeckRot(0);
    setDeckFlipped(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all.length]);

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    reset();
    await sleep(320);
    if (!aliveRef.current) return;

    // лёгкое перемешивание
    setDeckRot(-2);
    await sleep(170);
    setDeckRot(2);
    await sleep(170);
    setDeckRot(0);
    await sleep(320);

    // достаём карты расклада по одной
    for (let i = 0; i < n; i++) {
      if (!aliveRef.current) return;
      patch(i, { on: true });
      patch(i, { ty: DECK_POS.y - 70, sc: 1.08 });
      setLayersLeft((l) => Math.max(2, l - 1));
      await sleep(380);
      patch(i, { tx: slots[i].x, ty: slots[i].y, rot: slots[i].rot });
      await sleep(520);
      patch(i, { flipped: true });
      await sleep(560);
      patch(i, { sc: 1 });
      await sleep(220);
    }

    await sleep(420);
    // переворот колоды + карта со дна
    if (bottomCard) {
      if (!aliveRef.current) return;
      setDeckFlipped(true);
      await sleep(1300); // подождем завершения переворота колоды
      const bi = n; // индекс нижней карты
      patch(bi, { on: true, flipped: true }); // сразу лицом вверх!
      patch(bi, { ty: DECK_POS.y - 70, sc: 1.08 });
      setLayersLeft((l) => Math.max(1, l - 1));
      await sleep(380);
      patch(bi, { tx: ASIDE.x, ty: ASIDE.y, rot: 0 });
      await sleep(520);
      patch(bi, { sc: 1 });
      await sleep(220);
    }

    if (!aliveRef.current) return;
    setRunning(false);
    onComplete?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, n, bottomCard, patch, reset, onComplete]);

  useEffect(() => {
    aliveRef.current = true;
    let t: ReturnType<typeof setTimeout> | undefined;
    if (autoPlay) t = setTimeout(() => run(), 500);
    return () => {
      aliveRef.current = false;
      if (t) clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const glowStyle: CSSProperties = {
    transform:
      "translate(" + DECK_POS.x + "px, " + (DECK_POS.y + 120) + "px)",
  };
  const deckStyle: CSSProperties = {
    transform:
      "translate(" +
      DECK_POS.x +
      "px, " +
      (deckFlipped ? DECK_POS.y - 30 : DECK_POS.y) +
      "px) rotateY(" +
      (deckFlipped ? 180 : 0) +
      "deg) rotateX(" +
      (deckFlipped ? 15 : 0) +
      "deg) rotateZ(" +
      deckRot +
      "deg)",
    transition: "transform 1.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
  };

  return (
    <div className="deckreveal-wrap">
      <div className="deckreveal-board">
        <div className="deckreveal-stage">
          {/* свечение под колодой */}
          <div className="dr-glow" style={glowStyle} />

          {/* КОЛОДА */}
          <div className="dr-deck" style={deckStyle}>
            {Array.from({ length: layersLeft }).map((_, i) => {
              const layerStyle: CSSProperties = {
                transform:
                  "translate(" + i * 0.7 + "px, " + -i * 0.7 + "px)",
                zIndex: i,
              };
              // Если колода перевернута лицом вверх, верхний слой колоды должен показывать лицо фоновой карты!
              const isTopLayerOfFlippedDeck = deckFlipped && i === layersLeft - 1;
              return (
                <div key={i} className="dr-layer" style={layerStyle}>
                  {isTopLayerOfFlippedDeck && bottomCard ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bottomCard.card.image} alt="" className="w-full h-full object-cover" />
                  ) : isVideoBack ? (
                    <video src={backSrc} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={backSrc} alt="" />
                  )}
                </div>
              );
            })}
          </div>

          {/* ДОСТАВАЕМЫЕ КАРТЫ */}
          {all.map((rc, i) => {
            const p = places[i];
            const cardStyle: CSSProperties = {
              transform:
                "translate(" +
                p.tx +
                "px, " +
                p.ty +
                "px) rotate(" +
                p.rot +
                "deg) scale(" +
                p.sc +
                ")",
              opacity: p.on ? 1 : 0,
              zIndex: 100 + i,
              transition: "transform 1.05s " + EASE + ", opacity 0.3s ease",
            };
            const innerStyle: CSSProperties = {
              transform: p.flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            };
            const frontImgStyle: CSSProperties | undefined = rc.reversed
              ? { transform: "rotate(180deg)" }
              : undefined;
            return (
              <div
                key={rc.card.id + "-" + i}
                className="dr-card"
                style={cardStyle}
              >
                <div className="dr-inner" style={innerStyle}>
                  <div className="dr-face dr-back">
                    {isVideoBack ? (
                      <video src={backSrc} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={backSrc} alt="" />
                    )}
                  </div>
                  <div className="dr-face dr-front">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={rc.card.image}
                      alt={rc.card.name}
                      style={frontImgStyle}
                    />
                    {rc.label ? (
                      <span className="dr-label">{rc.label}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .deckreveal-wrap {
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .deckreveal-board {
          position: relative;
          width: 820px;
          height: 540px;
          perspective: 1700px;
          transform-origin: top center;
        }
        .deckreveal-stage {
          position: absolute;
          inset: 0;
          transform-style: preserve-3d;
        }
        .dr-glow {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 180px;
          height: 60px;
          margin-left: -90px;
          margin-top: -30px;
          border-radius: 50%;
          background: radial-gradient(
            ellipse,
            rgba(232, 200, 122, 0.3),
            transparent 70%
          );
          filter: blur(6px);
          pointer-events: none;
        }
        .dr-card,
        .dr-deck {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 144px;
          height: 248px;
          margin-left: -72px;
          margin-top: -124px;
          transform-style: preserve-3d;
        }
        .dr-card {
          will-change: transform;
        }
        .dr-layer {
          position: absolute;
          inset: 0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
        }
        .dr-inner {
          position: absolute;
          inset: 0;
          transform-style: preserve-3d;
          transition: transform 0.9s ${EASE};
        }
        .dr-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 18px 34px rgba(0, 0, 0, 0.55);
        }
        .dr-front {
          transform: rotateY(180deg);
        }
        .dr-layer :global(img),
        .dr-face :global(img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .dr-label {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 6px 4px;
          text-align: center;
          font-size: 12px;
          color: #f6efdc;
          background: linear-gradient(
            to top,
            rgba(13, 8, 34, 0.85),
            transparent
          );
        }
        @media (max-width: 840px) {
          .deckreveal-board {
            transform: scale(0.8);
          }
        }
        @media (max-width: 680px) {
          .deckreveal-board {
            transform: scale(0.6);
            height: 460px;
          }
        }
        @media (max-width: 520px) {
          .deckreveal-board {
            transform: scale(0.46);
            height: 380px;
          }
        }
      `}</style>
    </div>
  );
}
