import { describe, expect, it } from 'vitest';
import { truncateAtWord } from './html';

describe('truncateAtWord', () => {
  it('returns short text unchanged (trimmed, whitespace collapsed)', () => {
    expect(truncateAtWord('  A short\n excerpt.  ')).toBe('A short excerpt.');
  });

  it('cuts long text at a word boundary and stays within the limit', () => {
    const text =
      'Uncover the hidden meanings within symbols, numerology, runes, tarot, astrology, and other esoteric systems. Develop your intuition and explore the world of divination for guidance.';
    const out = truncateAtWord(text, 160);
    expect(out.length).toBeLessThanOrEqual(160);
    expect(out.endsWith('…')).toBe(true);
    expect(out).not.toMatch(/\bdiv…$/);
    expect(text.startsWith(out.slice(0, -1))).toBe(true);
  });

  it('falls back to a hard cut when there is no usable space', () => {
    const out = truncateAtWord('x'.repeat(200), 160);
    expect(out.length).toBe(160);
  });
});
