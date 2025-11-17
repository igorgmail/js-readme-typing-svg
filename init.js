import { createMultilineBlockTypingSVG } from './typing-svg.js';

// --------------- DEMO --------------------
document.addEventListener("DOMContentLoaded", () => {
  createMultilineBlockTypingSVG({
    lines: [
      "🅷🅴🆈 My name`s Igor",
      "Today is $DATE{weekday: long, month: long, day: numeric, locale: en}",
      "Started coding $RELDATE{value: -2, unit: hour, locale: ru}"
    ],
    printSpeed: 50,
    fontSize: 20,
    background: "#81BECE",
    color: "1A5975",
    width: 1000,
    height: 100,
    verticalAlign: "middle",
    horizontalAlign: "center",
    typingMode: "static", // expand | static
    eraseMode: "line", // line | block | wipe-down | fade
		multiLine: false,
  });
});

