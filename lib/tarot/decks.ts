/**
 * Реестр колод Таро.
 * Чтобы добавить новую колоду:
 * 1. Создай папку public/decks/[id]/ с картинками 0–77 (+ back)
 * 2. Добавь запись в массив DECKS ниже
 * 3. Готово — колода появится в выборе на сайте
 */

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
  /** Расширение файлов карт: 'gif' | 'jpg' | 'png' */
  cardExtension: 'gif' | 'jpg' | 'png' | 'webp';
}

export const DECKS: DeckMeta[] = [
  {
    id: 'deviant-moon',
    name: 'Безумная Луна',
    description:
      'Психологичная, тёмная и глубокая колода. Раскрывает теневые аспекты личности. Лучше всего для вопросов об отношениях, самопознания и сложных жизненных ситуаций.',
    bestFor: ['relationship', 'celtic-cross', 'five-cards', 'horseshoe'],
    folder: 'deviant-moon',
    cardExtension: 'gif',
  },
  // ──────────────────────────────────────────────────────────────────────────
  // ДОБАВЬ НОВУЮ КОЛОДУ ЗДЕСЬ (скопируй блок ниже и заполни поля):
  //
  // {
  //   id: 'my-new-deck',
  //   name: 'Название колоды',
  //   description: 'Для чего эта колода лучше всего подходит.',
  //   bestFor: ['three-cards', 'yes-no'], // spread IDs
  //   folder: 'my-new-deck',             // папка в public/decks/
  //   cardExtension: 'jpg',
  // },
  // ──────────────────────────────────────────────────────────────────────────
];

export const DEFAULT_DECK_ID = DECKS[0].id;

/** Получить метаданные колоды по ID (fallback — первая колода) */
export function getDeck(id?: string | null): DeckMeta {
  return DECKS.find((d) => d.id === id) ?? DECKS[0];
}

/** Путь к картинке карты в выбранной колоде */
export function getCardImageUrl(cardId: number, deckId?: string | null): string {
  const deck = getDeck(deckId);
  return `/decks/${deck.folder}/${cardId}.${deck.cardExtension}`;
}

/** Путь к рубашке карты в выбранной колоде */
export function getBackImageUrl(deckId?: string | null): string {
  const deck = getDeck(deckId);
  return `/decks/${deck.folder}/back.${deck.cardExtension}`;
}
