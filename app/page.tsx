'use client';

import Link from 'next/link';
import { SPREADS, THEMES } from '@/lib/tarot/spreads';
import { site, tgLinks } from '@/lib/site';
import Card3D from '@/components/Card3D';
import AnimatedEmoji from '@/components/AnimatedEmoji';
import { DECK } from '@/lib/tarot/deck';

const SPREAD_PREVIEW_CARDS: Record<string, number> = {
  'three-cards': 10,       // Колесо Фортуны
  'five-cards': 21,        // Мир
  'cross': 15,             // Дьявол
  'yes-no': 8,             // Сила
  'decision': 1,           // Маг
  'horseshoe': 7,          // Колесница
  'celtic-cross': 20,      // Суд
  'relationship': 6,       // Влюбленные
  'card-of-the-day': 19,   // Солнце
};

export default function HomePage() {
  return (
    <main className="relative">
      {/* ── HERO ───────────────────────────────────── */}
      <section className="relative flex min-h-[88vh] flex-col items-center justify-center px-4 text-center">
        <div className="relative z-10 flex flex-col items-center">
          <p className="mb-3 font-display text-sm uppercase tracking-[0.3em] text-gold/70">
            {site.fullName}
          </p>
          <h1 className="mb-5 max-w-3xl font-display text-4xl font-semibold leading-tight text-moon sm:text-6xl">
            Что скрывает твоё <span className="text-gradient-gold">будущее</span>?
          </h1>
          <p className="mb-9 max-w-xl text-base text-moon/60 sm:text-lg">
            Гадание на картах Таро «Безумной Луны» с интерпретацией от нейросети.
            Задай вопрос — и карты откроют скрытое.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link href={`/divine/${SPREADS[0].id}`} className="btn-primary">
              🔮 Начать расклад
            </Link>
            <button
              onClick={() => alert('Запуск в Telegram временно недоступен. Пожалуйста, используйте веб-версию! 🔮')}
              className="btn-ghost"
            >
              Открыть в Telegram
            </button>
          </div>

          <div className="mt-10 flex items-center gap-2 text-xs text-moon/40">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
            Бесплатно · Без регистрации · Конфиденциально
          </div>
        </div>
      </section>

      {/* ── ТИПЫ РАСКЛАДОВ ─────────────────────────── */}
      <section className="container-mystic py-16">
        <h2 className="mb-2 text-center font-display text-3xl text-moon sm:text-4xl">
          Выбери расклад
        </h2>
        <p className="mb-10 text-center text-moon/50">
          Девять типов гадания под любой вопрос
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SPREADS.map((s, i) => (
            <Link
              key={s.id}
              href={`/divine/${s.id}`}
              className="card-panel group p-4 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-card flex gap-4 items-center"
              style={{ animation: 'rise 0.5s ease-out forwards', animationDelay: `${i * 60}ms`, opacity: 0 }}
            >
              <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                <Card3D 
                  card={DECK[SPREAD_PREVIEW_CARDS[s.id] ?? 19]} 
                  faceUp={true} 
                  size="sm" 
                  interactive={false} 
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <AnimatedEmoji id={s.id} fallback={s.icon} className="w-7 h-7 object-contain" />
                    <span className="rounded-full border border-gold/20 px-2 py-0.5 text-[9px] text-gold/60">
                      {s.count} {s.count === 1 ? 'карта' : s.count < 5 ? 'карты' : 'карт'}
                    </span>
                  </div>
                  <h3 className="mb-0.5 font-display text-lg text-moon transition-colors group-hover:text-gold-bright leading-snug">
                    {s.name}
                  </h3>
                  <p className="text-xs text-moon/50 line-clamp-2 leading-relaxed">{s.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── ТЕМЫ ──────────────────────────────────── */}
      <section className="container-mystic py-12">
        <h2 className="mb-6 text-center font-display text-2xl text-moon">
          О чём хочешь спросить?
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {THEMES.map((t) => (
            <span
              key={t.id}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-moon/70"
            >
              <AnimatedEmoji id={t.id} fallback={t.icon} className="w-5 h-5 object-contain" />
              {t.label}
            </span>
          ))}
        </div>
      </section>

      {/* ── КАК ЭТО РАБОТАЕТ ───────────────────────── */}
      <section className="container-mystic py-16">
        <h2 className="mb-10 text-center font-display text-3xl text-moon">
          Как это работает
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { n: '1', t: 'Задай вопрос', d: 'Выбери расклад и тему, сформулируй, что тебя волнует.' },
            { n: '2', t: 'Карты откроются', d: 'Лиза разложит карты «Безумной Луны» с твоим вопросом в сердце.' },
            { n: '3', t: 'Получи ответ', d: 'Нейросеть мгновенно растолкует карты и даст совет.' },
          ].map((step) => (
            <div key={step.n} className="card-panel p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 font-display text-xl text-gold">
                {step.n}
              </div>
              <h3 className="mb-2 font-display text-lg text-moon">{step.t}</h3>
              <p className="text-sm text-moon/50">{step.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ФИНАЛЬНЫЙ CTA ─────────────────────────── */}
      <section className="container-mystic py-20 text-center">
        <div className="mb-6 text-5xl">✦</div>
        <h2 className="mb-4 font-display text-3xl text-moon sm:text-4xl">
          Карта уже ждёт тебя
        </h2>
        <p className="mx-auto mb-8 max-w-md text-moon/50">
          Один расклад может изменить взгляд на ситуацию. Сделай первый шаг.
        </p>
        <Link href={`/divine/${SPREADS[0].id}`} className="btn-primary">
          🔮 Начать гадание
        </Link>
      </section>

      {/* ── ФУТЕР ─────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8">
        <div className="container-mystic flex flex-col items-center justify-between gap-4 text-center text-xs text-moon/40 sm:flex-row sm:text-left">
          <p>
            {site.fullName} · Карты «Безумной Луны»
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => alert('Telegram-канал скоро откроется! 🔮')}
              className="transition hover:text-gold"
            >
              Канал
            </button>
            <button
              onClick={() => alert('Telegram-бот в разработке! 🔮')}
              className="transition hover:text-gold"
            >
              Бот
            </button>
          </div>
        </div>
        <p className="mt-4 text-center text-[10px] text-moon/30">
          Гадание носит развлекательный характер и не заменяет профессиональных советов.
        </p>
      </footer>
    </main>
  );
}
