import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { DomainId } from '../types.js';
import Domains from './Domains.js';

const renderDomains = (activeDomain: DomainId) => {
  const onDomainChange = vi.fn();
  render(<Domains activeDomain={activeDomain} onDomainChange={onDomainChange} />);
  return { onDomainChange, user: userEvent.setup() };
};

describe('Domains', () => {
  it('marks the active domain in the sub navigation and reports changes', async () => {
    const { user, onDomainChange } = renderDomains('finance');

    const nav = screen.getByRole('navigation', { name: 'Domains' });
    expect(nav).toBeInTheDocument();

    const finance = screen.getByRole('button', { name: 'Finance' });
    const life = screen.getByRole('button', { name: 'Life' });
    expect(finance).toHaveAttribute('aria-pressed', 'true');
    expect(life).toHaveAttribute('aria-pressed', 'false');

    await user.click(life);
    expect(onDomainChange).toHaveBeenCalledWith('life');
  });

  it('shows only the active domain panel', () => {
    renderDomains('finance');

    expect(screen.getByRole('heading', { name: 'Finance' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Career' })).not.toBeInTheDocument();
  });

  it('renders the Career study fields and publishing funnel', () => {
    renderDomains('career');

    expect(screen.getByText('overloaded')).toBeInTheDocument();
    expect(screen.getByText('STUDY · WRITING BY FIELD')).toBeInTheDocument();
    expect(screen.getByText('Cloud arch')).toBeInTheDocument();
    expect(screen.getByText('18 pg')).toBeInTheDocument();
    expect(screen.getByText('DRAFTED')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('▸ VPC design notes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish →' })).toBeInTheDocument();
  });

  it('renders the Finance stats, spending, composition and overdue action', () => {
    renderDomains('finance');

    expect(screen.getByText('NET WORTH')).toBeInTheDocument();
    expect(screen.getByText('₩ 84.2M')).toBeInTheDocument();
    expect(screen.getByText('last Jun 30')).toBeInTheDocument();
    expect(screen.getByText('₩820k')).toBeInTheDocument();
    expect(screen.getByText('Investments 46%')).toBeInTheDocument();
    expect(screen.getByText('Record July asset snapshot')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '▶ Record now' })).toBeInTheDocument();
  });

  it('renders every Personal Data asset group', () => {
    renderDomains('pdata');

    expect(screen.getByText('62% organized · 5 need attention')).toBeInTheDocument();
    for (const label of [
      '2025 Photos',
      '2024 Photos',
      '2024 Projects',
      'Paper / PDF',
      'Music',
      'Videos',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText('3,100 untagged', { exact: false })).toBeInTheDocument();
  });

  it('renders the Life timetable with its imbalance and protected block', () => {
    renderDomains('life');

    expect(screen.getByText('neglected')).toBeInTheDocument();

    const timetable = screen.getByLabelText('Weekly timetable');
    expect(timetable.querySelectorAll('[data-block]')).toHaveLength(21);
    expect(timetable.querySelectorAll('[data-block="protected"]')).toHaveLength(2);

    expect(screen.getByText('⚠ IMBALANCE')).toBeInTheDocument();
    expect(screen.getByText('Sat afternoon → exercise')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '▶ Protect block' })).toBeInTheDocument();
  });
});
