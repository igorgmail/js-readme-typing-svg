# 🎨 SVG Typing Animation Generator

> Динамическая генерация SVG с анимацией печати текста через URL параметры

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![ES6 Modules](https://img.shields.io/badge/ES6-Modules-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
[![Intl API](https://img.shields.io/badge/Intl-API-green.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)

Создавайте красивые анимированные SVG с эффектом печатающего текста для ваших GitHub профилей, README файлов и веб-страниц.

## ✨ Особенности

- 🎬 **SMIL-анимация v2** — улучшенная версия без JavaScript для GitHub README (работает в `<img>`)

- 🌍 **Нативные Intl API** — поддержка всех локалей через `Intl.DateTimeFormat` и `Intl.RelativeTimeFormat`
- 📅 **Динамические переменные** — `$DATE` для дат, `$RELDATE` для относительного времени
- 🎭 **Разные режимы стирания**
- ⚡ **Разные режимы печати**
- 🎯 **URL параметры** — полная настройка через query string
- 🖌️ **Визуальный генератор** — создавайте URL через удобный интерфейс
- 🌈 **Гибкая настройка** — цвета, размеры, скорости, выравнивание
- 🚀 **Серверная генерация** — SVG формируется на сервере

## 🚀 Быстрый старт

> 💡 **Новичок?** Читайте [QUICKSTART.md](QUICKSTART.md) для быстрого введения!

### Деплой на Vercel (Рекомендуется)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/js-readme-typing-svg)

1. Нажмите кнопку выше
2. Авторизуйтесь в Vercel
3. Получите готовый URL: `https://your-project.vercel.app`

**Или через CLI:**
```bash
npm i -g vercel
vercel
```

📖 **Подробная инструкция**: [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md)

### Запуск локального сервера

1. Установите зависимости:
```bash
npm install
```

2. Запустите сервер:
```bash
npm start              # Express сервер (локальная разработка)
npm run vercel:dev     # Vercel serverless (эмуляция продакшена)
```

3. Откройте нужную страницу:
   - **Генератор URL**: `http://localhost:3000/generator`
   - **Демо**: `http://localhost:3000/`

4. Используйте API эндпоинт:
```
http://localhost:3000/svg?lines=Hello+World&fontSize=32&color=0077cc
```

📖 **Документация**:
- [🚀 Деплой на Vercel](docs/VERCEL_DEPLOYMENT.md) — serverless развертывание
- [Запуск сервера](docs/SERVER_SETUP.md)
- [Примеры использования API](docs/API_EXAMPLES.md)

### Использование через URL

Просто добавьте параметры в URL:

```
https://yourusername.github.io/js-readme-typing-svg/?lines=Hello+World&fontSize=32&color=0077cc
```

### В GitHub Profile README

⭐ **Рекомендуется:** Используйте SMIL-версию (без JavaScript):
```markdown
![Typing SVG](http://localhost:3000/svg-smil?lines=Welcome+to+my+profile!;I'm+a+developer;Check+my+projects&fontSize=24&color=0077cc&typingMode=textPath)
```


Через GitHub Pages:
```markdown
![Typing SVG](https://yourusername.github.io/js-readme-typing-svg/?lines=Welcome+to+my+profile!;I'm+a+developer;Check+my+projects&center=true)
```

### Программное использование

```javascript
import { createMultilineBlockTypingSVG } from './src/typing-svg.js';

createMultilineBlockTypingSVG({
  lines: ["Hello", "World"],
  fontSize: 32,
  color: "#0077cc",
  center: true
});
```

## 📖 Примеры

### Простой текст

```
?lines=Hello+World&fontSize=24&color=333333
```

![Example 1](https://via.placeholder.com/400x60/f0f0f0/333333?text=Hello+World)

### Многострочный с переменными

```
?lines=Today+is+$DATE{dateStyle:+full,+locale:+en};Started+coding+$RELDATE{value:+-2,+unit:+hour}&multiLine=true&fontSize=20
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

### С датой и временем

```
?lines=Today:+$DATE{weekday:+long,+month:+long,+day:+numeric}
&fontSize=28
&color=0077cc
&center=true
```

## 🎯 Основные параметры

| Параметр | Тип | Дефолт | Описание |
|----------|-----|--------|----------|
| **Текст и строки** |
| `lines` | string | - | Строки текста, разделенные `;` |
| **Цвета** |
| `color` | HEX | `000000` | Цвет текста (без `#`) |
| `background` | HEX | `transparent` | Цвет фона (без `#` или `transparent`) |
| **Скорости анимации (ms)** |
| `printSpeed` | number | `1` | Скорость печати: количество символов в секунду (0.1-100) |
| `eraseSpeed` | number | `10` | Скорость стирания: количество символов в секунду (0.1-100) |
| `delayBetweenLines` | number | `800` | Задержка между строками при печати/стирании (0-5000) |
| **Размеры** |
| `fontSize` | number | `16` | Размер шрифта в px |
| `lineHeight` | number | `1.35` | Межстрочный интервал |
| `width` | number | `800` | Ширина SVG в px |
| `height` | number | `200` | Высота SVG в px |
| `paddingX` | number | `16` | Горизонтальный отступ в px |
| `paddingY` | number | `20` | Вертикальный отступ в px |
| **Выравнивание** |
| `horizontalAlign` | string | `left` | Горизонтальное: `left`, `center`, `right` |
| `verticalAlign` | string | `top` | Вертикальное: `top`, `middle`, `bottom` |
| `center` | boolean | - | Центрировать по обеим осям (алиас) |
| **Режимы работы** |
| `multiLine` | boolean | `false` | Многострочный режим |
| `typingMode` | string | `expand` | Режим печати: `expand`, `static` |
| `eraseMode` | string | `line` | Режим стирания: `line`, `block`, `wipe-down`, `fade` |

## 📅 Переменные

### $DATE - Текущая дата

Использует нативный `Intl.DateTimeFormat` для форматирования дат.

```javascript
// Полная дата
$DATE{dateStyle: full, locale: en}
// → "Monday, November 17, 2025"

// Компоненты даты
$DATE{weekday: long, month: long, day: numeric}
// → "Monday, November 17"

// Дата и время
$DATE{dateStyle: medium, timeStyle: short}
// → "Nov 17, 2025, 2:30 PM"
```

### $RELDATE - Относительное время

Использует нативный `Intl.RelativeTimeFormat` для форматирования относительного времени.

```javascript
// Вчера
$RELDATE{value: -1, unit: day}
// → "yesterday"

// Через 5 дней
$RELDATE{value: 5, unit: day}
// → "in 5 days"

// 3 часа назад (русский)
$RELDATE{value: -3, unit: hour, locale: ru}
// → "3 часа назад"
```

## 🛠️ Генератор

Используйте визуальный генератор для создания URL:

👉 [generator.html](client/pages/generator.html)

Генератор позволяет:
- Настроить все параметры через UI
- Получить готовый URL
- Скопировать Markdown/HTML код
- Увидеть превью результата

## 📦 Локальная установка

### 1. Клонирование репозитория

```bash
git clone https://github.com/yourusername/js-readme-typing-svg.git
cd js-readme-typing-svg
```

### 2. Запуск локального сервера

**VS Code:**
Используйте расширение "Live Server"

### 3. Открытие в браузере

```
http://localhost:8000/
```

## 📚 Документация

### Основные руководства

- 📘 [Быстрый старт](docs/QUICKSTART.md) — начните здесь!

- 🔗 [URL параметры](docs/URL_PARAMS.md) — полный список параметров
- 📅 [Переменные](docs/VARIABLES.md) — как использовать $DATE и $RELDATE

### Дополнительно

- [API Reference](#) — документация по функциям
- [Contributing](#) — как внести вклад

## 💡 Практические примеры

### Для GitHub Profile

```markdown
### Hi there 👋

![Typing SVG](https://yourusername.github.io/js-readme-typing-svg/?lines=Welcome+to+my+profile!;I'm+a+Full+Stack+Developer;Always+learning+new+things&center=true&width=380&height=50)
```

### С актуальной датой

```markdown
![Last Updated](https://yourusername.github.io/js-readme-typing-svg/?lines=Last+updated:+$DATE{dateStyle:+medium}&fontSize=16&color=666666)
```

### Статистика проекта

```markdown
![Project Status](https://yourusername.github.io/js-readme-typing-svg/?lines=Created+$RELDATE{value:+-365,+unit:+day};Active+development;⭐+Star+us+on+GitHub&multiLine=true&center=true)
```

### Навыки и технологии

```markdown
![Tech Stack](https://yourusername.github.io/js-readme-typing-svg/?lines=💻+JavaScript+%2B+TypeScript;⚛️+React+%2B+Vue;🚀+Node.js+%2B+Express;🎨+CSS+%2B+Tailwind&multiLine=true&fontSize=20&width=400&height=120)
```



## 🤝 Вклад в проект

Приветствуются любые вклады! Пожалуйста:

1. Форкните репозиторий
2. Создайте ветку для фичи (`git checkout -b feature/AmazingFeature`)
3. Закоммитьте изменения (`git commit -m 'Add AmazingFeature'`)
4. Запушьте в ветку (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📄 Лицензия

Проект распространяется под лицензией MIT. См. [LICENSE](LICENSE) для подробностей.

## 🔗 Ссылки

- [Демо](https://yourusername.github.io/js-readme-typing-svg/)
- [Генератор URL](https://yourusername.github.io/js-readme-typing-svg/generator.html)
- [GitHub Issues](https://github.com/yourusername/js-readme-typing-svg/issues)
- [Обсуждения](https://github.com/yourusername/js-readme-typing-svg/discussions)

---

<p align="center">
  Сделано с ❤️ и ☕
</p>

<p align="center">
  <a href="#-быстрый-старт">Начать использовать</a> •
  <a href="#-документация">Документация</a> •
  <a href="#-примеры">Примеры</a>
</p>
