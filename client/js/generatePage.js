import { DEFAULT_PARAMS } from './defaults.js';

class GeneratorPage {
	constructor() {
		this.baseURL = `${window.location.origin}/svg`;
		this.defaults = DEFAULT_PARAMS;
		this.controls = this.initControls();
		this.outputs = this.initOutputs();
		this.preview = document.querySelector('[data-js="preview"]');
		this.generatedURL = '';
		this.bindEvents();
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
			.addEventListener('click', () => this.generate());
		document
			.querySelector('[data-js-action="reset"]')
			.addEventListener('click', () => this.reset());
		document
			.querySelector('[data-js-action="copy"]')
			?.addEventListener('click', () => this.copyURL());
		document
			.querySelectorAll('.js-copy-btn')
			.forEach(btn => btn.addEventListener('click', () => this.copy(btn)));
		document
			.querySelectorAll('[pin-name]')
			.forEach(btn => btn.addEventListener('click', () => this.pin(btn)));
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
		params.append('fontFamily', this.controls['font-family'].value.trim() || 'monospace');
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
		params.append('delayAfterBlockPrint', this.controls['delay-after-print'].value);
		params.append('eraseSpeed', this.controls['erase-speed'].value);
		params.append('eraseMode', this.controls['erase-mode'].value);
		
		// Обработка выравнивания из select (true/false -> center/middle)
		const horizontalAlign = this.controls['horizontal-align'].value;
		params.append('horizontalAlign', horizontalAlign);
		
		const verticalAlign = this.controls['vertical-align'].value;
		params.append('verticalAlign', verticalAlign);
		
		// Обработка multiline и repeat из select
		params.append('multiLine', this.controls.multiline.value === 'true' ? 'true' : 'false');
		params.append('repeat', this.controls.repeat.value === 'true' ? 'true' : 'false');

		return params;
	}

	generate() {
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
		
		this.preview.innerHTML = `<img src="${fullURL}" alt="SVG Preview" />`;
	}

	pin(btn) {
		const pinStatus = btn.closest('[pin-status]').getAttribute('pin-status');
		if (pinStatus === 'on') {
			btn.closest('[pin-status]').setAttribute('pin-status', 'off');
			btn.closest('.js-preview').classList.remove('pin');
		} else {
			btn.closest('[pin-status]').setAttribute('pin-status', 'on');
			btn.closest('.js-preview').classList.add('pin');
		}
	}

	copy(btn) {
		const text = btn.closest('.code-container').querySelector('code').textContent;
		navigator.clipboard.writeText(text).then(() => {
			btn.classList.add('copied');
			setTimeout(() => btn.classList.remove('copied'), 1000);
		});
	}

	copyURL() {
		if (!this.generatedURL) {
			window.alert('⚠️ Сначала сгенерируйте URL');
			return;
		}

		navigator.clipboard
			.writeText(this.generatedURL)
			.then(() => window.alert('✅ URL скопирован в буфер обмена!'))
			.catch((error) => window.alert('❌ Ошибка копирования: ' + error));
	}
	
	reset() {
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
				this.controls.background.jscolor.fromString('000000FF');
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
		this.controls['delay-after-print'].value = this.defaults.delayAfterBlockPrint;
		this.controls['erase-speed'].value = this.defaults.eraseSpeed;
		this.controls['erase-mode'].value = this.defaults.eraseMode;
		this.controls['horizontal-align'].value = this.defaults.horizontalAlign;
		this.controls['vertical-align'].value = this.defaults.verticalAlign;
		this.controls.multiline.value = this.defaults.multiLine.toString();
		this.controls.repeat.value = this.defaults.repeat.toString();

		// Автоматически генерируем SVG с дефолтными параметрами
		this.generate();

		document.querySelectorAll('[data-code-output]').forEach(output => {
			output.innerText = '';
		});
	}
}

window.addEventListener('DOMContentLoaded', () => {
	new GeneratorPage();
});