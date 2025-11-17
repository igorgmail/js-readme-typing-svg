# Миграция на нативные Intl API

## Что изменилось

Модуль `variables.js` теперь использует **только нативные браузерные API** для форматирования дат и относительного времени:

- ✅ **`Intl.DateTimeFormat`** — для форматирования дат (`$DATE`)
- ✅ **`Intl.RelativeTimeFormat`** — для относительного времени (`$RELDATE`)

## До и После

### Переменная $DATE

#### ❌ Старый синтаксис (самодельный парсер):
```javascript
"$DATE{format: YYYY-MM-DD, locale: ru}"
"$DATE{format: dddd\, DD MMMM YYYY, locale: ru}"
```

#### ✅ Новый синтаксис (Intl.DateTimeFormat):
```javascript
// Preset стили
"$DATE{dateStyle: full, locale: ru}"
// Результат: "понедельник, 17 ноября 2025 г."

"$DATE{dateStyle: long, timeStyle: short, locale: ru}"
// Результат: "17 ноября 2025 г. в 14:30"

// Детальные опции
"$DATE{year: numeric, month: long, day: numeric, locale: ru}"
// Результат: "17 ноября 2025 г."

"$DATE{weekday: long, month: short, day: numeric, locale: en}"
// Результат: "Monday, Nov 17"
```

### Переменная $RELDATE

Синтаксис не изменился, используется нативный API с самого начала:

```javascript
"$RELDATE{value: -2, unit: hour, locale: ru}"
// Результат: "2 часа назад"

"$RELDATE{value: 5, unit: day, numeric: auto, locale: en}"
// Результат: "in 5 days"
```

## Преимущества новых API

### 1. Автоматическая локализация
Не нужно вручную прописывать названия месяцев и дней недели — API поддерживает **все** локали браузера.

### 2. Меньше кода
- **Было:** 57 строк для `formatDate()`
- **Стало:** 51 строка для полноценной обертки с двумя режимами

### 3. Больше возможностей
- Часовые пояса
- 12/24 часовой формат
- Короткие/длинные/узкие форматы
- Полная локализация

### 4. Производительность
Нативные API оптимизированы на уровне браузера.

### 5. Стандартизация
Следование международным стандартам ECMA-402.

## Миграция существующих проектов

Если вы используете старый синтаксис `$DATE{format: YYYY-MM-DD}`, обновите на новый:

| Старый | Новый |
|--------|-------|
| `format: YYYY-MM-DD` | `year: numeric, month: 2-digit, day: 2-digit` |
| `format: DD.MM.YYYY` | `day: 2-digit, month: 2-digit, year: numeric` |
| `format: MMMM DD\, YYYY` | `month: long, day: numeric, year: numeric` |
| `format: dddd\, DD MMMM` | `weekday: long, day: numeric, month: long` |

Или используйте простые preset стили:

| Старый формат | Новый preset |
|---------------|--------------|
| Полная дата | `dateStyle: full` |
| Длинная дата | `dateStyle: long` |
| Средняя дата | `dateStyle: medium` |
| Короткая дата | `dateStyle: short` |

## Ссылки на спецификации

- [ECMA-402: Intl.DateTimeFormat](https://tc39.es/ecma402/#datetimeformat-objects)
- [ECMA-402: Intl.RelativeTimeFormat](https://tc39.es/ecma402/#relativetimeformat-objects)
- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [MDN: Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat)

## Примеры кода

### Простая дата
```javascript
lines: ["Today: $DATE{dateStyle: medium, locale: en}"]
// Результат: "Today: Nov 17, 2025"
```

### Дата и время
```javascript
lines: ["Now: $DATE{dateStyle: short, timeStyle: short, locale: ru}"]
// Результат: "Now: 17.11.2025, 14:30"
```

### С часовым поясом
```javascript
lines: ["Tokyo: $DATE{dateStyle: full, timeStyle: long, timeZone: Asia/Tokyo}"]
// Результат: "Tokyo: Monday, November 17, 2025 at 8:30:45 PM JST"
```

### Детальный контроль
```javascript
lines: ["$DATE{weekday: short, month: short, day: numeric, hour: 2-digit, minute: 2-digit}"]
// Результат: "Mon, Nov 17, 02:30 PM"
```

### Комбинация с относительным временем
```javascript
lines: [
  "Created: $DATE{dateStyle: long}",
  "Updated: $RELDATE{value: -3, unit: hour}"
]
// Результат:
// "Created: November 17, 2025"
// "Updated: 3 hours ago"
```

