/**
 * Интерфейс AI-провайдера.
 * Любая нейросеть (OpenAI / OpenRouter / Claude / Mock) реализует его.
 */

export interface InterpretParams {
  systemPrompt: string;
  userPrompt: string;
}

export interface InterpretResult {
  text: string;
  /** Метаданные для лога */
  meta: {
    tokensIn?: number;
    tokensOut?: number;
    latencyMs: number;
    model: string;
  };
}

export interface AiProvider {
  readonly name: string;
  readonly model: string;
  interpret(params: InterpretParams): Promise<InterpretResult>;
}
