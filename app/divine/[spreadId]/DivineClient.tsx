'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Card3D from '@/components/Card3D';
import DeckReveal, { type RevealCard } from '@/components/DeckReveal';
import { THEMES, QUESTION_PRESETS, type SpreadType } from '@/lib/tarot/spreads';
import { getCard } from '@/lib/tarot/deck';
import { DECKS, DEFAULT_DECK_ID, getCardImageUrl, getBackImageUrl } from '@/lib/tarot/decks';
import { site, tgLinks } from '@/lib/site';
import { initTelegram, haptic, openTgLink, isMiniApp } from '@/components/TgInitData';
import type { TgUser } from '@/lib/telegram/subscription';
import AnimatedEmoji from '@/components/AnimatedEmoji';

type Phase = 'setup' | 'shuffling' | 'dealing' | 'revealed' | 'paywall' | 'reading';

interface ApiCard {
  id: number;
  name: string;
  reversed: boolean;
  position: number;
}

interface PositionInfo {
  title: string;
  hint: string;
}

export default function DivineClient({ spread }: { spread: SpreadType }) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [theme, setTheme] = useState<string>('general');
  const [question, setQuestion] = useState('');
  const [userName, setUserName] = useState('');
  const [targetName, setTargetName] = useState('');
  const [previewCards, setPreviewCards] = useState<Record<string, number[]>>({});
  const [deckId, setDeckId] = useState<string>(DEFAULT_DECK_ID);
  const [tgUser, setTgUser] = useState<TgUser | null>(null);
  const [webUserId, setWebUserId] = useState<string | null>(null);
  const [inMiniApp, setInMiniApp] = useState(false);

  const [readingId, setReadingId] = useState<string | null>(null);
  const [cards, setCards] = useState<ApiCard[]>([]);
  const [positions, setPositions] = useState<PositionInfo[]>([]);
  const [interpretation, setInterpretation] = useState<string>('');
  const [freeReadsLeft, setFreeReadsLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // true после того как DeckReveal завершил анимацию
  const [deckRevealed, setDeckRevealed] = useState(false);

  // Стейты звука
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Инициализация TG, Web-пользователя и Аудио
  useEffect(() => {
    const u = initTelegram();
    setTgUser(u);
    setInMiniApp(isMiniApp());

    if (!u) {
      let wId = localStorage.getItem('liza_web_user_id');
      if (!wId) {
        wId = 'web_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('liza_web_user_id', wId);
      }
      setWebUserId(wId);
    }

    // Загрузка мистического фонового эмбиента
    audioRef.current = new Audio('https://assets.mixkit.co/music/preview/mixkit-mystical-mystic-ambient-1160.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.35;

    // Генерируем по 4 случайных ID карт для каждой колоды
    const generated: Record<string, number[]> = {};
    for (const d of DECKS) {
      const ids: number[] = [];
      while (ids.length < 4) {
        const rand = Math.floor(Math.random() * 78);
        if (!ids.includes(rand)) {
          // И для Уэйт-Смит пропускаем отсутствующие Старшие Арканы (0-7 и 17)
          if (d.id === 'waite-smith' && (rand <= 7 || rand === 17)) {
            continue;
          }
          ids.push(rand);
        }
      }
      generated[d.id] = ids;
    }
    setPreviewCards(generated);

    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.play().catch(() => {});
      setIsMuted(false);
    } else {
      audioRef.current.pause();
      setIsMuted(true);
    }
    haptic('light');
  };

  // ── Старт расклада ──────────────────────────────────────
  async function startReading() {
    if (!userName.trim()) {
      setError('Пожалуйста, введите ваше имя');
      haptic('warning');
      return;
    }

    setLoading(true);
    setError(null);
    haptic('light');
    setDeckRevealed(false);
    setPhase('shuffling');

    try {
      const res = await fetch('/api/divine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadId: spread.id,
          theme,
          question: question.trim() || undefined,
          deckId,
          userName: userName.trim(),
          targetName: targetName.trim() || undefined,
          tgUser: tgUser ?? undefined,
          webUserId: webUserId ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка расклада');

      setReadingId(data.readingId);
      setCards(data.cards);
      setPositions(data.positions);
      setFreeReadsLeft(data.freeAvailable ? 1 : 0);

      // Запускаем анимацию DeckReveal; reveal() вызовется в onDeckComplete
      setPhase('dealing');
      haptic('success');
    } catch (e) {
      setError((e as Error).message);
      setPhase('setup');
    } finally {
      setLoading(false);
    }
  }

  // ── Колбэк: DeckReveal завершил анимацию ────────────────
  async function onDeckComplete() {
    setDeckRevealed(true);
    await reveal(readingId ?? undefined);
  }

  // ── Проверка подписки ────────────────────────
  async function checkSub() {
    haptic('light');
    await reveal();
  }

  // ── Раскрытие текста (после подписки или за бесплатные) ─
  async function reveal(overrideReadingId?: string) {
    const id = overrideReadingId || readingId;
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readingId: id,
          tgUser: tgUser ?? undefined,
          webUserId: webUserId ?? undefined,
        }),
      });
      const data = await res.json();

      if (res.status === 402 || res.status === 403) {
        // Paywall — нужна подписка
        if (phase === 'paywall') {
          setError('Вы ещё не подписались на канал. Если уже подписались, подождите пару секунд и попробуйте снова.');
          haptic('warning');
        } else {
          setPhase('paywall');
        }
        setFreeReadsLeft(data.freeReadsLeft ?? 0);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Ошибка интерпретации');

      setInterpretation(data.text);
      setPhase('reading');
      haptic('success');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Текущая колода
  const selectedDeck = DECKS.find((d) => d.id === deckId) ?? DECKS[0];
  // Пресеты вопросов для выбранной темы
  const presets = QUESTION_PRESETS[theme] ?? [];

  return (
    <main className="container-mystic min-h-screen py-8 sm:py-12 relative overflow-hidden">
      {/* Тематические фоны для каждой темы с мягким перекрестным затуханием (fade-in/out) */}
      {(['love', 'career', 'money', 'self', 'general'] as const).map((t) => (
        <div
          key={t}
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 pointer-events-none w-screen h-screen"
          style={{
            backgroundImage: `url("/tarot_${t}_theme.png")`,
            opacity: theme === t ? 0.18 : 0,
          }}
        />
      ))}

      {/* Общие радиальные и линейные затемняющие градиенты */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none w-screen h-screen transition-opacity duration-1000" 
        style={{ 
          background: 'radial-gradient(circle at center, transparent 0%, rgba(7, 9, 15, 0.95) 100%), linear-gradient(to bottom, transparent 0%, rgba(7, 9, 15, 0.5) 50%, rgba(7, 9, 15, 1) 100%)',
          opacity: ['love', 'career', 'money', 'self', 'general'].includes(theme) ? 1 : 0,
        }}
      />

      {/* Дыхание Бездны на фоне */}
      <div className="void-glow-bg" />

      {/* Кнопка переключения звука */}
      <div className="absolute right-4 top-4 z-50">
        <button
          onClick={toggleMute}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-midnight/80 text-base text-gold transition-all duration-300 hover:border-gold hover:bg-ash shadow-mystic"
          title={isMuted ? 'Включить таинственную музыку' : 'Выключить музыку'}
        >
          {isMuted ? '🔇' : '🔮🔊'}
        </button>
      </div>

      {/* Шапка */}
      <div className="mb-8 text-center relative z-10">
        <Link href="/" className="text-xs text-moon/40 transition hover:text-gold">
          ← Все расклады
        </Link>
        <h1 className="mt-3 font-display text-3xl text-moon sm:text-4xl">
          <span className="mr-2">{spread.icon}</span>
          {spread.name}
        </h1>
        <p className="mt-1 text-sm text-moon/50">{spread.description}</p>
      </div>

      {error && (
        <div className="mx-auto mb-6 max-w-md rounded-lg border border-blood/40 bg-blood/10 p-3 text-center text-sm text-blood/90 relative z-10">
          {error}
        </div>
      )}

      {/* ═══ SETUP: выбор колоды, темы и вопроса ═══ */}
      {phase === 'setup' && (
        <div className="mx-auto max-w-lg space-y-7 relative z-10">

          {/* ── Выбор колоды ── */}
          {DECKS.length > 0 && (
            <div>
              <label className="mb-3 block font-display text-sm text-moon/70">
                Выбери колоду
              </label>
              <div className="flex flex-col gap-2">
                {DECKS.map((deck) => (
                  <button
                    key={deck.id}
                    onClick={() => { setDeckId(deck.id); haptic('light'); }}
                    className={`flex items-start gap-4 rounded-xl border p-3 text-left transition-all duration-200 ${
                      deckId === deck.id
                        ? 'border-gold/60 bg-gold/10 shadow-[0_0_16px_rgba(200,160,60,0.15)]'
                        : 'border-white/10 bg-midnight/40 hover:border-gold/30'
                    }`}
                  >
                    {/* Миниатюра (Лицо случайной карты для превью стиля) */}
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-8 h-12 rounded overflow-hidden border border-white/10 relative shadow-[0_2px_6px_rgba(0,0,0,0.3)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getCardImageUrl(previewCards[deck.id]?.[0] ?? 19, deck.id)}
                          alt={deck.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-display text-sm leading-tight ${deckId === deck.id ? 'text-gold-bright' : 'text-moon'}`}>
                          {deck.name}
                        </span>
                        {deckId === deck.id && (
                          <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[9px] text-gold">
                            Выбрана
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-moon/50 line-clamp-2">
                        {deck.description}
                      </p>

                      {/* Превью-галерея карт при выборе колоды */}
                      {deckId === deck.id && (
                        <div className="mt-3 flex gap-1.5 animate-fadeIn">
                          {(previewCards[deck.id] || [10, 19, 22, 50]).map((cardId) => {
                            const imgUrl = getCardImageUrl(cardId, deck.id);
                            return (
                              <div key={cardId} className="w-9 h-14 rounded overflow-hidden border border-gold/25 relative shadow-mystic group hover:border-gold hover:scale-105 transition-all duration-300">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={imgUrl}
                                  alt="Пример карты"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Выбор темы ── */}
          <div>
            <label className="mb-3 block font-display text-sm text-moon/70">
              Тема вопроса
            </label>
            <div className="flex flex-wrap gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    haptic('light');
                  }}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                    theme === t.id
                      ? 'border-gold bg-gold/15 text-gold-bright'
                      : 'border-white/10 text-moon/60 hover:border-gold/40'
                  }`}
                >
                  <AnimatedEmoji id={t.id} fallback={t.icon} className="w-5 h-5 object-contain" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Пресеты вопросов ── */}
          {presets.length > 0 && (
            <div
              className="flex flex-wrap gap-2"
              style={{ animation: 'rise 0.3s ease-out forwards' }}
            >
              {presets.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setQuestion(q);
                    haptic('light');
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-all duration-200 ${
                    question === q
                      ? 'border-gold/60 bg-gold/15 text-gold-bright'
                      : 'border-white/10 bg-white/5 text-moon/60 hover:border-gold/30 hover:text-moon/80'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* ── Поля имен ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block font-display text-sm text-moon/70">
                Ваше имя <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  if (error === 'Пожалуйста, введите ваше имя') setError(null);
                }}
                placeholder="Как вас зовут?"
                className="w-full rounded-xl border border-white/10 bg-midnight/70 p-4 text-moon placeholder:text-moon/30 focus:border-gold/50 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-2 block font-display text-sm text-moon/70">
                Имя партнёра <span className="text-moon/30">(необязательно)</span>
              </label>
              <input
                type="text"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder="О ком ваш вопрос?"
                className="w-full rounded-xl border border-white/10 bg-midnight/70 p-4 text-moon placeholder:text-moon/30 focus:border-gold/50 focus:outline-none"
              />
            </div>
          </div>

          {/* ── Поле вопроса ── */}
          <div>
            <label className="mb-2 block font-display text-sm text-moon/70">
              Твой вопрос <span className="text-moon/30">(или выбери выше)</span>
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Задай свой вопрос картам..."
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-midnight/70 p-4 text-moon placeholder:text-moon/30 focus:border-gold/50 focus:outline-none"
            />
          </div>

          <button
            onClick={startReading}
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? '🌙 Тасую колоду...' : '🔮 Разложить карты'}
          </button>

          {!tgUser && (
            <p className="text-center text-xs text-moon/40">
              Совет: открой в Telegram — так расклады сохраняются в историю.
            </p>
          )}
        </div>
      )}

      {/* ═══ SHUFFLING: анимация тасования колоды ═══ */}
      {phase === 'shuffling' && (() => {
        const backUrl = getBackImageUrl(deckId);
        const isVideo = backUrl.endsWith('.webm') || backUrl.endsWith('.mp4');
        const renderBack = () => isVideo ? (
          <video src={backUrl} autoPlay loop muted playsInline className="h-full w-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={backUrl} alt="Тасовка" className="h-full w-full object-cover" />
        );
        return (
          <div className="mx-auto max-w-md py-12 flex flex-col items-center gap-6 relative z-10">
            <div className="relative h-44 w-28 scene-3d flex items-center justify-center">
              {/* Три карты в стопке с анимацией вылета */}
              <div className="absolute inset-0 rounded-xl border border-gold/40 shadow-card bg-midnight overflow-hidden shuffle-card-l">
                {renderBack()}
              </div>
              <div className="absolute inset-0 rounded-xl border border-gold/40 shadow-card bg-midnight overflow-hidden shuffle-card-r">
                {renderBack()}
              </div>
              <div className="absolute inset-0 rounded-xl border border-gold/50 shadow-glow bg-midnight overflow-hidden shuffle-card-c">
                {renderBack()}
              </div>
            </div>
            <p className="animate-pulse text-center font-display text-lg text-gold-bright">
              🌙 {site.name} тасует колоду карт...
            </p>
          </div>
        );
      })()}

      {/* ═══ DEALING / PAYWALL / READING: анимация раздачи и paywall ═══ */}
      {(phase === 'dealing' || phase === 'paywall' || phase === 'reading') && cards.length > 0 && (
        <div className="mx-auto max-w-3xl relative">
          {/* Мерцающий туман позади карт */}
          <div className="mystic-fog rounded-full opacity-35 filter blur-3xl" />

          {/* ── DeckReveal: 3D-анимация расклада (только в фазе dealing до завершения) ── */}
          {phase === 'dealing' && !deckRevealed && (() => {
            const mainCards = cards.filter((c) => c.position !== 0);
            const bottomCardData = cards.find((c) => c.position === 0);

            const revealCards: RevealCard[] = mainCards.map((c, i) => ({
              card: { ...getCard(c.id), image: getCardImageUrl(c.id, deckId) },
              reversed: c.reversed,
            }));

            const revealBottomCard: RevealCard | null = bottomCardData
              ? {
                  card: {
                    ...getCard(bottomCardData.id),
                    image: getCardImageUrl(bottomCardData.id, deckId),
                  },
                  reversed: bottomCardData.reversed,
                  label: 'Фоновая карта',
                }
              : null;

            return (
              <DeckReveal
                key={deckId}
                spreadCards={revealCards}
                bottomCard={revealBottomCard}
                autoPlay
                cardBack={getBackImageUrl(deckId)}
                onComplete={onDeckComplete}
              />
            );
          })()}

          {/* ── Сетка Card3D: показывается после DeckReveal или в paywall/reading ── */}
          {(deckRevealed || phase === 'paywall' || phase === 'reading') && (
            <div className="space-y-8 z-10 relative">
              {/* Главный ряд карт расклада */}
              <div className="flex flex-row flex-wrap justify-center items-end gap-4 sm:gap-6">
                {cards.filter((c) => c.position !== 0).map((c, i) => {
                  const card = getCard(c.id);
                  const faceUp = true; // Карты всегда остаются открытыми после раздачи
                  const cardWithDeckImage = {
                    ...card,
                    image: getCardImageUrl(card.id, deckId),
                  };
                  return (
                    <Card3D
                      key={c.id}
                      card={cardWithDeckImage}
                      faceUp={faceUp}
                      reversed={c.reversed}
                      interactive={true}
                      size={spread.count > 5 ? 'sm' : spread.count > 3 ? 'md' : 'lg'}
                      dealDelay={i * 300}
                      deckId={deckId}
                    />
                  );
                })}
              </div>

              {/* Фоновая карта (извлекаемая с самого дна колоды) */}
              {(() => {
                const bottomCardData = cards.find((c) => c.position === 0);
                if (!bottomCardData) return null;
                const card = getCard(bottomCardData.id);
                const faceUp = true;
                const cardWithDeckImage = {
                  ...card,
                  image: getCardImageUrl(card.id, deckId),
                };
                return (
                  <div className="flex flex-col items-center mt-6">
                    <p className="mb-2 text-xs font-display text-gold/60 uppercase tracking-wider">Фоновая карта</p>
                    <Card3D
                      card={cardWithDeckImage}
                      faceUp={faceUp}
                      reversed={bottomCardData.reversed}
                      interactive={true}
                      size="md"
                      dealDelay={100}
                      label="Фоновая карта"
                      hint="Фоновая энергия всего расклада"
                      deckId={deckId}
                    />
                  </div>
                );
              })()}

              {/* Индикатор загрузки во время генерации текста */}
              {loading && (
                <div className="mt-8 flex flex-col items-center justify-center animate-pulse">
                  <div className="mb-3 text-3xl">✨</div>
                  <p className="font-display text-xl text-gold-bright">
                    Трактую ваши карты...
                  </p>
                  <p className="text-sm text-moon/60 mt-2">
                    Вглядываюсь в лунные тени
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ═══ PAYWALL ═══ */}
          {phase === 'paywall' && (
            <div className="mt-10 rounded-2xl border border-gold/30 bg-gradient-to-b from-midnight to-void p-6 text-center shadow-glow relative z-10 animate-fadeIn">
              <div className="mb-4 text-5xl animate-pulse drop-shadow-[0_0_15px_rgba(200,160,60,0.8)]">🔮</div>
              <h3 className="mb-2 font-display text-2xl text-moon">
                Бесплатные гадания закончились
              </h3>
              <p className="mb-4 text-moon/60">
                Чтобы прочитать интерпретацию этого расклада и получить безлимитный доступ к гаданиям, подпишитесь на наш канал.
              </p>

              {error && (
                <div className="mx-auto mb-4 max-w-sm rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-center text-sm text-rose-200 animate-fadeIn">
                  {error}
                </div>
              )}

              <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  onClick={() => openTgLink(tgLinks.channel)}
                  className="btn-primary"
                >
                  ✉️ Подписаться на канал
                </button>
                <button
                  onClick={checkSub}
                  disabled={loading}
                  className="btn-ghost"
                >
                  {loading ? 'Проверяю...' : 'Я подписался, открыть'}
                </button>
              </div>
            </div>
          )}

          {/* ═══ READING: текст интерпретации ═══ */}
          {phase === 'reading' && (
            <div className="mt-8 space-y-4 relative z-10">
              <div className="whitespace-pre-line rounded-2xl border border-white/10 bg-midnight/70 p-6 leading-relaxed text-moon/90">
                {renderInterpretation(interpretation)}
              </div>

              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                {!tgUser ? (
                  <button
                    onClick={() => {
                      haptic('light');
                      setPhase('paywall');
                    }}
                    className="btn-primary px-10"
                  >
                    Продолжить
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setPhase('setup');
                      setCards([]);
                      setInterpretation('');
                      setReadingId(null);
                    }}
                    className="btn-primary"
                  >
                    🔮 Новый расклад
                  </button>
                )}
                <button
                  onClick={() => alert('Telegram-канал скоро откроется! 🔮')}
                  className="btn-ghost"
                >
                  Больше гаданий в канале
                </button>
              </div>

              <p className="text-center text-[11px] text-moon/30">
                ✦ Интерпретация сгенерирована нейросетью и носит развлекательный характер.
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

/** Простой markdown-подобный рендер: **жирный** и переводы строк */
function renderInterpretation(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-gold-bright">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
