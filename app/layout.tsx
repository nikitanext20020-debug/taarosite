import type { Metadata, Viewport } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-body',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Гадание от Лизы — карты Таро с ИИ',
  description: 'Гадание на картах Таро «Безумной Луны» с интерпретацией от нейросети. Раскрой, что скрывает твоё будущее.',
  keywords: ['таро', 'гадание', 'расклад', 'нейросеть', 'Лиза'],
  openGraph: {
    title: 'Гадание от Лизы — карты Таро с ИИ',
    description: 'Раскрой, что скрывает твоё будущее.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#07090f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: Telegram-SDK и next/font вписывают
    // inline-стили в <html> после гидратации — это нормально для Mini App
    <html
      lang="ru"
      className={`${inter.variable} ${cormorant.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Telegram WebApp SDK — нужен для Mini App */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="relative min-h-screen antialiased bg-[#07090f] text-[#d9d3c4] overflow-x-hidden">
        {/* Фоновое видео */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
          >
            <source src="/video/bg-video.webm" type="video/webm" />
          </video>
        </div>

        {/* Светящаяся луна на фоне */}
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-0 pointer-events-none opacity-30 mix-blend-screen flex items-center justify-center">
          <div className="absolute bg-[#c8a35c]/10 rounded-full blur-[80px] w-80 h-80 animate-pulse" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/moon.png" alt="Moon" className="w-36 h-36 animate-float" />
        </div>

        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
