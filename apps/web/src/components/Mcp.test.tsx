import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Mcp from './Mcp.js';

describe('Mcp', () => {
  it('lists every connector with its connection state', () => {
    render(<Mcp />);

    expect(screen.getByRole('heading', { name: 'MCP' })).toBeInTheDocument();
    expect(screen.getByText('5 connected · 1 down')).toBeInTheDocument();

    const list = screen.getByRole('list', { name: 'MCP servers' });
    expect(list.querySelectorAll('li')).toHaveLength(5);

    expect(screen.getByText('Notion')).toBeInTheDocument();
    expect(screen.getByText('down · retry')).toBeInTheDocument();
    expect(screen.getByText('Local files')).toBeInTheDocument();
    expect(screen.getByText('idle')).toBeInTheDocument();
    expect(screen.getAllByText('connected')).toHaveLength(3);
  });

  it('offers the add-server affordance', () => {
    render(<Mcp />);

    expect(screen.getByText('+ add MCP server')).toBeInTheDocument();
  });
});
