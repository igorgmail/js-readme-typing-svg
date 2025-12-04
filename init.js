import { createMultilineBlockTypingSVG } from './src/typing-svg.js';
import { initFromURL, urlParamsToOptions, parseURLParams } from './src/url-parser.js';

// --------------- DEMO --------------------
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = parseURLParams();
  
  // Если в URL есть параметры - используем их
  if (Object.keys(urlParams).length > 0) {
    initFromURL(createMultilineBlockTypingSVG);
  } 
  // Иначе используем дефолтные значения
  else {
    createMultilineBlockTypingSVG({
      lines: [
        "🅷🅴🆈 My name`s Igor",
        "Today is $DATE{weekday: long, month: long, day: numeric, locale: en}",
        "It`s a great day to code."
      ],
      
      // Цвета (дефолт: color="#000000", background="transparent")
      color: "#1A5975",
      background: "#81BECE",
      
      // Скорости анимации (дефолт: printSpeed=1, eraseSpeed=10 - символов в секунду)
      printSpeed: 20,
      eraseSpeed: 20,
      delayBetweenLines: 800, // дефолт: 800 - задержка между строками
      
      // Размеры (дефолт: fontSize=16, width=800, height=200)
      fontSize: 20,
      width: 1000,
      height: 100,
      lineHeight: 1.35, // дефолт: 1.35
      
      // Отступы (дефолт: paddingX=16, paddingY=20)
      paddingX: 16,
      paddingY: 20,
      
      // Выравнивание (дефолт: verticalAlign="top", horizontalAlign="left")
      verticalAlign: "middle",
      horizontalAlign: "center",
      
      // Режимы (дефолт: multiLine=false, typingMode="expand", eraseMode="line")
      multiLine: false,
      typingMode: "static",
      eraseMode: "line",
    });
  }
});

