/**
 * Реестр колод Таро.
 * Чтобы добавить новую колоду:
 * 1. Создай папку public/decks/[id]/ с картинками 0–77 (+ back)
 * 2. Добавь запись в массив DECKS ниже
 * 3. Готово — колода появится в выборе на сайте
 */

import { DECK } from './deck';

export interface DeckMeta {
  id: string;
  /** Название колоды (отображается на сайте) */
  name: string;
  /** Краткое описание — для чего лучше всего */
  description: string;
  /** ID раскладов, для которых эта колода особенно хороша */
  bestFor: string[];
  /** Папка в public/decks/[folder] */
  folder: string;
  /** Расширение файлов карт: 'avif' | 'gif' | 'jpg' | 'png' | 'webp' */
  cardExtension: 'avif' | 'gif' | 'jpg' | 'png' | 'webp';
}

export const DECKS: DeckMeta[] = [
  {
    id: 'deviant-moon',
    name: 'Безумная Луна',
    description:
      'Психологичная, тёмная и глубокая колода. Раскрывает теневые аспекты личности. Лучше всего для вопросов об отношениях, самопознания и сложных жизненных ситуаций.',
    bestFor: ['relationship', 'celtic-cross', 'five-cards', 'horseshoe'],
    folder: 'deviant-moon',
    cardExtension: 'avif',
  },
  {
    id: 'manara',
    name: 'Манара',
    description:
      'Чувственная, эротическая колода, созданная итальянским художником Мило Манара. Идеально подходит для раскладов на любовь, отношения, чувства и сексуальность.',
    bestFor: ['relationship', 'three-cards', 'five-cards'],
    folder: 'Манара',
    cardExtension: 'avif',
  },
  {
    id: 'waite-smith',
    name: 'Уэйт-Смит',
    description:
      'Классическая универсальная колода Райдера-Уэйта-Смит. Превосходно подходит для любых жизненных ситуаций, работы, финансов и общего анализа.',
    bestFor: ['celtic-cross', 'five-cards', 'horseshoe', 'yes-no', 'three-cards'],
    folder: 'Уэйт-Смит',
    cardExtension: 'avif',
  },
];

export const DEFAULT_DECK_ID = DECKS[0].id;

/** Получить метаданные колоды по ID (fallback — первая колода) */
export function getDeck(id?: string | null): DeckMeta {
  return DECKS.find((d) => d.id === id) ?? DECKS[0];
}

/** Путь к картинке карты в выбранной колоде */
export function getCardImageUrl(cardId: number, deckId?: string | null): string {
  const deck = getDeck(deckId);

  if (deck.id === 'waite-smith') {
    const card = DECK.find((c) => c.id === cardId);
    if (card) {
      // Фолбэк для отсутствующих Старших Арканов (0-7 и 17)
      if (card.suit === 'major' && (cardId <= 7 || cardId === 17)) {
        return `/decks/deviant-moon/${cardId}.avif`;
      }

      // Маппинг имен файлов для Уэйт-Смит
      if (card.suit === 'major') {
        const num = cardId.toString().padStart(2, '0');
        return `/decks/${deck.folder}/major_${num}.avif`;
      } else {
        let numStr = '';
        if (card.rank === 'ace') numStr = '01';
        else if (card.rank === 'page') numStr = '11';
        else if (card.rank === 'knight') numStr = '12';
        else if (card.rank === 'queen') numStr = '13';
        else if (card.rank === 'king') numStr = '14';
        else numStr = card.rank!.padStart(2, '0');

        return `/decks/${deck.folder}/${card.suit}_${numStr}.avif`;
      }
    }
  }

  if (deck.id === 'manara') {
    // В колоде Манара файлы используют двузначные индексы: 00.avif, 01.avif...
    const fileId = cardId.toString().padStart(2, '0');
    return `/decks/${deck.folder}/${fileId}.avif`;
  }

  return `/decks/${deck.folder}/${cardId}.${deck.cardExtension}`;
}

/** Путь к рубашке карты в выбранной колоде */
export function getBackImageUrl(deckId?: string | null): string {
  // Заменяем Back JPG / GIF на видео-рубашку Back Webm
  return '/video/back.webm';
}
