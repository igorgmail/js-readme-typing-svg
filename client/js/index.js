import GeneratorPage from "./generatePage.js";

async function initGenPage() {
	const locate = window.location.pathname;
	// Поддерживаем разные пути к странице генератора
	const isGeneratorPage = locate === "/" ||
	                        locate === "/generator.html" || 
	                        locate === "/generator" || 
	                        locate === "/client/generator.html";
	
	if (!isGeneratorPage) return;

	new GeneratorPage();
}

document.addEventListener("DOMContentLoaded", initGenPage);