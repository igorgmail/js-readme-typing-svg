# URL параметры для генерации SVG

Проект поддерживает генерацию SVG через URL query-параметры. Это позволяет использовать его как сервис для динамического создания анимированных текстовых SVG.

## Базовый синтаксис

```
https://your-domain.com/?parameter1=value1&parameter2=value2
```

## Основные параметры

### 📝 Текст

| Параметр | Описание | Пример | Дефолт |
|----------|----------|--------|--------|
| `lines` | Строки текста, разделенные `;` | `lines=Hello;World` | - |

**Примечание:** Пробелы можно заменить на `+` или использовать URL encoding `%20`

### 🎨 Визуальные параметры

| Параметр | Описание | Значения | Дефолт |
|----------|----------|----------|--------|
| `fontSize` | Размер шрифта | число (px) | `16` |
| `color` | Цвет текста | HEX без `#` | `000` |
| `background` | Цвет фона | HEX без `#` или `transparent` | `transparent` |
| `width` | Ширина SVG | число (px) | `800` |
| `height` | Высота SVG | число (px) | `200` |

### ⚡ Анимация

| Параметр | Описание | Значения | Дефолт |
|----------|----------|----------|--------|
| `printSpeed` | Скорость печати | число (ms) | `80` |
| `eraseSpeed` | Скорость стирания | число (ms) | `50` |
| `delayAfterBlockPrint` | Задержка после печати | число (ms) | `800` |
| `delayAfterErase` | Задержка после стирания | число (ms) | `500` |

### 📐 Выравнивание

| Параметр | Описание | Значения | Дефолт |
|----------|----------|----------|--------|
| `horizontalAlign` | Горизонтальное выравнивание | `left`, `center`, `right` | `left` |
| `verticalAlign` | Вертикальное выравнивание | `top`, `middle`, `bottom` | `top` |
| `center` | Центрировать по обеим осям | `true`, `false` | `false` |

### 🔧 Режимы

| Параметр | Описание | Значения | Дефолт |
|----------|----------|----------|--------|
| `typingMode` | Режим печати | `expand`, `static` | `expand` |
| `eraseMode` | Режим стирания | `line`, `block`, `wipe-down`, `fade` | `line` |
| `multiLine` | Многострочный режим | `true`, `false` | `false` |

## Алиасы параметров

Для удобства поддерживаются короткие имена:

| Полное имя | Алиас |
|------------|-------|
| `printSpeed` | `duration` |
| `delayAfterBlockPrint` | `pause` |
| `fontSize` | `font` |
| `horizontalAlign` | `hAlign` |
| `verticalAlign` | `vAlign` |
| `multiLine` | `multiline` |

## Примеры использования

### Простой пример

```
?lines=Hello+World&fontSize=32&color=0077cc
```

**Результат:** Текст "Hello World", размер 32px, синий цвет

### Многострочный текст

```
?lines=Line+1;Line+2;Line+3&multiLine=true&fontSize=24
```

**Результат:** Три строки текста, каждая на новой строке

### С переменными

```
?lines=Today+is+$DATE{dateStyle:+medium};Started+$RELDATE{value:+-2,+unit:+hour}&multiLine=true
```

**Результат:** Динамическая дата и относительное время

### Полный пример

```
?lines=🅷🅴🆈+My+name+is+Igor;Today+is+$DATE{weekday:+long,+month:+long,+day:+numeric};It's+a+great+day+to+code
&fontSize=20
&color=1A5975
&background=81BECE
&width=1000
&height=100
&center=true
&typingMode=static
&eraseMode=fade
&multiLine=false
&printSpeed=50
```

### Как в примере readme-typing-svg.demolab.com

```
?font=20
&duration=50
&pause=800
&color=1A5975
&center=true
&multiline=false
&width=1000
&height=100
&background=81BECE
&lines=🅷🅴🆈+My+name's+Igor;Today+is+Monday,+November+17;It's+a+great+day+to+code
```

## Переменные в URL

Поддерживаются все переменные из модуля `variables.js`:

### $DATE - текущая дата

```
?lines=Today:+$DATE{dateStyle:+full,+locale:+en}
```

**Примечание:** В URL пробелы заменяются на `+`, а двоеточия можно использовать напрямую.

### $RELDATE - относительное время

```
?lines=Updated+$RELDATE{value:+-3,+unit:+hour,+locale:+en}
```

## Генерация URL программно

Используйте функцию `optionsToURL()`:

```javascript
import { optionsToURL } from './url-parser.js';

const options = {
  lines: ["Hello", "World"],
  fontSize: 32,
  color: "#0077cc",
  center: true
};

const url = optionsToURL(options);
console.log(url);
// Результат: https://your-domain.com/?lines=Hello;World&fontSize=32&color=0077cc&...
```

## Встраивание в README

### Markdown

```markdown
![Typing SVG](https://your-domain.com/?lines=Hello+World&fontSize=32&color=0077cc)
```

### HTML

```html
<img src="https://your-domain.com/?lines=Hello+World&fontSize=32&color=0077cc" alt="Typing SVG" />
```

### GitHub Profile

```markdown
[![Typing SVG](https://your-domain.com/?lines=Welcome+to+my+profile!;I'm+a+developer)](https://github.com/yourusername)
```

## Советы по URL

1. **URL encoding:** Используйте `+` для пробелов или `%20`
2. **Спецсимволы:** Кодируйте через `encodeURIComponent()` в JS
3. **Длина URL:** Браузеры имеют ограничение ~2000 символов
4. **Тестирование:** Сначала протестируйте локально, затем используйте в production

## Отладка

Если SVG не генерируется:

1. Проверьте консоль браузера на ошибки
2. Убедитесь что параметр `lines` присутствует
3. Проверьте корректность URL encoding
4. Попробуйте упростить параметры (уберите все кроме `lines`)

## API функции

### `parseURLParams()`
Парсит URL query параметры в объект.

### `urlParamsToOptions(urlParams)`
Преобразует URL параметры в опции для `createMultilineBlockTypingSVG`.

### `initFromURL(createSVGFunction, container)`
Инициализирует SVG из URL параметров автоматически.

### `optionsToURL(options, baseURL)`
Генерирует URL с параметрами из объекта опций.

## Примеры кода

### Автоматическая инициализация

```javascript
import { createMultilineBlockTypingSVG } from './typing-svg.js';
import { initFromURL } from './url-parser.js';

document.addEventListener("DOMContentLoaded", () => {
  initFromURL(createMultilineBlockTypingSVG);
});
```

### Ручная обработка

```javascript
import { createMultilineBlockTypingSVG } from './typing-svg.js';
import { parseURLParams, urlParamsToOptions } from './url-parser.js';

const urlParams = parseURLParams();
const options = urlParamsToOptions(urlParams);

// Добавляем кастомные опции
options.container = document.getElementById('custom-container');

createMultilineBlockTypingSVG(options);
```

### Генерация URL для шаринга

```javascript
import { optionsToURL } from './url-parser.js';

const shareButton = document.getElementById('share');
shareButton.addEventListener('click', () => {
  const currentOptions = getCurrentOptions(); // ваша функция
  const url = optionsToURL(currentOptions);
  
  navigator.clipboard.writeText(url);
  alert('URL copied to clipboard!');
});
```

