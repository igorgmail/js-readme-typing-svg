/**
 * Скрипт проверки синхронизации дефолтных значений
 * между клиентом и сервером
 * 
 * Использование: node scripts/check-defaults-sync.js
 */

import { DEFAULT_PARAMS as clientDefaults } from '../client/js/defaults.js';
import { DEFAULT_PARAMS as serverDefaults } from '../server/utils/defaults.js';

const clientKeys = Object.keys(clientDefaults);
const serverKeys = Object.keys(serverDefaults);

// Параметры, которые есть только на сервере
const serverOnlyParams = ['paddingX', 'paddingY', 'lineHeight'];

// Общие ключи (исключаем server-only параметры)
const commonKeys = clientKeys.filter(k => 
  serverKeys.includes(k) && 
  !serverOnlyParams.includes(k)
);

console.log('🔍 Проверка синхронизации дефолтных значений\n');
console.log('━'.repeat(60));

let hasErrors = false;

// Проверка значений
commonKeys.forEach(key => {
  const clientVal = clientDefaults[key];
  const serverVal = serverDefaults[key];
  
  if (clientVal !== serverVal) {
    console.error(`❌ Несоответствие для "${key}":`);
    console.error(`   Клиент: ${JSON.stringify(clientVal)}`);
    console.error(`   Сервер: ${JSON.stringify(serverVal)}\n`);
    hasErrors = true;
  } else {
    console.log(`✅ ${key}: ${JSON.stringify(clientVal)}`);
  }
});

// Проверка параметров только на сервере
console.log('\n' + '━'.repeat(60));
console.log('\n📋 Параметры только на сервере:\n');
serverOnlyParams.forEach(key => {
  if (serverKeys.includes(key)) {
    console.log(`   ${key}: ${JSON.stringify(serverDefaults[key])}`);
  }
});

// Итоги
console.log('\n' + '━'.repeat(60));
if (hasErrors) {
  console.error('\n❌ ОШИБКА: Обнаружены несоответствия!');
  console.error('   Обновите значения в client/js/defaults.js или server/utils/defaults.js\n');
  process.exit(1);
} else {
  console.log('\n✅ УСПЕХ: Все значения синхронизированы!\n');
  process.exit(0);
}

