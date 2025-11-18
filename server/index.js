import express from 'express';
import { handleSVG } from './routes/svg.js';
import logger from'morgan';

const app = express();
const PORT = process.env.PORT || 3000;

// cod
app.use(logger('dev'));
// Статические файлы из client (css, js и другие ресурсы)
app.use(express.static('client'));
// Статические файлы для HTML страниц из client/pages
app.use(express.static('client/pages', {
  extensions: ['html']
}));

// Роуты для прямого доступа к страницам
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'client/pages' });
});

app.get('/generator.html', (req, res) => {
  res.sendFile('generator.html', { root: 'client/pages' });
});

app.get('/test-server.html', (req, res) => {
  res.sendFile('test-server.html', { root: 'client/pages' });
});

// Единственный эндпоинт для генерации SVG (без JavaScript)
app.get('/svg', handleSVG);

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}\n`);
  console.log(`📝 Generator:        http://localhost:${PORT}/generator.html`);
  console.log(`🧪 Test:             http://localhost:${PORT}/test-server.html`);
  console.log(`🎨 Demo:             http://localhost:${PORT}/index.html\n`);
  
  console.log(`API Endpoint:`);
  console.log(`⚡ /svg              http://localhost:${PORT}/svg?lines=Hello+World\n`);
});

