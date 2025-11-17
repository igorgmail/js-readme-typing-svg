function createMultilineBlockTypingSVG(opts = {}) {
  const {
    lines = [],
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

  // type one line
  function typeLine(lineIndex) {
    return new Promise((resolve) => {
      let i = 0;
      const interval = setInterval(() => {
        updateCaret(lineIndex, i);
        i++;
        if (i > lines[lineIndex].length) {
          clearInterval(interval);
          resolve();
        }
      }, printSpeed);
    });
  }

  // erase one line
  function eraseLine(lineIndex) {
    return new Promise((resolve) => {
      let i = lines[lineIndex].length;
      const interval = setInterval(() => {
        updateCaret(lineIndex, i);
        i--;
        if (i < 0) {
          clearInterval(interval);
          const t = multiLine ? textEls[lineIndex] : textEls[0];
          t.textContent = "";
          resolve();
        }
      }, eraseSpeed);
    });
  }

  // erase block mode (right to left)
  async function eraseBlock() {
    const maxLen = Math.max(...lines.map((l) => l.length));
    for (let step = maxLen; step >= 0; step--) {
      for (let i = 0; i < lines.length; i++) {
        const remain = Math.min(step, lines[i].length);
        updateCaret(i, remain);
      }
      await new Promise((r) => setTimeout(r, eraseSpeed));
    }
    textEls.forEach((t) => (t.textContent = ""));
  }

  // wipe-down effect
  async function eraseWipeDown() {
    // mask rectangle
    const maskId = "mask_" + Date.now();
    const mask = document.createElementNS(NS, "mask");
    mask.setAttribute("id", maskId);
    svg.appendChild(mask);

    // white rect (mask visible)
    const whiteRect = document.createElementNS(NS, "rect");
    whiteRect.setAttribute("x", 0);
    whiteRect.setAttribute("y", 0);
    whiteRect.setAttribute("width", width);
    whiteRect.setAttribute("height", 0);
    whiteRect.setAttribute("fill", "white");
    mask.appendChild(whiteRect);

    textEls.forEach((t) => t.setAttribute("mask", `url(#${maskId})`));

    const steps = 50;
    for (let i = 0; i <= steps; i++) {
      whiteRect.setAttribute("height", (height * i) / steps);
      await new Promise((r) => setTimeout(r, eraseSpeed));
    }
    // cleanup
    textEls.forEach((t) => t.setAttribute("mask", null));
    svg.removeChild(mask);
    textEls.forEach((t) => (t.textContent = ""));
  }

  // fade effect
  async function eraseFade() {
    const steps = 20;
    for (let s = steps; s >= 0; s--) {
      const o = s / steps;
      textEls.forEach((t) => t.setAttribute("opacity", o));
      await new Promise((r) => setTimeout(r, eraseSpeed));
    }
    textEls.forEach((t) => {
      t.setAttribute("opacity", 1);
      t.textContent = "";
    });
  }

  async function loop() {
    if (multiLine) {
      // режим: все строки одновременно
      while (true) {
        for (let i = 0; i < lines.length; i++) await typeLine(i);
        await new Promise((r) => setTimeout(r, delayAfterBlockPrint));

        if (eraseMode === "line") {
          for (let i = lines.length - 1; i >= 0; i--) await eraseLine(i);
        } else if (eraseMode === "block") {
          await eraseBlock();
        } else if (eraseMode === "wipe-down") {
          await eraseWipeDown();
        } else if (eraseMode === "fade") {
          await eraseFade();
        }

        await new Promise((r) => setTimeout(r, delayAfterErase));
      }
    } else {
      // режим: одна строка меняется на другую
      let currentLineIndex = 0;
      while (true) {
        await typeLine(currentLineIndex);
        await new Promise((r) => setTimeout(r, delayAfterBlockPrint));

        // стираем текущую строку одним из эффектов
        if (eraseMode === "fade") {
          await eraseFade();
        } else if (eraseMode === "wipe-down") {
          await eraseWipeDown();
        } else {
          // для остальных режимов используем eraseLine
          await eraseLine(currentLineIndex);
        }

        await new Promise((r) => setTimeout(r, delayAfterErase));

        // переходим к следующей строке
        currentLineIndex = (currentLineIndex + 1) % lines.length;
      }
    }
  }

  loop();
}

