# Архитектура SVG Генератора

## Диаграмма компонентов

```
┌─────────────────────────────────────────────────────────────────┐
│                   core/svg-generator.js                         │
│                    (Главный координатор)                        │
│  - Парсинг входных параметров                                   │
│  - Нормализация данных                                          │
│  - Координация модулей                                          │
│  - Асинхронная загрузка шрифтов                                │
└───────────┬─────────────────────────────────────────────────────┘
            │
            ├──────────────────┬──────────────────┬─────────────────┬─────────────
            │                  │                  │                 │
            ▼                  ▼                  ▼                 ▼
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ utils/          │  │ core/            │  │ core/            │  │ fonts/           │
│ text-utils.js   │  │ svg-renderer.js  │  │ animation-       │  │ font-embed.js    │
│                 │  │                  │  │ calculator.js    │  │ font-metrics.js  │
│ • escapeXml     │  │ • renderSVG      │  │                  │  │                  │
│ • validate      │  │ • generate       │  │ • calculateStartY│  │ • getEmbedded    │
│   FontFamily    │  │   TextElement    │  │ • calculate      │  │   FontCSS        │
│ • process       │  │ • generate       │  │   LinesAnimation │  │ • getCharWidth   │
│   Background    │  │   Opacity        │  │ • calculate      │  │ • computeText    │
│ • parseLetterSp │  │   Animation      │  │   PrintCursor    │  │   WidthPrecise   │
│ • computeText   │  │ • generate       │  │   Positions      │  │ • getCharacter   │
│   Width         │  │   CursorElement  │  │ • calculate      │  │   Widths         │
│ • computeTextX  │  │ • generate       │  │   EraseCursor    │  │                  │
│                 │  │   MultiLineCursor│  │   Positions      │  │                  │
└─────────────────┘  └──────────────────┘  └────────┬─────────┘  └──────────────────┘
                                                     │
                    ┌────────────────────────────────┴────────────────────────┐
                    │                                                         │
                    ▼                                                         ▼
         ┌──────────────────────┐                              ┌──────────────────────┐
         │   effects/erase/     │                              │   effects/cursor/    │
         │   (Strategy Pattern) │                              │                      │
         └──────────┬───────────┘                              │ • isCursorAllowed    │
                    │                                          │ • shouldHide         │
         ┌──────────┼──────────┐                              │   CursorWhenFinished │
         │          │          │                               │ • getCursorInfo      │
         ▼          ▼          ▼                               └──────────────────────┘
    ┌────────┐ ┌────────┐ ┌────────┐
    │ Fade   │ │ Line   │ │ None   │
    │ Erase  │ │ Erase  │ │ Erase  │
    │ Mode   │ │ Mode   │ │ Mode   │
    └────────┘ └────────┘ └────────┘
                           
         ┌──────────────────────┐
         │   processors/        │
         │                      │
         │ • style-segments-    │
         │   parser.js          │
         │   - parseStyle       │
         │     Segments         │
         │   - stripStyle       │
         │     Markers          │
         │   - hasStyle         │
         │     Markers          │
         │                      │
         │ • variables-parser.js│
         │   - parseLines       │
         └──────────────────────┘
```

## Взаимодействие компонентов

### 1. Входная точка: `generateSVG(params)`

```javascript
generateSVG({
  lines: ['Text 1', 'Text 2'],
  fontSize: 20,
  eraseMode: 'fade',
  multiLine: true,
  repeat: true,
  fontFamily: 'Roboto',
  fontWeight: 400
})
```

### 2. Этап парсинга и нормализации

```javascript
// core/svg-generator.js
const lines = parseLines(rawLines);
const normalizedParams = {
  multiLine: true/false,
  repeat: true/false,
  color: '#XXXXXX',
  printSpeed: 10,
  eraseSpeed: 10,
  delayBetweenLines: 800,
  // ...
};
```

### 3. Загрузка и встраивание шрифтов (асинхронно)

```javascript
// fonts/font-embed.js
const fontData = await getEmbeddedFontCSS({
  fontFamily: 'Roboto',
  fontWeight: 400,
  lines
});
// → { css: '@font-face {...}', parsedFont: Font {...} }

// fonts/font-metrics.js использует opentype.js
const parsedFont = fontData.parsedFont; // opentype.Font объект
```

### 4. Вычисление позиций с точными метриками шрифта

```javascript
// core/animation-calculator.js использует fonts/font-metrics.js
const startY = calculateStartY({ /* config */ });

// Точный расчет с метриками из opentype.js
const textWidth = computeTextWidthPrecise(text, fontSize, parsedFont, letterSpacing);
const startX = computeTextX(text, fontSize, align, width, padding, letterSpacing, fontFamily, parsedFont);

// Получаем накопленные ширины для анимации курсора
const widths = getCharacterWidths(line, fontSize, parsedFont, letterSpacing);
// → [0, width1, width1+width2, width1+width2+width3, ...]
```

### 5. Обработка цветовых сегментов

```javascript
// processors/style-segments-parser.js
const hasMarkers = hasStyleMarkers(line);
// Проверка на маркеры типа: "Text <<color:#FF0000>>red text<<reset>>"

const segments = parseStyleSegments(line, defaultColor);
// → [
//   { text: 'Text ', color: '#000000' },
//   { text: 'red text', color: '#FF0000' }
// ]

const cleanLine = stripStyleMarkers(line);
// → "Text red text" (для расчетов длительности)
```

### 6. Применение стратегии стирания

```javascript
// core/animation-calculator.js
const eraseModeInstance = getEraseMode('fade'); // effects/erase/index.js

// Для разных режимов:
const eraseResult = eraseModeInstance.calculateMultiLineMode(config);
// или
const eraseResult = eraseModeInstance.calculateReplacingMode(config);
// или
const eraseResult = eraseModeInstance.calculateSingleLineMode(config);

// → { useFadeErase, fadeEraseStart, fadeEraseEnd, keyTimes, pathValues }
```

### 7. Расчет детальных позиций курсора

```javascript
// core/animation-calculator.js
// Для печати (посимвольное движение курсора)
const printCursorData = calculatePrintCursorPositions({
  line, startX, printStart, printEnd, 
  fontSize, letterSpacing, parsedFont
});
// → { keyTimes: [t0, t1, t2, ...], xPositions: [x0, x1, x2, ...] }

// Для стирания (посимвольное движение курсора назад)
const eraseCursorData = calculateEraseCursorPositions({
  line, startX, eraseStart, eraseEnd,
  fontSize, letterSpacing, parsedFont
});
// → { keyTimes: [t0, t1, t2, ...], xPositions: [xN, xN-1, xN-2, ...] }
```

### 8. Генерация данных для рендера

```javascript
// core/animation-calculator.js
const linesData = lines.map(line => ({
  index,
  pathId,
  animateId,
  line,
  // Геометрия
  startX,
  y,
  textWidth,
  fontFamily,
  color,
  fontSize,
  fontWeight,
  letterSpacingValue,
  // Анимация текста
  begin,
  totalDuration,
  fillValue,
  pathValues,
  keyTimes,
  useFadeErase,
  fadeEraseStart,
  fadeEraseEnd,
  // Режимы
  multiLine,
  isReplacingMode,
  // Данные курсора
  cursorStyle,
  cursorKeyTimes,
  cursorValues,
  cursorFillValue,
  // Детальные позиции для multiline
  printStart,
  printEnd,
  eraseStart,
  eraseEnd,
  cursorPrintKeyTimes,
  cursorPrintXPositions,
  cursorEraseKeyTimes,
  cursorEraseXPositions
}));
```

### 9. Рендеринг SVG

```javascript
// core/svg-renderer.js
return renderSVG({
  width,
  height,
  background,
  linesData,
  fontCSS // Встроенные шрифты
});

// Внутри:
// - generateTextElement() - для каждой строки
// - generateCursorElement() - единый курсор
//   - generatePerLineCursor() - для single/replacing режима
//   - generateMultiLineCursor() - для multiline режима
// - generateOpacityAnimation() - для fade эффекта
// - generateTextPathContent() - с поддержкой цветовых сегментов
```

## Ключевые улучшения архитектуры

### 1. Точные метрики шрифта (opentype.js)

**До:**
```javascript
// Приближенный расчет
const charWidth = fontSize * 0.5; // Грубая оценка
```

**После:**
```javascript
// Точный расчет с opentype.js
const glyph = font.charToGlyph(char);
const scale = fontSize / font.unitsPerEm;
const charWidth = glyph.advanceWidth * scale;
```

**Преимущества:**
- ✅ Точная ширина каждого символа
- ✅ Корректная анимация курсора
- ✅ Правильное позиционирование текста
- ✅ Поддержка пропорциональных шрифтов
- ✅ Поддержка emoji (особая обработка)

### 2. Детальная анимация курсора

**Проблема (было):**
- Курсор двигался линейно от начала до конца строки
- Не учитывалась разная ширина символов
- Курсор "опережал" или "отставал" от текста

**Решение (стало):**
```javascript
// Для каждого символа создается ключевая точка
const widths = getCharacterWidths(line, fontSize, parsedFont, letterSpacing);
// [0, 8.5, 17.2, 23.1, ...] - накопленные ширины

// Генерируем keyTimes и xPositions для каждого символа
for (let i = 0; i <= chars.length; i++) {
  const progress = i / chars.length;
  const time = printStart + (printEnd - printStart) * progress;
  const x = startX + widths[i];
  
  keyTimes.push(time);
  xPositions.push(x);
}
```

**Результат:**
- ✅ Курсор следует точно за каждым символом
- ✅ Учитывается разная ширина букв (i vs W)
- ✅ Плавное движение при печати и стирании

### 3. Корректный расчет пауз между строками

**Проблема (было):**
```javascript
// Использовалась длительность ТЕКУЩЕЙ строки для всех
const timeBeforeThisLine = index * (printDuration + delayBetweenLines);
const totalPrintTime = lines.length * (printDuration + delayBetweenLines);
```

**Решение (стало):**
```javascript
// Рассчитываем длительность КАЖДОЙ строки отдельно
const msPerCharPrint = 1000 / printSpeed;
const lineDurations = cleanLines.map(l => l.length * msPerCharPrint);

// Суммируем длительности ВСЕХ предыдущих строк
let timeBeforeThisLine = 0;
for (let i = 0; i < index; i++) {
  timeBeforeThisLine += lineDurations[i] + delayBetweenLines;
}

// Общее время = сумма длительностей всех строк + паузы
const totalPrintTime = lineDurations.reduce((sum, dur) => sum + dur, 0) 
  + (lines.length - 1) * delayBetweenLines;
```

**Результат:**
- ✅ Паузы между строками одинаковые
- ✅ Учитывается разная длина строк
- ✅ Пауза перед началом стирания
- ✅ Паузы между строками при стирании

### 4. Поддержка цветовых сегментов

```javascript
// Маркеры в тексте
const line = "Normal <<color:#FF0000>>Red<<reset>> <<color:#00FF00>>Green<<reset>>";

// Парсинг
const segments = parseStyleSegments(line, '#000000');
// → [
//   { text: 'Normal ', color: '#000000' },
//   { text: 'Red', color: '#FF0000' },
//   { text: ' ', color: '#000000' },
//   { text: 'Green', color: '#00FF00' }
// ]

// Рендеринг
segments.map(segment => 
  `<tspan fill="${segment.color}">${escapeXml(segment.text)}</tspan>`
).join('');
```

**Результат:**
- ✅ Многоцветный текст в одной строке
- ✅ Маркеры очищаются при расчетах
- ✅ Корректная длительность анимации

## Паттерны проектирования

### Strategy Pattern (Стратегия)
**Где**: `effects/erase/`

**Зачем**: Позволяет легко добавлять новые режимы стирания без изменения основного кода

**Как работает**:
1. Базовый класс `EraseMode` определяет интерфейс
2. Конкретные классы (`FadeEraseMode`, `LineEraseMode`, `NoneEraseMode`) реализуют интерфейс
3. Фабрика `getEraseMode(name)` возвращает нужную стратегию
4. Калькулятор использует стратегию для вычисления параметров

**Методы стратегий**:
- `calculateSingleLineMode(config)` - для одной строки
- `calculateReplacingMode(config)` - для режима замены строк
- `calculateMultiLineMode(config)` - для многострочного режима

**Преимущества**:
- ✅ Open/Closed Principle - открыт для расширения, закрыт для модификации
- ✅ Легко добавить новый режим стирания
- ✅ Легко тестировать каждый режим отдельно

### Coordinator Pattern (Координатор)
**Где**: `core/svg-generator.js`

**Зачем**: Централизованное управление процессом генерации

**Как работает**:
1. Принимает входные параметры
2. Асинхронно загружает и встраивает шрифты
3. Делегирует работу специализированным модулям
4. Собирает результаты
5. Возвращает итоговый SVG

**Преимущества**:
- ✅ Простота понимания общего потока
- ✅ Легко модифицировать процесс
- ✅ Компактный главный файл (~95 строк)
- ✅ Асинхронная обработка шрифтов

### Module Pattern (Модули)
**Где**: Все файлы

**Зачем**: Инкапсуляция и переиспользование

**Как работает**:
- Каждый модуль экспортирует только необходимые функции
- Внутренние детали скрыты
- Модули не зависят друг от друга напрямую
- Четкое разделение ответственности

**Преимущества**:
- ✅ Слабое связывание (Loose Coupling)
- ✅ Высокая когезия (High Cohesion)
- ✅ Переиспользование кода
- ✅ Простое тестирование

## Структура проекта

```
server/
├─ core/                          # Ядро генератора
│  ├─ svg-generator.js (~95 строк) - Координатор
│  ├─ svg-renderer.js (~493 строки) - Рендеринг SVG
│  └─ animation-calculator.js (~564 строки) - Расчеты анимации
│
├─ effects/                       # Эффекты
│  ├─ cursor/                     # Управление курсором
│  │  └─ index.js
│  ├─ erase/                      # Стратегии стирания
│  │  ├─ EraseMode.js            # Базовый класс
│  │  ├─ FadeEraseMode.js        # Fade режим
│  │  ├─ LineEraseMode.js        # Line режим
│  │  ├─ NoneEraseMode.js        # None режим
│  │  └─ index.js                # Фабрика
│  └─ print/                      # Режимы печати (будущее)
│
├─ fonts/                         # Работа со шрифтами
│  ├─ font-embed.js              # Встраивание шрифтов
│  ├─ font-metrics.js            # Точные метрики (opentype.js)
│  └─ data/                      # Данные шрифтов
│
├─ processors/                    # Обработчики
│  ├─ style-segments-parser.js   # Парсинг цветовых сегментов
│  └─ variables-parser.js        # Парсинг переменных
│
├─ utils/                         # Утилиты
│  ├─ text-utils.js              # Утилиты текста
│  ├─ defaults.js                # Дефолтные значения
│  └─ params-parser.js           # Парсинг параметров
│
├─ config/                        # Конфигурация
│  ├─ defaults.js
│  └─ params-parser.js
│
├─ routes/                        # Express роуты
│  └─ svg.js
│
└─ index.js                       # Входная точка сервера
```

## Метрики качества

| Метрика | Значение | Статус |
|---------|----------|--------|
| Размер главного файла | 95 строк | ✅ |
| Размер svg-renderer.js | 493 строки | ✅ Сложная логика курсора |
| Размер animation-calculator.js | 564 строки | ✅ Детальные расчеты |
| Цикломатическая сложность | Низкая | ✅ |
| Связанность модулей | Низкая | ✅ |
| Когезия модулей | Высокая | ✅ |
| Расширяемость | Легко | ✅ |
| Тестируемость | Легко | ✅ |
| Читаемость | Высокая | ✅ |
| Точность метрик | Высокая | ✅ opentype.js |
| Поддержка цветов | Да | ✅ |
| Асинхронность | Да | ✅ Font loading |

## Принципы SOLID

### ✅ Single Responsibility Principle (SRP)
Каждый модуль имеет одну ответственность:
- `font-metrics.js` - только расчет метрик
- `style-segments-parser.js` - только парсинг стилей
- `animation-calculator.js` - только расчет анимации
- `svg-renderer.js` - только рендеринг

### ✅ Open/Closed Principle (OCP)
- Открыт для расширения (новые режимы стирания, новые эффекты)
- Закрыт для модификации (базовая логика не меняется)

### ✅ Liskov Substitution Principle (LSP)
Любой `EraseMode` можно заменить на другой без изменения поведения системы

### ✅ Interface Segregation Principle (ISP)
Клиенты зависят только от нужных им интерфейсов:
- `animation-calculator` использует только `getEraseMode()`
- `svg-renderer` использует только готовые `linesData`

### ✅ Dependency Inversion Principle (DIP)
Зависимости от абстракций:
- `animation-calculator` → `EraseMode` (абстракция)
- `svg-generator` → интерфейсы модулей, а не реализации

## Последние исправления (Декабрь 2024)

### 1. Исправлена анимация курсора в многострочном режиме
**Проблема:** Курсор "прыгал" и терялся при переходах между строками

**Решение:**
- Оптимизирована логика телепортации курсора
- Избегаем избыточных точек с одинаковым keyTime
- Используем мгновенное изменение opacity для плавности

**Код:**
```javascript
// Телепортируем курсор невидимым
pushPoint(detailedKeyTimes[0], detailedXPositions[0], lineY, 0);
// Делаем видимым в той же точке
pushPoint(detailedKeyTimes[0], detailedXPositions[0], lineY, 1);
```

### 2. Исправлен расчет пауз между строками
**Проблема:** Паузы между строками были разные, не соответствовали `delayBetweenLines`

**Решение:**
- Расчет длительности каждой строки индивидуально
- Суммирование длительностей всех предыдущих строк
- Добавлена пауза перед началом стирания
- Учет пауз между строками при стирании

**Код:**
```javascript
const lineDurations = cleanLines.map(l => l.length * msPerCharPrint);
let timeBeforeThisLine = 0;
for (let i = 0; i < index; i++) {
  timeBeforeThisLine += lineDurations[i] + delayBetweenLines;
}
```

### 3. Корректная обработка маркеров стилей
**Проблема:** Маркеры `<<color:#xxx>>` учитывались в расчете длительности

**Решение:**
- Очистка всех строк от маркеров перед расчетами
- Использование `stripStyleMarkers()` для всех вычислений
- Оригинальные строки с маркерами используются только для рендеринга

**Код:**
```javascript
const cleanLines = lines.map(l => stripStyleMarkers(l));
const lineDurations = cleanLines.map(l => l.length * msPerCharPrint);
```

## Будущие расширения

### 1. Print Modes (Готова структура)
```
effects/print/
├─ PrintMode.js (базовый класс)
├─ TypewriterPrintMode.js (посимвольно - текущий)
├─ WordPrintMode.js (пословно)
├─ InstantPrintMode.js (мгновенно)
├─ FadeInPrintMode.js (с fade-in)
└─ index.js (фабрика)
```

### 2. Cursor Modes (Расширение)
- Различные стили курсора (блок, подчеркивание, вертикальная линия)
- Мигающий курсор
- Пользовательские символы курсора

### 3. Transition Modes
Переходы между строками в режиме замены:
- Slide (скольжение)
- Fade (затухание)
- Scale (масштабирование)

### 4. Performance Optimizations
- Кэширование вычислений метрик шрифтов
- Lazy loading режимов стирания
- Оптимизация генерации больших SVG
- WebWorker для тяжелых вычислений (опционально)

### 5. Advanced Text Effects
- Gradient colors
- Shadow effects  
- Stroke effects
- Animation easing functions

## Заключение

Архитектура построена на принципах модульности, расширяемости и точности. Использование opentype.js для точных метрик шрифтов обеспечивает корректную анимацию для любых шрифтов и текстов. Четкое разделение ответственности между модулями позволяет легко добавлять новые функции и исправлять ошибки.
