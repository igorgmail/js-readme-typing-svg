# 🎯 Примеры использования API

## Базовое использование

### Простой текст

```
/svg?lines=Hello+World
```

![Example](http://localhost:3000/svg?lines=Hello+World)

---

## Множественные строки

### Две строки с переключением

```
/svg?lines=First+Line;Second+Line
```

### Три строки в многострочном режиме

```
/svg?lines=Line+1;Line+2;Line+3&multiLine=true
```

---

## Цвета и размеры

### Кастомные цвета

```
/svg?lines=Colored+Text&color=ff6b6b&background=ffe66d&fontSize=28
```

### Прозрачный фон

```
/svg?lines=Transparent+Background&color=4ecdc4&background=transparent
```

---

## Выравнивание

### Центрированный текст

```
/svg?lines=Centered+Text&horizontalAlign=center&verticalAlign=middle&width=800&height=150
```

### Выравнивание справа

```
/svg?lines=Right+Aligned&horizontalAlign=right&fontSize=24
```

---

## Режимы печати

### Static (без сдвига текста)

```
/svg?lines=Static+Mode;No+Text+Shift&typingMode=static&horizontalAlign=center
```

### Expand (со сдвигом)

```
/svg?lines=Expand+Mode;Text+Shifts&typingMode=expand
```

---

## Режимы стирания

### Line (построчно)

```
/svg?lines=Line+Erase&eraseMode=line
```

### Block (блоком)

```
/svg?lines=Block+Erase&eraseMode=block&multiLine=true
```

### Fade (затухание)

```
/svg?lines=Fade+Effect&eraseMode=fade
```

### Wipe Down (вытирание)

```
/svg?lines=Wipe+Down&eraseMode=wipe-down
```

---

## Скорости анимации

### Быстрая печать

```
/svg?lines=Fast+Typing&printSpeed=30&eraseSpeed=20
```

### Медленная печать

```
/svg?lines=Slow+Typing&printSpeed=150&eraseSpeed=100
```

### Длинные паузы

```
/svg?lines=Long+Pauses&delayAfterBlockPrint=2000&delayAfterErase=1000
```

---

## Размеры и отступы

### Большой SVG

```
/svg?lines=Large+SVG&width=1200&height=300&fontSize=48
```

### Компактный SVG

```
/svg?lines=Compact&width=400&height=80&fontSize=16&paddingX=8&paddingY=8
```

---

## Комплексные примеры

### GitHub Profile Header

```
/svg?lines=Hi+👋+I'm+Developer;Welcome+to+my+profile!;Check+out+my+projects+below&fontSize=28&color=58a6ff&background=0d1117&horizontalAlign=center&verticalAlign=middle&width=800&height=150&typingMode=static
```

### Мотивационная цитата

```
/svg?lines=Make+it+work;Make+it+right;Make+it+fast&fontSize=32&color=f0db4f&background=323330&horizontalAlign=center&eraseMode=fade&multiLine=true&height=250
```

### Множественные языки

```
/svg?lines=Hello+World!;Привет+Мир!;你好世界!;مرحبا+بالعالم&fontSize=24&color=4285f4&horizontalAlign=center
```

---

## Использование переменных (при серверной реализации)

### Текущая дата

```
/svg?lines=Today+is+Monday+November+17
```

### Относительное время

```
/svg?lines=Started+coding+recently
```

---

## Полный пример

```
/svg?lines=Full+Stack+Developer;Building+Amazing+Apps;Open+Source+Contributor&fontSize=26&color=61dafb&background=282c34&width=900&height=180&horizontalAlign=center&verticalAlign=middle&typingMode=static&eraseMode=fade&printSpeed=60&eraseSpeed=40&delayAfterBlockPrint=1500&multiLine=false
```

---

## Советы по использованию

1. **Экранирование символов**: Используйте `+` вместо пробелов или `%20`
2. **Множественные строки**: Разделяйте строки символом `;`
3. **Цвета**: Можно указывать с `#` или без: `color=ff0000` или `color=%23ff0000`
4. **Размеры**: Убедитесь, что размеры соответствуют вашему тексту
5. **Тестирование**: Используйте `/generator.html` для визуальной настройки

---

## Использование в Markdown

```markdown
![Typing SVG](http://localhost:3000/svg?lines=Your+Text+Here)
```

## Использование в HTML

```html
<img src="http://localhost:3000/svg?lines=Your+Text+Here" alt="Typing SVG" />
```

## Использование в BBCode (форумы)

```
[img]http://localhost:3000/svg?lines=Your+Text+Here[/img]
```

