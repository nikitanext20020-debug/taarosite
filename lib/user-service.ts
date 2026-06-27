/**
 * Сервис пользователей: upsert по telegramId, управление
 * подпиской и счётчиком бесплатных раскладов.
 */

import { prisma } from '@/lib/db';
import { site } from '@/lib/site';
import type { TgUser } from '@/lib/telegram/subscription';

export async function upsertUser(tg: TgUser) {
  if (!tg?.id) return null;
  const tgIdStr = String(tg.id);
  return prisma.user.upsert({
    where: { telegramId: tgIdStr },
    update: {
      username: tg.username ?? null,
      firstName: tg.first_name ?? null,
      lastName: tg.last_name ?? null,
      photoUrl: tg.photo_url ?? null,
    },
    create: {
      telegramId: tgIdStr,
      username: tg.username ?? null,
      firstName: tg.first_name ?? null,
      lastName: tg.last_name ?? null,
      photoUrl: tg.photo_url ?? null,
      freeReadsLeft: site.freeReadsDefault,
    },
  });
}

/** Создать или получить анонимного веб-пользователя */
export async function upsertWebUser(webId: string) {
  return prisma.user.upsert({
    where: { webId },
    update: {},
    create: {
      webId,
      freeReadsLeft: site.freeReadsDefault,
    },
  });
}

/** Записать результат проверки подписки в БД */
export async function setSubscription(tgId: number, subscribed: boolean) {
  return prisma.user.update({
    where: { telegramId: String(tgId) },
    data: { isSubscribed: subscribed, subCheckedAt: new Date() },
  });
}

/**
 * Может ли пользователь открыть расклад БЕЗ подписки (по счётчику бесплатных).
 */
export async function canReadForFree(params: { tgId?: number; webId?: string }): Promise<boolean> {
  const { tgId, webId } = params;
  if (!tgId && !webId) return false;

  const u = await prisma.user.findUnique({
    where: tgId ? { telegramId: String(tgId) } : { webId },
  });
  if (!u) return false;
  return u.freeReadsLeft > 0;
}

/** Списать один бесплатный расклад */
export async function consumeFreeRead(params: { tgId?: number; webId?: string }): Promise<number> {
  const { tgId, webId } = params;
  if (!tgId && !webId) throw new Error('Идентификатор пользователя обязателен');

  const u = await prisma.user.update({
    where: tgId ? { telegramId: String(tgId) } : { webId },
    data: { freeReadsLeft: { decrement: 1 } },
  });
  return u.freeReadsLeft;
}
