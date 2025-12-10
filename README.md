<img src="https://js-readme-typing-svg.vercel.app/svg?lines=%F0%9F%8E%A8+SVG+Typing+Animation&fontSize=36&fontFamily=Nosifer&fontWeight=400&letterSpacing=0&color=0D7B14&background=transparent&width=800&height=200&printSpeed=10&delayBetweenLines=800&eraseSpeed=20&eraseMode=line&cursorStyle=none&horizontalAlign=center&verticalAlign=middle&multiLine=true&repeat=true" alt="Typing SVG" />

<div align="center">
  <h1>🎨 SVG Typing Animation Generator</h1>
</div>

> Создавайте анимированные SVG с эффектом печатающего текста для ваших GitHub профилей, README файлов и веб-страниц.

<div align="center">

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![ES6 Modules](https://img.shields.io/badge/ES6-Modules-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
  ![Made with Love](https://img.shields.io/badge/Made%20with-%E2%9D%A4-red.svg)

</div>


## ✨ Основные возможности

- **SMIL-анимация** — работает в GitHub README без JavaScript
- **Переменные** — реализация переменных (DATE, RELDATE, STYLE)
- **Режимы анимации** — различные режимы печати и стирания текста
- **Многострочность** — поддержка нескольких строк текста
- **Google Fonts** — любые шрифты из Google Fonts
- **Серверная генерация** — SVG создается на сервере

## 🚀 Быстрый старт

### Используйте генератор (рекомендуется)

👉 **[Открыть генератор](https://js-readme-typing-svg.vercel.app/generator)**

1. Введите текст и настройте параметры
2. Скопируйте готовый URL/Markdown/HTML
3. Вставьте в ваш README или веб-страницу

> [!NOTE]
> При изменении шрифта (Google Fonts) нужно указать font-weight который этот шрифт имеет, иначе будет сгенерирован шрифт по умолчанию

## 📸 Demo

![Generator Preview](https://via.placeholder.com/800x400/1e1e1e/00ff00?text=Generator+Preview+%28coming+soon%29)

### Использование в GitHub README

**Markdown** :
```markdown
![Typing SVG](https://js-readme-typing-svg.vercel.app/svg?lines=Hello+World;Welcome+to+my+profile&fontSize=24&color=00ff00)
```

**HTML** :
```html
<img src="https://js-readme-typing-svg.vercel.app/svg?lines=Hello+World&fontSize=32" alt="Typing SVG" />
```


## 📖 Параметры анимации

| Параметр | Описание | Значения | По умолчанию |
|----------|----------|----------|--------------|
| **Внешний вид** | | | |
| `fontFamily` | Шрифт из Google Fonts | | `Roboto` |
| `fontSize` | Размер шрифта (px) | | `16` |
| `fontWeight` | Толщина шрифта | | `400` |
| `color` | Цвет текста (HEX без `#`) | | `000000` |
| `background` | Цвет фона (HEX без `#`) | | `transparent` |
| `letterSpacing` | Межбуквенный интервал | | `0` |
| **Размеры** | | | |
| `width` | Ширина SVG (px) | | `800` |
| `height` | Высота SVG (px) | | `200` |
| **Скорости** | | | |
| `printSpeed` | Скорость печати (символов/сек) | | `10` |
| `eraseSpeed` | Скорость стирания (символов/сек) | | `10` |
| `delayBetweenLines` | Задержка между строками (ms) | | `800` |
| **Выравнивание** | | | |
| `horizontalAlign` | Горизонтальное | `left`, `center`, `right` | `left` |
| `verticalAlign` | Вертикальное | `top`, `middle`, `bottom` | `top` |
| **Режимы** | | | |
| `typingMode` | Режим печати | `expand`, `static` | `expand` |
| `eraseMode` | Режим стирания | `line`, `fade`, `none` | `line` |
| `cursorStyle` | Стиль курсора | `none`, `straight`, `underlined`, `block`, `emoji`, `custom` | `straight` |
| `multiLine` | Многострочный режим | `true` / `false` | `false` |
| `repeat` | Повторять анимацию | `true` / `false` | `true` |
| **Дополнительные параметры**| *(только через URL)*  | | |
| `paddingX` | Горизонтальный отступ (px) | | `16` |
| `paddingY` | Вертикальный отступ (px) | | `20` |
| `lineHeight` | Межстрочный интервал | | `1.35` |
| `center` | Центрировать по обеим осям | `true` / `false` | `false` |

### Переменные

Используйте динамические переменные в тексте:

```
$DATE{dateStyle: full, locale: en}
→ "Monday, December 10, 2024"

$RELDATE{value: -1, unit: day}
→ "yesterday"

$STYLE{color: #e36209, text: 'STATUS'}
```

**Подробнее о переменных:** см. [docs/VARIABLES.md](docs/VARIABLES.md)

## 💻 Установка и деплой

### Вариант 1: Deploy на Vercel (рекомендуется)

Самый простой способ развернуть проект:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/js-readme-typing-svg)

**Или через CLI:**
```bash
npm i -g vercel
git clone https://github.com/yourusername/js-readme-typing-svg.git
cd js-readme-typing-svg
vercel
```

### Вариант 2: Локальный Express сервер

Для разработки и тестирования:

```bash
# Клонировать репозиторий
git clone https://github.com/yourusername/js-readme-typing-svg.git
cd js-readme-typing-svg

# Установить зависимости
npm install

# Запустить сервер
npm start
```

Сервер будет доступен по адресу: `http://localhost:3000`

- **Генератор:** `http://localhost:3000/generator`
- **API:** `http://localhost:3000/svg?lines=Hello+World`

## 🎯 Примеры использования

### Простой пример
```markdown
![Typing SVG](https://js-readme-typing-svg.vercel.app/svg?lines=Hello+World&fontSize=32)
```

### С настройками
```markdown
![Typing SVG](https://js-readme-typing-svg.vercel.app/svg?lines=Welcome;I'm+a+Developer&fontSize=28&color=00ff00&background=1e1e1e&center=true&multiLine=true)
```

### С переменными
```markdown
![Typing SVG](https://js-readme-typing-svg.vercel.app/svg?lines=Today:+$DATE{dateStyle:+medium}&fontSize=24)
```

## 📚 Дополнительная документация

- [Работа с переменными](docs/VARIABLES.md)

## 🙏 Благодарности

Этот проект основан на идеях:

- [DenverCoder1/readme-typing-svg](https://github.com/DenverCoder1/readme-typing-svg) — оригинальная идея typing SVG для GitHub
- [whiteSHADOW1234/TypingSVG](https://github.com/whiteSHADOW1234/TypingSVG) — Немного другая реализация

Огромная благодарность авторам этих проектов за идею! ❤️

## 🚀 Вклад в проект

Приветствуются любые улучшения:

1. Fork репозитория
2. Создайте ветку для фичи (`git checkout -b feature/AmazingFeature`)
3. Commit изменений (`git commit -m 'Add AmazingFeature'`)
4. Push в ветку (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 🌟 Поддержка
Если вам понравился этот проект, поставьте ему ⭐ и поделитесь им с друзьями!

## 🔗 Ссылки

- 🎨 [Demo Генератор URL (Vercel)](https://js-readme-typing-svg.vercel.app/generator)
- 🐛 [Issues](https://github.com/igorgmail/js-readme-typing-svg/issues)

---

<p align="center">
  Сделано с ❤️ для сообщества разработчиков
</p>
