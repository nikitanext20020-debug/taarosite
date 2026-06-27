/**
 * Клиентские утилиты для работы с Telegram WebApp SDK.
 */

import type { TgUser } from '@/lib/telegram/subscription';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: { user?: TgUser };
        ready: () => void;
        expand: () => void;
        close: () => void;
        version?: string;
        themeParams?: Record<string, string>;
        colorScheme?: 'light' | 'dark';
        isVersionAtLeast?: (v: string) => boolean;
        MainButton?: { text: string; show: () => void; hide: () => void; onClick: (cb: () => void) => void };
        BackButton?: { show: () => void; hide: () => void; onClick: (cb: () => void) => void };
        HapticFeedback?: {
          impactOccurred: (s: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (s: 'error' | 'success' | 'warning') => void;
        };
        openTelegramLink: (url: string) => void;
        setHeaderColor?: (c: string) => void;
        setBackgroundColor?: (c: string) => void;
      };
    };
  }
}

type TgWebApp = NonNullable<NonNullable<Window['Telegram']>['WebApp']>;

/** Проверка, поддерживает ли клиент версию Telegram WebApp API */
function supports(wa: TgWebApp | undefined | null, v: string): boolean {
  return !!(wa && typeof wa.isVersionAtLeast === 'function' && wa.isVersionAtLeast(v));
}

export function initTelegram(): TgUser | null {
  if (typeof window === 'undefined') return null;
  const wa = window.Telegram?.WebApp;
  if (!wa) return null;
  try {
    // ready + expand поддерживаются везде
    wa.ready();
    wa.expand();

    // setHeaderColor / setBackgroundColor только с версии 6.1+
    if (supports(wa, '6.1')) {
      wa.setHeaderColor?.('#07090f');
      wa.setBackgroundColor?.('#07090f');
    }
  } catch {}
  return wa.initDataUnsafe?.user ?? null;
}

export function haptic(type: 'light' | 'success' | 'error' | 'warning' = 'light') {
  if (typeof window === 'undefined') return;
  const wa = window.Telegram?.WebApp;
  if (!wa) return;
  // HapticFeedback доступен с версии 6.1
  if (!supports(wa, '6.1')) return;
  try {
    if (type === 'success' || type === 'error' || type === 'warning') {
      wa.HapticFeedback?.notificationOccurred(type);
    } else {
      wa.HapticFeedback?.impactOccurred(type);
    }
  } catch {}
}

export function openTgLink(url: string) {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    window.Telegram.WebApp.openTelegramLink(url);
  } else if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
}

export function isMiniApp(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.Telegram?.WebApp?.initData;
}
