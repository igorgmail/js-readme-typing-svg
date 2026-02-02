import { highlight } from '../utils/highlight.js';

/**
 * Manages the code sample insertion block with syntax highlighting
 */
export default class SampleBlock {
	constructor(generatorPage) {
		this.generatorPage = generatorPage;
		this.editable = document.querySelector('[data-js="sample-code-input"]');
		this.removeBtn = document.querySelector('[data-js-action="remove-sample"]');
		this.isValid = null; // null - empty field, true - valid, false - invalid
		
		if (this.editable) {
			this.init();
		}
	}

	init() {
		this.bindEvents();
		this.initAutoResize();
	}

	bindEvents() {
		// Handler for clearing the field
		if (this.removeBtn) {
			this.removeBtn.addEventListener('click', () => this.handleRemove());
		}

		// Blur handler for validation and parsing
		if (this.editable) {
			this.editable.addEventListener('blur', () => this.handleBlur());
		}
	}

	/**
	 * Initialize auto-resize and syntax highlighting for code input field
	 */
	initAutoResize() {
		if (!this.editable) return;

		let isUpdating = false;

		const updateHighlight = () => {
			if (isUpdating) return;
			isUpdating = true;

			// Save cursor position
			const selection = window.getSelection();
			const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
			const cursorOffset = range ? this.getCaretCharacterOffset(this.editable) : 0;

			// Get text content
			const text = this.editable.textContent || '';

			// Apply highlighting
			if (text.trim()) {
				// Escape HTML entities for processing
				const escapedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
				
				// Apply syntax highlighting
				this.editable.innerHTML = highlight(escapedText);

				// Restore cursor position
				this.setCaretCharacterOffset(this.editable, cursorOffset);
			}

			isUpdating = false;
		};

		// Handle input
		this.editable.addEventListener('input', () => {
			updateHighlight();
		});

		// Handle paste - insert plain text only
		this.editable.addEventListener('paste', (e) => {
			e.preventDefault();
			const text = e.clipboardData.getData('text/plain');
			
			// Insert text at cursor position
			const selection = window.getSelection();
			if (selection.rangeCount > 0) {
				const range = selection.getRangeAt(0);
				range.deleteContents();
				range.insertNode(document.createTextNode(text));
				range.collapse(false);
			}

			// Update highlighting after paste
			setTimeout(updateHighlight, 0);
		});

		// Initial update
		updateHighlight();
	}

	/**
	 * Gets the current cursor position in a contenteditable element
	 * @param {HTMLElement} element 
	 * @returns {number}
	 */
	getCaretCharacterOffset(element) {
		let caretOffset = 0;
		const selection = window.getSelection();
		
		if (selection.rangeCount > 0) {
			const range = selection.getRangeAt(0);
			const preCaretRange = range.cloneRange();
			preCaretRange.selectNodeContents(element);
			preCaretRange.setEnd(range.endContainer, range.endOffset);
			caretOffset = preCaretRange.toString().length;
		}
		
		return caretOffset;
	}

	/**
	 * Sets the cursor position in a contenteditable element
	 * @param {HTMLElement} element 
	 * @param {number} offset 
	 */
	setCaretCharacterOffset(element, offset) {
		const range = document.createRange();
		const selection = window.getSelection();
		
		let charCount = 0;
		let nodeStack = [element];
		let node;
		let foundStart = false;

		while (!foundStart && (node = nodeStack.pop())) {
			if (node.nodeType === Node.TEXT_NODE) {
				const nextCharCount = charCount + node.length;
				if (offset >= charCount && offset <= nextCharCount) {
					range.setStart(node, offset - charCount);
					range.setEnd(node, offset - charCount);
					foundStart = true;
				}
				charCount = nextCharCount;
			} else {
				let i = node.childNodes.length;
				while (i--) {
					nodeStack.push(node.childNodes[i]);
				}
			}
		}

		if (foundStart) {
			selection.removeAllRanges();
			selection.addRange(range);
		}
	}

	/**
	 * Clears the inserted code in the input field
	 */
	handleRemove() {
		if (this.editable) {
			this.editable.innerHTML = '';
			this.editable.textContent = '';
			this.editable.focus();
			this.isValid = null;
			this.updateValidationState();
		}
	}

	/**
	 * Blur handler - validation and parsing
	 */
	handleBlur() {
		const text = this.editable.textContent?.trim() || '';

		if (!text) {
			this.isValid = null;
			this.updateValidationState();
			return;
		}

		const parsedData = this.parseInput(text);

		if (parsedData) {
			this.isValid = true;
			console.log('Parsed parameters:', parsedData);
			
			// Apply parameters to the form and generate new SVG
			if (this.generatorPage) {
				this.generatorPage.applyParsedParams(parsedData.params);
			}
		} else {
			this.isValid = false;
		}

		this.updateValidationState();
	}

	/**
	 * Parses input string (URL, Markdown or HTML) and extracts parameters
	 * @param {string} input - input string
	 * @returns {Object|null} - object with parameters or null if parsing failed
	 */
	parseInput(input) {
		let url = null;

		// Check input string type and extract URL
		if (input.startsWith('http://') || input.startsWith('https://')) {
			// Format: URL
			url = input;
		} else if (input.startsWith('![')) {
			// Format: Markdown - ![alt](url)
			const markdownMatch = input.match(/!\[.*?\]\((https?:\/\/[^)]+)\)/);
			if (markdownMatch) {
				url = markdownMatch[1];
			}
		} else if (input.startsWith('<img')) {
			// Format: HTML - <img src="url" ... />
			const htmlMatch = input.match(/<img[^>]+src=["']([^"']+)["']/);
			if (htmlMatch) {
				url = htmlMatch[1];
			}
		}

		if (!url) {
			return null;
		}

		// Parse URL and extract parameters
		try {
			const urlObj = new URL(url);
			const params = {};

			// Check that the path contains /svg
			if (!urlObj.pathname.includes('/svg')) {
				return null;
			}

			// Extract all parameters from query string
			urlObj.searchParams.forEach((value, key) => {
				params[key] = value;
			});

			return {
				type: this.detectInputType(input),
				url: url,
				params: params
			};
		} catch (error) {
			return null;
		}
	}

	/**
	 * Detects the type of input string
	 * @param {string} input 
	 * @returns {string} - 'url', 'markdown' or 'html'
	 */
	detectInputType(input) {
		if (input.startsWith('![')) {
			return 'markdown';
		} else if (input.startsWith('<img')) {
			return 'html';
		}
		return 'url';
	}

	/**
	 * Updates the visual validation state of the field
	 */
	updateValidationState() {
		if (!this.editable) return;

		if (this.isValid === false) {
			this.editable.classList.add('is-invalid');
		} else {
			this.editable.classList.remove('is-invalid');
		}
	}
}
