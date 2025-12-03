import GeneratorPage from "./generatePage.js";

async function initGenPage() {
	const locate = window.location.pathname;
	if (!(locate === "/generator.html" || locate === "/generator")) return;

	new GeneratorPage();
}

document.addEventListener("DOMContentLoaded", initGenPage);