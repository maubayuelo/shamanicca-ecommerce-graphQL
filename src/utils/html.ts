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

// WPGraphQL `date`/`modified` come without an offset. The WordPress site clock is UTC
// (verified Oct 2026: modified times match edits in UTC), so mark them as UTC for schema.org.
// If the WP timezone setting ever changes, switch the query to dateGmt/modifiedGmt instead.
export function toIsoUtc(date?: string | null): string | undefined {
  if (!date) return undefined;
  return /([zZ]|[+-]\d{2}:?\d{2})$/.test(date) ? date : `${date}Z`;
}
