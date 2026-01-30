import express from 'express';
import { handleSVG } from './routes/svg.js';
import { handleDefaults } from './routes/defaults.js';
import logger from'morgan';

const app = express();
const PORT = process.env.PORT || 3000;

// Check fetch API support on startup
if (typeof fetch !== 'function') {
  console.warn('\n⚠️  WARNING: fetch API is not available in your Node.js version');
  console.warn('   Google Fonts will not be loaded. Custom fonts will be ignored.');
  console.warn('   Please upgrade to Node.js >= 18.13.0 for full functionality.\n');
}

app.use(logger('dev'));
// Static files: serve /client/* from client/ folder
app.use('/client', express.static('client'));
// Root static files (for backward compatibility)
app.use(express.static('client'));

// Route for main page (generator)
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'client' });
});

// API endpoints
app.get('/svg', handleSVG);
app.get('/defaults', handleDefaults);
app.get('/api/defaults', handleDefaults);

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}\n`);
  console.log(`🎨 Generator:        http://localhost:${PORT}/\n`);
  
  console.log(`API Endpoints:`);
  console.log(`⚡ /svg              http://localhost:${PORT}/svg?lines=Hello+World`);
  console.log(`📋 /api/defaults     http://localhost:${PORT}/api/defaults\n`);
});

