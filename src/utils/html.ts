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

// Meta descriptions: cut at the last word boundary so search snippets never end mid-word.
export function truncateAtWord(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s,;:.—–-]+$/, '')}…`;
}
