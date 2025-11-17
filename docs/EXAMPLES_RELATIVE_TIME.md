# Примеры использования $RELATIVE_DATE

## Базовые примеры

### Вчера / Завтра
```javascript
lines: [
  "Last updated $RELDATE{value: -1, unit: day}"
]
// Результат: "Last updated yesterday"

lines: [
  "Release $RELDATE{value: 1, unit: day}"
]
// Результат: "Release tomorrow"
```

### Часы назад
```javascript
lines: [
  "Posted $RELDATE{value: -3, unit: hour}"
]
// Результат: "Posted 3 hours ago"
```

### Русская локаль
```javascript
lines: [
  "Начал работу $RELDATE{value: -2, unit: hour, locale: ru}"
]
// Результат: "Начал работу 2 часа назад"

lines: [
  "Релиз $RELDATE{value: 7, unit: day, locale: ru}"
]
// Результат: "Релиз через 7 дней"
```

## Различные стили

### Long (полный)
```javascript
"$RELDATE{value: 5, unit: day, style: long}"
// Результат: "in 5 days"
```

### Short (короткий)
```javascript
"$RELDATE{value: 5, unit: day, style: short}"
// Результат: "in 5 days"
```

### Narrow (компактный)
```javascript
"$RELDATE{value: 5, unit: day, style: narrow}"
// Результат: "in 5d"
```

## Numeric: auto vs always

### Auto (словесные формы)
```javascript
"$RELDATE{value: -1, unit: day, numeric: auto}"
// Результат: "yesterday"

"$RELDATE{value: 0, unit: day, numeric: auto}"
// Результат: "today"

"$RELDATE{value: 1, unit: day, numeric: auto}"
// Результат: "tomorrow"
```

### Always (числовой формат)
```javascript
"$RELDATE{value: -1, unit: day, numeric: always}"
// Результат: "1 day ago"

"$RELDATE{value: 1, unit: day, numeric: always}"
// Результат: "in 1 day"
```

## Различные единицы времени

```javascript
// Года
"$RELDATE{value: -1, unit: year}"
// Результат: "last year"

// Месяцы
"$RELDATE{value: 2, unit: month, locale: ru}"
// Результат: "через 2 месяца"

// Недели
"$RELDATE{value: -3, unit: week}"
// Результат: "3 weeks ago"

// Часы
"$RELDATE{value: -5, unit: hour}"
// Результат: "5 hours ago"

// Минуты
"$RELDATE{value: 30, unit: minute}"
// Результат: "in 30 minutes"

// Секунды
"$RELDATE{value: -45, unit: second}"
// Результат: "45 seconds ago"
```

## Комбинация переменных

```javascript
createMultilineBlockTypingSVG({
  lines: [
    "Project: My Awesome App",
    "Created: $DATE{format: DD.MM.YYYY}",
    "Last commit: $RELDATE{value: -3, unit: hour, locale: en}",
    "Next release: $RELDATE{value: 14, unit: day, locale: en}"
  ],
  multiLine: true,
  // ...
});

// Результат:
// "Project: My Awesome App"
// "Created: 17.11.2025"
// "Last commit: 3 hours ago"
// "Next release: in 14 days"
```

## Сравнение с конкретной датой

```javascript
"$RELDATE{date: 2025-12-31, unit: day}"
// Результат: "in X days" (где X = дни до 31 декабря 2025)

"$RELDATE{date: 2025-01-01, unit: week}"
// Результат: "X weeks ago" (если дата в прошлом)
```

## Практические кейсы

### GitHub Profile README
```javascript
lines: [
  "👋 Hi, I'm Developer",
  "🔭 Working on project",
  "📝 Last commit $RELDATE{value: -5, unit: hour}",
  "🎯 Next milestone $RELDATE{value: 7, unit: day}"
]
```

### Status Badge
```javascript
lines: [
  "Status: Active",
  "Updated $RELDATE{value: -1, unit: day, numeric: auto}",
  "Next check $RELDATE{value: 2, unit: hour}"
]
```

### Blog Post Meta
```javascript
lines: [
  "Published $RELDATE{value: -14, unit: day}",
  "Reading time: 5 min"
]
```

