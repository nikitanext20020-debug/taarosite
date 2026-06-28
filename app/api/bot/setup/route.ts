/**
 * GET /api/bot/setup
 * Регистрирует webhook бота на Telegram.
 * Запускать один раз после деплоя: curl {APP_URL}/api/bot/setup
 */

import { NextResponse } from 'next/server';
import { site } from '@/lib/site';

export const runtime = 'nodejs';

export async function GET() {
  const token = process.env.BOT_TOKEN;
  const appUrl = site.appUrl;
  if (!token) {
    return NextResponse.json({ error: 'BOT_TOKEN не задан' }, { status: 500 });
  }

  const baseUrl = (appUrl || '').replace(/\/$/, '');
  const webhookUrl = `${baseUrl}/api/bot/webhook`;
  const res = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`,
  );
  const data = await res.json();

  // Заодно задаём меню WebApp
  await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      menu_button: {
        type: 'web_app',
        text: '🔮 Гадание',
        web_app: { url: `${appUrl}/miniapp` },
      },
    }),
  }).catch(() => {});

  return NextResponse.json({ webhookUrl, telegram: data });
}
