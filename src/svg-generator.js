/**
 * Серверный генератор SVG с анимацией печати
 */

/**
 * Простой парсинг переменных DATE и RELDATE в строках
 * Упрощенная версия без полной поддержки Intl API
 */
function parseVariables(lines) {
  return lines.map(line => {
    // Простая замена $DATE
    let processed = line.replace(/\$DATE\{[^}]*\}/g, () => {
      const now = new Date();
      return now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    });
    
    // Простая замена $RELDATE
    processed = processed.replace(/\$RELDATE\{[^}]*\}/g, 'recently');
    
    return processed;
  });
}

/**
 * Экранирование спецсимволов для XML/SVG
 */
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Генерирует SVG код с анимацией
 */
export function generateSVG(params) {
  // Парсим строки
  const rawLines = params.lines.split(';').map(l => l.trim()).filter(l => l);
  const lines = parseVariables(rawLines);
  
  // Добавляем # к цветам если нужно
  const color = params.color === 'transparent' ? params.color : 
    (params.color.startsWith('#') ? params.color : '#' + params.color);
  const background = params.background === 'transparent' ? params.background : 
    (params.background.startsWith('#') ? params.background : '#' + params.background);
  
  // Вычисляем startY для вертикального выравнивания
  const totalTextHeight = params.multiLine 
    ? lines.length * params.fontSize * params.lineHeight 
    : params.fontSize;
  
  let startY = params.paddingY;
  if (params.verticalAlign === 'middle') {
    startY = (params.height - totalTextHeight) / 2 + params.fontSize;
  } else if (params.verticalAlign === 'bottom') {
    startY = params.height - totalTextHeight + params.fontSize / 2;
  }
  
  // Генерируем текстовые элементы
  const textElements = params.multiLine
    ? lines.map((_, i) => {
        const y = startY + i * params.fontSize * params.lineHeight;
        return `<text id="line${i}" y="${y}" fill="${color}" font-size="${params.fontSize}" font-family="monospace"></text>`;
      }).join('\n    ')
    : `<text id="line0" y="${startY}" fill="${color}" font-size="${params.fontSize}" font-family="monospace"></text>`;
  
  // Экранируем данные для передачи в JavaScript
  const linesJSON = JSON.stringify(lines.map(escapeXml));
  
  // Генерируем полный SVG
  const svg = `<svg width="${params.width}" height="${params.height}" viewBox="0 0 ${params.width} ${params.height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    @keyframes blink { 
      0%, 50% { opacity: 1; } 
      51%, 100% { opacity: 0; } 
    }
    .caret { animation: blink 1s infinite; }
  </style>
  
  <rect width="${params.width}" height="${params.height}" fill="${background}"/>
  
  <g id="text-container">
    ${textElements}
  </g>
  
  <rect class="caret" id="caret" width="2" height="${params.fontSize}" fill="${color}"/>
  
  <script type="text/javascript">
  <![CDATA[
    (function() {
      const lines = ${linesJSON};
      const multiLine = ${params.multiLine};
      const typingMode = "${params.typingMode}";
      const eraseMode = "${params.eraseMode}";
      const printSpeed = ${params.printSpeed};
      const eraseSpeed = ${params.eraseSpeed};
      const delayAfterBlockPrint = ${params.delayAfterBlockPrint};
      const delayAfterErase = ${params.delayAfterErase};
      const fontSize = ${params.fontSize};
      const lineHeight = ${params.lineHeight};
      const width = ${params.width};
      const height = ${params.height};
      const paddingX = ${params.paddingX};
      const horizontalAlign = "${params.horizontalAlign}";
      const startY = ${startY};
      const background = "${background}";
      
      const NS = "http://www.w3.org/2000/svg";
      const svg = document.querySelector('svg');
      const caret = document.getElementById('caret');
      const textEls = [];
      
      for (let i = 0; i < (multiLine ? lines.length : 1); i++) {
        textEls.push(document.getElementById('line' + i));
      }
      
      function getTextWidth(text) {
        const temp = document.createElementNS(NS, 'text');
        temp.setAttribute('font-size', fontSize);
        temp.setAttribute('font-family', 'monospace');
        temp.textContent = text;
        svg.appendChild(temp);
        const w = temp.getComputedTextLength();
        svg.removeChild(temp);
        return w;
      }
      
      function computeLineX(text) {
        if (horizontalAlign === 'left') return paddingX;
        const textWidth = getTextWidth(text);
        if (horizontalAlign === 'right') return width - paddingX - textWidth;
        return (width - textWidth) / 2;
      }
      
      const staticX = lines.map(line => typingMode === 'static' ? computeLineX(line) : null);
      
      function updateCaret(lineIndex, charIndex) {
        const full = lines[lineIndex];
        const partial = full.slice(0, charIndex);
        const t = multiLine ? textEls[lineIndex] : textEls[0];
        
        let x = typingMode === 'static' ? staticX[lineIndex] : computeLineX(partial);
        
        t.setAttribute('x', x);
        t.textContent = partial;
        
        const caretX = x + t.getComputedTextLength() + 2;
        const caretY = parseFloat(t.getAttribute('y')) - fontSize + fontSize * 0.2;
        
        caret.setAttribute('x', caretX);
        caret.setAttribute('y', caretY);
      }
      
      async function typeLine(lineIndex) {
        const full = lines[lineIndex];
        for (let i = 0; i <= full.length; i++) {
          updateCaret(lineIndex, i);
          await new Promise(r => setTimeout(r, printSpeed));
        }
      }
      
      async function eraseLine(lineIndex) {
        const full = lines[lineIndex];
        for (let i = full.length; i >= 0; i--) {
          updateCaret(lineIndex, i);
          await new Promise(r => setTimeout(r, eraseSpeed));
        }
      }
      
      async function eraseBlock() {
        const maxLen = Math.max(...lines.map(l => l.length));
        for (let i = maxLen; i >= 0; i--) {
          for (let j = 0; j < lines.length; j++) {
            const len = Math.min(i, lines[j].length);
            updateCaret(j, len);
          }
          await new Promise(r => setTimeout(r, eraseSpeed));
        }
      }
      
      async function eraseWipeDown() {
        const totalH = height;
        for (let y = 0; y <= totalH; y += 5) {
          const wipeRect = document.createElementNS(NS, 'rect');
          wipeRect.setAttribute('y', 0);
          wipeRect.setAttribute('width', width);
          wipeRect.setAttribute('height', y);
          wipeRect.setAttribute('fill', background);
          const oldWipe = svg.querySelector('.wipe');
          if (oldWipe) svg.removeChild(oldWipe);
          wipeRect.classList.add('wipe');
          svg.appendChild(wipeRect);
          await new Promise(r => setTimeout(r, eraseSpeed / 5));
        }
        const wipe = svg.querySelector('.wipe');
        if (wipe) svg.removeChild(wipe);
        textEls.forEach((t, i) => updateCaret(i, 0));
      }
      
      async function eraseFade() {
        for (let opacity = 1; opacity >= 0; opacity -= 0.05) {
          textEls.forEach(t => t.setAttribute('opacity', opacity));
          await new Promise(r => setTimeout(r, eraseSpeed));
        }
        textEls.forEach((t, i) => {
          t.setAttribute('opacity', 1);
          updateCaret(i, 0);
        });
      }
      
      async function loop() {
        if (multiLine) {
          while (true) {
            for (let i = 0; i < lines.length; i++) await typeLine(i);
            await new Promise(r => setTimeout(r, delayAfterBlockPrint));
            
            if (eraseMode === 'line') {
              for (let i = lines.length - 1; i >= 0; i--) await eraseLine(i);
            } else if (eraseMode === 'block') {
              await eraseBlock();
            } else if (eraseMode === 'wipe-down') {
              await eraseWipeDown();
            } else if (eraseMode === 'fade') {
              await eraseFade();
            }
            
            await new Promise(r => setTimeout(r, delayAfterErase));
          }
        } else {
          let currentLineIndex = 0;
          while (true) {
            await typeLine(currentLineIndex);
            await new Promise(r => setTimeout(r, delayAfterBlockPrint));
            
            if (eraseMode === 'fade') {
              await eraseFade();
            } else if (eraseMode === 'wipe-down') {
              await eraseWipeDown();
            } else {
              await eraseLine(currentLineIndex);
            }
            
            await new Promise(r => setTimeout(r, delayAfterErase));
            currentLineIndex = (currentLineIndex + 1) % lines.length;
          }
        }
      }
      
      loop();
    })();
  ]]>
  </script>
</svg>`;

  return svg;
}

