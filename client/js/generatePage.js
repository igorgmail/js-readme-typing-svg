import { DEFAULT_PARAMS } from './utils/defaults.js';
import './utils/colorPicker.js';
import './utils/highlight.js';

export default class GeneratorPage {
	constructor() {
		this.baseURL = `${window.location.origin}/svg`;
		this.defaults = DEFAULT_PARAMS;
		this.controls = this.initControls();
		this.outputs = this.initOutputs();
		this.preview = document.querySelector('[data-js="preview"]');
		this.generatedURL = '';
		this.autoUpdateEnabled = false;
		this.autoUpdateTimeout = null;
		this.fieldHandlers = [];
		this.fetchController = null;
		this.previewObjectURL = null;
		
		// Алиас для метода генерации, так как он используется в autoUpdate и handleReset
		this.generate = this.handleGenerate.bind(this);
		
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
		
		// Получаем цвет из jscolor с поддержкой альфа-канала
		let colorValue = '000000';
		if (this.controls.color.jscolor) {
			const colorHexa = this.controls.color.jscolor.toString('hexa');
			// Убираем # и проверяем альфа-канал
			const hexaValue = colorHexa.replace('#', '');
			// Если альфа = 00 (полностью прозрачный), используем transparent
			if (hexaValue.length === 8 && hexaValue.substr(6, 2).toUpperCase() === '00') {
				colorValue = 'transparent';
			} else if (hexaValue.length === 8 && hexaValue.substr(6, 2).toUpperCase() === 'FF') {
				// Если альфа = FF (непрозрачный), используем только RGB
				colorValue = hexaValue.substr(0, 6);
			} else if (hexaValue.length === 8) {
				// Используем полный hexa формат с альфа-каналом
				colorValue = hexaValue;
			} else {
				colorValue = hexaValue;
			}
		} else {
			colorValue = this.controls.color.value.replace('#', '');
		}
		params.append('color', colorValue);

		// Получаем background из jscolor
		let backgroundValue = 'transparent';
		if (this.controls.background.jscolor) {
			const bgColor = this.controls.background.jscolor.toString('hexa');
			// Убираем # и проверяем альфа-канал
			const hexaValue = bgColor.replace('#', '');
			// Если альфа = 00 (полностью прозрачный), используем transparent
			if (hexaValue.length === 8 && hexaValue.substr(6, 2).toUpperCase() === '00') {
				backgroundValue = 'transparent';
			} else if (hexaValue.length === 8 && hexaValue.substr(6, 2).toUpperCase() === 'FF') {
				// Если альфа = FF (непрозрачный), используем только RGB
				backgroundValue = hexaValue.substr(0, 6);
			} else if (hexaValue.length === 8) {
				// Используем полный hexa формат с альфа-каналом
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
		
		// Обработка выравнивания из checkbox (checked -> center/middle, unchecked -> left/top)
		const horizontalAlign = this.controls['horizontal-align'].checked ? 'center' : 'left';
		params.append('horizontalAlign', horizontalAlign);
		
		const verticalAlign = this.controls['vertical-align'].checked ? 'middle' : 'top';
		params.append('verticalAlign', verticalAlign);
		
		// Обработка multiline и repeat из checkbox
		params.append('multiLine', this.controls.multiline.checked ? 'true' : 'false');
		params.append('repeat', this.controls.repeat.checked ? 'true' : 'false');

		return params;
	}

	/**
	 * Генерирует URL для SVG, обновляет предпросмотр и блоки кода.
	 * Считывает значения из элементов управления, формирует параметры URL,
	 * создает HTML и Markdown код, и обновляет соответствующие элементы DOM.
	 * Если доступна функция highlight, применяет подсветку синтаксиса.
	 */
	handleGenerate() {
		const params = this.collectParams();
		const fullURL = `${this.baseURL}?${params.toString()}`;
		this.generatedURL = fullURL;

		const markdownCode = `![Typing SVG](${fullURL})`;
		const htmlCode = `<img src="${fullURL}" alt="Typing SVG" />`;

		// Применяем подсветку синтаксиса для всех полей
		if (typeof highlight === 'function') {
			this.outputs.url.innerHTML = highlight(
				fullURL.replace(/</g, '&lt;').replace(/>/g, '&gt;')
			);
			this.outputs.markdown.innerHTML = highlight(
				markdownCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')
			);
			this.outputs.html.innerHTML = highlight(
				htmlCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')
			);
		} else {
			// Fallback если функция highlight недоступна
			this.outputs.url.textContent = fullURL;
			this.outputs.markdown.textContent = markdownCode;
			this.outputs.html.textContent = htmlCode;
		}
		
		this.updatePreview(fullURL);
	}

	/**
	 * Загружает SVG изображение и обновляет превью с индикацией загрузки
	 * @param {string} url 
	 */
	updatePreview(url) {
		// Отменяем предыдущий запрос
		if (this.fetchController) {
			this.fetchController.abort();
		}
		this.fetchController = new AbortController();
		const signal = this.fetchController.signal;

		// Добавляем класс загрузки
		this.preview.classList.add('loader');

		fetch(url, { signal })
			.then(response => {
				if (!response.ok) {
					throw new Error(`HTTP status: ${response.status}`);
				}
				return response.blob();
			})
			.then(blob => {
				// Очищаем старый URL объекта
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
				this.preview.innerHTML = `<div class="error-message" style="color: #e06c75; padding: 1rem;">Ошибка загрузки: ${error.message}</div>`;
			})
			.finally(() => {
				this.preview.classList.remove('loader');
			});
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
	
	handleReset() {
		// Сбрасываем все поля формы к дефолтным значениям
		this.controls.lines.value = this.defaults.lines;
		this.controls['font-size'].value = this.defaults.fontSize;
		this.controls['font-family'].value = this.defaults.fontFamily;
		this.controls['font-weight'].value = this.defaults.fontWeight;
		this.controls['letter-spacing'].value = this.defaults.letterSpacing;
		
		// Сброс цветов через jscolor
		if (this.controls.color.jscolor) {
			this.controls.color.jscolor.fromString(this.defaults.color);
		} else {
			this.controls.color.value = `#${this.defaults.color}`;
		}
		
		if (this.controls.background.jscolor) {
			// Для transparent устанавливаем непрозрачный черный цвет (альфа = FF)
			// чтобы ползунок прозрачности был в положении непрозрачный
			if (this.defaults.background === 'transparent') {
				this.controls.background.jscolor.fromString('#FFFFFFFF');
			} else {
				// Если значение не hexa формат, добавляем альфа-канал FF
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

		// Автоматически генерируем SVG с дефолтными параметрами
		this.generate();
	}

	
	/**
	 * Включает или отключает режим автоматического обновления SVG при изменении параметров.
	 * @param {boolean} enabled - Если true, включает автообновление (вешает обработчики), иначе отключает.
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
		// Очищаем предыдущие обработчики
		this.disableAutoUpdate();

		// Функция для debounce генерации
		const debouncedGenerate = () => {
			if (this.autoUpdateTimeout) {
				clearTimeout(this.autoUpdateTimeout);
			}
			this.autoUpdateTimeout = setTimeout(() => {
				this.generate();
			}, 300);
		};

		// Добавляем обработчики для обычных полей
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

		// Обработчики для цветовых полей через jscolor
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
		// Удаляем все обработчики
		this.fieldHandlers.forEach(({ element, event, handler, type }) => {
			if (type === 'jscolor') {
				element.jscolor.onChange = null;
			} else {
				element.removeEventListener(event, handler);
			}
		});
		this.fieldHandlers = [];

		// Очищаем таймер
		if (this.autoUpdateTimeout) {
			clearTimeout(this.autoUpdateTimeout);
			this.autoUpdateTimeout = null;
		}
	}
}
