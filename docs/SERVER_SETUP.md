# Запуск сервера для генерации SVG

## Установка зависимостей

```bash
npm install
```

## Запуск сервера

### Обычный режим
```bash
npm start
```

### Режим разработки (с автоперезагрузкой)
```bash
npm run dev
```

Сервер запустится на `http://localhost:3000`

## Доступные маршруты

- **`/generator.html`** - Интерактивный генератор URL для SVG
- **`/index.html`** - Локальная демо-страница с анимацией
- **`/svg`** - API эндпоинт для генерации SVG с параметрами

## Использование API эндпоинта

### Пример запроса

```
GET http://localhost:3000/svg?lines=Hello+World;Welcome!&fontSize=24&color=1a5975&background=81bece&width=800&height=150
```

### Параметры

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `lines` | string | - | Строки текста, разделенные `;` |
| `fontSize` | number | 16 | Размер шрифта в px |
| `color` | string | 000000 | Цвет текста (без #) |
| `background` | string | transparent | Цвет фона |
| `width` | number | 800 | Ширина SVG в px |
| `height` | number | 200 | Высота SVG в px |
| `printSpeed` | number | 80 | Скорость печати в ms |
| `eraseSpeed` | number | 50 | Скорость стирания в ms |
| `delayAfterBlockPrint` | number | 800 | Пауза после печати в ms |
| `delayAfterErase` | number | 500 | Пауза после стирания в ms |
| `lineHeight` | number | 1.35 | Межстрочный интервал |
| `paddingX` | number | 16 | Горизонтальный отступ в px |
| `paddingY` | number | 20 | Вертикальный отступ в px |
| `horizontalAlign` | string | left | `left`, `center`, `right` |
| `verticalAlign` | string | top | `top`, `middle`, `bottom` |
| `multiLine` | boolean | false | Многострочный режим |
| `typingMode` | string | expand | `expand` или `static` |
| `eraseMode` | string | line | `line`, `block`, `wipe-down`, `fade` |

## Использование в README

```markdown
![Typing SVG](http://localhost:3000/svg?lines=Hello+World;Welcome!)
```

## Деплой

Сервер готов к деплою на любую платформу, поддерживающую Node.js:
- Vercel
- Heroku
- Railway
- Render
- и другие

После деплоя замените `http://localhost:3000` на ваш продакшн URL.

