import { highlight } from '../utils/highlight.js';

/**
 * Управляет блоком вставки примеров кода с подсветкой синтаксиса
 */
export default class SampleBlock {
	constructor(generatorPage) {
		this.generatorPage = generatorPage;
		this.editable = document.querySelector('[data-js="sample-code-input"]');
		this.removeBtn = document.querySelector('[data-js-action="remove-sample"]');
		this.isValid = null; // null - пустое поле, true - валидно, false - невалидно
		
		if (this.editable) {
			this.init();
		}
	}

	init() {
		this.bindEvents();
		this.initAutoResize();
	}

	bindEvents() {
		// Обработчик очистки поля
		if (this.removeBtn) {
			this.removeBtn.addEventListener('click', () => this.handleRemove());
		}

		// Обработчик потери фокуса для валидации и парсинга
		if (this.editable) {
			this.editable.addEventListener('blur', () => this.handleBlur());
		}
	}

	/**
	 * Инициализация авто-ресайза и подсветки синтаксиса для поля ввода кода
	 */
	initAutoResize() {
		if (!this.editable) return;

		let isUpdating = false;

		const updateHighlight = () => {
			if (isUpdating) return;
			isUpdating = true;

			// Сохраняем позицию курсора
			const selection = window.getSelection();
			const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
			const cursorOffset = range ? this.getCaretCharacterOffset(this.editable) : 0;

			// Получаем текстовое содержимое
			const text = this.editable.textContent || '';

			// Применяем подсветку
			if (text.trim()) {
				// Экранируем HTML-сущности для обработки
				const escapedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
				
				// Применяем подсветку синтаксиса
				this.editable.innerHTML = highlight(escapedText);

				// Восстанавливаем позицию курсора
				this.setCaretCharacterOffset(this.editable, cursorOffset);
			}

			isUpdating = false;
		};

		// Обработка ввода
		this.editable.addEventListener('input', () => {
			updateHighlight();
		});

		// Обработка вставки - вставляем только plain text
		this.editable.addEventListener('paste', (e) => {
			e.preventDefault();
			const text = e.clipboardData.getData('text/plain');
			
			// Вставляем текст в позицию курсора
			const selection = window.getSelection();
			if (selection.rangeCount > 0) {
				const range = selection.getRangeAt(0);
				range.deleteContents();
				range.insertNode(document.createTextNode(text));
				range.collapse(false);
			}

			// Обновляем подсветку после вставки
			setTimeout(updateHighlight, 0);
		});

		// Первоначальное обновление
		updateHighlight();
	}

	/**
	 * Получает текущую позицию курсора в contenteditable элементе
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
	 * Устанавливает позицию курсора в contenteditable элементе
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
	 * Очищает вставленный код в поле ввода
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
	 * Обработчик потери фокуса - валидация и парсинг
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
			
			// Применяем параметры к форме и генерируем новый SVG
			if (this.generatorPage) {
				this.generatorPage.applyParsedParams(parsedData.params);
			}
		} else {
			this.isValid = false;
		}

		this.updateValidationState();
	}

	/**
	 * Парсит входную строку (URL, Markdown или HTML) и извлекает параметры
	 * @param {string} input - входная строка
	 * @returns {Object|null} - объект с параметрами или null если парсинг не удался
	 */
	parseInput(input) {
		let url = null;

		// Проверяем тип входной строки и извлекаем URL
		if (input.startsWith('http://') || input.startsWith('https://')) {
			// Формат: URL
			url = input;
		} else if (input.startsWith('![')) {
			// Формат: Markdown - ![alt](url)
			const markdownMatch = input.match(/!\[.*?\]\((https?:\/\/[^)]+)\)/);
			if (markdownMatch) {
				url = markdownMatch[1];
			}
		} else if (input.startsWith('<img')) {
			// Формат: HTML - <img src="url" ... />
			const htmlMatch = input.match(/<img[^>]+src=["']([^"']+)["']/);
			if (htmlMatch) {
				url = htmlMatch[1];
			}
		}

		if (!url) {
			return null;
		}

		// Парсим URL и извлекаем параметры
		try {
			const urlObj = new URL(url);
			const params = {};

			// Проверяем, что путь содержит /svg
			if (!urlObj.pathname.includes('/svg')) {
				return null;
			}

			// Извлекаем все параметры из query string
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
	 * Определяет тип входной строки
	 * @param {string} input 
	 * @returns {string} - 'url', 'markdown' или 'html'
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
	 * Обновляет визуальное состояние валидности поля
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
