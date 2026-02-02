import { fetchDefaults } from '../utils/defaults.js';
import { highlight } from '../utils/highlight.js';
import '../utils/colorPicker.js';
import SampleBlock from './sampleBlock.js';

export default class GeneratorPage {
	constructor() {
		this.baseURL = `${window.location.origin}/svg`;
		this.defaults = null; // Will be loaded asynchronously
		this.controls = this.initControls();
		this.outputs = this.initOutputs();
		this.preview = document.querySelector('[data-js="preview"]');
		this.svgDataObjectURL = null;
		this.generatedURL = '';
		this.autoUpdateEnabled = false;
		this.autoUpdateTimeout = null;
		this.fieldHandlers = [];
		this.fetchController = null;
		this.previewObjectURL = null;
		
		// Initialize sample block with callback
		this.sampleBlock = new SampleBlock(this);
		
		// Alias for the generate method, as it's used in autoUpdate and handleReset
		this.generate = this.handleGenerate.bind(this);
		
		// Asynchronous initialization
		this.init();
	}

	async init() {
		// Load defaults from server
		this.defaults = await fetchDefaults();
		
		// Apply defaults to form
		this.applyDefaultsToForm();
		
		// Now we can initialize the rest
		this.bindEvents();
		this.setAutoUpdate(true);
		this.handleGenerate();
	}

	initControls() {
		const names = [
			'lines',
			'font-size',
			'font-family',
			'font-weight',
			'letter-spacing',
			'color',
			'background',
			'width',
			'height',
			'print-speed',
			'delay-after-print',
			'erase-speed',
			'erase-mode',
			'cursor-style',
			'horizontal-align',
			'vertical-align',
			'multiline',
			'repeat'
		];

		return names.reduce((acc, name) => {
			acc[name] = document.querySelector(`[data-js="${name}"]`);
			return acc;
		}, {});
	}

	initOutputs() {
		return {
			url: document.querySelector('[data-js="url-output"]'),
			markdown: document.querySelector('[data-js="markdown-output"]'),
			html: document.querySelector('[data-js="html-output"]')
		};
	}

	bindEvents() {
		document
			.querySelector('[data-js-action="generate"]')
			.addEventListener('click', () => this.handleGenerate());
		document
			.querySelector('[data-js-action="reset"]')
			.addEventListener('click', () => this.handleReset());
		document
			.querySelectorAll('[data-js-action="copy"]')
			.forEach(btn => btn.addEventListener('click', () => this.handleCopy(btn)));
		document
			.querySelectorAll('[pin-name]')
			.forEach(btn => btn.addEventListener('click', () => this.handlePin(btn)));
			document
			.querySelector('[data-js-action="download-svg-preview"]')
			.addEventListener('click', () => this.handleDownloadSVGPreview());
		document
			.querySelector('[data-js-action="copy-svg-preview"]')
			.addEventListener('click', () => this.handleCopySVGPreview());
	}

	collectParams() {
		const params = new URLSearchParams();
		const rawLines = this.controls.lines.value
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean);

		if (rawLines.length > 0) {
			params.append('lines', rawLines.join(';'));
		}

		params.append('fontSize', this.controls['font-size'].value);
		params.append('fontFamily', this.controls['font-family'].value.trim() || 'Roboto');
		params.append('fontWeight', this.controls['font-weight'].value);
		params.append('letterSpacing', this.controls['letter-spacing'].value);
		
		// Get color from jscolor with alpha channel support
		let colorValue = '000000';
		if (this.controls.color.jscolor) {
			const colorHexa = this.controls.color.jscolor.toString('hexa');
			// Remove # and check alpha channel
			const hexaValue = colorHexa.replace('#', '');
			// If alpha = 00 (fully transparent), use transparent
			if (hexaValue.length === 8 && hexaValue.substr(6, 2).toUpperCase() === '00') {
				colorValue = 'transparent';
			} else if (hexaValue.length === 8 && hexaValue.substr(6, 2).toUpperCase() === 'FF') {
				// If alpha = FF (opaque), use only RGB
				colorValue = hexaValue.substr(0, 6);
			} else if (hexaValue.length === 8) {
				// Use full hexa format with alpha channel
				colorValue = hexaValue;
			} else {
				colorValue = hexaValue;
			}
		} else {
			colorValue = this.controls.color.value.replace('#', '');
		}
		params.append('color', colorValue);

		// Get background from jscolor
		let backgroundValue = 'transparent';
		if (this.controls.background.jscolor) {
			const bgColor = this.controls.background.jscolor.toString('hexa');
			// Remove # and check alpha channel
			const hexaValue = bgColor.replace('#', '');
			// If alpha = 00 (fully transparent), use transparent
			if (hexaValue.length === 8 && hexaValue.substr(6, 2).toUpperCase() === '00') {
				backgroundValue = 'transparent';
			} else if (hexaValue.length === 8 && hexaValue.substr(6, 2).toUpperCase() === 'FF') {
				// If alpha = FF (opaque), use only RGB
				backgroundValue = hexaValue.substr(0, 6);
			} else if (hexaValue.length === 8) {
				// Use full hexa format with alpha channel
				backgroundValue = hexaValue;
			} else {
				backgroundValue = hexaValue;
			}
		}
		params.append('background', backgroundValue);

		params.append('width', this.controls.width.value);
		params.append('height', this.controls.height.value);
		params.append('printSpeed', this.controls['print-speed'].value);
		params.append('delayBetweenLines', this.controls['delay-after-print'].value);
		params.append('eraseSpeed', this.controls['erase-speed'].value);
		params.append('eraseMode', this.controls['erase-mode'].value);
		params.append('cursorStyle', this.controls['cursor-style'].value);
		
		// Handle alignment from checkboxes (checked -> center/middle, unchecked -> left/top)
		const horizontalAlign = this.controls['horizontal-align'].checked ? 'center' : 'left';
		params.append('horizontalAlign', horizontalAlign);
		
		const verticalAlign = this.controls['vertical-align'].checked ? 'middle' : 'top';
		params.append('verticalAlign', verticalAlign);
		
		// Handle multiline and repeat from checkboxes
		params.append('multiLine', this.controls.multiline.checked ? 'true' : 'false');
		params.append('repeat', this.controls.repeat.checked ? 'true' : 'false');

		return params;
	}

	handlePin(btn) {
		const pinStatus = btn.closest('[pin-status]').getAttribute('pin-status');
		if (pinStatus === 'on') {
			btn.closest('[pin-status]').setAttribute('pin-status', 'off');
			btn.closest('.js-preview').classList.remove('pin');
		} else {
			btn.closest('[pin-status]').setAttribute('pin-status', 'on');
			btn.closest('.js-preview').classList.add('pin');
		}
	}

	handleCopy(btn) {
		const text = btn.closest('.code-container').querySelector('code').textContent;
		navigator.clipboard.writeText(text).then(() => {
			btn.classList.add('copied');
			setTimeout(() => btn.classList.remove('copied'), 1000);
		});
	}
	
	handleDownloadSVGPreview() {
		if (!this.svgDataObjectURL) {
			console.warn('SVG data not available');
			return;
		}
		
		const blob = new Blob([this.svgDataObjectURL], { type: 'image/svg+xml' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'typing-svg.svg';
		a.click();
		URL.revokeObjectURL(url);
	}

	handleCopySVGPreview(btn) {
		if (!this.svgDataObjectURL) {
			console.warn('SVG data not available');
			return;
		}
		
		navigator.clipboard.writeText(this.svgDataObjectURL).then(() => {
			btn.classList.add('copied');
			setTimeout(() => btn.classList.remove('copied'), 1000);
		});
	}

	/**
	 * Generates SVG URL, updates preview and code blocks.
	 * Reads values from control elements, formats URL parameters,
	 * creates HTML and Markdown code, and updates corresponding DOM elements.
	 * If highlight function is available, applies syntax highlighting.
	 */
	handleGenerate() {
		const params = this.collectParams();
		const fullURL = `${this.baseURL}?${params.toString()}`;
		this.generatedURL = fullURL;

		const markdownCode = `![Typing SVG](${fullURL})`;
		const htmlCode = `<img src="${fullURL}" alt="Typing SVG" />`;

		// Apply syntax highlighting for all fields
		this.outputs.url.innerHTML = highlight(
			fullURL.replace(/</g, '&lt;').replace(/>/g, '&gt;')
		);
		this.outputs.markdown.innerHTML = highlight(
			markdownCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')
		);
		this.outputs.html.innerHTML = highlight(
			htmlCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')
		);
		
		this.updatePreview(fullURL);
	}

	/**
	 * Resets form values to defaults and generates new SVG
	 */
	handleReset() {
		// Apply defaults to form
		this.applyDefaultsToForm();

		// Automatically generate SVG with default parameters
		this.generate();
	}

	setFontWeight(weight) {
		this.controls['font-weight'].value = weight;
	}
	
	/**
	 * Loads SVG image and updates preview with loading indication
	 * @param {string} url 
	 */
	updatePreview(url) {
		// Cancel previous request
		if (this.fetchController) {
			this.fetchController.abort();
		}
		this.fetchController = new AbortController();
		const signal = this.fetchController.signal;

		// Add loading class
		this.preview.classList.add('loader');

	fetch(url, { signal })
		.then(response => {
			if (!response.ok) {
				throw new Error(`HTTP status: ${response.status}`);
			}
			return response.text();
		})
		.then(svgText => {
			// Save SVG as text for copying and downloading
			this.svgDataObjectURL = svgText;

			// Create Blob and URL for display in <img>
			const blob = new Blob([svgText], { type: 'image/svg+xml' });
			
			// Clean up old object URL
			if (this.previewObjectURL) {
				URL.revokeObjectURL(this.previewObjectURL);
			}
			this.previewObjectURL = URL.createObjectURL(blob);

			const img = document.createElement('img');
			img.alt = 'SVG Preview';
			img.onload = () => {
				// this.preview.classList.remove('loader');
			};
			img.src = this.previewObjectURL;

			this.preview.innerHTML = '';
			this.preview.appendChild(img);
		})
			.catch(error => {
				if (error.name === 'AbortError') return;
				this.preview.innerHTML = `<div class="error-message" style="color: #e06c75; padding: 1rem;">Error loading: ${error.message}</div>`;
			})
			.finally(() => {
				this.preview.classList.remove('loader');
			});
	}

	/**
	 * Applies default values to form fields
	 */
	applyDefaultsToForm() {
		// Check that defaults are loaded
		if (!this.defaults) {
			console.warn('Defaults not loaded yet');
			return;
		}

		// Apply all default values to form
		this.controls.lines.value = this.defaults.lines;
		this.controls['font-size'].value = this.defaults.fontSize;
		this.controls['font-family'].value = this.defaults.fontFamily;
		this.controls['font-weight'].value = this.defaults.fontWeight;
		this.controls['letter-spacing'].value = this.defaults.letterSpacing;
		
		// Reset colors via jscolor
		if (this.controls.color.jscolor) {
			this.controls.color.jscolor.fromString(this.defaults.color);
		} else {
			this.controls.color.value = `#${this.defaults.color}`;
		}
		
		if (this.controls.background.jscolor) {
			// For transparent, set opaque white color (alpha = FF)
			// so the transparency slider is in opaque position
			if (this.defaults.background === 'transparent') {
				this.controls.background.jscolor.fromString('#FFFFFFFF');
			} else {
				// If value is not in hexa format, add alpha channel FF
				const bgValue = this.defaults.background;
				const hexaValue = bgValue.length === 6 ? bgValue + 'FF' : bgValue;
				this.controls.background.jscolor.fromString(hexaValue);
			}
		} else {
			this.controls.background.value = this.defaults.background === 'transparent' 
				? 'transparent' 
				: `#${this.defaults.background}`;
		}
		
		this.controls.width.value = this.defaults.width;
		this.controls.height.value = this.defaults.height;
		this.controls['print-speed'].value = this.defaults.printSpeed;
		this.controls['delay-after-print'].value = this.defaults.delayBetweenLines;
		this.controls['erase-speed'].value = this.defaults.eraseSpeed;
		this.controls['erase-mode'].value = this.defaults.eraseMode;
		this.controls['cursor-style'].value = this.defaults.cursorStyle;
		this.controls['horizontal-align'].checked = this.defaults.horizontalAlign === 'center';
		this.controls['vertical-align'].checked = this.defaults.verticalAlign === 'middle';
		this.controls.multiline.checked = this.defaults.multiLine;
		this.controls.repeat.checked = this.defaults.repeat;
	}

	/**
	 * Применяет параметры из распарсенной строки к форме
	 * @param {Object} params - объект с параметрами
	 */
	applyParsedParams(params) {
		if (!params) return;

		// Сначала сбрасываем все параметры к значениям по умолчанию
		// Это гарантирует, что параметры, не указанные в строке, будут установлены в дефолты
		this.applyDefaultsToForm();

		// Маппинг параметров из URL в названия полей формы
		const paramMapping = {
			lines: 'lines',
			fontSize: 'font-size',
			fontFamily: 'font-family',
			fontWeight: 'font-weight',
			letterSpacing: 'letter-spacing',
			color: 'color',
			background: 'background',
			width: 'width',
			height: 'height',
			printSpeed: 'print-speed',
			delayBetweenLines: 'delay-after-print',
			eraseSpeed: 'erase-speed',
			eraseMode: 'erase-mode',
			cursorStyle: 'cursor-style',
			horizontalAlign: 'horizontal-align',
			verticalAlign: 'vertical-align',
			multiLine: 'multiline',
			repeat: 'repeat'
		};

		// Применяем каждый параметр из распарсенной строки к соответствующему полю
		Object.entries(params).forEach(([key, value]) => {
			const fieldName = paramMapping[key];
			if (!fieldName || !this.controls[fieldName]) return;

			const control = this.controls[fieldName];

			// Обработка специальных полей
			if (key === 'lines') {
				// Преобразуем параметр lines из формата "line1;line2" в многострочный текст
				control.value = value.split(';').join('\n');
			} else if (key === 'color') {
				// Обработка цвета через jscolor
				if (control.jscolor) {
					// Если цвет transparent, устанавливаем черный с альфа-каналом 00
					if (value === 'transparent') {
						control.jscolor.fromString('#00000000');
					} else {
						// Добавляем # если его нет и проверяем альфа-канал
						const colorValue = value.startsWith('#') ? value : `#${value}`;
						// Если формат без альфа-канала (6 символов), добавляем FF
						const hexaValue = colorValue.length === 7 ? colorValue + 'FF' : colorValue;
						control.jscolor.fromString(hexaValue);
					}
				} else {
					control.value = value.startsWith('#') ? value : `#${value}`;
				}
			} else if (key === 'background') {
				// Обработка фона через jscolor
				if (control.jscolor) {
					if (value === 'transparent') {
						control.jscolor.fromString('#FFFFFF00');
					} else {
						const bgValue = value.startsWith('#') ? value : `#${value}`;
						const hexaValue = bgValue.length === 7 ? bgValue + 'FF' : bgValue;
						control.jscolor.fromString(hexaValue);
					}
				} else {
					control.value = value === 'transparent' ? 'transparent' : (value.startsWith('#') ? value : `#${value}`);
				}
			} else if (key === 'horizontalAlign') {
				// Checkbox: checked если center, иначе unchecked (left)
				control.checked = value === 'center';
			} else if (key === 'verticalAlign') {
				// Checkbox: checked если middle, иначе unchecked (top)
				control.checked = value === 'middle';
			} else if (key === 'multiLine' || key === 'repeat') {
				// Булевы значения для чекбоксов
				control.checked = value === 'true' || value === true;
			} else {
				// Остальные поля - просто присваиваем значение
				control.value = value;
			}
		});

		// После применения параметров генерируем новый SVG
		this.handleGenerate();
	}


	
	/**
	 * Enables or disables automatic SVG update mode when parameters change.
	 * @param {boolean} enabled - If true, enables auto-update (attaches handlers), otherwise disables.
	 */
	setAutoUpdate(enabled) {
		this.autoUpdateEnabled = enabled;
		
		if (enabled) {
			this.enableAutoUpdate();
		} else {
			this.disableAutoUpdate();
		}
	}

	enableAutoUpdate() {
		// Clear previous handlers
		this.disableAutoUpdate();

		// Function for debounced generation
		const debouncedGenerate = () => {
			if (this.autoUpdateTimeout) {
				clearTimeout(this.autoUpdateTimeout);
			}
			this.autoUpdateTimeout = setTimeout(() => {
				this.generate();
			}, 300);
		};

		// Add handlers for standard fields
		const standardFields = [
			'lines', 'font-size', 'font-family', 'font-weight', 'letter-spacing',
			'width', 'height', 'print-speed', 'delay-after-print', 'erase-speed',
			'erase-mode', 'cursor-style', 'horizontal-align', 'vertical-align', 'multiline', 'repeat'
		];

		standardFields.forEach(fieldName => {
			const control = this.controls[fieldName];
			if (control) {
				const eventType = control.tagName === 'TEXTAREA' ? 'input' : 'change';
				const handler = () => debouncedGenerate();
				control.addEventListener(eventType, handler);
				this.fieldHandlers.push({ element: control, event: eventType, handler });
			}
		});

		// Handlers for color fields via jscolor
		if (this.controls.color.jscolor) {
			const colorHandler = () => debouncedGenerate();
			this.controls.color.jscolor.onChange = colorHandler;
			this.fieldHandlers.push({ element: this.controls.color, type: 'jscolor', handler: colorHandler });
		}

		if (this.controls.background.jscolor) {
			const backgroundHandler = () => debouncedGenerate();
			this.controls.background.jscolor.onChange = backgroundHandler;
			this.fieldHandlers.push({ element: this.controls.background, type: 'jscolor', handler: backgroundHandler });
		}
	}

	disableAutoUpdate() {
		// Remove all handlers
		this.fieldHandlers.forEach(({ element, event, handler, type }) => {
			if (type === 'jscolor') {
				element.jscolor.onChange = null;
			} else {
				element.removeEventListener(event, handler);
			}
		});
		this.fieldHandlers = [];

		// Clear timer
		if (this.autoUpdateTimeout) {
			clearTimeout(this.autoUpdateTimeout);
			this.autoUpdateTimeout = null;
		}
	}
}
