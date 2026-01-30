// Helper function for processing URL with parameters
export function highlightUrl(url) {
  return url.replace(/(https?:\/\/[^\s?]+)(\?.*)?/g, (match, baseUrl, params) => {
    let result = `<span class="token-url">${baseUrl}</span>`;
    
    // If query parameters exist, process them separately
    if (params) {
      // Remove leading ? and process parameters
      const paramsStr = params.substring(1);
      // Process each parameter separately
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
    // Process HTML tags as a whole to avoid processing attributes inside spans
    highlighted = highlighted.replace(/(&lt;\/?)(\w+)(.*?)(&gt;)/g, (m, start, tag, attrs, end) => {
      // Process attributes inside tag separately
      let processedAttrs = attrs.replace(/(\s+)?(\w+)="([^"]*)"/g, (match, space, attrName, attrValue) => {
        // Process attribute value (URL or regular value)
        let processedValue = attrValue;
        if (attrValue.includes('http://') || attrValue.includes('https://')) {
          // If value contains URL, process it with parameters
          processedValue = highlightUrl(attrValue);
        } else {
          // Otherwise just highlight as value
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
        // Process URL in parentheses with parameters
        return `(${highlightUrl(url)})`;
      });
  }

  // ---------- 3) URL ----------
  else if (code.includes("http://") || code.includes("https://") || code.includes("/svg?")) {
    highlighted = highlightUrl(code);
  }

  return highlighted;
}

// Support for legacy connection via global function
if (typeof window !== 'undefined') {
  window.highlight = highlight;
}
