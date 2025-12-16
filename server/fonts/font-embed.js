/**
 * Утилита для загрузки CSS шрифта с Google Fonts
 * и замены ссылок на font-файлы на встроенные data-URI.
 * Также парсит шрифт через opentype.js для извлечения метрик.
 *
 * ВАЖНО:
 * - Логика опциональная: если что-то пошло не так, возвращаем пустую строку
 *   и не ломаем генерацию SVG.
 * - Предполагаем, что используется один font-family из параметров генератора.
 */

import { Buffer } from 'node:buffer';
import * as opentype from 'opentype.js';

const GOOGLE_FONTS_API = 'https://fonts.googleapis.com/css';

/**
 * Нормализует значение font-family для использования в запросе к Google Fonts:
 * - берёт только первое семейство до запятой
 * - убирает кавычки
 * - приводит каждое слово к виду "ПерваяБукваВерхнийРегистр, остальные нижний"
 * Примеры:
 *   `"pacifico", cursive` -> `Pacifico`
 *   `"roboto slab", serif` -> `Roboto Slab`
 *   `Roboto` -> `Roboto`
 * @param {string} fontFamily
 * @returns {string}
 */
function normalizeFontFamilyForGoogle(fontFamily) {
  if (!fontFamily || typeof fontFamily !== 'string') {
    return '';
  }

  const primary = fontFamily.split(',')[0].trim();
  const withoutQuotes = primary.replace(/["']/g, '').trim();

  if (!withoutQuotes) {
    return '';
  }

  const words = withoutQuotes.split(/\s+/).filter(Boolean);

  // Внутри значения оставляем пробелы — URLSearchParams превратит их в '+'
  // family=Roboto Slab -> family=Roboto+Slab в итоговом URL
  // ВАЖНО: не меняем регистр, чтобы имя совпадало с тем, что ожидает Google Fonts
  const normalized = words.join(' ');

  return normalized;
}

/**
 * Проверяет, является ли имя шрифта "общим" CSS-шрифтом,
 * для которых не имеет смысла тянуть Google Fonts.
 * @param {string} fontFamily
 * @returns {boolean}
 */
function isGenericFontFamily(fontFamily) {
  const normalized = normalizeFontFamilyForGoogle(fontFamily).toLowerCase();

  if (!normalized) {
    return true;
  }

  // Базовый набор generic-шрифтов
  const genericFamilies = [
    'monospace',
    'serif',
    'sans-serif',
    'system-ui',
    'ui-monospace',
    'ui-sans-serif',
  ];

  return genericFamilies.includes(normalized);
}

/**
 * Собирает URL для Google Fonts API.
 * @param {string} fontFamily
 * @param {string|number} fontWeight
 * @param {string[]} lines
 * @returns {string}
 */
function buildGoogleFontsUrl(fontFamily, fontWeight, lines) {
  const normalizedFamily = normalizeFontFamilyForGoogle(fontFamily);
  if (!normalizedFamily) {
    return GOOGLE_FONTS_API;
  }

  const allText = Array.isArray(lines) ? lines.join(' ') : '';
  // Оставляем только уникальные символы для уменьшения размера шрифта
  const uniqueChars = allText ? [...new Set(allText)].join('') : '';

  // Формируем URL с весом шрифта и уникальными символами для оптимизации
  const url = `${GOOGLE_FONTS_API}?${new URLSearchParams({
    family: `${normalizedFamily}:wght@${fontWeight}`,
    text: uniqueChars,
    display: 'fallback',
  })}`;

  return url;
}

/**
 * Загружает CSS с Google Fonts, заменяет ссылки на font-файлы
 * на встроенные data-URI и парсит первый шрифт через opentype.js.
 *
 * @param {Object} options
 * @param {string} options.fontFamily
 * @param {string|number} options.fontWeight
 * @param {string[]} options.lines
 * @returns {Promise<{css: string, parsedFont: object|null}>} CSS и распарсенный шрифт
 */
export async function getEmbeddedFontCSS(options) {
  const { fontFamily, fontWeight, lines } = options || {};

  if (!fontFamily || isGenericFontFamily(fontFamily)) {
    return { css: '', parsedFont: null };
  }

  // Если fetch недоступен (старый Node) — тихо выходим без шрифта
  if (typeof fetch !== 'function') {
    return { css: '', parsedFont: null };
  }

  try {
    const url = buildGoogleFontsUrl(fontFamily, fontWeight, lines);

    const response = await fetch(url, {
      headers: {
        // Без нормального User-Agent Google Fonts иногда отдаёт пустой ответ
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      return { css: '', parsedFont: null };
    }

    let css = await response.text();
    let parsedFont = null;
    let firstFontBuffer = null;

    // Ищем все ссылки на font-файлы и заменяем их на data-URI
    const urlRegex =
      /url\((https:\/\/fonts\.gstatic\.com[^)]+)\)\s+format\(['"]([^'"]+)['"]\)/g;
    const matches = [...css.matchAll(urlRegex)];

    for (const match of matches) {
      const [, fontUrl, fontFormat] = match;

      try {
        const fontResponse = await fetch(fontUrl);
        if (!fontResponse.ok) {
          continue;
        }

        const fontBuffer = await fontResponse.arrayBuffer();
        
        // Сохраняем первый загруженный шрифт для парсинга
        if (!firstFontBuffer) {
          firstFontBuffer = fontBuffer;
        }
        
        const base64Font = Buffer.from(fontBuffer).toString('base64');
        const dataUri = `data:font/${fontFormat};base64,${base64Font}`;

        css = css.replace(fontUrl, dataUri);
      } catch (fontError) {
        // Не логируем в проде, чтобы не заспамить консоль
      }
    }

    // Парсим первый загруженный шрифт через opentype.js для получения метрик
    if (firstFontBuffer) {
      try {
        parsedFont = opentype.parse(firstFontBuffer);
      } catch (parseError) {
        console.warn(`Failed to parse font ${fontFamily}:`, parseError.message);
        // parsedFont остаётся null, будет использован fallback
      }
    }

    return { css, parsedFont };
  } catch (error) {
    // На любой ошибке просто возвращаем пустые значения
    return { css: '', parsedFont: null };
  }
}

/**
 * Загружает CSS для нескольких шрифтов и объединяет их в один CSS блок
 * @param {Array<{fontFamily: string, fontWeight: string|number, lines: string[]}>} fonts - массив объектов с параметрами шрифтов
 * @returns {Promise<string>} объединенный CSS для всех шрифтов
 */
export async function getMultipleEmbeddedFontsCSS(fonts) {
  if (!Array.isArray(fonts) || fonts.length === 0) {
    return '';
  }
  
  // Убираем дубликаты шрифтов перед загрузкой
  const uniqueFonts = [];
  const seenFonts = new Set();
  
  for (const font of fonts) {
    if (!font.fontFamily) continue;
    
    const normalized = normalizeFontFamilyForGoogle(font.fontFamily).toLowerCase();
    if (normalized && !seenFonts.has(normalized)) {
      seenFonts.add(normalized);
      uniqueFonts.push(font);
    }
  }
  
  if (uniqueFonts.length === 0) {
    return '';
  }
  
  // Загружаем все шрифты параллельно
  const cssPromises = uniqueFonts.map(font => getEmbeddedFontCSS(font));
  const results = await Promise.all(cssPromises);
  
  // Объединяем все CSS
  const allCSS = results.map(r => r.css).filter(Boolean).join('\n');
  
  // Удаляем дубликаты @font-face с одинаковыми font-family и font-weight
  const fontFaceRegex = /@font-face\s*\{[^}]*\}/gs;
  const fontFaces = new Map();
  
  const matches = allCSS.matchAll(fontFaceRegex);
  for (const match of matches) {
    const fontFace = match[0];
    // Извлекаем font-family и font-weight из @font-face для уникальной идентификации
    const familyMatch = fontFace.match(/font-family:\s*['"]?([^'";}]+)['"]?/i);
    const weightMatch = fontFace.match(/font-weight:\s*([^;}+]+)/i);
    
    if (familyMatch) {
      const family = familyMatch[1].trim().toLowerCase();
      const weight = weightMatch ? weightMatch[1].trim() : 'normal';
      const key = `${family}:${weight}`;
      
      // Сохраняем первый вариант (они все одинаковые после загрузки)
      if (!fontFaces.has(key)) {
        fontFaces.set(key, fontFace);
      }
    }
  }
  
  // Объединяем уникальные @font-face
  return Array.from(fontFaces.values()).join('\n');
}