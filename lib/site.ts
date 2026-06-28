/**
 * Бренд «Лизы» и конфигурация сайта.
 * Значения берутся из env (см. .env.example), есть безопасные дефолты.
 * Меняешь .env — меняется всё отображение, без правки кода.
 */

export const site = {
  // Как представляться
  name: process.env.LIZA_NAME || 'Лиза',
  // Полное представление для hero / футера
  fullName: process.env.LIZA_FULL_NAME || 'Лиза · таролог',
  tone: (process.env.LIZA_TONE || 'myst') as 'warm' | 'mystic' | 'friendly' | 'myst', // Используем 'myst' как ключ для нашего расширенного мистического тона
  address: (process.env.LIZA_ADDRESS || 'ты') as 'ты' | 'вы',

  // Telegram
  botUsername: (process.env.LIZA_BOT_USERNAME || 'liza_taro_bot').replace(/^@/, ''),
  channelUsername: (process.env.CHANNEL_USERNAME || 'liza_taro').replace(/^@/, ''),
  channelId: process.env.CHANNEL_ID || '',

  // Приложение
  freeReadsDefault: Number(process.env.FREE_READS_DEFAULT || 1),
  appUrl: process.env.APP_URL || 'http://localhost:3000',
} as const;

export const toneVoice: Record<'warm' | 'mystic' | 'friendly' | 'myst', string> = {
  warm: 'тёплый, заботливый, поддерживающий',
  mystic: 'мистический, загадочный, многозначный',
  myst: 'таинственный, глубокий, проницательный, говорящий языком древних символов и загадок луны',
  friendly: 'дружеский, лёгкий, ободряющий',
};

// Ссылки Telegram
export const tgLinks = {
  // Канал для подписки (воронка)
  channel: `https://t.me/${site.channelUsername}`,
  // Бот
  bot: `https://t.me/${site.botUsername}`,
  // WebApp-ссылка на расклад или главную
  webapp: (spreadId?: string) => {
    const base = site.appUrl.endsWith('/') ? site.appUrl.slice(0, -1) : site.appUrl;
    return spreadId ? `${base}/divine/${spreadId}` : base;
  },
};
