import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Home from './Home.js';

const renderHome = () => {
  const props = {
    onDomainSelect: vi.fn(),
    onOpenDomains: vi.fn(),
    onStartReview: vi.fn(),
  };
  render(<Home {...props} />);
  return { ...props, user: userEvent.setup() };
};

describe('Home', () => {
  it("leads with this week's headline and today's briefing", () => {
    renderHome();

    expect(
      screen.getByRole('heading', { name: /close the July finance snapshot/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('TODAY · THU JUL 17')).toBeInTheDocument();
    expect(screen.getByText('2 days overdue')).toBeInTheDocument();
  });

  it('shows a status card per domain with its progress', () => {
    renderHome();

    expect(screen.getByRole('button', { name: 'Career' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finance' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Personal Data' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Life' })).toBeInTheDocument();

    expect(screen.getByText('snapshot missing')).toBeInTheDocument();
    expect(screen.getByText('NEGLECTED')).toBeInTheDocument();
  });

  it('opens the clicked domain', async () => {
    const { user, onDomainSelect } = renderHome();

    await user.click(screen.getByRole('button', { name: 'Personal Data' }));

    expect(onDomainSelect).toHaveBeenCalledWith('pdata');
  });

  it("sends today's call to action into the domain views", async () => {
    const { user, onOpenDomains } = renderHome();

    await user.click(
      screen.getByRole('button', { name: '▶ Record July asset snapshot' }),
    );

    expect(onOpenDomains).toHaveBeenCalledTimes(1);
  });

  it('starts the weekly review from the source-gates row', async () => {
    const { user, onStartReview } = renderHome();

    await user.click(screen.getByRole('button', { name: 'Start weekly review →' }));

    expect(onStartReview).toHaveBeenCalledTimes(1);
  });

  it('ranks the next actions and recaps past, now and next', () => {
    renderHome();

    expect(screen.getByText('1 · Record July snapshot')).toBeInTheDocument();
    expect(screen.getByText('2 · Protect Sat exercise')).toBeInTheDocument();
    expect(screen.getByText('3 · Prep cloud cert outline')).toBeInTheDocument();

    expect(screen.getByText('◂ PAST · WHAT CHANGED')).toBeInTheDocument();
    expect(screen.getByText("● NOW · TODAY'S ISSUE")).toBeInTheDocument();
    expect(screen.getByText('▸ NEXT · MOVES')).toBeInTheDocument();
    expect(screen.getByText('✕ Notion connector down')).toBeInTheDocument();
  });
});
