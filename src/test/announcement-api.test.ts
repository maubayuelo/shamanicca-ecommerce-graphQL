import type { NextApiRequest, NextApiResponse } from 'next';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { query } = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock('../lib/graphql/apolloClient', () => ({ default: { query } }));

import handler from '../pages/api/cms/announcement';

function response(): NextApiResponse {
  return {
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as NextApiResponse;
}

describe('/api/cms/announcement', () => {
  afterEach(() => {
    query.mockReset();
    vi.restoreAllMocks();
  });

  it('returns a hidden banner and logs when GraphQL rejects', async () => {
    query.mockRejectedValueOnce(new Error('proxy unavailable'));
    const res = response();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    await handler({} as NextApiRequest, res);

    expect(query).toHaveBeenCalledWith(expect.objectContaining({ fetchPolicy: 'no-cache' }));
    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      's-maxage=60, stale-while-revalidate=300',
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ banner: null });
    expect(error).toHaveBeenCalledWith(
      '[api/cms/announcement] GraphQL request failed:',
      'proxy unavailable',
    );
  });
});
