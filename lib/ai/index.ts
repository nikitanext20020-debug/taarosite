/**
 * Фабрика AI-провайдеров.
 * Выбор по env AI_PROVIDER: mock | openai | openrouter | claude
 *
 * По умолчанию — mock (работает без ключа).
 */

import type { AiProvider } from './provider';
import { MockProvider } from './mock';
import { OpenAIProvider } from './openai';
import { ClaudeProvider } from './claude';

let _provider: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (_provider) return _provider;

  const type = (process.env.AI_PROVIDER || 'mock').toLowerCase();

  try {
    switch (type) {
      case 'openai':
      case 'openrouter':
        _provider = new OpenAIProvider();
        break;
      case 'claude':
        _provider = new ClaudeProvider();
        break;
      case 'mock':
      default:
        _provider = new MockProvider();
        break;
    }
  } catch (e) {
    // Если ключа нет/ошибка инициализации — падаем на mock, чтобы воронка жила
    console.warn(`[AI] Не удалось инициализировать провайдер «${type}»: ${(e as Error).message}. Использую mock.`);
    _provider = new MockProvider();
  }

  return _provider;
}

export type { AiProvider, InterpretParams, InterpretResult } from './provider';

/**
 * Главная функция интерпретации расклада.
 */
export async function interpretReading(params: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<{ text: string; meta: import('./provider').InterpretResult['meta'] }> {
  const provider = getAiProvider();
  const result = await provider.interpret(params);
  return { text: result.text, meta: { ...result.meta, provider: provider.name } as any };
}
