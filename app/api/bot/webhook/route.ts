/**
 * POST /api/bot/webhook
 * Webhook для Telegram-бота (grammY).
 * URL для регистрации: {APP_URL}/api/bot/webhook
 */

import { NextRequest } from 'next/server';
import { getBot, handleWebhook } from '@/lib/telegram/bot';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const bot = getBot();
    const handler = handleWebhook(bot);
    return await handler(req);
  } catch (e) {
    console.error('[/api/bot/webhook] error', e);
    return new Response('ok', { status: 200 });
  }
}
