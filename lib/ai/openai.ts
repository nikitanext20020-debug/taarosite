/**
 * OpenAI-совместимый провайдер.
 * Работает с OpenAI и с OpenRouter (через AI_BASE_URL).
 * Поддерживает ключи и модели OpenAI / OpenRouter.
 */

import type { AiProvider, InterpretParams, InterpretResult } from './provider';

export class OpenAIProvider implements AiProvider {
  readonly name: string;
  readonly model: string;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    const key = process.env.AI_API_KEY;
    const provider = process.env.AI_PROVIDER || 'openai';
    if (!key) throw new Error('AI_API_KEY не задан');

    this.apiKey = key;
    this.name = provider; // 'openai' | 'openrouter'
    this.model = process.env.AI_MODEL || 'gpt-4o-mini';
    this.baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  }

  async interpret(params: InterpretParams): Promise<InterpretResult> {
    const start = Date.now();
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        // OpenRouter рекомендует эти заголовки
        ...(this.name === 'openrouter'
          ? {
              'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
              'X-Title': 'Гадание от Лизы',
            }
          : {}),
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 1200,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`${this.name} API ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content ?? '';
    const usage = data.usage;

    return {
      text: text.trim(),
      meta: {
        latencyMs: Date.now() - start,
        model: this.model,
        tokensIn: usage?.prompt_tokens,
        tokensOut: usage?.completion_tokens,
      },
    };
  }
}
