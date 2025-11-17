import { typeLine, eraseLine, eraseBlock, eraseWipeDown, eraseFade } from './animations.js';
import { parseLines } from './variables.js';

export function createMultilineBlockTypingSVG(opts = {}) {
  const {
    lines: rawLines = [],
    color = "#000",
    printSpeed = 80,
    eraseSpeed = 50,
    delayAfterBlockPrint = 800,
    delayAfterErase = 500,
    fontSize = 16,
    lineHeight = 1.35,
    width = 800,
    height = 200,
    paddingX = 16,
    paddingY = 20,
		multiLine = false,
    verticalAlign = "top",
    horizontalAlign = "left", // left | center | right
    typingMode = "expand", // expand | static
    eraseMode = "line", // line | block | wipe-down | fade
    background = "transparent",
    container = document.getElementById("demo"),
  } = opts;

  // Парсим переменные в строках
  const lines = parseLines(rawLines);

  const NS = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  container.appendChild(svg);

  // background
  const bgRect = document.createElementNS(NS, "rect");
  bgRect.setAttribute("width", width);
  bgRect.setAttribute("height", height);
  bgRect.setAttribute("fill", background);
  svg.appendChild(bgRect);

  // vertical alignment
  const totalTextHeight = multiLine ? lines.length * fontSize * lineHeight : fontSize;
  let startY = paddingY;
  if (verticalAlign === "middle")
    startY = (height - totalTextHeight) / 2 + fontSize;
  if (verticalAlign === "bottom")
    startY = height - totalTextHeight + fontSize / 2;

  // helper: compute X position
  function computeLineX(text) {
    const temp = document.createElementNS(NS, "text");
    temp.setAttribute("font-size", fontSize);
    temp.setAttribute("font-family", "monospace");
    temp.textContent = text;
    svg.appendChild(temp);
    const textWidth = temp.getComputedTextLength();
    svg.removeChild(temp);

    if (horizontalAlign === "left") return paddingX;
    if (horizontalAlign === "right") return width - paddingX - textWidth;
    return (width - textWidth) / 2; // center
  }

  // create text elements
  const textEls = [];
  if (multiLine) {
    // создаем элемент для каждой строки
    lines.forEach((_, i) => {
      const t = document.createElementNS(NS, "text");
      t.setAttribute("y", startY + i * fontSize * lineHeight);
      t.setAttribute("fill", color);
      t.setAttribute("font-size", fontSize);
      t.setAttribute("font-family", "monospace");
      t.textContent = "";
      svg.appendChild(t);
      textEls.push(t);
    });
  } else {
    // создаем только один элемент для одной строки
    const t = document.createElementNS(NS, "text");
    t.setAttribute("y", startY);
    t.setAttribute("fill", color);
    t.setAttribute("font-size", fontSize);
    t.setAttribute("font-family", "monospace");
    t.textContent = "";
    svg.appendChild(t);
    textEls.push(t);
  }

  // precompute static X
  const staticX = lines.map((line) =>
    typingMode === "static" ? computeLineX(line) : null
  );

  // caret
  const caret = document.createElementNS(NS, "rect");
  caret.setAttribute("width", 2);
  caret.setAttribute("height", fontSize);
  caret.setAttribute("fill", color);
  svg.appendChild(caret);

  setInterval(() => {
    caret.setAttribute(
      "opacity",
      caret.getAttribute("opacity") === "1" ? "0" : "1"
    );
  }, 500);

  function updateCaret(lineIndex, charIndex) {
    const full = lines[lineIndex];
    const partial = full.slice(0, charIndex);
    // в режиме multiLine = false всегда используем textEls[0]
    const t = multiLine ? textEls[lineIndex] : textEls[0];

    let x;
    if (typingMode === "static") x = staticX[lineIndex];
    else x = computeLineX(partial);

    t.setAttribute("x", x);
    t.textContent = partial;

    const caretX = x + t.getComputedTextLength() + 2;
    const caretY =
      parseFloat(t.getAttribute("y")) - fontSize + fontSize * 0.2;

    caret.setAttribute("x", caretX);
    caret.setAttribute("y", caretY);
  }

  // Обертки для функций анимации с контекстом
  const typeLineWithContext = (lineIndex) => 
    typeLine(lineIndex, lines, printSpeed, updateCaret);

  const eraseLineWithContext = (lineIndex) => 
    eraseLine(lineIndex, lines, eraseSpeed, updateCaret, textEls, multiLine);

  const eraseBlockWithContext = () => 
    eraseBlock(lines, eraseSpeed, updateCaret, textEls);

  const eraseWipeDownWithContext = () => 
    eraseWipeDown(NS, svg, width, height, eraseSpeed, textEls);

  const eraseFadeWithContext = () => 
    eraseFade(eraseSpeed, textEls);

  async function loop() {
    if (multiLine) {
      // режим: все строки одновременно
      while (true) {
        for (let i = 0; i < lines.length; i++) await typeLineWithContext(i);
        await new Promise((r) => setTimeout(r, delayAfterBlockPrint));

        if (eraseMode === "line") {
          for (let i = lines.length - 1; i >= 0; i--) await eraseLineWithContext(i);
        } else if (eraseMode === "block") {
          await eraseBlockWithContext();
        } else if (eraseMode === "wipe-down") {
          await eraseWipeDownWithContext();
        } else if (eraseMode === "fade") {
          await eraseFadeWithContext();
        }

        await new Promise((r) => setTimeout(r, delayAfterErase));
      }
    } else {
      // режим: одна строка меняется на другую
      let currentLineIndex = 0;
      while (true) {
        await typeLineWithContext(currentLineIndex);
        await new Promise((r) => setTimeout(r, delayAfterBlockPrint));

        // стираем текущую строку одним из эффектов
        if (eraseMode === "fade") {
          await eraseFadeWithContext();
        } else if (eraseMode === "wipe-down") {
          await eraseWipeDownWithContext();
        } else {
          // для остальных режимов используем eraseLine
          await eraseLineWithContext(currentLineIndex);
        }

        await new Promise((r) => setTimeout(r, delayAfterErase));

        // переходим к следующей строке
        currentLineIndex = (currentLineIndex + 1) % lines.length;
      }
    }
  }

  loop();
}

