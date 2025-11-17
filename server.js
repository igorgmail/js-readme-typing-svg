import express from 'express';
import { generateSVG } from './src/svg-generator.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Статические файлы для generator.html и index.html
app.use(express.static('.', {
  extensions: ['html']
}));

// Эндпоинт для генерации SVG
app.get('/svg', (req, res) => {
  try {
    // Парсим параметры из query
    const params = {
      lines: req.query.lines || 'Add ?lines=Your+text+here',
      color: req.query.color || '000000',
      background: req.query.background || 'transparent',
      fontSize: parseInt(req.query.fontSize) || 16,
      width: parseInt(req.query.width) || 800,
      height: parseInt(req.query.height) || 200,
      printSpeed: parseInt(req.query.printSpeed) || 80,
      eraseSpeed: parseInt(req.query.eraseSpeed) || 50,
      delayAfterBlockPrint: parseInt(req.query.delayAfterBlockPrint) || 800,
      delayAfterErase: parseInt(req.query.delayAfterErase) || 500,
      lineHeight: parseFloat(req.query.lineHeight) || 1.35,
      paddingX: parseInt(req.query.paddingX) || 16,
      paddingY: parseInt(req.query.paddingY) || 20,
      verticalAlign: req.query.verticalAlign || 'top',
      horizontalAlign: req.query.horizontalAlign || 'left',
      multiLine: req.query.multiLine === 'true',
      typingMode: req.query.typingMode || 'expand',
      eraseMode: req.query.eraseMode || 'line'
    };

    // Генерируем SVG
    const svg = generateSVG(params);

    // Отправляем с правильным Content-Type
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(svg);
  } catch (error) {
    console.error('Error generating SVG:', error);
    res.status(500).send('Error generating SVG');
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}\n`);
  console.log(`📝 Generator:     http://localhost:${PORT}/generator.html`);
  console.log(`🧪 Test page:     http://localhost:${PORT}/test-server.html`);
  console.log(`🎨 Demo:          http://localhost:${PORT}/index.html`);
  console.log(`⚡ SVG endpoint:  http://localhost:${PORT}/svg?lines=Hello+World\n`);
});

