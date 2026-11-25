import type { FastifyInstance } from 'fastify';
import { DOMAIN_IDS, type DomainId, type RegistryEntry } from '@productiveme/core';

export const WEEKLY_TASK_CAPS: Record<DomainId, number> = {
  career: 3, finance: 2, 'personal-data': 2, life: 3,
};

type Health = { id: string; status: string; lastGoodReadAt: string | null };
type Task = { id: string; domain: DomainId; text: string; done: boolean; kind?: 'snapshot' | 'publish' };
type Status = 'blocked' | 'overloaded' | 'neglected' | 'attention' | 'on-track';

export function weeklyStatuses(entries: RegistryEntry[], health: Health[], tasks: Task[]) {
  const byId = new Map(health.map((state) => [state.id, state]));
  return DOMAIN_IDS.map((domain) => {
    const sources = entries.filter((source) => source.domain === domain);
    const blocked = sources.find((source) => byId.get(source.id)?.status === 'down');
    const domainTasks = tasks.filter((task) => task.domain === domain);
    const total = domainTasks.length;
    const cap = WEEKLY_TASK_CAPS[domain];
    const done = domainTasks.filter((task) => task.done).length;
    const open = total - done;
    const next = domainTasks.find((task) => !task.done);
    let status: Status = 'on-track';
    let reason = `${done} of ${total} done this week.`;

    if (blocked) {
      status = 'blocked';
      reason = `${blocked.name} (${blocked.kind}) is down, so numbers may be stale.`;
    } else if (total > cap) {
      status = 'overloaded';
      reason = `${total} tasks this week against a cap of ${cap}.`;
    } else if (total && !done) {
      status = 'neglected';
    } else if (open > done) {
      status = 'attention';
      reason = `${done} of ${total} done · ${open} still open.`;
    }
    return {
      domain, status, reason, total, cap, done, open,
      next: next ? { id: next.id, text: next.text, ...(next.kind ? { kind: next.kind } : {}) } : null,
      sourceIds: sources.map(({ id }) => id),
    };
  });
}

const statusSchema = {
  type: 'object', required: ['domain', 'status', 'reason', 'total', 'cap', 'done', 'open', 'next', 'sourceIds'],
  properties: {
    domain: { type: 'string', enum: DOMAIN_IDS },
    status: { type: 'string', enum: ['blocked', 'overloaded', 'neglected', 'attention', 'on-track'] },
    reason: { type: 'string' },
    total: { type: 'integer' }, cap: { type: 'integer' }, done: { type: 'integer' }, open: { type: 'integer' },
    next: { anyOf: [{ type: 'null' }, { type: 'object', required: ['id', 'text'], properties: {
      id: { type: 'string' }, text: { type: 'string' }, kind: { type: 'string', enum: ['snapshot', 'publish'] },
    } }] },
    sourceIds: { type: 'array', items: { type: 'string' } },
  },
} as const;
const weekQuery = { type: 'object', required: ['week'], properties: { week: { type: 'string', format: 'date' } } } as const;
const inputError = { type: 'object', required: ['code', 'message'], properties: { code: { type: 'string' }, message: { type: 'string' } } } as const;
const sourceAlertSchema = {
  type: 'object', required: ['id', 'name', 'lastGoodReadAt'],
  properties: { id: { type: 'string' }, name: { type: 'string' }, lastGoodReadAt: { type: ['string', 'null'], format: 'date-time' } },
} as const;
type Weekly = { Querystring: { week: string } };

export function registerWeeklyStatusRoutes(app: FastifyInstance, read: (week: string) => Promise<{
  entries: RegistryEntry[]; health: Health[]; tasks: Task[];
}>) {
  const valid = (week: string) => new Date(`${week}T00:00:00Z`).getUTCDay() === 1;
  const error = { code: 'INVALID_WEEK', message: 'Week must start on a Monday.' };
  app.get<Weekly>('/home', {
    schema: { querystring: weekQuery, response: { 200: {
      type: 'object', required: ['domains', 'sourceAlerts'],
      properties: {
        domains: { type: 'array', items: statusSchema },
        sourceAlerts: { type: 'array', items: sourceAlertSchema },
      },
    }, 400: inputError } },
  }, async ({ query }, reply) => {
    if (!valid(query.week)) return reply.code(400).send(error);
    const { entries, health, tasks } = await read(query.week);
    const sourceAlerts = health.filter(({ status }) => status === 'down').flatMap(({ id, lastGoodReadAt }) => {
      const source = entries.find((entry) => entry.id === id);
      return source ? [{ id, name: source.name, lastGoodReadAt }] : [];
    });
    return { domains: weeklyStatuses(entries, health, tasks), sourceAlerts };
  });
  app.get<Weekly & { Params: { id: DomainId } }>('/domains/:id', {
    schema: {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', enum: DOMAIN_IDS } } },
      querystring: weekQuery, response: { 200: statusSchema, 400: inputError },
    },
  }, async ({ params, query }, reply) => {
    if (!valid(query.week)) return reply.code(400).send(error);
    const { entries, health, tasks } = await read(query.week);
    return weeklyStatuses(entries, health, tasks).find(({ domain }) => params.id === domain);
  });
}
