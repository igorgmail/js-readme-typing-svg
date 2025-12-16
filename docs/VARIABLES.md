# 📅 Working with Variables

Variables allow you to insert dynamic content into SVG animation text.

## Syntax

```
$VARIABLE_NAME{param1: value1, param2: value2}
```

Parameters are specified in curly braces, separated by commas.

## $DATE — Current Date and Time

Uses native `Intl.DateTimeFormat` for formatting.

👉 **[Read more on MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)**

### Main Parameters

| Parameter | Values | Description |
|----------|----------|----------|
| `locale` | `en`, `ru`, `de`, etc. | Formatting language |
| `dateStyle` | `full`, `long`, `medium`, `short` | Date style |
| `timeStyle` | `full`, `long`, `medium`, `short` | Time style |

### Date Components

| Parameter | Values | Example |
|----------|----------|--------|
| `weekday` | `long`, `short`, `narrow` | `Monday`, `Mon`, `M` |
| `year` | `numeric`, `2-digit` | `2024`, `24` |
| `month` | `long`, `short`, `narrow`, `numeric`, `2-digit` | `December`, `Dec`, `D`, `12`, `12` |
| `day` | `numeric`, `2-digit` | `10`, `10` |

### Time Components

| Parameter | Values | Example |
|----------|----------|--------|
| `hour` | `numeric`, `2-digit` | `14`, `14` |
| `minute` | `numeric`, `2-digit` | `5`, `05` |
| `second` | `numeric`, `2-digit` | `3`, `03` |
| `hour12` | `true`, `false` | 12/24 hour format |

## $DATE Examples

### Full Date

```
$DATE{dateStyle: full, locale: en}
→ "Monday, December 10, 2024"

$DATE{dateStyle: full, locale: ru}
→ "понедельник, 10 декабря 2024 г."
```

### Short Date

```
$DATE{dateStyle: short}
→ "12/10/24"

$DATE{dateStyle: medium}
→ "Dec 10, 2024"
```

### Date Components

```
$DATE{weekday: long, month: long, day: numeric}
→ "Monday, December 10"

$DATE{year: numeric, month: short, day: numeric}
→ "2024, Dec 10"
```

### Date and Time

```
$DATE{dateStyle: medium, timeStyle: short}
→ "Dec 10, 2024, 2:30 PM"

$DATE{dateStyle: short, timeStyle: medium}
→ "12/10/24, 2:30:45 PM"
```

### Time Only

```
$DATE{timeStyle: short}
→ "2:30 PM"

$DATE{hour: numeric, minute: 2-digit, second: 2-digit, hour12: false}
→ "14:30:05"
```

## $RELDATE — Relative Time

Uses native `Intl.RelativeTimeFormat`.

👉 **[Read more on MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)**

### Parameters

| Parameter | Description | Required |
|----------|----------|--------------|
| `value` | Numeric value (positive = future, negative = past) | ✅ Yes |
| `unit` | Time unit: `year`, `month`, `week`, `day`, `hour`, `minute`, `second` | ✅ Yes |
| `locale` | Formatting language (default: `en`) | ❌ No |
| `style` | Style: `long`, `short`, `narrow` (default: `long`) | ❌ No |

## $RELDATE Examples

### Past Time

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

### Future Time

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

### With Different Locales

```
$RELDATE{value: -3, unit: hour, locale: ru}
→ "3 часа назад"

$RELDATE{value: 1, unit: day, locale: de}
→ "morgen"

$RELDATE{value: -5, unit: day, locale: fr}
→ "il y a 5 jours"
```

### Formatting Styles

```
$RELDATE{value: -7, unit: day, style: long}
→ "7 days ago"

$RELDATE{value: -7, unit: day, style: short}
→ "7 days ago"

$RELDATE{value: -7, unit: day, style: narrow}
→ "7d ago"
```

## URL Usage

When using in URL parameters, make sure to encode special characters:

### Example for $DATE

```
Plain text:
$DATE{dateStyle: full, locale: en}

URL-encoded:
$DATE%7BdateStyle%3A%20full%2C%20locale%3A%20en%7D

Or with + instead of spaces:
$DATE{dateStyle:+full,+locale:+en}
```

### Example for $RELDATE

```
Plain text:
$RELDATE{value: -3, unit: hour}

URL-encoded:
$RELDATE%7Bvalue%3A%20-3%2C%20unit%3A%20hour%7D

Or with + instead of spaces:
$RELDATE{value:+-3,+unit:+hour}
```

## Practical Examples

### Profile Last Update

```markdown
![Last Update](https://js-readme-typing-svg.vercel.app/svg?lines=Last+updated:+$DATE{dateStyle:+medium}&fontSize=16&color=666666&height=80&repeat=true)
```

<img src="https://js-readme-typing-svg.vercel.app/svg?lines=Last+updated:+$DATE{dateStyle:+medium}&fontSize=16&color=666666&height=80&repeat=true" alt="Typing SVG" />



### Coding Experience

```markdown
![Experience](https://js-readme-typing-svg.vercel.app/svg?lines=Coding+since+$RELDATE{value:+-1095,+unit:+day}&fontSize=20&height=80&repeat=true)
```
<img src="https://js-readme-typing-svg.vercel.app/svg?lines=Coding+since+$RELDATE{value:+-1095,+unit:+day}&fontSize=20&height=80&repeat=true" alt="Typing SVG" />

### Greeting with Date

```markdown
![Greeting](https://js-readme-typing-svg.vercel.app/svg?lines=Today+is+$DATE{weekday:+long};Have+a+great+day!&multiLine=true&center=true&height=80&repeat=true)
```

<img src="https://js-readme-typing-svg.vercel.app/svg?lines=Today+is+$DATE{weekday:+long};Have+a+great+day!&multiLine=true&center=true&height=80&repeat=true" alt="Typing SVG" />

### Project Status

```markdown
![Project Status](https://js-readme-typing-svg.vercel.app/svg?lines=Project+started+$RELDATE{value:+-180,+unit:+day};Active+development&multiLine=true&height=80&repeat=true)
```
<img src="https://js-readme-typing-svg.vercel.app/svg?lines=Project+started+$RELDATE{value:+-180,+unit:+day};Active+development&multiLine=true&height=80&repeat=true" alt="Typing SVG" />

## $STYLE — Text Styling

Allows you to apply various styles to a portion of text within a line.

### Parameters

| Parameter | Description | Example Value | Required |
|----------|----------|-----------------|--------------|
| `text` | Text to style | `"Hello"` | ✅ Yes |
| `color` | Text color | `#FF0000`, `FF0000` | ❌ No |
| `fontWeight` or `weight` | Font weight | `bold`, `400`, `700` | ❌ No |
| `fontSize` or `size` | Font size | `20`, `24px` | ❌ No |
| `fontFamily` or `font` | Font family | `"Arial"`, `"Roboto"` | ❌ No |
| `opacity` | Opacity | `0.5`, `0.8` | ❌ No |
| `italic` | Italic style | `true`, `false` | ❌ No |
| `underline` | Underline | `true`, `false` | ❌ No |
| `strikethrough` | Strikethrough | `true`, `false` | ❌ No |

### $STYLE Examples

#### Color Change

```
Normal text $STYLE{text: 'red text', color: #FF0000} back to normal
```

#### Bold Font

```
$STYLE{text: 'Important!', fontWeight: bold, color: #FF5722}
```

#### Italic with Opacity

```
$STYLE{text: 'subtle text', italic: true, opacity: 0.7}
```

#### Underlined Text

```
$STYLE{text: 'underlined', underline: true, color: #2196F3}
```

#### Strikethrough Text

```
$STYLE{text: 'deprecated', strikethrough: true, color: #999999}
```

#### Different Font Size

```
Normal text $STYLE{text: 'BIG', fontSize: 32} and small again
```

#### Different Font

```
$STYLE{text: 'Monospace', fontFamily: 'Courier New', color: #4CAF50}
```

#### Combined Styles

```
$STYLE{text: 'STYLED', color: #9C27B0, fontWeight: bold, italic: true, fontSize: 28}
```

### Using $STYLE in URLs

When using in URL parameters, make sure to encode special characters:

```
Plain text:
$STYLE{text: 'red', color: #FF0000}

URL-encoded:
$STYLE%7Btext%3A%20%27red%27%2C%20color%3A%20%23FF0000%7D

Or with + instead of spaces:
$STYLE{text:+'red',+color:+#FF0000}
```

### Practical $STYLE Examples

#### Status Highlighting

```markdown
![Status](https://js-readme-typing-svg.vercel.app/svg?lines=$STYLE{text:+ONLINE,+color:+00FF00,+fontWeight:+bold}+Server+Status)
```
<img src="https://js-readme-typing-svg.vercel.app/svg?lines=$STYLE{text:+ONLINE,+color:+00FF00,+fontWeight:+bold}+Server+Status&height=80&repeat=true" alt="Typing SVG" />

#### Emphasizing Important Information

```markdown
![Warning](https://js-readme-typing-svg.vercel.app/svg?lines=⚠️+$STYLE{text:+WARNING,+color:+FF9800,+fontWeight:+bold,+fontSize:+32}+System+maintenance)
```
<img src="https://js-readme-typing-svg.vercel.app/svg?lines=⚠️+$STYLE{text:+WARNING,+color:+FF9800,+fontWeight:+bold,+fontSize:+32}+System+maintenance&height=80&repeat=true" alt="Typing SVG" />

#### Multicolor Text

```markdown
![Colorful](https://js-readme-typing-svg.vercel.app/svg?lines=$STYLE{text:+H,+color:+FF0000}$STYLE{text:+e,+color:+FF7F00}$STYLE{text:+l,+color:+FFFF00}$STYLE{text:+l,+color:+00FF00}$STYLE{text:+o,+color:+0000FF})
```
<img src="https://js-readme-typing-svg.vercel.app/svg?lines=$STYLE{text:+H,+color:+FF0000}$STYLE{text:+e,+color:+FF7F00}$STYLE{text:+l,+color:+FFFF00}$STYLE{text:+l,+color:+00FF00}$STYLE{text:+o,+color:+0000FF}&height=80&repeat=true" alt="Typing SVG" />

### $STYLE Limitations

1. The `text` parameter is required
2. Color can be specified with or without `#` (`#FF0000` or `FF0000`)
3. Boolean parameters (`italic`, `underline`, `strikethrough`) accept `true` or `false` values
4. Multiple styles can be combined in a single expression
5. Styles apply only to the specified text, not affecting the rest of the line
6. ✅ **Nested variables are supported** — you can use `$DATE` or `$RELDATE` inside `$STYLE`

## Combining Variables

You can use multiple variables in one text, including combinations of $DATE, $RELDATE, and $STYLE:

### Example with Date and Relative Time

```
Today is $DATE{weekday: long} Started coding $RELDATE{value: -365, unit: day}
```

In URL:
```
?lines=Today+is+$DATE{weekday:+long} Started+coding+$RELDATE{value:+-365,+unit:+day}
```

### Example with Sequential Variable Combination

```
$STYLE{text: 'Project Status', color: 00FF00, fontWeight: bold}: Started $RELDATE{value: -90, unit: day}
```

```
Last update: $DATE{dateStyle: short} - $STYLE{text: 'Active', color: 00FF00, fontWeight: bold}
```

### ✅ Nested Variables (NEW!)

**Nested variables are now supported** — you can use one variable inside another (up to 10 nesting levels):

#### Example 1: Date Inside Style

```
$STYLE{text: '$DATE{dateStyle: medium}', color: #2196F3, fontWeight: bold}
```

**Result:** Styled current date (e.g., "Dec 11, 2024" in bold blue font)

#### Example 2: Relative Date Inside Style

```
Last updated $STYLE{text: '$RELDATE{value: -3, unit: day}', color: #FF9800, italic: true}
```

**Result:** "Last updated 3 days ago" (in orange italic)

#### Example 3: Multiple Nesting

```
$STYLE{text: '$DATE{weekday: long} - $RELDATE{value: -7, unit: day}', color: #00FF00, fontWeight: bold}
```

**Result:** "Thursday - 7 days ago" (in bold green font)

#### Example 4: Combination with Regular Text

```
Status: $STYLE{text: 'Active since $RELDATE{value: -30, unit: day}', color: #4CAF50, fontWeight: bold}
```

**Result:** "Status: Active since 30 days ago" (where "Active since..." is in bold green)

## Supported Locales

Variables support all locales from the IETF BCP 47 standard:

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
- And many more...

## Debugging

If a variable is not working:

1. Check syntax: `$VARIABLE{param: value}`
2. Ensure parameters are URL-encoded
3. Check parameter names (case-sensitive)
4. For `$RELDATE`, both `value` and `unit` are required
5. Use the [generator](https://js-readme-typing-svg.vercel.app/generator) to automatically create correct URLs

---


