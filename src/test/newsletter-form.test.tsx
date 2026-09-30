import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NewsletterForm from '../components/molecules/NewsletterForm';

const fetchMock = vi.fn();

function submit(email = 'reader@example.com') {
  fireEvent.change(screen.getByRole('textbox', { name: 'Email address' }), { target: { value: email } });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
}

describe('NewsletterForm confirmation feedback', () => {
  beforeEach(() => { vi.stubGlobal('fetch', fetchMock); });
  afterEach(() => {
    cleanup();
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('shows confirmation instructions without claiming membership', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    render(<NewsletterForm className="existing-placement" />);
    submit();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Check your email');
    expect(alert).toHaveTextContent("We've sent a confirmation email. Click the link to confirm your subscription.");
    expect(alert).not.toHaveTextContent(/you're in|welcome|you are subscribed/i);
    expect(alert).toHaveClass('existing-placement');
    expect(alert.querySelector('[aria-hidden="true"] svg')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/newsletter', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reader@example.com' }),
    });
  });

  it.each(['', 'invalid'])('rejects %j locally', (email) => {
    render(<NewsletterForm />);
    submit(email);
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('disables input and button while waiting', async () => {
    let resolve: (value: unknown) => void = () => {};
    fetchMock.mockReturnValue(new Promise((done) => { resolve = done; }));
    render(<NewsletterForm />);
    submit();
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: '...' })).toBeDisabled();
    resolve({ ok: true, json: async () => ({ ok: true }) });
    expect(await screen.findByRole('alert')).toHaveTextContent('Check your email');
  });

  it('shows server errors and permits a successful retry', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Could not send a confirmation email. Please try again later.' }) });
    render(<NewsletterForm />);
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not send a confirmation email.');
    expect(screen.getByRole('textbox')).toBeEnabled();
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });
    submit();
    expect(await screen.findByText('Check your email')).toBeInTheDocument();
  });

  it.each([null, {}, [], { ok: false }, { ok: 'true' }, { error: {} }])('rejects unexpected response %j', async (data) => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => data });
    render(<NewsletterForm />);
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Please try again.');
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });

  it.each(['network', 'invalid JSON'])('allows retry after %s errors', async (reason) => {
    if (reason === 'network') fetchMock.mockRejectedValue(new Error(reason));
    else fetchMock.mockResolvedValue({ ok: true, json: async () => { throw new Error(reason); } });
    render(<NewsletterForm />);
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Network error. Please try again.');
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });
});
