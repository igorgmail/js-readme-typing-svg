/**
 *  На основе локального файла server/fonts/webfonts.json:
 *  - берёт список всех шрифтов Google Fonts (family + files[variant])
 *  - скачивает все веса и стили с fonts.gstatic.com
 *  - конвертирует каждый в base64
 *  - сохраняет данные в server/fonts/allFontsData.json
 */

import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Пишем JSON с данными шрифтов
const OUTPUT = path.join(__dirname, '../fonts/allFontsData.json');
const WEBFONTS_SOURCE = path.join(__dirname, '../fonts/webfonts.json');

// Получение списка всех шрифтов из локального webfonts.json
async function getFontsList() {
  if (!fs.existsSync(WEBFONTS_SOURCE)) {
    throw new Error(
      `Файл ${WEBFONTS_SOURCE} не найден. Сначала скачай webfonts.json через Google Fonts API.`,
    );
  }

  const raw = fs.readFileSync(WEBFONTS_SOURCE, 'utf8');
  const parsed = JSON.parse(raw);

  if (!parsed || !Array.isArray(parsed.items)) {
    throw new Error(
      'Некорректный формат webfonts.json: ожидался объект с полем "items" (массив).',
    );
  }

  return parsed.items;
}

// Скачивание бинарного файла шрифта и конвертация в base64
async function downloadFont(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        `Ошибка загрузки файла: ${url} (status: ${response.status})`,
      );
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  } catch (error) {
    console.error(`Ошибка сети при загрузке файла: ${url}`, error);
    return null;
  }
}

// Определение формата по расширению файла
function getFormat(url) {
  const ext = url.split('.').pop().toLowerCase();
  if (ext === 'woff2') return 'woff2';
  if (ext === 'woff') return 'woff';
  if (ext === 'ttf') return 'truetype';
  if (ext === 'otf') return 'opentype';
  return 'unknown';
}

async function generate() {
  console.log('Получаю список шрифтов...');
  const fonts = await getFontsList();

  /**
   * Структура выходного файла:
   * {
   *   "Roboto": [ { ...variant }, ... ],
   *   "Playwrite CZ": [ { ...variant }, ... ],
   *   ...
   * }
   *
   * Чтобы не держать все данные в памяти (огромный JSON),
   * пишем файл потоком: по одному семейству за раз.
   */

  const out = fs.createWriteStream(OUTPUT, 'utf8');
  out.write('{\n');
  let isFirstFamily = true;

  for (const font of fonts) {
    const family = font.family;
    console.log(`\n>>> Генерируем: ${family}`);

    const familyVariants = [];

    for (const [styleKey, fontURL] of Object.entries(font.files)) {
      if (!fontURL) continue;

      const weight = styleKey.match(/\d+/)?.[0] || 400;
      const italic = styleKey.includes('italic') ? 'italic' : 'normal';
      const format = getFormat(fontURL);

      if (format === 'unknown') {
        console.log(`  → пропускаю: ${styleKey} (неизвестный формат)`);
        continue;
      }

      console.log(`  → скачиваю: ${styleKey} (${format})`);

      const base64 = await downloadFont(fontURL);
      if (!base64) {
        console.log(`  → пропускаю: ${styleKey}, не удалось скачать файл`);
        continue;
      }

      const src = `data:font/${format};base64,${base64}`;

      const fontFace = `
@font-face {
  font-family: '${family}';
  font-style: ${italic};
  font-weight: ${weight};
  font-stretch: normal;
  font-display: swap;
  src: url(${src}) format('${format}');
}
`.trim();

      familyVariants.push({
        family,
        style: italic,
        weight: Number(weight),
        format,
        src,
        fontFace,
      });
    }

    if (familyVariants.length === 0) {
      continue;
    }

    if (!isFirstFamily) {
      out.write(',\n');
    }
    isFirstFamily = false;

    const key = JSON.stringify(family);
    const value = JSON.stringify(familyVariants, null, 2)
      .split('\n')
      .map((line, index) => (index === 0 ? line : `  ${line}`))
      .join('\n');

    out.write(`  ${key}: ${value}`);
  }

  out.write('\n}\n');
  out.end();

  console.log(`\n🎉 Готово! Создан файл: ${OUTPUT}`);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});