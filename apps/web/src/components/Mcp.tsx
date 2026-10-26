import { mcp, mcpServers } from '../data/mock.js';
import type { McpStatus } from '../types.js';
import { DomainHeading, fill, ink } from './bits.js';

const statusTone: Readonly<Record<McpStatus, 'done' | 'blocked' | 'parked'>> = {
  connected: 'done',
  down: 'blocked',
  idle: 'parked',
};

export default function Mcp() {
  return (
    <div
      style={{
        padding: '28px 30px',
        maxWidth: '640px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="mono" style={{ fontSize: '9px', letterSpacing: '.12em', color: 'var(--muted)', marginBottom: '8px' }}>PROTOTYPE · illustrative server status</div>
      <DomainHeading title="MCP" scope={mcp.summary} />
      <ul
        aria-label="MCP servers"
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          border: '1px solid var(--line)',
          borderRadius: 'var(--r2)',
          overflow: 'hidden',
        }}
      >
        {mcpServers.map((server, index) => (
          <li
            key={server.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '13px 16px',
              borderBottom:
                index === mcpServers.length - 1 ? undefined : '1px solid var(--line)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: fill(statusTone[server.status]),
              }}
            />
            <b style={{ flex: 1, fontSize: '14px' }}>{server.name}</b>
            <span
              className="mono"
              style={{ fontSize: '10px', color: ink(statusTone[server.status]) }}
            >
              {server.detail}
            </span>
          </li>
        ))}
      </ul>
      <div
        className="mono"
        style={{
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--muted)',
          padding: '13px',
          border: '1px dashed var(--line-2)',
          borderRadius: 'var(--r)',
          marginTop: '12px',
          cursor: 'pointer',
        }}
      >
        {mcp.add}
      </div>
    </div>
  );
}
