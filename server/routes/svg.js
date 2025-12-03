/**
 * Роут для генерации SVG
 */

import { generateSVG } from '../core/svg-generator.js';
import { parseQueryParams } from '../config/params-parser.js';
import { applyDefaults } from '../config/defaults.js';

/**
 * Обработчик GET /svg
 * Генерирует SVG (без JavaScript)
 */
export async function handleSVG(req, res) {
  try {
    // Парсим query параметры
    const parsedParams = parseQueryParams(req.query);
    
    // Применяем дефолтные значения
    const params = applyDefaults(parsedParams);
    
    // Отладка параметров
    // console.log('handleSVG - req.query.multiLine:', req.query.multiLine);
    // console.log('handleSVG - parsedParams.multiLine:', parsedParams.multiLine);
    // console.log('handleSVG - params.multiLine:', params.multiLine);
    
    // Генерируем SVG (c возможной асинхронной загрузкой шрифтов)
    const svg = await generateSVG(params);
    
    // Отправляем с правильным Content-Type
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(svg);
  } catch (error) {
    console.error('Error generating SVG:', error);
    res.status(500).send('Error generating SVG');
  }
}

