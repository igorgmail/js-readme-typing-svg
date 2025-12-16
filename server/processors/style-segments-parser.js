/**
 * Модуль для парсинга строк с маркерами стилей на сегменты
 * Обрабатывает специальные маркеры, созданные parseVariables($STYLE{...})
 */

/**
 * Парсит строку с маркерами стилей на массив сегментов
 * @param {string} text - строка с маркерами стилей
 * @param {string} defaultColor - цвет по умолчанию для сегментов без стилей
 * @returns {Array<Object>} массив сегментов {text, color, styles}
 */
export function parseStyleSegments(text, defaultColor = '#000000') {
  const segments = [];
  
  // Регулярка для поиска маркеров стилей
  const styleMarkerRegex = /\x00STYLE_START\x00(.*?)\x00(.*?)\x00STYLE_END\x00/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = styleMarkerRegex.exec(text)) !== null) {
    const startIndex = match.index;
    const endIndex = styleMarkerRegex.lastIndex;
    
    // Добавляем текст до маркера (если есть)
    if (startIndex > lastIndex) {
      const plainText = text.substring(lastIndex, startIndex);
      if (plainText) {
        segments.push({
          text: plainText,
          color: defaultColor,
          styles: {}
        });
      }
    }
    
    // Парсим стили из маркера
    try {
      const stylesJson = match[1];
      const styledText = match[2];
      const styles = JSON.parse(stylesJson);
      
      segments.push({
        text: styledText,
        color: styles.color || defaultColor,
        styles: styles
      });
    } catch (error) {
      console.error('Error parsing style marker:', error);
      // В случае ошибки добавляем как обычный текст
      segments.push({
        text: match[2] || '',
        color: defaultColor,
        styles: {}
      });
    }
    
    lastIndex = endIndex;
  }
  
  // Добавляем оставшийся текст после последнего маркера
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      segments.push({
        text: remainingText,
        color: defaultColor,
        styles: {}
      });
    }
  }
  
  // Если маркеров не было, возвращаем всю строку как один сегмент
  if (segments.length === 0 && text) {
    segments.push({
      text: text,
      color: defaultColor,
      styles: {}
    });
  }
  
  return segments;
}

/**
 * Проверяет, содержит ли строка маркеры стилей
 * @param {string} text - строка для проверки
 * @returns {boolean} true если строка содержит маркеры стилей
 */
export function hasStyleMarkers(text) {
  return text.includes('\x00STYLE_START\x00');
}

/**
 * Удаляет маркеры стилей из текста, оставляя только "чистый" текст
 * Используется для расчета ширины текста
 * @param {string} text - строка с маркерами
 * @returns {string} строка без маркеров, только текстовое содержимое
 */
export function stripStyleMarkers(text) {
  if (!hasStyleMarkers(text)) {
    return text;
  }
  
  // Извлекаем текст из всех маркеров стилей
  const styleMarkerRegex = /\x00STYLE_START\x00(.*?)\x00(.*?)\x00STYLE_END\x00/g;
  
  return text.replace(styleMarkerRegex, (match, stylesJson, styledText) => {
    return styledText;
  });
}

/**
 * Извлекает все уникальные fontFamily из маркеров стилей в строках
 * @param {Array<string>} lines - массив строк с маркерами стилей
 * @returns {Set<string>} множество уникальных fontFamily
 */
export function extractFontFamiliesFromStyles(lines) {
  const fontFamilies = new Set();
  
  if (!Array.isArray(lines)) {
    return fontFamilies;
  }
  
  const styleMarkerRegex = /\x00STYLE_START\x00(.*?)\x00(.*?)\x00STYLE_END\x00/g;
  
  for (const line of lines) {
    if (!hasStyleMarkers(line)) {
      continue;
    }
    
    let match;
    while ((match = styleMarkerRegex.exec(line)) !== null) {
      try {
        const stylesJson = match[1];
        const styles = JSON.parse(stylesJson);
        
        if (styles.fontFamily && typeof styles.fontFamily === 'string') {
          const trimmed = styles.fontFamily.trim();
          if (trimmed) {
            fontFamilies.add(trimmed);
          }
        }
      } catch (error) {
        // Игнорируем ошибки парсинга отдельных маркеров
      }
    }
  }
  
  return fontFamilies;
}
