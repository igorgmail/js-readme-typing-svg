// Вспомогательная функция для обработки URL с параметрами
export function highlightUrl(url) {
  return url.replace(/(https?:\/\/[^\s?]+)(\?.*)?/g, (match, baseUrl, params) => {
    let result = `<span class="token-url">${baseUrl}</span>`;
    
    // Если есть параметры запроса, обрабатываем их отдельно
    if (params) {
      // Убираем начальный ? и обрабатываем параметры
      const paramsStr = params.substring(1);
      // Обрабатываем каждый параметр отдельно
      const processedParams = paramsStr.split('&').map(param => {
        const [key, ...valueParts] = param.split('=');
        const value = valueParts.join('=');
        if (key && value !== undefined) {
          return `<span class="token-key">${key}</span>=<span class="token-value">${value}</span>`;
        }
        return param;
      }).join('&');
      
      result += `?${processedParams}`;
    }
    
    return result;
  });
}

export function highlight(code) {
  let highlighted = code;

  // ---------- 1) HTML ----------
  if (code.trim().startsWith("<") || code.trim().startsWith("&lt;")) {
    // Обрабатываем HTML теги целиком, чтобы избежать обработки атрибутов внутри span-ов
    highlighted = highlighted.replace(/(&lt;\/?)(\w+)(.*?)(&gt;)/g, (m, start, tag, attrs, end) => {
      // Обрабатываем атрибуты внутри тега по отдельности
      let processedAttrs = attrs.replace(/(\s+)?(\w+)="([^"]*)"/g, (match, space, attrName, attrValue) => {
        // Обрабатываем значение атрибута (URL или обычное значение)
        let processedValue = attrValue;
        if (attrValue.includes('http://') || attrValue.includes('https://')) {
          // Если значение содержит URL, обрабатываем его с параметрами
          processedValue = highlightUrl(attrValue);
        } else {
          // Иначе просто выделяем как значение
          processedValue = `<span class="token-value">${attrValue}</span>`;
        }
        
        const spacePart = space || '';
        return `${spacePart}<span class="token-attr">${attrName}</span>="${processedValue}"`;
      });
      
      return `${start}<span class="token-tag">${tag}</span>${processedAttrs}${end}`;
    });
  }

  // ---------- 2) Markdown ----------
  else if (code.trim().startsWith("![")) {
    highlighted = highlighted
      .replace(/!\[(.*?)\]/, `![<span class="token-key">$1</span>]`)
      .replace(/\((.*?)\)/, (match, url) => {
        // Обрабатываем URL в скобках с параметрами
        return `(${highlightUrl(url)})`;
      });
  }

  // ---------- 3) URL ----------
  else if (code.includes("http://") || code.includes("https://") || code.includes("/svg?")) {
    highlighted = highlightUrl(code);
  }

  return highlighted;
}

// Поддержка старого варианта подключения через глобальную функцию
if (typeof window !== 'undefined') {
  window.highlight = highlight;
}
