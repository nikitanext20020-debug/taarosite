/**
 * POST /api/check-subscription
 * Проверяет, подписан ли пользователь на канал Лизы.
 *
 * body: { tgUser: { id, ... } }
 * Возвращает: { subscribed: boolean, freeReadsLeft?: number }
 */

import { NextResponse } from 'next/server';
import { checkSubscription } from '@/lib/telegram/subscription';
import { upsertUser, setSubscription } from '@/lib/user-service';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { tgUser } = (await req.json()) as {
      tgUser?: { id: number; first_name?: string; username?: string };
    };

    if (!tgUser?.id) {
      return NextResponse.json({ error: 'tgUser.id обязателен' }, { status: 400 });
    }

    // 1. Реальная проверка через Telegram API
    const result = await checkSubscription(tgUser.id);

    // 2. upsert юзера + кэшируем статус
    await upsertUser(tgUser as any);
    await setSubscription(tgUser.id, result.subscribed);

    // 3. Текущий счётчик бесплатных
    const user = await prisma.user.findUnique({
      where: { telegramId: String(tgUser.id) },
      select: { freeReadsLeft: true },
    });

    return NextResponse.json({
      subscribed: result.subscribed,
      status: result.status,
      freeReadsLeft: user?.freeReadsLeft ?? 0,
    });
  } catch (e) {
    console.error('[/api/check-subscription] error', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
