/**
 * Типы раскладов (9 шт.) — как на taroyal.ru.
 * Каждый расклад задаёт массив позиций: сколько карт и что каждая значит.
 */

export interface SpreadPosition {
  /** 1-индексация */
  index: number;
  /** Название позиции */
  title: string;
  /** Короткое пояснение */
  hint: string;
}

export interface SpreadType {
  id: string;
  name: string;
  description: string;
  /** Кол-во карт */
  count: number;
  /** Иконка-эмодзи для карточки выбора */
  icon: string;
  /** Длительность чтения */
  duration: string;
  /** Позиции карт */
  positions: SpreadPosition[];
  /** Закрыт ли (замок) — пока откроем все */
  locked?: boolean;
}

export const SPREADS: SpreadType[] = [
  {
    id: 'three-cards',
    name: 'Три карты',
    description: 'Три карты на твой вопрос',
    count: 3,
    icon: '🕒',
    duration: '2 мин',
    positions: [
      { index: 1, title: 'Суть вопроса', hint: 'Главная энергия ситуации' },
      { index: 2, title: 'Что влияет', hint: 'Скрытые силы и обстоятельства' },
      { index: 3, title: 'К чему движется', hint: 'Вероятный итог и совет' },
    ],
  },
  {
    id: 'five-cards',
    name: 'Пять карт',
    description: 'Подробный разбор ситуации',
    count: 5,
    icon: '✦',
    duration: '3 мин',
    positions: [
      { index: 1, title: 'Суть', hint: 'Главная тема вопроса' },
      { index: 2, title: 'Причина', hint: 'Что привело к этому' },
      { index: 3, title: 'Что скрыто', hint: 'Неочевидное влияние' },
      { index: 4, title: 'Совет', hint: 'Как лучше поступить' },
      { index: 5, title: 'Итог', hint: 'Вероятный результат' },
    ],
  },
  {
    id: 'cross',
    name: 'Кельтский крест-мини',
    description: 'Классический расклад из 5 карт',
    count: 5,
    icon: '✚',
    duration: '3 мин',
    positions: [
      { index: 1, title: 'Ситуация', hint: 'Текущее положение дел' },
      { index: 2, title: 'Вызов', hint: 'Что преодолеваешь' },
      { index: 3, title: 'Основа', hint: 'Бессознательные мотивы' },
      { index: 4, title: 'Недавнее', hint: 'Что только что было' },
      { index: 5, title: 'Возможное', hint: 'Ближайшее будущее' },
    ],
  },
  {
    id: 'yes-no',
    name: 'Да или Нет',
    description: 'Чёткий ответ на вопрос',
    count: 1,
    icon: '⚖',
    duration: '1 мин',
    positions: [
      { index: 1, title: 'Ответ', hint: 'Карта-ответ с разъяснением' },
    ],
  },
  {
    id: 'decision',
    name: 'Выбор',
    description: 'Два пути и их исход',
    count: 5,
    icon: '⇄',
    duration: '3 мин',
    positions: [
      { index: 1, title: 'Вопрос', hint: 'В чём суть выбора' },
      { index: 2, title: 'Путь А — если', hint: 'Что будет, если выбрать первый вариант' },
      { index: 3, title: 'Путь Б — если', hint: 'Что будет, если выбрать второй вариант' },
      { index: 4, title: 'Что важно учесть', hint: 'Скрытый фактор' },
      { index: 5, title: 'Совет', hint: 'Куда склоняется судьба' },
    ],
  },
  {
    id: 'horseshoe',
    name: 'Подкова',
    description: '7 карт на удачу',
    count: 7,
    icon: '∞',
    duration: '4 мин',
    positions: [
      { index: 1, title: 'Исток', hint: 'Что привело к этой ситуации' },
      { index: 2, title: 'Сейчас', hint: 'Где ты находишься' },
      { index: 3, title: 'Скрытое', hint: 'То, чего не замечаешь' },
      { index: 4, title: 'Препятствия', hint: 'Что мешает' },
      { index: 5, title: 'Окружение', hint: 'Влияние людей и обстоятельств' },
      { index: 6, title: 'Совет', hint: 'Лучший образ действий' },
      { index: 7, title: 'Итог', hint: 'Финал при верном пути' },
    ],
  },
  {
    id: 'celtic-cross',
    name: 'Кельтский крест',
    description: 'Большой расклад из 10 карт',
    count: 10,
    icon: '✛',
    duration: '6 мин',
    positions: [
      { index: 1, title: 'Суть', hint: 'Сердце вопроса' },
      { index: 2, title: 'Перекрёстная', hint: 'Что накладывается на суть' },
      { index: 3, title: 'Основа', hint: 'Фундамент ситуации' },
      { index: 4, title: 'Недавнее прошлое', hint: 'Что привело к этому' },
      { index: 5, title: 'Возможное', hint: 'Лучший вариант развития' },
      { index: 6, title: 'Ближайшее', hint: 'Что будет в ближайшие дни' },
      { index: 7, title: 'Ты сам', hint: 'Твоя позиция и состояние' },
      { index: 8, title: 'Окружение', hint: 'Люди и влияния вокруг' },
      { index: 9, title: 'Надежды и страхи', hint: 'Внутренние ожидания' },
      { index: 10, title: 'Итог', hint: 'Финальный результат' },
    ],
  },
  {
    id: 'relationship',
    name: 'Совместимость',
    description: 'Расклад для двоих',
    count: 6,
    icon: '❦',
    duration: '4 мин',
    positions: [
      { index: 1, title: 'Ты', hint: 'Твоя роль в паре' },
      { index: 2, title: 'Партнёр', hint: 'Его/её роль' },
      { index: 3, title: 'Связь', hint: 'Что вас соединяет' },
      { index: 4, title: 'Сила союза', hint: 'На что опираться' },
      { index: 5, title: 'Слабое место', hint: 'Где трещина' },
      { index: 6, title: 'Перспектива', hint: 'Куда движетесь' },
    ],
  },
  {
    id: 'card-of-the-day',
    name: 'Карта дня',
    description: 'Совет на сегодня',
    count: 1,
    icon: '☀',
    duration: '1 мин',
    positions: [
      { index: 1, title: 'Карта дня', hint: 'Энергия и совет на грядущий день' },
    ],
  },
];

export const SPREAD_BY_ID = new Map<string, SpreadType>(
  SPREADS.map((s) => [s.id, s]),
);

export function getSpread(id: string): SpreadType {
  const spread = SPREAD_BY_ID.get(id);
  if (!spread) throw new Error(`Расклад "${id}" не найден`);
  return spread;
}

/** Темы вопросов */
export const THEMES = [
  { id: 'love', label: 'Любовь', icon: '❤' },
  { id: 'career', label: 'Карьера', icon: '★' },
  { id: 'money', label: 'Финансы', icon: '◈' },
  { id: 'self', label: 'Самопознание', icon: '☾' },
  { id: 'general', label: 'Общий вопрос', icon: '✦' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

/**
 * Пресеты вопросов по теме.
 * Отображаются как кнопки-чипы под выбором темы —
 * клик на чип заполняет поле вопроса.
 */
export const QUESTION_PRESETS: Record<string, string[]> = {
  love: [
    'Что он чувствует ко мне?',
    'О чём он думает?',
    'Каковы перспективы наших отношений?',
  ],
  career: [
    'Правильно ли я выбрала профессию?',
    'Стоит ли мне двигаться дальше?',
    'Как улучшить своё положение?',
  ],
  money: [
    'Как улучшить своё финансовое положение?',
    'Что мне мешает зарабатывать больше?',
  ],
  self: [
    'В чём моя сильная сторона?',
    'Что мне мешает двигаться вперёд?',
  ],
  general: [
    'Что меня ждёт в ближайшее время?',
    'На что обратить внимание?',
  ],
};
