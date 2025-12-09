import express from 'express';
import { handleSVG } from './routes/svg.js';
import { handleDefaults } from './routes/defaults.js';
import logger from'morgan';

const app = express();
const PORT = process.env.PORT || 3000;

// cod
app.use(logger('dev'));
// Статические файлы: раздаем /client/* из папки client/
app.use('/client', express.static('client'));
// Корневые статические файлы (для обратной совместимости)
app.use(express.static('client'));

// Роуты для прямого доступа к страницам
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'client' });
});

app.get('/generator', (req, res) => {
  res.sendFile('generator.html', { root: 'client' });
});

app.get('/generator.html', (req, res) => {
  res.sendFile('generator.html', { root: 'client' });
});

// API endpoints
app.get('/svg', handleSVG);
app.get('/defaults', handleDefaults);
app.get('/api/defaults', handleDefaults);

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}\n`);
  console.log(`📝 Generator:        http://localhost:${PORT}/generator`);
  console.log(`🎨 Demo:             http://localhost:${PORT}/\n`);
  
  console.log(`API Endpoints:`);
  console.log(`⚡ /svg              http://localhost:${PORT}/svg?lines=Hello+World`);
  console.log(`📋 /api/defaults     http://localhost:${PORT}/api/defaults\n`);
});

