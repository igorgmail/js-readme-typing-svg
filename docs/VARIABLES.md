# 📅 Работа с переменными

Переменные позволяют вставлять динамический контент в текст SVG-анимации.

## Синтаксис

```
$VARIABLE_NAME{param1: value1, param2: value2}
```

Параметры указываются в фигурных скобках через запятую.

## $DATE — Текущая дата и время

Использует нативный `Intl.DateTimeFormat` для форматирования.

👉 **[Подробнее на MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)**

### Основные параметры

| Параметр | Значения | Описание |
|----------|----------|----------|
| `locale` | `en`, `ru`, `de`, и т.д. | Язык форматирования |
| `dateStyle` | `full`, `long`, `medium`, `short` | Стиль даты |
| `timeStyle` | `full`, `long`, `medium`, `short` | Стиль времени |

### Компоненты даты

| Параметр | Значения | Пример |
|----------|----------|--------|
| `weekday` | `long`, `short`, `narrow` | `Monday`, `Mon`, `M` |
| `year` | `numeric`, `2-digit` | `2024`, `24` |
| `month` | `long`, `short`, `narrow`, `numeric`, `2-digit` | `December`, `Dec`, `D`, `12`, `12` |
| `day` | `numeric`, `2-digit` | `10`, `10` |

### Компоненты времени

| Параметр | Значения | Пример |
|----------|----------|--------|
| `hour` | `numeric`, `2-digit` | `14`, `14` |
| `minute` | `numeric`, `2-digit` | `5`, `05` |
| `second` | `numeric`, `2-digit` | `3`, `03` |
| `hour12` | `true`, `false` | Формат 12/24 часа |

## Примеры $DATE

### Полная дата

```
$DATE{dateStyle: full, locale: en}
→ "Monday, December 10, 2024"

$DATE{dateStyle: full, locale: ru}
→ "понедельник, 10 декабря 2024 г."
```

### Короткая дата

```
$DATE{dateStyle: short}
→ "12/10/24"

$DATE{dateStyle: medium}
→ "Dec 10, 2024"
```

### Компоненты даты

```
$DATE{weekday: long, month: long, day: numeric}
→ "Monday, December 10"

$DATE{year: numeric, month: short, day: numeric}
→ "2024, Dec 10"
```

### Дата и время

```
$DATE{dateStyle: medium, timeStyle: short}
→ "Dec 10, 2024, 2:30 PM"

$DATE{dateStyle: short, timeStyle: medium}
→ "12/10/24, 2:30:45 PM"
```

### Только время

```
$DATE{timeStyle: short}
→ "2:30 PM"

$DATE{hour: numeric, minute: 2-digit, second: 2-digit, hour12: false}
→ "14:30:05"
```

## $RELDATE — Относительное время

Использует нативный `Intl.RelativeTimeFormat`.

### Параметры

| Параметр | Описание | Обязательный |
|----------|----------|--------------|
| `value` | Числовое значение (положительное = будущее, отрицательное = прошлое) | ✅ Да |
| `unit` | Единица времени: `year`, `month`, `week`, `day`, `hour`, `minute`, `second` | ✅ Да |
| `locale` | Язык форматирования (по умолчанию `en`) | ❌ Нет |
| `style` | Стиль: `long`, `short`, `narrow` (по умолчанию `long`) | ❌ Нет |

## Примеры $RELDATE

### Прошлое время

```
$RELDATE{value: -1, unit: day}
→ "yesterday"

$RELDATE{value: -2, unit: hour}
→ "2 hours ago"

$RELDATE{value: -7, unit: day}
→ "7 days ago"

$RELDATE{value: -1, unit: year}
→ "last year"
```

### Будущее время

```
$RELDATE{value: 1, unit: day}
→ "tomorrow"

$RELDATE{value: 5, unit: hour}
→ "in 5 hours"

$RELDATE{value: 3, unit: week}
→ "in 3 weeks"

$RELDATE{value: 2, unit: month}
→ "in 2 months"
```

### С разными локалями

```
$RELDATE{value: -3, unit: hour, locale: ru}
→ "3 часа назад"

$RELDATE{value: 1, unit: day, locale: de}
→ "morgen"

$RELDATE{value: -5, unit: day, locale: fr}
→ "il y a 5 jours"
```

### Стили форматирования

```
$RELDATE{value: -7, unit: day, style: long}
→ "7 days ago"

$RELDATE{value: -7, unit: day, style: short}
→ "7 days ago"

$RELDATE{value: -7, unit: day, style: narrow}
→ "7d ago"
```

## Использование в URL

При использовании в URL параметрах, обязательно кодируйте специальные символы:

### Пример для $DATE

```
Обычный текст:
$DATE{dateStyle: full, locale: en}

URL-кодированный:
$DATE%7BdateStyle%3A%20full%2C%20locale%3A%20en%7D

Или с + вместо пробелов:
$DATE{dateStyle:+full,+locale:+en}
```

### Пример для $RELDATE

```
Обычный текст:
$RELDATE{value: -3, unit: hour}

URL-кодированный:
$RELDATE%7Bvalue%3A%20-3%2C%20unit%3A%20hour%7D

Или с + вместо пробелов:
$RELDATE{value:+-3,+unit:+hour}
```

## Практические примеры

### Последнее обновление профиля

```markdown
![Last Update](https://js-readme-typing-svg.vercel.app/svg?lines=Last+updated:+$DATE{dateStyle:+medium}&fontSize=16&color=666666&repeat=true)
```

<img src="https://js-readme-typing-svg.vercel.app/svg?lines=Last+updated:+$DATE{dateStyle:+medium}&fontSize=16&color=666666&repeat=true" alt="Typing SVG" />



### Стаж разработки

```markdown
![Experience](https://js-readme-typing-svg.vercel.app/svg?lines=Coding+since+$RELDATE{value:+-1095,+unit:+day}&fontSize=20)
```
<img src="https://js-readme-typing-svg.vercel.app/svg?lines=Coding+since+$RELDATE{value:+-1095,+unit:+day}&fontSize=20&repeat=true" alt="Typing SVG" />

### Приветствие с датой

```markdown
![Greeting](https://js-readme-typing-svg.vercel.app/svg?lines=Today+is+$DATE{weekday:+long};Have+a+great+day!&multiLine=true&center=true)
```

<img src="https://js-readme-typing-svg.vercel.app/svg?lines=Today+is+$DATE{weekday:+long};Have+a+great+day!&multiLine=true&center=true&repeat=true" alt="Typing SVG" />

### Статус проекта

```markdown
![Project Status](https://js-readme-typing-svg.vercel.app/svg?lines=Project+started+$RELDATE{value:+-180,+unit:+day};Active+development&multiLine=true)
```
<img src="https://js-readme-typing-svg.vercel.app/svg?lines=Project+started+$RELDATE{value:+-180,+unit:+day};Active+development&multiLine=true&repeat=true" alt="Typing SVG" />

## Комбинирование переменных

Можно использовать несколько переменных в одном тексте:

```
Today is $DATE{weekday: long};Started coding $RELDATE{value: -365, unit: day}
```

В URL:
```
?lines=Today+is+$DATE{weekday:+long};Started+coding+$RELDATE{value:+-365,+unit:+day}
```

## Ограничения

1. Переменные обрабатываются на сервере при генерации SVG
2. Значения обновляются при каждом запросе к API
3. GitHub может кэшировать SVG, обновления могут отображаться не сразу
4. Для форсирования обновления можно добавить параметр `cache-bust` с timestamp

## Поддерживаемые локали

Переменные поддерживают все локали из стандарта IETF BCP 47:

- `en` — English
- `ru` — Русский
- `de` — Deutsch
- `fr` — Français
- `es` — Español
- `it` — Italiano
- `pt` — Português
- `ja` — 日本語
- `zh` — 中文
- `ko` — 한국어
- И многие другие...

## Отладка

Если переменная не работает:

1. Проверьте синтаксис: `$VARIABLE{param: value}`
2. Убедитесь что параметры URL-кодированы
3. Проверьте названия параметров (регистр важен)
4. Для `$RELDATE` обязательны `value` и `unit`
5. Используйте [генератор](https://js-readme-typing-svg.vercel.app/generator) для автоматического создания правильных URL

---

💡 **Совет:** Используйте [визуальный генератор](https://js-readme-typing-svg.vercel.app/generator) для создания правильно отформатированных URL с переменными.

