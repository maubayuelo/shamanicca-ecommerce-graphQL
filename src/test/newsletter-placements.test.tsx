import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Footer from '../components/organisms/Footer';
import NewsletterModal from '../components/molecules/NewsletterModal';

const fetchMock = vi.fn();

function submitIn(container: HTMLElement, email: string) {
  const scope = within(container);
  fireEvent.change(scope.getByRole('textbox', { name: 'Email address' }), { target: { value: email } });
  fireEvent.click(scope.getByRole('button', { name: 'Send' }));
}

describe('Independent newsletter placements', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('enables footer signup by default and displays pending feedback', async () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');
    submitIn(footer, 'footer@example.com');
    const alert = await within(footer).findByRole('alert');
    expect(alert).toHaveTextContent('Check your email');
    expect(alert).not.toHaveTextContent("You're in!");
    expect(alert.querySelector('[aria-hidden="true"] svg')).toBeInTheDocument();
  });

  it('opts out of only the footer signup block when explicitly requested', () => {
    render(<Footer showNewsletterSignup={false} />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByText('Get The Good Stuff')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Instagram' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact Us' })).toBeInTheDocument();
  });

  it.each(['footer', 'popup'])('submitting the %s keeps the other form independent', async (first) => {
    render(<><Footer /><NewsletterModal /></>);
    fireEvent(document, new MouseEvent('mouseleave', { clientY: 0 }));
    const footer = screen.getByRole('contentinfo');
    const popup = screen.getByRole('dialog', { name: 'Subscribe to our newsletter' });
    const [one, two] = first === 'footer' ? [footer, popup] : [popup, footer];
    submitIn(one, 'first@example.com');
    expect(await within(one).findByRole('alert')).toHaveTextContent('Check your email');
    expect(within(two).getByRole('textbox')).toBeEnabled();
    expect(within(two).queryByRole('alert')).not.toBeInTheDocument();
    submitIn(two, 'second@example.com');
    expect(await within(two).findByRole('alert')).toHaveTextContent('Check your email');
    expect(screen.getAllByText('Check your email')).toHaveLength(2);
    expect(screen.queryByText("You're in! ✓")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
