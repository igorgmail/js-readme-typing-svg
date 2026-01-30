<img src="https://js-readme-typing-svg.vercel.app/svg?lines=%F0%9F%8C%9F+%24STYLE%7Btext%3A+SVG%2C+color%3A+95190C%7D+Typing+%24STYLE%7Btext%3A+Animation%2C+color%3A+044B7F%7D&fontSize=36&fontFamily=Alfa+Slab+One&fontWeight=400&letterSpacing=2&color=107E7D&background=transparent&width=800&height=200&printSpeed=20&delayBetweenLines=800&eraseSpeed=20&eraseMode=line&cursorStyle=underlined&horizontalAlign=center&verticalAlign=middle&multiLine=false&repeat=true" alt="Typing SVG" />

<div align="center">
  <h1>SVG Typing Animation Generator</h1>
</div>

> Create animated SVG typing text for GitHub profiles, README files and web pages. 
JavaScript-based typing SVG generator.


<div align="center">

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![ES6 Modules](https://img.shields.io/badge/ES6-Modules-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
  ![Made with Love](https://img.shields.io/badge/Made%20with-%E2%9D%A4-red.svg)

**[Русский / Readme-RU](/docs/README_RU.md/)**
</div>


## ✨ Key Features

- **SMIL Animation** — works in GitHub README without JavaScript
- **Variables** — dynamic variables support (DATE, RELDATE, STYLE)
- **Animation Modes** — various typing and erasing effects
- **Multiline Support** — multiple lines of text
- **Google Fonts** — access to any Google Fonts
- **Server-side Generation** — SVG rendered on the server

## 🚀 Quick Start

### Use the Generator

👉 **[Open Generator](https://js-readme-typing-svg.vercel.app/)**

1. Enter your text and configure parameters
2. Copy the generated URL/Markdown/HTML
3. Paste it into your README or web page

> [!NOTE]
> When changing the font (Google Fonts), make sure to specify the font-weight that the font has, otherwise the font will be rendered with its default font-weight

## 📸 Demo

![Generator Preview](/docs/preview.gif)

### Using in GitHub README

**Markdown**:
```markdown
![Typing SVG](https://js-readme-typing-svg.vercel.app/svg?lines=Hello+World;Welcome+to+my+profile&fontSize=24&color=00ff00)
```

**HTML**:
```html
<img src="https://js-readme-typing-svg.vercel.app/svg?lines=Hello+World&fontSize=32" alt="Typing SVG" />
```


## 🎛️ Animation Parameters

| Parameter | Description | Values | Default |
|----------|----------|----------|--------------|
| **Appearance** | | | |
| `fontFamily` | Google Fonts font name | | `Roboto` |
| `fontSize` | Font size in pixels | | `16` |
| `fontWeight` | Font weight | | `400` |
| `color` | Text color (HEX without `#`) | | `000000` |
| `background` | Background color (HEX without `#`) | | `transparent` |
| `letterSpacing` | Character spacing | | `0` |
| **Dimensions** | | | |
| `width` | SVG width in pixels | | `800` |
| `height` | SVG height in pixels | | `200` |
| **Speed** | | | |
| `printSpeed` | Typing speed (chars/sec) | | `10` |
| `eraseSpeed` | Erasing speed (chars/sec) | | `10` |
| `delayBetweenLines` | Delay between lines (ms) | | `800` |
| **Alignment** | | | |
| `horizontalAlign` | Horizontal alignment | `left`, `center`, `right` | `left` |
| `verticalAlign` | Vertical alignment | `top`, `middle`, `bottom` | `top` |
| **Modes** | | | |
| `typingMode` | Typing mode | `expand`, `static` | `expand` |
| `eraseMode` | Erasing mode | `line`, `fade`, `none` | `line` |
| `cursorStyle` | Cursor style | `none`, `straight`, `underlined`, `block`, `emoji`, `custom` | `straight` |
| `multiLine` | Multiline mode | `true` / `false` | `false` |
| `repeat` | Repeat animation | `true` / `false` | `true` |
| **Additional Parameters**| *(URL only)*  | | |
| `paddingX` | Horizontal padding (px) | | `16` |
| `paddingY` | Vertical padding (px) | | `20` |
| `lineHeight` | Line height | | `1.35` |
| `center` | Center both axes | `true` / `false` | `false` |

### Variables

Use dynamic variables in your text:

```
$DATE{dateStyle: full, locale: en}
→ "Monday, December 10, 2024"

$RELDATE{value: -1, unit: day}
→ "yesterday"

$STYLE{color: #e36209, text: 'STATUS'}
```

**Learn more about variables:** see [VARIABLES.md](docs/VARIABLES.md)

## 💻 Installation & Deployment

### Option 1: Deploy to Vercel (Recommended)

The easiest way to deploy the project:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/igorgmail/js-readme-typing-svg)

**Or via CLI:**
```bash
npm i -g vercel
git clone https://github.com/igorgmail/js-readme-typing-svg.git
cd js-readme-typing-svg
vercel
```

### Option 2: Local Express Server


```bash
# Clone the repository
git clone https://github.com/igorgmail/js-readme-typing-svg.git
cd js-readme-typing-svg

# Install dependencies
npm install

# Start the server
npm start
```

Server will be available at: `http://localhost:3000`

- **Generator:** `http://localhost:3000/`
- **API:** `http://localhost:3000/svg?lines=Hello+World`


## 📚 Additional Documentation

- [Working with Variables](docs/VARIABLES.md)

## 🙏 Acknowledgments

Project inspired by:

- [DenverCoder1/readme-typing-svg](https://github.com/DenverCoder1/readme-typing-svg) — original implementation
- [whiteSHADOW1234/TypingSVG](https://github.com/whiteSHADOW1234/TypingSVG) — alternative implementation

Huge thanks to the authors of these projects for the inspiration! ❤️

## 🏆 Contributing

Contributions are welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🌟 Support
If you like this project, give it a ⭐ and share it with friends!

## 🔗 Links

- 🎨 [Live Generator Demo (Vercel)](https://js-readme-typing-svg.vercel.app/)
- 🐛 [Issues](https://github.com/igorgmail/js-readme-typing-svg/issues)

---

<p align="center">
  Made with ❤️ for the developer community
</p>
