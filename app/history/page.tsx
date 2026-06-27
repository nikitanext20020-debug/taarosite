/**
 * /history — история раскладов пользователя.
 * В вебе (без TG) показывает заглушку с предложением открыть в Telegram.
 * В Mini App — реальные расклады из БД по tgUser.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { initTelegram } from '@/components/TgInitData';
import { SPREAD_BY_ID } from '@/lib/tarot/spreads';
import { getCard } from '@/lib/tarot/deck';
import { tgLinks } from '@/lib/site';
import type { TgUser } from '@/lib/telegram/subscription';

interface ReadingRow {
  id: string;
  spreadType: string;
  theme: string | null;
  question: string | null;
  cards: { id: number; reversed: boolean; position: number }[];
  createdAt: string;
  revealed: boolean;
}

export default function HistoryPage() {
  const [tgUser, setTgUser] = useState<TgUser | null>(null);
  const [rows, setRows] = useState<ReadingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = initTelegram();
    setTgUser(u);

    let bodyData: any = {};
    if (u) {
      bodyData = { tgUser: u };
    } else {
      const wId = typeof window !== 'undefined' ? localStorage.getItem('liza_web_user_id') : null;
      if (wId) {
        bodyData = { webUserId: wId };
      } else {
        setLoading(false);
        return;
      }
    }

    fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    })
      .then((r) => r.json())
      .then((d) => setRows(d.readings ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="container-mystic py-20 text-center text-moon/50">
        Загружаю историю...
      </main>
    );
  }

  // Если истории нет вообще
  if (rows.length === 0) {
    if (!tgUser) {
      return (
        <main className="container-mystic py-20 text-center">
          <div className="mb-4 text-4xl">📜</div>
          <h1 className="mb-3 font-display text-2xl text-moon">История раскладов</h1>
          <p className="mb-6 text-moon/50">
            Чтобы видеть историю своих гаданий, открой приложение в Telegram.
          </p>
          <a href={tgLinks.bot} className="btn-primary">
            Открыть в Telegram
          </a>
        </main>
      );
    }

    return (
      <main className="container-mystic py-20 text-center">
        <div className="mb-4 text-4xl">🌙</div>
        <h1 className="mb-3 font-display text-2xl text-moon">Пока пусто</h1>
        <p className="mb-6 text-moon/50">Сделай свой первый расклад.</p>
        <Link href="/" className="btn-primary">
          🔮 Начать гадание
        </Link>
      </main>
    );
  }

  return (
    <main className="container-mystic py-10">
      <h1 className="mb-8 text-center font-display text-3xl text-moon">
        Твои расклады
      </h1>
      {!tgUser && (
        <div className="mb-6 rounded-xl border border-gold/30 bg-gold/5 p-4 text-center text-sm text-gold/90">
          🔮 Это твоя локальная история в этом браузере.
          <a href={tgLinks.bot} className="ml-1 font-semibold underline transition hover:text-gold-bright">
            Открой бота в Telegram
          </a>
          , чтобы перенести расклады на телефон!
        </div>
      )}
      <div className="space-y-4">
        {rows.map((r) => {
          const spread = SPREAD_BY_ID.get(r.spreadType);
          return (
            <div key={r.id} className="card-panel p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-lg text-moon">
                  {spread?.icon} {spread?.name ?? r.spreadType}
                </h3>
                <span className="text-xs text-moon/40">
                  {new Date(r.createdAt).toLocaleString('ru-RU')}
                </span>
              </div>
              {r.question && (
                <p className="mb-3 text-sm italic text-moon/50">«{r.question}»</p>
              )}
              <div className="flex gap-2">
                {r.cards.slice(0, 6).map((c) => {
                  const card = getCard(c.id);
                  return (
                    <div key={c.id} className="relative h-16 w-12 overflow-hidden rounded border border-gold/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={card.image}
                        alt={card.name}
                        className="h-full w-full object-cover"
                        style={{ transform: c.reversed ? 'rotate(180deg)' : undefined }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
