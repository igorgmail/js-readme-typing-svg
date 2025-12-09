/**
 * Скрипт для проверки синхронизации дефолтных значений
 * 
 * Проверяет что fallback значения в client/js/utils/defaults.js
 * синхронизированы с server/config/defaults.js
 * 
 * Usage: node scripts/check-defaults-sync.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_PARAMS as serverDefaults, getClientDefaults } from '../server/config/defaults.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Читаем клиентский файл
const clientFilePath = path.join(__dirname, '../client/js/utils/defaults.js');
const clientFileContent = fs.readFileSync(clientFilePath, 'utf-8');

// Извлекаем FALLBACK_DEFAULTS из клиентского файла
const fallbackMatch = clientFileContent.match(/const FALLBACK_DEFAULTS = ({[\s\S]*?});/);
if (!fallbackMatch) {
  console.error('❌ Не удалось найти FALLBACK_DEFAULTS в клиентском файле');
  process.exit(1);
}

// Парсим объект (простой eval для нашего случая)
let clientDefaults;
try {
  // Удаляем комментарии и eval
  const objectStr = fallbackMatch[1]
    .replace(/\/\/.*$/gm, '') // Удаляем однострочные комментарии
    .replace(/\/\*[\s\S]*?\*\//g, ''); // Удаляем многострочные комментарии
  
  clientDefaults = eval(`(${objectStr})`);
} catch (error) {
  console.error('❌ Ошибка парсинга FALLBACK_DEFAULTS:', error.message);
  process.exit(1);
}

// Получаем эталонные клиентские дефолты с сервера
const expectedDefaults = getClientDefaults();

// Сравниваем
console.log('\n🔍 Проверка синхронизации дефолтных значений');
console.log('━'.repeat(60));

let hasErrors = false;

// Проверяем что все ключи из сервера есть на клиенте
for (const key in expectedDefaults) {
  if (!(key in clientDefaults)) {
    console.error(`❌ ${key}: отсутствует в FALLBACK_DEFAULTS`);
    hasErrors = true;
    continue;
  }

  const serverValue = expectedDefaults[key];
  const clientValue = clientDefaults[key];

  if (serverValue !== clientValue) {
    console.error(`❌ ${key}: не совпадает`);
    console.error(`   Сервер:  ${JSON.stringify(serverValue)}`);
    console.error(`   Клиент:  ${JSON.stringify(clientValue)}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${key}: ${JSON.stringify(serverValue)}`);
  }
}

// Проверяем что на клиенте нет лишних ключей
for (const key in clientDefaults) {
  if (!(key in expectedDefaults)) {
    console.warn(`⚠️  ${key}: есть в FALLBACK_DEFAULTS, но отсутствует в серверных дефолтах`);
    console.warn(`   Значение: ${JSON.stringify(clientDefaults[key])}`);
  }
}

console.log('━'.repeat(60));

// Server-only параметры (для информации)
const serverOnlyParams = ['paddingX', 'paddingY', 'lineHeight'];
const serverOnlyPresent = serverOnlyParams.filter(key => key in serverDefaults);
if (serverOnlyPresent.length > 0) {
  console.log('\nℹ️  Server-only параметры (не отдаются клиенту):');
  serverOnlyPresent.forEach(key => {
    console.log(`   ${key}: ${JSON.stringify(serverDefaults[key])}`);
  });
}

console.log();

if (hasErrors) {
  console.error('❌ ОШИБКА: Найдены несоответствия!');
  console.error('   Обновите FALLBACK_DEFAULTS в client/js/utils/defaults.js\n');
  process.exit(1);
} else {
  console.log('✅ УСПЕХ: Все значения синхронизированы!\n');
  process.exit(0);
}

