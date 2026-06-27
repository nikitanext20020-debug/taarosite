/**
 * Mock-провайдер — работает БЕЗ API-ключа.
 * Генерирует осмысленный текст расклада по шаблонам таролога,
 * чтобы UI/воронка были полностью рабочими на старте.
 *
 * Когда появится реальный ключ (AI_PROVIDER=openai|...),
 * этот провайдер просто перестаёт использоваться.
 */

import type { AiProvider, InterpretParams, InterpretResult } from './provider';
import { DECK } from '../tarot/deck';

const INTROS = [
  'Я разложила для тебя карты, и они открывают очень интересную картину.',
  'Колода сейчас говорит с тобой особенно откровенно — послушай.',
  'Карты сложились в ясный узор, и я с радостью поделюсь тем, что вижу.',
  'Энергия этого расклада глубокая. Давай разберём её вместе.',
];

const ADVICE = [
  'Доверься интуиции — она сейчас точнее логики.',
  'Не торопи события: всходы уже проклюнулись, дай им время.',
  'Сделай первый шаг, даже если не видишь всей дороги.',
  'Поговори с тем, кого давно откладывал, — это сдвинет ситуацию.',
  'Позаботься о себе сейчас — это не эгоизм, а необходимость.',
  'Отпусти то, что уже не откликается, — освободится место для нового.',
];

const OUTROS = [
  'Помни: карты показывают вероятности, а не приговор. Выбор всегда за тобой. 💜',
  'Ты сильнее обстоятельств. Иди с открытым сердцем. ✨',
  'Если захочешь углубиться — я всегда рядом, приходи ещё. 🌙',
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export class MockProvider implements AiProvider {
  readonly name = 'mock';
  readonly model = 'mock-tarologist-v1';

  async interpret(params: InterpretParams): Promise<InterpretResult> {
    const start = Date.now();
    // Имитируем «думание» нейросети
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 800));

    const seed = hash(params.userPrompt);

    // Достаём карты из промпта (строки «- **Позиция**...»)
    const cardLines = params.userPrompt
      .split('\n')
      .filter((l) => l.trimStart().startsWith('- **'));

    const cardsParsed = cardLines.map((line) => {
      // Формат: - **Суть вопроса** (Главная энергия ситуации): Шут (прямое положение).
      const m = line.match(/-\s*\*\*(.+?)\*\*(\s*\(.+?\))?:\s*(.+?)\s*\((.+?)\)/);
      if (!m) {
        const cleaned = line.replace(/^-\s*\*\*/, '').replace(/\*\*/, '');
        const parts = cleaned.split(':');
        const pos = parts[0]?.trim() || 'Позиция';
        const cardWithState = parts[1]?.trim() || 'Карта';
        const reversed = cardWithState.toLowerCase().includes('перевёрнут') || cardWithState.toLowerCase().includes('перевернут');
        const cardName = cardWithState.split('(')[0]?.trim() || cardWithState;
        return { pos, card: cardName, reversed };
      }
      const pos = m[1].trim();
      const card = m[3].trim().replace(/\.$/, '');
      const reversed = m[4].toLowerCase().includes('перевёрнут') || m[4].toLowerCase().includes('перевернут');
      return { pos, card, reversed };
    });

    const intro = pick(INTROS, seed);

    const body = cardsParsed
      .map((c, i) => {
        // Находим карту в DECK по имени
        const cardObj = DECK.find((x) => x.name.toLowerCase() === c.card.toLowerCase());
        const meaning = cardObj
          ? (c.reversed ? cardObj.meaningReversed : cardObj.meaningUpright)
          : 'Эта карта указывает на важные аспекты вашей текущей жизненной ситуации.';
        const keywords = cardObj
          ? (c.reversed ? cardObj.keywordsReversed : cardObj.keywordsUpright).join(', ')
          : 'энергия, влияние';

        return `### **${c.pos}**: ${c.card} (${c.reversed ? 'перевёрнутое положение' : 'прямое положение'})  
*Ключевые значения:* ${keywords}  

${meaning} В контексте позиции «${c.pos}» этот символ заслуживает особого внимания в вашем раскладе.`;
      })
      .join('\n\n');

    const advice = pick(ADVICE, seed >> 3);
    const outro = pick(OUTROS, seed >> 5);

    const disclaimer = `

---
Важное напоминание:  
Таро — это инструмент для размышления. Ты сам несёшь полную ответственность за все свои решения и действия.  
Расклад не заменяет профессиональную юридическую, медицинскую или финансовую помощь.  
Также ты сам отвечаешь за своё эмоциональное и ментальное состояние после прочтения расклада.`;

    const text = [
      intro,
      '',
      body,
      '',
      `**Совет:** ${advice}`,
      '',
      outro,
      disclaimer,
    ].join('\n');

    return {
      text,
      meta: {
        latencyMs: Date.now() - start,
        model: this.model,
        tokensIn: Math.ceil(params.userPrompt.length / 4),
        tokensOut: Math.ceil(text.length / 4),
      },
    };
  }
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
