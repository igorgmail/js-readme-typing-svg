# Переменные в строках

Библиотека поддерживает динамические переменные в строках текста.

## Синтаксис

```
$VARIABLE_NAME{param1: value1, param2: value2}
```

## Доступные переменные

### $RELATIVE_DATE (алиас: $RELDATE) - Относительное время

Форматирует относительное время с использованием API `Intl.RelativeTimeFormat`. Позволяет выводить такие фразы как "вчера", "через 2 дня", "3 часа назад" и т.д.

> **Краткий алиас:** Можно использовать `$RELDATE` вместо `$RELATIVE_DATE`

#### Параметры:

- **value** - числовое значение (положительное для будущего, отрицательное для прошлого)
- **unit** - единица времени: `year`, `quarter`, `month`, `week`, `day`, `hour`, `minute`, `second` (по умолчанию: `day`)
- **locale** - локаль (по умолчанию: `en`)
- **numeric** - режим отображения:
  - `auto` (по умолчанию) - использует словесные формы ("yesterday", "tomorrow")
  - `always` - всегда числовой формат ("1 day ago", "in 2 days")
- **style** - стиль форматирования:
  - `long` (по умолчанию) - полный ("in 3 days")
  - `short` - короткий ("in 3 days")
  - `narrow` - компактный ("in 3d")
- **date** - конкретная дата для сравнения с текущей (формат ISO или любой валидный для `new Date()`)

#### Примеры использования:

```javascript
// Простые примеры с value
"$RELATIVE_DATE{value: -1, unit: day}"
// Результат (en): "yesterday" (с numeric: auto)
// Результат (ru): "вчера"

"$RELATIVE_DATE{value: -1, unit: day, numeric: always}"
// Результат: "1 day ago"

"$RELATIVE_DATE{value: 1, unit: day}"
// Результат: "tomorrow"

"$RELATIVE_DATE{value: 2, unit: day}"
// Результат: "in 2 days"

"$RELATIVE_DATE{value: -3, unit: hour, locale: ru}"
// Результат: "3 часа назад"

// Разные стили
"$RELATIVE_DATE{value: 5, unit: day, style: long}"
// Результат: "in 5 days"

"$RELATIVE_DATE{value: 5, unit: day, style: short}"
// Результат: "in 5 days"

"$RELATIVE_DATE{value: 5, unit: day, style: narrow}"
// Результат: "in 5d"

// Различные единицы времени
"$RELATIVE_DATE{value: -2, unit: week}"
// Результат: "2 weeks ago"

"$RELATIVE_DATE{value: 1, unit: month, locale: ru}"
// Результат: "через 1 месяц"

"$RELATIVE_DATE{value: -1, unit: year}"
// Результат: "last year"

// Сравнение с конкретной датой
"$RELATIVE_DATE{date: 2025-12-31, unit: day}"
// Результат: "in X days" (где X - количество дней до 31 декабря 2025)

// Текущий момент
"$RELATIVE_DATE{value: 0, unit: second}"
// Результат: "now"

"$RELATIVE_DATE{value: 0, unit: day}"
// Результат: "today"
```

#### Комбинации с другими переменными:

```javascript
lines: [
  "Release date: $DATE{format: YYYY-MM-DD}",
  "That's $RELATIVE_DATE{value: 5, unit: day} from now",
]
// Результат:
// "Release date: 2025-11-17"
// "That's in 5 days from now"
```

---

### $DATE - Текущая дата

Форматирует текущую дату с использованием API `Intl.DateTimeFormat`. Поддерживает все локали браузера и мощные опции форматирования.

#### Два режима работы:

**1. Preset стили** (dateStyle / timeStyle)  
**2. Детальные опции компонентов** (year, month, day, и т.д.)

#### Параметры Preset стилей:

- **dateStyle** - стиль даты: `full`, `long`, `medium`, `short`
- **timeStyle** - стиль времени: `full`, `long`, `medium`, `short`
- **locale** - локаль (по умолчанию: `en`)
- **timeZone** - часовой пояс (например, `America/New_York`, `Europe/Moscow`)

#### Параметры компонентов:

**Дата:**
- **year** - `numeric`, `2-digit`
- **month** - `numeric`, `2-digit`, `long`, `short`, `narrow`
- **day** - `numeric`, `2-digit`
- **weekday** - `long`, `short`, `narrow`

**Время:**
- **hour** - `numeric`, `2-digit`
- **minute** - `numeric`, `2-digit`
- **second** - `numeric`, `2-digit`
- **hour12** - `true`, `false` (12/24 час формат)

**Другое:**
- **timeZone** - часовой пояс
- **locale** - локаль

#### Примеры Preset стилей:

```javascript
// Полная дата
"$DATE{dateStyle: full, locale: en}"
// Результат: "Monday, November 17, 2025"

// Полная дата на русском
"$DATE{dateStyle: full, locale: ru}"
// Результат: "понедельник, 17 ноября 2025 г."

// Длинная дата и время
"$DATE{dateStyle: long, timeStyle: long, locale: en}"
// Результат: "November 17, 2025 at 2:30:45 PM GMT+3"

// Короткая дата
"$DATE{dateStyle: short, locale: en}"
// Результат: "11/17/25"

// Только время
"$DATE{timeStyle: medium, locale: ru}"
// Результат: "14:30:45"
```

#### Примеры с компонентами:

```javascript
// Год-Месяц-День (числовой)
"$DATE{year: numeric, month: 2-digit, day: 2-digit}"
// Результат: "11/17/2025" (зависит от локали)

// Полное название месяца
"$DATE{month: long, day: numeric, year: numeric, locale: en}"
// Результат: "November 17, 2025"

// День недели и дата
"$DATE{weekday: long, month: long, day: numeric, locale: ru}"
// Результат: "понедельник, 17 ноября"

// Дата и время
"$DATE{year: numeric, month: short, day: numeric, hour: 2-digit, minute: 2-digit, locale: en}"
// Результат: "Nov 17, 2025, 02:30 PM"

// 24-часовой формат
"$DATE{hour: 2-digit, minute: 2-digit, second: 2-digit, hour12: false}"
// Результат: "14:30:45"
```

#### Часовые пояса:

```javascript
"$DATE{dateStyle: full, timeStyle: long, timeZone: America/New_York, locale: en}"
// Результат: "Monday, November 17, 2025 at 6:30:45 AM EST"

"$DATE{dateStyle: full, timeStyle: long, timeZone: Asia/Tokyo, locale: en}"
// Результат: "Monday, November 17, 2025 at 8:30:45 PM JST"
```

#### Поддерживаемые локали:

API поддерживает **все** локали браузера:
- `en-US`, `en-GB` - English
- `ru-RU` - Русский
- `de-DE` - Deutsch
- `fr-FR` - Français
- `es-ES` - Español
- `ja-JP` - 日本語
- `zh-CN` - 中文
- и многие другие...

## Добавление новых переменных

Чтобы добавить новую переменную, отредактируйте файл `variables.js`:

1. Создайте функцию обработки переменной:

```javascript
function processMyVariable(params) {
  // ваша логика
  return result;
}
```

2. Добавьте case в switch конструкцию функции `parseVariables`:

```javascript
case 'MYVAR':
  return processMyVariable(params);
```

3. Используйте в тексте:

```javascript
lines: [
  "Text with $MYVAR{param: value}"
]
```

## Примеры

### Полный пример использования:

```javascript
createMultilineBlockTypingSVG({
  lines: [
    "Hello, World!",
    "Today is $DATE{format: dddd\, MMMM DD\, YYYY, locale: en}",
    "Current time: $DATE{format: HH:mm:ss}"
  ],
  fontSize: 24,
  multiLine: true,
  // ... другие параметры
});
```

