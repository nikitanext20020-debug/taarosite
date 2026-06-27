/**
 * Webhook-бот на grammY.
 * - команда /start → приветствие + кнопка открыть Mini App
 * - раздаёт WebApp-ссылку на расклады
 * Webhook подключается в app/api/bot/webhook/route.ts
 */

import { Bot, InlineKeyboard, webhookCallback } from 'grammy';
import { site, tgLinks } from '@/lib/site';

let _bot: Bot | null = null;

export function getBot(): Bot {
  if (_bot) return _bot;
  const token = process.env.BOT_TOKEN;
  if (!token) throw new Error('BOT_TOKEN не задан');

  const bot = new Bot(token);

  bot.command('start', async (ctx) => {
    const name = ctx.from?.first_name ? `, ${ctx.from.first_name}` : '';
    const kb = new InlineKeyboard().webApp('🔮 Открыть гадание', tgLinks.webapp());
    await ctx.reply(
      `Привет${name}! Я ${site.name} ✦\n\n` +
        `Я раскладываю карты «Безумной Луны» и помогаю увидеть скрытое.\n\n` +
        `Нажми кнопку ниже — и мы начнём твой первый расклад.`,
      { reply_markup: kb },
    );
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(
      `Я ${site.name}. Открой гадание кнопкой меню или командой /start.\n` +
        `Канал: ${tgLinks.channel}`,
    );
  });

  _bot = bot;
  return bot;
}

/** Обработчик webhook (для Next.js route) */
export const handleWebhook = (bot: Bot) => webhookCallback(bot, 'std/http');
