/**
 * Типы карт Таро.
 * Колода «Безумной Луны» (Deviant Moon) — стандартные 78 карт.
 */

export type Arcana = 'major' | 'minor';

export type Suit = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

export type Rank =
  | 'ace'
  | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
  | 'page' | 'knight' | 'queen' | 'king';

export const SUIT_LABEL: Record<Exclude<Suit, 'major'>, string> = {
  wands: 'жезлов',
  cups: 'кубков',
  swords: 'мечей',
  pentacles: 'денариев',
};

export const RANK_LABEL: Record<Rank, string> = {
  ace: 'Туз',
  '2': 'Двойка',
  '3': 'Тройка',
  '4': 'Четвёрка',
  '5': 'Пятёрка',
  '6': 'Шестёрка',
  '7': 'Семёрка',
  '8': 'Восьмёрка',
  '9': 'Девятка',
  '10': 'Десятка',
  page: 'Паж',
  knight: 'Рыцарь',
  queen: 'Дама',
  king: 'Король',
};

export interface TarotCard {
  /** 0–77, совпадает с именем файла public/deck/{id}.gif */
  id: number;
  /** Русское название (как на magiachisel.ru) */
  name: string;
  arcana: Arcana;
  suit: Suit;
  rank?: Rank;
  /** Короткие ключевые слова — для UI и для промпта нейросети */
  keywordsUpright: string[];
  keywordsReversed: string[];
  /** Краткое описание прямого положения */
  meaningUpright: string;
  /** Краткое описание перевёрнутого положения */
  meaningReversed: string;
  /** Путь к картинке */
  image: string;
}

/** Вытянутая карта в раскладе */
export interface DrawnCard {
  card: TarotCard;
  reversed: boolean;
  /** Позиция в раскладе (1-индексация), см. spread.positions */
  position: number;
}

/** Элемент карты для сериализации (без методов) */
export interface SerializedCard {
  id: number;
  name: string;
  reversed: boolean;
  position: number;
}
