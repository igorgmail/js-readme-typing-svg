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

👉 **[Подробнее на MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)**

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
![Last Update](https://js-readme-typing-svg.vercel.app/svg?lines=Last+updated:+$DATE{dateStyle:+medium}&fontSize=16&color=666666&height=80&repeat=true)
```

<img src="https://js-readme-typing-svg.vercel.app/svg?lines=Last+updated:+$DATE{dateStyle:+medium}&fontSize=16&color=666666&height=80&repeat=true" alt="Typing SVG" />



### Стаж разработки

```markdown
![Experience](https://js-readme-typing-svg.vercel.app/svg?lines=Coding+since+$RELDATE{value:+-1095,+unit:+day}&fontSize=20&height=80&repeat=true)
```
<img src="https://js-readme-typing-svg.vercel.app/svg?lines=Coding+since+$RELDATE{value:+-1095,+unit:+day}&fontSize=20&height=80&repeat=true" alt="Typing SVG" />

### Приветствие с датой

```markdown
![Greeting](https://js-readme-typing-svg.vercel.app/svg?lines=Today+is+$DATE{weekday:+long};Have+a+great+day!&multiLine=true&center=true&height=80&repeat=true)
```

<img src="https://js-readme-typing-svg.vercel.app/svg?lines=Today+is+$DATE{weekday:+long};Have+a+great+day!&multiLine=true&center=true&height=80&repeat=true" alt="Typing SVG" />

### Статус проекта

```markdown
![Project Status](https://js-readme-typing-svg.vercel.app/svg?lines=Project+started+$RELDATE{value:+-180,+unit:+day};Active+development&multiLine=true&height=80&repeat=true)
```
<img src="https://js-readme-typing-svg.vercel.app/svg?lines=Project+started+$RELDATE{value:+-180,+unit:+day};Active+development&multiLine=true&height=80&repeat=true" alt="Typing SVG" />

## $STYLE — Стилизация текста

Позволяет применять различные стили к части текста внутри строки.

### Параметры

| Параметр | Описание | Пример значения | Обязательный |
|----------|----------|-----------------|--------------|
| `text` | Текст для стилизации | `"Hello"` | ✅ Да |
| `color` | Цвет текста | `#FF0000`, `FF0000` | ❌ Нет |
| `fontWeight` или `weight` | Толщина шрифта | `bold`, `400`, `700` | ❌ Нет |
| `fontSize` или `size` | Размер шрифта | `20`, `24px` | ❌ Нет |
| `fontFamily` или `font` | Семейство шрифта | `"Arial"`, `"Roboto"` | ❌ Нет |
| `opacity` | Прозрачность | `0.5`, `0.8` | ❌ Нет |
| `italic` | Курсив | `true`, `false` | ❌ Нет |
| `underline` | Подчеркивание | `true`, `false` | ❌ Нет |
| `strikethrough` | Зачеркивание | `true`, `false` | ❌ Нет |

### Примеры $STYLE

#### Изменение цвета

```
Normal text $STYLE{text: 'red text', color: #FF0000} back to normal
```

#### Жирный шрифт

```
$STYLE{text: 'Important!', fontWeight: bold, color: #FF5722}
```

#### Курсив с прозрачностью

```
$STYLE{text: 'subtle text', italic: true, opacity: 0.7}
```

#### Подчеркнутый текст

```
$STYLE{text: 'underlined', underline: true, color: #2196F3}
```

#### Зачеркнутый текст

```
$STYLE{text: 'deprecated', strikethrough: true, color: #999999}
```

#### Другой размер шрифта

```
Normal text $STYLE{text: 'BIG', fontSize: 32} and small again
```

#### Другой шрифт

```
$STYLE{text: 'Monospace', fontFamily: 'Courier New', color: #4CAF50}
```

#### Комбинация стилей

```
$STYLE{text: 'STYLED', color: #9C27B0, fontWeight: bold, italic: true, fontSize: 28}
```

### Использование $STYLE в URL

При использовании в URL параметрах, обязательно кодируйте специальные символы:

```
Обычный текст:
$STYLE{text: 'red', color: #FF0000}

URL-кодированный:
$STYLE%7Btext%3A%20%27red%27%2C%20color%3A%20%23FF0000%7D

Или с + вместо пробелов:
$STYLE{text:+'red',+color:+#FF0000}
```

### Практические примеры $STYLE

#### Выделение статуса

```markdown
![Status](https://js-readme-typing-svg.vercel.app/svg?lines=$STYLE{text:+ONLINE,+color:+00FF00,+fontWeight:+bold}+Server+Status)
```
<img src="https://js-readme-typing-svg.vercel.app/svg?lines=$STYLE{text:+ONLINE,+color:+00FF00,+fontWeight:+bold}+Server+Status&height=80&repeat=true" alt="Typing SVG" />

#### Акцент на важной информации

```markdown
![Warning](https://js-readme-typing-svg.vercel.app/svg?lines=⚠️+$STYLE{text:+WARNING,+color:+FF9800,+fontWeight:+bold,+fontSize:+32}+System+maintenance)
```
<img src="https://js-readme-typing-svg.vercel.app/svg?lines=⚠️+$STYLE{text:+WARNING,+color:+FF9800,+fontWeight:+bold,+fontSize:+32}+System+maintenance&height=80&repeat=true" alt="Typing SVG" />

#### Разноцветный текст

```markdown
![Colorful](https://js-readme-typing-svg.vercel.app/svg?lines=$STYLE{text:+H,+color:+FF0000}$STYLE{text:+e,+color:+FF7F00}$STYLE{text:+l,+color:+FFFF00}$STYLE{text:+l,+color:+00FF00}$STYLE{text:+o,+color:+0000FF})
```
<img src="https://js-readme-typing-svg.vercel.app/svg?lines=$STYLE{text:+H,+color:+FF0000}$STYLE{text:+e,+color:+FF7F00}$STYLE{text:+l,+color:+FFFF00}$STYLE{text:+l,+color:+00FF00}$STYLE{text:+o,+color:+0000FF}&height=80&repeat=true" alt="Typing SVG" />

### Ограничения $STYLE

1. Параметр `text` обязателен
2. Цвет можно указывать с `#` или без него (`#FF0000` или `FF0000`)
3. Boolean параметры (`italic`, `underline`, `strikethrough`) принимают значения `true` или `false`
4. Можно комбинировать несколько стилей в одном выражении
5. Стили применяются только к указанному тексту, не влияют на остальную строку
6. ✅ **Поддерживается вложенность переменных** — можно использовать `$DATE` или `$RELDATE` внутри `$STYLE`

## Комбинирование переменных

Можно использовать несколько переменных в одном тексте, включая комбинацию $DATE, $RELDATE и $STYLE:

### Пример с датой и относительным временем

```
Today is $DATE{weekday: long} Started coding $RELDATE{value: -365, unit: day}
```

В URL:
```
?lines=Today+is+$DATE{weekday:+long} Started+coding+$RELDATE{value:+-365,+unit:+day}
```

### Пример с комбинацией переменных (последовательно)

```
$STYLE{text: 'Project Status', color: 00FF00, fontWeight: bold}: Started $RELDATE{value: -90, unit: day}
```

```
Last update: $DATE{dateStyle: short} - $STYLE{text: 'Active', color: 00FF00, fontWeight: bold}
```

### ✅ Вложенные переменные (NEW!)

Теперь поддерживается **вложенность переменных** — можно использовать одну переменную внутри другой (до 10 уровней вложенности):

#### Пример 1: Дата внутри стиля

```
$STYLE{text: '$DATE{dateStyle: medium}', color: #2196F3, fontWeight: bold}
```

**Результат:** Стилизованная текущая дата (например, "Dec 11, 2024" синим жирным шрифтом)

#### Пример 2: Относительная дата внутри стиля

```
Last updated $STYLE{text: '$RELDATE{value: -3, unit: day}', color: #FF9800, italic: true}
```

**Результат:** "Last updated 3 days ago" (оранжевым курсивом)

#### Пример 3: Множественная вложенность

```
$STYLE{text: '$DATE{weekday: long} - $RELDATE{value: -7, unit: day}', color: #00FF00, fontWeight: bold}
```

**Результат:** "Thursday - 7 days ago" (зеленым жирным шрифтом)

#### Пример 4: Комбинация с обычным текстом

```
Status: $STYLE{text: 'Active since $RELDATE{value: -30, unit: day}', color: #4CAF50, fontWeight: bold}
```

**Результат:** "Status: Active since 30 days ago" (где "Active since..." зеленым жирным)

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
5. Используйте [генератор](https://js-readme-typing-svg.vercel.app/) для автоматического создания правильных URL

---


