// @vitest-environment node
import type { NextApiRequest, NextApiResponse } from 'next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '../pages/api/newsletter';

const fetchMock = vi.fn();
const failure = { error: 'Could not send a confirmation email. Please try again later.' };

function response() {
  const res = {
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return { res, api: res as unknown as NextApiResponse };
}

async function submit(body: unknown = { email: 'reader@example.com' }, method = 'POST') {
  const { res, api } = response();
  await handler({ body, method } as NextApiRequest, api);
  return res;
}

describe('/api/newsletter Brevo DOI', () => {
  beforeEach(() => {
    vi.stubEnv('BREVO_API_KEY', 'test-private-key');
    vi.stubEnv('BREVO_LIST_ID', '12');
    vi.stubEnv('BREVO_DOI_TEMPLATE_ID', '5');
    vi.stubEnv('BREVO_DOI_REDIRECT_URL', '');
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockResolvedValue(new Response(null, { status: 201 }));
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('accepts an empty 201, normalizes email and sends only DOI fields server-side', async () => {
    const res = await submit({ email: '  Reader@Example.COM  ' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/contacts/doubleOptinConfirmation',
      {
        method: 'POST',
        headers: { 'api-key': 'test-private-key', 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email: 'reader@example.com', includeListIds: [12], templateId: 5,
          redirectionUrl: 'https://shamanicca.com/newsletter?confirmed=1',
        }),
        signal: expect.any(AbortSignal),
        redirect: 'error',
      },
    );
  });

  it('accepts the documented 201 with an empty JSON object', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 201 }));
    expect((await submit()).json).toHaveBeenCalledWith({ ok: true });
  });

  it.each([
    'http://localhost:3000/newsletter?confirmed=1',
    'https://shamanicca.com/newsletter?confirmed=1',
    'http://localhost:3000/newsletter/confirmed',
  ])('preserves the configured redirect %s and the rest of the Brevo contract', async (url) => {
    vi.stubEnv('BREVO_DOI_REDIRECT_URL', url);
    const res = await submit();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [endpoint, options] = fetchMock.mock.calls[0];
    expect(endpoint).toBe('https://api.brevo.com/v3/contacts/doubleOptinConfirmation');
    expect(options.method).toBe('POST');
    expect(options.headers['api-key']).toBe('test-private-key');
    expect(JSON.parse(options.body)).toEqual({
      email: 'reader@example.com', includeListIds: [12], templateId: 5, redirectionUrl: url,
    });
  });

  it.each([null, {}, [], 'reader@example.com', { email: null }, { email: 42 },
    { email: {} }, { email: [] }, { email: '' }, { email: '   ' }, { email: 'reader' },
    { email: 'a@@example.com' }, { email: 'a b@example.com' }, { email: 'a@example' },
    { email: `${'a'.repeat(250)}@example.com` },
  ])('rejects invalid request body %j without contacting Brevo', async (body) => {
    const res = await submit(body);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Valid email address is required.' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a missing request body', async () => {
    const { res, api } = response();
    await handler({ method: 'POST' } as NextApiRequest, api);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['GET', 'PUT', 'DELETE'])('rejects %s and advertises POST', async (method) => {
    const res = await submit({}, method);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.setHeader).toHaveBeenCalledWith('Allow', 'POST');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['BREVO_API_KEY', 'BREVO_LIST_ID', 'BREVO_DOI_TEMPLATE_ID'])('fails closed without %s', async (name) => {
    delete process.env[name];
    const res = await submit();
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(failure);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['', ' ', '0', '-1', '1.5', 'abc', '12x', '1e2', '9007199254740992'])('rejects invalid list/template ID %j', async (value) => {
    for (const name of ['BREVO_LIST_ID', 'BREVO_DOI_TEMPLATE_ID']) {
      vi.stubEnv('BREVO_LIST_ID', '12');
      vi.stubEnv('BREVO_DOI_TEMPLATE_ID', '5');
      vi.stubEnv(name, value);
      expect((await submit()).status).toHaveBeenCalledWith(503);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a blank API key', async () => {
    vi.stubEnv('BREVO_API_KEY', '   ');
    expect((await submit()).status).toHaveBeenCalledWith(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [401, 'unauthorized', 'Invalid API key'],
    [403, 'permission_denied', 'Account not authorized'],
    [400, 'invalid_parameter', 'List does not exist'],
    [400, 'invalid_parameter', 'Invalid DOI template'],
    [400, 'invalid_parameter', 'Template is inactive'],
    [400, 'duplicate_parameter', 'Contact already exists'],
    [429, 'too_many_requests', 'Rate limit exceeded'],
    [500, 'internal_error', 'Provider failure'],
  ])('handles provider %s / %s / %s without exposing details or claiming success', async (status, code, message) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ code, message }), { status: Number(status) }));
    const res = await submit();
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(failure);
    expect(console.error).toHaveBeenCalledWith('[newsletter] Brevo DOI request rejected:', status);
    expect(JSON.stringify(res.json.mock.calls)).not.toContain('test-private-key');
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('reader@example.com');
  });

  it.each([200, 202, 204, 302, 418, 503])('does not treat unexpected HTTP %s as DOI success', async (status) => {
    fetchMock.mockResolvedValue(new Response(null, { status }));
    const res = await submit();
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(failure);
  });

  it('handles an HTML error response without parsing or leaking it', async () => {
    fetchMock.mockResolvedValue(new Response('<html>private upstream error</html>', { status: 502 }));
    expect((await submit()).json).toHaveBeenCalledWith(failure);
  });

  it('keeps repeated accepted submissions in the DOI flow', async () => {
    for (let i = 0; i < 2; i++) {
      expect((await submit()).json).toHaveBeenCalledWith({ ok: true });
    }
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [url, options] of fetchMock.mock.calls) {
      expect(url).toContain('/contacts/doubleOptinConfirmation');
      expect(JSON.parse(options.body)).not.toHaveProperty('updateEnabled');
      expect(JSON.parse(options.body)).not.toHaveProperty('emailBlacklisted');
    }
  });

  it.each(['network', 'timeout', 'redirect'])('handles %s failure without logging the thrown message', async (reason) => {
    fetchMock.mockRejectedValue(new Error(`${reason}: test-private-key reader@example.com`));
    const res = await submit();
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(failure);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('[newsletter] Brevo DOI request failed');
  });

  it('sets a ten-second upstream timeout', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    await submit();
    expect(timeout).toHaveBeenCalledWith(10000);
  });
});
