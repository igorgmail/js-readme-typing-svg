import GeneratorPage from "./pages/generatePage.js";

async function initGenPage() {
	const locate = window.location.pathname;
	// Support different paths to the generator page
	const isGeneratorPage = locate === "/" ||
	                        locate === "/generator.html" || 
	                        locate === "/generator" || 
	                        locate === "/client/generator.html";
	
	if (!isGeneratorPage) return;

	new GeneratorPage();
}

document.addEventListener("DOMContentLoaded", initGenPage);