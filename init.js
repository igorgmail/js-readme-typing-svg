import { createMultilineBlockTypingSVG } from './typing-svg.js';

// --------------- DEMO --------------------
document.addEventListener("DOMContentLoaded", () => {
  createMultilineBlockTypingSVG({
    lines: [
      "🅷🅴🆈 My name`s Igor",
      "Today is $DATE{format: YYYY-MM-DD, locale: ru}",
			"it`s a great day to code."
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

