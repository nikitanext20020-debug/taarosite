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
    
    const caption = 
      `Привет${name}! Я ${site.name} ✦\n\n` +
      `Я раскладываю разные колоды Таро: от классического Уэйта до таинственной «Безумной Луны». Я помогаю заглянуть в будущее, прояснить отношения и найти ответы на скрытые вопросы.\n\n` +
      `Моя нейросеть детально проанализирует каждую выпавшую карту и даст тебе глубокую и персональную интерпретацию.\n\n` +
      `Нажми кнопку ниже — и мы начнём твой первый расклад 🌙`;

    const base = site.appUrl.endsWith('/') ? site.appUrl.slice(0, -1) : site.appUrl;
    const photoUrl = `${base}/tarot_general_theme.png`;

    await ctx.replyWithPhoto(photoUrl, {
      caption: caption,
      reply_markup: kb,
    });
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
