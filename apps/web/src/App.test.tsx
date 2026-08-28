import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App.js';

describe('App shell', () => {
  it('renders Home by default and switches primary views', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /close the July finance snapshot/ }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Review' }));
    expect(
      screen.getByRole('heading', { name: 'Weekly review · Week 29' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'MCP' }));
    expect(screen.getByRole('heading', { name: 'MCP' })).toBeInTheDocument();
  });

  it('marks only the active primary tab', async () => {
    const user = userEvent.setup();
    render(<App />);

    const home = screen.getByRole('button', { name: 'Home' });
    const review = screen.getByRole('button', { name: 'Review' });

    expect(home).toHaveAttribute('aria-pressed', 'true');
    expect(review).toHaveAttribute('aria-pressed', 'false');

    await user.click(review);
    expect(home).toHaveAttribute('aria-pressed', 'false');
    expect(review).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggles the root theme between dark and light', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const root = container.firstElementChild;

    expect(root).toHaveAttribute('data-theme', 'dark');
    await user.click(
      screen.getByRole('button', { name: 'Switch to light theme' }),
    );
    expect(root).toHaveAttribute('data-theme', 'light');
    expect(
      screen.getByRole('button', { name: 'Switch to dark theme' }),
    ).toBeInTheDocument();
  });

  it('opens the selected domain from a Home card', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Career' }));

    expect(screen.getByRole('heading', { name: 'Career' })).toBeInTheDocument();
    expect(screen.getByText('STUDY · WRITING BY FIELD')).toBeInTheDocument();
  });

  it("opens Finance from today's call to action", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole('button', { name: '▶ Record July asset snapshot' }),
    );

    expect(screen.getByRole('heading', { name: 'Finance' })).toBeInTheDocument();
  });

  it('switches domains from the domain navigation', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Career' }));
    expect(screen.getByRole('heading', { name: 'Career' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Life' }));
    expect(screen.getByRole('heading', { name: 'Life' })).toBeInTheDocument();
  });

  it('starts the weekly review from Home and switches it to monthly', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Start weekly review →' }));
    expect(
      screen.getByRole('heading', { name: 'Weekly review · Week 29' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'MONTHLY' }));
    expect(
      screen.getByRole('heading', { name: 'Monthly review · July 2026' }),
    ).toBeInTheDocument();
  });

  it('keeps the current week visible in the top bar', () => {
    render(<App />);

    expect(screen.getByText('WK 29 · JUL 13–19')).toBeInTheDocument();
  });
});
