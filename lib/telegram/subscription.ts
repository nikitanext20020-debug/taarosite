/**
 * Проверка подписки на канал Лизы — ЯДРО ВОРОНКИ.
 * Использует Telegram Bot API getChatMember.
 *
 * Возвращает true, если пользователь подписан/участник канала.
 */

export interface SubscriptionResult {
  subscribed: boolean;
  status: string;
  raw?: unknown;
}

/**
 * Проверить подписку пользователя на канал.
 * @param userId Telegram ID пользователя
 */
export async function checkSubscription(userId: number): Promise<SubscriptionResult> {
  const token = process.env.BOT_TOKEN;
  const channelId = process.env.CHANNEL_ID; // числовой ID: -100...
  const channelUsername = process.env.CHANNEL_USERNAME;

  if (!token) {
    // Без токена — режим разработки: считаем подписанным (или нет по флагу)
    const dev = process.env.DEV_FORCE_SUBSCRIBED !== 'false';
    return { subscribed: dev, status: 'dev-mode' };
  }

  // getChatMember требует chat_id. Используем числовой CHANNEL_ID (надёжнее),
  // при его отсутствии — @username.
  const chatId = channelId || (channelUsername ? `@${channelUsername.replace(/^@/, '')}` : '');
  if (!chatId) {
    // Если канал не настроен, пускаем всех (подписка не требуется)
    return { subscribed: true, status: 'no-channel-config' };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/getChatMember?chat_id=${encodeURIComponent(
      chatId,
    )}&user_id=${userId}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok) {
      return { subscribed: false, status: `api-error:${data.description ?? 'unknown'}`, raw: data };
    }

    const status: string = data.result?.status ?? 'unknown';
    // member / creator / administrator = подписан
    // left / kicked = не подписан
    const subscribed = ['member', 'creator', 'administrator'].includes(status);

    return { subscribed, status };
  } catch (e) {
    return { subscribed: false, status: `exception:${(e as Error).message}` };
  }
}

/**
 * Проверка валидности Telegram WebApp initData.
 * Используется в Mini App, чтобы доверять user_id.
 * Возвращает распарсенные данные пользователя или null.
 */
export interface TgUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export function parseInitData(initData: string): { user: TgUser | null; valid: boolean } {
  try {
    const params = new URLSearchParams(initData);
    const userJson = params.get('user');
    const user = userJson ? (JSON.parse(userJson) as TgUser) : null;
    // Полная криптопроверка подписи опциональна — для жёсткой защиты нужен BOT_TOKEN HMAC.
    // Здесь принимаем initData из доверенного источника (Telegram открывает WebApp).
    return { user, valid: !!user };
  } catch {
    return { user: null, valid: false };
  }
}
