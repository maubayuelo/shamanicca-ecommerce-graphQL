export function stripTags(html?: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}

export function decodeEntities(text?: string): string {
  if (!text) return '';
  // Basic named entities
  const named: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
  };
  let out = text.replace(/(&amp;|&lt;|&gt;|&quot;|&#39;|&apos;)/g, (m) => named[m] || m);
  // Common numeric entities from WP
  out = out.replace(/&#(\d+);/g, (_, num) => {
    const code = parseInt(num, 10);
    try {
      return String.fromCharCode(code);
    } catch {
      return _;
    }
  });
  return out;
}

export function cleanExcerpt(html?: string): string {
  return decodeEntities(stripTags(html));
}
