import { describe, expect, it } from 'vitest';
import { visiblePostIds } from './blog-sidebar';

describe('visiblePostIds', () => {
  it('uses database IDs, preserves order, and removes duplicates', () => {
    expect(visiblePostIds([
      { databaseId: 797 },
      { databaseId: '590' },
      { databaseId: 797 },
    ])).toEqual(['797', '590']);
  });

  it('never passes a WPGraphQL global ID to notIn', () => {
    expect(visiblePostIds([
      { databaseId: 'cG9zdDo3OTc=' },
      { databaseId: 797 },
    ])).toEqual(['797']);
  });

  it('returns no exclusions for missing or invalid database IDs', () => {
    expect(visiblePostIds([
      {},
      { databaseId: null },
      { databaseId: 'cG9zdDo1OTA=' },
    ])).toEqual([]);
  });
});
