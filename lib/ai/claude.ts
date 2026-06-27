/**
 * Anthropic Claude провайдер.
 */

import type { AiProvider, InterpretParams, InterpretResult } from './provider';

export class ClaudeProvider implements AiProvider {
  readonly name = 'claude';
  readonly model: string;
  private apiKey: string;

  constructor() {
    const key = process.env.AI_API_KEY;
    if (!key) throw new Error('AI_API_KEY не задан');
    this.apiKey = key;
    this.model = process.env.AI_MODEL || 'claude-3-5-haiku-20241022';
  }

  async interpret(params: InterpretParams): Promise<InterpretResult> {
    const start = Date.now();
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1200,
        system: params.systemPrompt,
        messages: [{ role: 'user', content: params.userPrompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Claude API ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    const text: string = data.content?.map((c: { text: string }) => c.text).join('') ?? '';

    return {
      text: text.trim(),
      meta: {
        latencyMs: Date.now() - start,
        model: this.model,
        tokensIn: data.usage?.input_tokens,
        tokensOut: data.usage?.output_tokens,
      },
    };
  }
}
