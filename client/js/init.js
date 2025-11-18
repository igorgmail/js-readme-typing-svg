/**
 * Инициализация демо страницы
 * Использует клиентскую генерацию SVG (для демонстрации)
 * В продакшене генерация происходит на сервере через /svg эндпоинт
 */

import { createMultilineBlockTypingSVG } from './typing-svg.js';

// --------------- DEMO --------------------
document.addEventListener("DOMContentLoaded", () => {
  // Для демо используем дефолтные значения
  createMultilineBlockTypingSVG({
    lines: [
      "🅷🅴🆈 My name`s Igor",
      "Today is $DATE{weekday: long, month: long, day: numeric, locale: en}",
      "It`s a great day to code."
    ],
    
    // Цвета (дефолт: color="#000000", background="transparent")
    color: "#1A5975",
    background: "#81BECE",
    
    // Скорости анимации в ms (дефолт: printSpeed=80, eraseSpeed=50)
    printSpeed: 50,
    eraseSpeed: 50,
    delayAfterBlockPrint: 800, // дефолт: 800
    delayAfterErase: 500, // дефолт: 500
    
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
});

