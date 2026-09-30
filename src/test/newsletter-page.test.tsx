import type { GetServerSidePropsContext } from 'next';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NewsletterPage from '../pages/newsletter';
import NewsletterConfirmedPage, { getServerSideProps } from '../pages/newsletter/confirmed';

const { router } = vi.hoisted(() => ({
  router: { isReady: true, query: {} as { confirmed?: string | string[] } },
}));
vi.mock('next/router', () => ({ useRouter: () => router }));
vi.mock('../components/organisms/Header', () => ({ default: () => <header /> }));
vi.mock('../components/atoms/SeoHead', () => ({ default: () => null }));

const page = {
  slug: 'newsletter',
  title: { rendered: 'Get our newsletter' },
  content: { rendered: '<p>Fill in the signup form below.</p>' },
};
const fetchMock = vi.fn();

describe('Newsletter page presentation state', () => {
  beforeEach(() => {
    router.isReady = true;
    router.query = {};
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    cleanup();
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('renders the default main form without a duplicate footer signup', () => {
    render(<NewsletterPage page={page} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Get our newsletter' })).toBeInTheDocument();
    expect(screen.getByText('Fill in the signup form below.')).toBeInTheDocument();
    expect(screen.getAllByRole('textbox', { name: 'Email address' })).toHaveLength(1);
    const footer = within(screen.getByRole('contentinfo'));
    expect(footer.queryByRole('textbox')).not.toBeInTheDocument();
    expect(footer.queryByText('Get The Good Stuff')).not.toBeInTheDocument();
    expect(footer.getByRole('link', { name: 'Instagram' })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows exactly one pending confirmation after submission', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    render(<NewsletterPage page={page} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Email address' }), { target: { value: 'reader@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Check your email');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.queryByText("You're in!")).not.toBeInTheDocument();
    expect(within(screen.getByRole('contentinfo')).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('replaces signup heading, instructions and form with final confirmation', () => {
    router.query = { confirmed: '1' };
    render(<NewsletterPage page={page} />);
    expect(screen.getByRole('heading', { level: 1, name: "You're in!" })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Thank you for confirming your subscription. Welcome to the Shamanicca community.');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.queryByText('Fill in the signup form below.')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Get our newsletter' })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore the blog' })).toHaveAttribute('href', '/blog');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['0', 'true', '', ['1', '1']])('does not confirm for query value %j', (value) => {
    router.query = { confirmed: value };
    render(<NewsletterPage page={page} />);
    expect(screen.getByRole('textbox', { name: 'Email address' })).toBeInTheDocument();
    expect(screen.queryByText("You're in!")).not.toBeInTheDocument();
  });

  it('waits for router readiness without flashing contradictory signup content', () => {
    router.isReady = false;
    const { rerender } = render(<NewsletterPage page={page} />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByText('Fill in the signup form below.')).not.toBeInTheDocument();
    router.isReady = true;
    router.query = { confirmed: '1' };
    rerender(<NewsletterPage page={page} />);
    expect(screen.getByRole('heading', { name: "You're in!" })).toBeInTheDocument();
  });

  it('returns to the default form when the confirmation query is removed', () => {
    router.query = { confirmed: '1' };
    const { rerender } = render(<NewsletterPage page={page} />);
    router.query = {};
    rerender(<NewsletterPage page={page} />);
    expect(screen.getByRole('textbox', { name: 'Email address' })).toBeInTheDocument();
    expect(screen.queryByText("You're in!")).not.toBeInTheDocument();
  });

  it('retains retry feedback on API errors', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'Please try again later.' }) });
    render(<NewsletterPage page={page} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'reader@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Please try again later.');
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
    expect(screen.queryByText('Check your email')).not.toBeInTheDocument();
  });

  it('keeps the legacy route as a redirect with no independent UI', async () => {
    expect(await getServerSideProps({} as GetServerSidePropsContext)).toEqual({
      redirect: { destination: '/newsletter?confirmed=1', permanent: false },
    });
    const { container } = render(<NewsletterConfirmedPage />);
    expect(container).toBeEmptyDOMElement();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
