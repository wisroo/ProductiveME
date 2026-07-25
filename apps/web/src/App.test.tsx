import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App.js';

describe('App shell', () => {
  it('renders Home by default and switches primary views', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Today, at a glance' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Review' }));
    expect(
      screen.getByRole('heading', { name: 'Review your trajectory' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'MCP' }));
    expect(
      screen.getByRole('heading', { name: 'MCP connections' }),
    ).toBeInTheDocument();
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
});
