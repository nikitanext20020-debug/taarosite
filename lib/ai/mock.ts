/**
 * Mock-провайдер — работает БЕЗ API-ключа.
 * Генерирует осмысленный текст расклада по шаблонам таролога,
 * чтобы UI/воронка были полностью рабочими на старте.
 *
 * Когда появится реальный ключ (AI_PROVIDER=openai|...),
 * этот провайдер просто перестаёт использоваться.
 */

import type { AiProvider, InterpretParams, InterpretResult } from './provider';

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

    // Достаём карты из промпта (строки «- Позиция ... : ...»)
    const cardLines = params.userPrompt
      .split('\n')
      .filter((l) => l.trimStart().startsWith('- Позиция'));

    const cardsParsed = cardLines.map((line) => {
      const m = line.match(/«(.+?)»:\s*(.+?)\s*\((.+?)\)/);
      if (!m) return { pos: 'Позиция', card: line, reversed: false };
      return {
        pos: m[1],
        card: m[2],
        reversed: m[3].includes('перевёрнут'),
      };
    });

    const intro = pick(INTROS, seed);

    const body = cardsParsed
      .map((c, i) => {
        const tone = c.reversed
          ? 'В перевёрнутом виде эта карта говорит об искажении или блокировке её энергии.'
          : 'В прямом положении её свет проявлен в полной мере.';
        return `**${c.pos} — ${c.card}.** ${tone} Это указывает на важный аспект твоей ситуации, требующий внимания.`;
      })
      .join('\n\n');

    const advice = pick(ADVICE, seed >> 3);
    const outro = pick(OUTROS, seed >> 5);

    const text = [
      intro,
      '',
      body,
      '',
      `**Совет:** ${advice}`,
      '',
      outro,
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
