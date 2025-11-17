# Быстрый старт

## 🚀 Три способа использования

### 1. Через URL параметры (рекомендуется для README)

Просто откройте страницу с параметрами в URL:

```
http://localhost:8000/?lines=Hello+World;Welcome!&fontSize=32&color=0077cc&center=true
```

**Примеры URL:**

```
# Простой текст
?lines=Hello+World&fontSize=24

# Многострочный
?lines=Line+1;Line+2;Line+3&multiLine=true

# С переменными даты
?lines=Today+is+$DATE{dateStyle:+medium}&fontSize=20

# Полная конфигурация
?lines=Hello;World&fontSize=32&color=1A5975&background=81BECE&width=1000&height=100&center=true&typingMode=static&eraseMode=fade
```

### 2. Через генератор (визуальный редактор)

Откройте `generator.html` в браузере и настройте все параметры через удобный интерфейс.

### 3. Программно (для интеграции)

```javascript
import { createMultilineBlockTypingSVG } from './typing-svg.js';

createMultilineBlockTypingSVG({
  lines: ["Hello", "World"],
  fontSize: 32,
  color: "#0077cc",
  center: true
});
```

## 📦 Установка и запуск

### 1. Склонируйте репозиторий

```bash
git clone <your-repo-url>
cd js-readme-typing-svg
```

### 2. Запустите локальный сервер

**Python 3:**
```bash
python -m http.server 8000
```

**Node.js (с http-server):**
```bash
npx http-server -p 8000
```

**VS Code Live Server:**
Просто откройте `index.html` и нажмите "Go Live"

### 3. Откройте в браузере

```
http://localhost:8000/
```

## 🎯 Быстрые примеры

### Для GitHub Profile README

```markdown
![Typing SVG](http://localhost:8000/?lines=Welcome+to+my+profile!;I'm+a+developer;Check+my+projects&center=true)
```

### С датой и временем

```
?lines=Today+is+$DATE{dateStyle:+full,+locale:+en};Started+coding+$RELDATE{value:+-2,+unit:+hour}
```

### Стильный профиль

```
?lines=🅷🅴🆈+I'm+Developer;💻+Coding+since+2020;🚀+Open+source+enthusiast
&fontSize=24
&color=1A5975
&background=81BECE
&width=900
&height=120
&center=true
&typingMode=static
&eraseMode=fade
```

## 📚 Переменные

### $DATE - текущая дата

```
$DATE{dateStyle: full, locale: en}
→ "Monday, November 17, 2025"

$DATE{weekday: long, month: long, day: numeric}
→ "Monday, November 17"

$DATE{year: numeric, month: 2-digit, day: 2-digit}
→ "11/17/2025"
```

### $RELDATE - относительное время

```
$RELDATE{value: -1, unit: day}
→ "yesterday"

$RELDATE{value: -3, unit: hour, locale: ru}
→ "3 часа назад"

$RELDATE{value: 5, unit: day}
→ "in 5 days"
```

## 🎨 Основные параметры

| Параметр | Значение | Описание |
|----------|----------|----------|
| `lines` | `text;text2` | Строки текста (`;` = новая строка) |
| `fontSize` | `24` | Размер шрифта в px |
| `color` | `0077cc` | Цвет текста (HEX без #) |
| `background` | `ffffff` | Цвет фона (HEX без #) |
| `width` | `1000` | Ширина SVG |
| `height` | `100` | Высота SVG |
| `center` | `true` | Центрировать по обеим осям |
| `multiLine` | `true/false` | Многострочный режим |
| `typingMode` | `static/expand` | Режим печати |
| `eraseMode` | `fade/line/block/wipe-down` | Режим стирания |

## 🔧 Полная документация

- **URL параметры:** [URL_PARAMS.md](URL_PARAMS.md)
- **Переменные:** [VARIABLES.md](VARIABLES.md)
- **Примеры относительного времени:** [EXAMPLES_RELATIVE_TIME.md](EXAMPLES_RELATIVE_TIME.md)
- **Миграция на Intl API:** [INTL_API_MIGRATION.md](INTL_API_MIGRATION.md)

## 🐛 Решение проблем

### SVG не генерируется

1. Проверьте консоль браузера (F12)
2. Убедитесь что используете локальный сервер (не file://)
3. Проверьте наличие параметра `lines` в URL

### Переменные не работают

1. Убедитесь что используете корректный синтаксис: `$DATE{...}`
2. Проверьте что пробелы заменены на `+`
3. Попробуйте упростить параметры

### Неправильные цвета

HEX цвета передаются **без символа #**:
- ✅ Правильно: `?color=0077cc`
- ❌ Неправильно: `?color=#0077cc`

## 💡 Советы

1. **Используйте generator.html** для визуальной настройки
2. **Тестируйте локально** перед использованием в production
3. **Сокращайте URL** через URL shorteners если он слишком длинный
4. **Кодируйте спецсимволы** в переменных через `encodeURIComponent()`

## 🎓 Дополнительные ресурсы

- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [MDN: Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat)
- [ECMA-402 Specification](https://tc39.es/ecma402/)

