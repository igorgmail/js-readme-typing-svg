# Архитектура SVG Генератора

## Диаграмма компонентов

```
┌─────────────────────────────────────────────────────────────────┐
│                      svg-generator.js                           │
│                    (Главный координатор)                        │
│  - Парсинг входных параметров                                   │
│  - Нормализация данных                                          │
│  - Координация модулей                                          │
└───────────┬─────────────────────────────────────────────────────┘
            │
            ├──────────────────┬──────────────────┬────────────────
            │                  │                  │
            ▼                  ▼                  ▼
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  text-utils.js  │  │ svg-template.js  │  │ animation-       │
│                 │  │                  │  │ calculator.js    │
│ • escapeXml     │  │ • renderSVG      │  │                  │
│ • validate      │  │ • generate       │  │ • calculateStartY│
│   FontFamily    │  │   TextElement    │  │ • calculate      │
│ • process       │  │ • generate       │  │   LinesAnimation │
│   Background    │  │   Opacity        │  │                  │
│ • parseLetterSp │  │   Animation      │  │                  │
│ • computeText   │  │                  │  │                  │
│   Width         │  │                  │  │                  │
│ • computeTextX  │  │                  │  │                  │
└─────────────────┘  └──────────────────┘  └────────┬─────────┘
                                                     │
                    ┌────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │   erase-modes/       │
         │   (Strategy Pattern) │
         └──────────┬───────────┘
                    │
         ┌──────────┼──────────┐
         │          │          │
         ▼          ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │ Fade   │ │ Line   │ │ Block  │
    │ Erase  │ │ Erase  │ │ Line   │
    │ Mode   │ │ Mode   │ │ Erase  │
    └────────┘ └────────┘ └────────┘
                           
    ┌────────┐
    │ None   │
    │ Erase  │
    │ Mode   │
    └────────┘
```

## Взаимодействие компонентов

### 1. Входная точка: `generateSVG(params)`

```javascript
generateSVG({
  lines: ['Text 1', 'Text 2'],
  fontSize: 20,
  eraseMode: 'fade',
  multiLine: true,
  repeat: true
})
```

### 2. Этап парсинга и нормализации

```javascript
// svg-generator.js
const lines = parseLines(rawLines);
const normalizedParams = {
  multiLine: true/false,
  repeat: true/false,
  color: '#XXXXXX',
  // ...
};
```

### 3. Вычисление позиций

```javascript
// animation-calculator.js использует text-utils.js
const startY = calculateStartY({ /* config */ });
const textWidth = computeTextWidth(text, fontSize, letterSpacing);
const startX = computeTextX(text, fontSize, align, width, padding, spacing);
```

### 4. Применение стратегии стирания

```javascript
// animation-calculator.js
const eraseMode = getEraseMode('fade'); // Получаем стратегию из фабрики
const eraseResult = eraseMode.calculateReplacingMode(config);
// → { useFadeErase, fadeEraseStart, fadeEraseEnd, keyTimes, pathValues }
```

### 5. Генерация данных для рендера

```javascript
// animation-calculator.js
const linesData = lines.map(line => ({
  index,
  pathId,
  animateId,
  line,
  fontFamily,
  color,
  fontSize,
  fontWeight,
  letterSpacingValue,
  begin,
  totalDuration,
  fillValue,
  pathValues,
  keyTimes,
  useFadeErase,
  fadeEraseStart,
  fadeEraseEnd
}));
```

### 6. Рендеринг SVG

```javascript
// svg-template.js
return renderSVG({
  width,
  height,
  background,
  linesData // Массив готовых данных для каждой строки
});
```

## Паттерны проектирования

### Strategy Pattern (Стратегия)
**Где**: `erase-modes/`

**Зачем**: Позволяет легко добавлять новые режимы стирания без изменения основного кода

**Как работает**:
1. Базовый класс `EraseMode` определяет интерфейс
2. Конкретные классы (`FadeEraseMode`, `LineEraseMode`, etc.) реализуют интерфейс
3. Фабрика `getEraseMode(name)` возвращает нужную стратегию
4. Калькулятор использует стратегию для вычисления параметров

**Преимущества**:
- ✅ Open/Closed Principle - открыт для расширения, закрыт для модификации
- ✅ Легко добавить новый режим стирания
- ✅ Легко тестировать каждый режим отдельно

### Coordinator Pattern (Координатор)
**Где**: `svg-generator.js`

**Зачем**: Централизованное управление процессом генерации

**Как работает**:
1. Принимает входные параметры
2. Делегирует работу специализированным модулям
3. Собирает результаты
4. Возвращает итоговый SVG

**Преимущества**:
- ✅ Простота понимания общего потока
- ✅ Легко модифицировать процесс
- ✅ Минимальный главный файл (~75 строк)

### Module Pattern (Модули)
**Где**: Все файлы

**Зачем**: Инкапсуляция и переиспользование

**Как работает**:
- Каждый модуль экспортирует только необходимые функции
- Внутренние детали скрыты
- Модули не зависят друг от друга напрямую

**Преимущества**:
- ✅ Слабое связывание (Loose Coupling)
- ✅ Высокая когезия (High Cohesion)
- ✅ Переиспользование кода

## Сравнение: До и После

### До рефакторинга
```
svg-generator.js (685 строк)
├─ Все утилиты
├─ Все вычисления
├─ Вся логика режимов стирания
├─ Генерация SVG
└─ Сложно понять и расширять
```

### После рефакторинга
```
svg-generator.js (75 строк) - Координатор
├─ utils/text-utils.js (120 строк) - Утилиты
├─ svg-template.js (70 строк) - Рендеринг
├─ animation-calculator.js (220 строк) - Вычисления
└─ erase-modes/ (300 строк) - Стратегии
    ├─ EraseMode.js - Базовый класс
    ├─ FadeEraseMode.js
    ├─ LineEraseMode.js
    ├─ BlockLineEraseMode.js
    ├─ NoneEraseMode.js
    └─ index.js - Фабрика

Итого: ~785 строк (было 685)
Но: Модульно, расширяемо, читаемо, тестируемо
```

## Метрики качества

| Метрика | До | После | Улучшение |
|---------|----|----|-----------|
| Размер главного файла | 685 строк | 75 строк | ↓ 89% |
| Цикломатическая сложность | Высокая | Низкая | ✅ |
| Связанность модулей | Высокая | Низкая | ✅ |
| Когезия модулей | Низкая | Высокая | ✅ |
| Расширяемость | Сложно | Легко | ✅ |
| Тестируемость | Сложно | Легко | ✅ |
| Читаемость | Низкая | Высокая | ✅ |

## Принципы SOLID

### ✅ Single Responsibility Principle (SRP)
Каждый модуль имеет одну ответственность

### ✅ Open/Closed Principle (OCP)
Открыт для расширения (новые режимы), закрыт для модификации

### ✅ Liskov Substitution Principle (LSP)
Любой EraseMode можно заменить на другой без изменения поведения системы

### ✅ Interface Segregation Principle (ISP)
Клиенты зависят только от нужных им интерфейсов

### ✅ Dependency Inversion Principle (DIP)
Зависимости от абстракций (EraseMode), а не от конкретных реализаций

## Будущие расширения

### 1. Print Modes (Готова структура)
```
print-modes/
├─ PrintMode.js (базовый класс)
├─ TypewriterPrintMode.js (будущее)
├─ WordPrintMode.js (будущее)
├─ InstantPrintMode.js (будущее)
├─ FadeInPrintMode.js (будущее)
└─ index.js (фабрика)
```

### 2. Transition Modes (Будущее)
Переходы между строками в режиме замены

### 3. Effect Plugins (Будущее)
Дополнительные визуальные эффекты (тени, свечение, и т.д.)

### 4. Performance Optimizations
- Кэширование вычислений
- Lazy loading режимов
- WebWorker для тяжелых вычислений

