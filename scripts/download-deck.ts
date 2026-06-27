/**
 * Скачивание колоды «Безумной Луны» с magiachisel.ru → public/deck/
 *
 * Запуск:  npm run deck:download
 *
 * Источник: https://magiachisel.ru/KartyTaro/GalereyaTaro.aspx?kl=55
 * Картинки: Pictures/p60/00.gif … 77.gif  (78 карт)
 *           Pictures/p60/79.gif           (рубашка)
 *
 * Сайт имеет anti-bot защиту (cookie human_check=passed) — обходим её.
 */

import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { setTimeout as sleep } from 'node:timers/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'deck');

const BASE = 'https://magiachisel.ru';
const HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.9',
  Referer: `${BASE}/KartyTaro/GalereyaTaro.aspx?kl=55`,
  Cookie: 'human_check=passed',
};

// 78 карт (00..77) + рубашка (79)
const cardIds = [...Array.from({ length: 78 }, (_, i) => i), 79];

async function downloadOne(remoteName: string, localFile: string): Promise<boolean> {
  const url = `${BASE}/Pictures/p60/${remoteName}`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok || !res.body) {
      console.warn(`  ⚠ ${remoteName}: HTTP ${res.status}`);
      return false;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 200) {
      console.warn(`  ⚠ ${remoteName}: слишком маленький файл (${buf.length} байт) — возможно заглушка`);
      return false;
    }
    const ws = createWriteStream(localFile);
    await new Promise<void>((resolve, reject) => {
      ws.write(buf);
      ws.end();
      ws.on('finish', resolve);
      ws.on('error', reject);
    });
    console.log(`  ✓ ${remoteName} → ${localFile.split(/[\\/]/).pop()} (${buf.length} байт)`);
    return true;
  } catch (e) {
    console.warn(`  ✗ ${remoteName}: ${(e as Error).message}`);
    return false;
  }
}

async function main() {
  console.log('🌙 Скачивание колоды «Безумной Луны» (78 карт + рубашка)\n');
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  let ok = 0;
  let fail = 0;

  for (const id of cardIds) {
    const remoteName = `${String(id).padStart(2, '0')}.gif`;
    const localName = id === 79 ? 'back.gif' : `${id}.gif`;
    const localFile = join(OUT_DIR, localName);
    const success = await downloadOne(remoteName, localFile);
    if (success) ok++;
    else fail++;
    await sleep(120); // бережём сервер
  }

  console.log(`\n──────────────────────────────`);
  console.log(`✅ Успешно: ${ok}`);
  if (fail) console.log(`❌ Ошибок:  ${fail}`);
  console.log(`📁 Папка:   ${OUT_DIR}`);
  console.log(`\nТеперь 78 карт + back.gif лежат в public/deck/`);
}

main().catch((e) => {
  console.error('Фатальная ошибка:', e);
  process.exit(1);
});
