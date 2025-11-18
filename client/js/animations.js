/**
 * Модуль анимаций для SVG Typing Generator
 */

/**
 * Печатает одну строку посимвольно
 */
export function typeLine(lineIndex, lines, printSpeed, updateCaret) {
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

/**
 * Стирает одну строку справа налево
 */
export function eraseLine(lineIndex, lines, eraseSpeed, updateCaret, textEls, multiLine) {
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

/**
 * Стирает все строки одновременно справа налево (блоком)
 */
export async function eraseBlock(lines, eraseSpeed, updateCaret, textEls) {
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

/**
 * Стирает текст эффектом "шторки" сверху вниз
 */
export async function eraseWipeDown(NS, svg, width, height, eraseSpeed, textEls) {
  const maskId = "mask_" + Date.now();
  const mask = document.createElementNS(NS, "mask");
  mask.setAttribute("id", maskId);
  svg.appendChild(mask);

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

/**
 * Стирает текст плавным исчезновением (fade out)
 */
export async function eraseFade(eraseSpeed, textEls) {
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

