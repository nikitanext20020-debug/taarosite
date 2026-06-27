/**
 * Логика тасовки и вытягивания карт.
 * Детерминированный ГПСЧ (mulberry32) —_seed сохраняем, чтобы
 * расклад можно было воспроизвести (для истории / шаринга).
 */

import { DECK } from './deck';
import type { TarotCard, DrawnCard, SerializedCard } from './types';
import type { SpreadType } from './spreads';

/** Генератор псевдослучайных чисел mulberry32 — детерминированный по seed */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Тасование Фишера-Йетса с заданным генератором */
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Создаём seed из строки (вопрос) + времени + случайного */
export function makeSeed(question?: string): number {
  let h = 2166136261;
  const s = `${question ?? ''}-${Date.now()}-${Math.random()}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface DrawResult {
  seed: number;
  cards: DrawnCard[];
}

/**
 * Вытянуть карты для расклада.
 * @param spread тип расклада
 * @param seed если задан — расклад воспроизводим
 * @param question вопрос (влияет на seed если он не задан)
 */
export function drawCards(
  spread: SpreadType,
  seed?: number,
  question?: string,
): DrawResult {
  const actualSeed = seed ?? makeSeed(question);
  const rng = mulberry32(actualSeed);

  const shuffled = shuffle(DECK, rng);
  const picked: TarotCard[] = shuffled.slice(0, spread.count);

  const cards: DrawnCard[] = picked.map((card, i) => {
    // Реверсируем карту случайным образом (например, с вероятностью 20%)
    const reversed = rng() < 0.2;
    return {
      card,
      reversed,
      position: i + 1,
    };
  });

  // Добавляем фоновую карту со дна колоды только для расклада "Три карты" (three-cards)
  if (spread.id === 'three-cards') {
    const bottomCard = shuffled[shuffled.length - 1];
    const bottomReversed = rng() < 0.2;
    cards.push({
      card: bottomCard,
      reversed: bottomReversed,
      position: 0,
    });
  }

  return { seed: actualSeed, cards };
}

/** Сериализация для БД / API */
export function serializeCards(cards: DrawnCard[]): SerializedCard[] {
  return cards.map((c) => ({
    id: c.card.id,
    name: c.card.name,
    reversed: c.reversed,
    position: c.position,
  }));
}

/** Восстановление DrawnCard[] из сериализованного вида */
export function deserializeCards(data: SerializedCard[]): DrawnCard[] {
  // импорт getCard здесь, чтобы избежать циклов
  const { getCard } = require('./deck') as typeof import('./deck');
  return data.map((c) => ({
    card: getCard(c.id),
    reversed: c.reversed,
    position: c.position,
  }));
}
