import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { DOMAIN_IDS, type DomainId } from '@productiveme/core';
import type { FastifyInstance } from 'fastify';
import { WEEKLY_TASK_CAPS as caps } from './weekly-status.js';

const dateSchema = { type: 'string', format: 'date' } as const;
const domainSchema = { type: 'string', enum: DOMAIN_IDS } as const;
const textSchema = { type: 'string', minLength: 1, maxLength: 500 } as const;
const kindSchema = { type: 'string', enum: ['snapshot', 'publish'] } as const;
const taskFields = { week: dateSchema, date: dateSchema, domain: domainSchema, text: textSchema, kind: kindSchema } as const;
const mutableFields = { ...taskFields, done: { type: 'boolean' }, note: { type: 'string', maxLength: 4000 } } as const;
const taskSchema = {
  type: 'object',
  required: ['id', 'week', 'domain', 'text', 'done'],
  properties: { id: { type: 'string' }, ...mutableFields },
} as const;
const errors = {
  type: 'object', required: ['code', 'message'],
  properties: { code: { type: 'string' }, message: { type: 'string' } },
} as const;
const idParams = { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } } as const;
const forceQuery = { type: 'object', properties: { force: { type: 'string', enum: ['1'] } } } as const;

type TaskInput = { week: string; domain: DomainId; text: string; date?: string; kind?: 'snapshot' | 'publish' };
type Task = TaskInput & { id: string; done: boolean; note?: string };
type TaskPatch = Partial<Omit<Task, 'id' | 'date'>> & { date?: string | null };
type WithId = { Params: { id: string } };
type WithForce = { Querystring: { force?: '1' } };

function validSchedule(week: string, date?: string): boolean {
  const start = new Date(`${week}T00:00:00Z`);
  if (!Number.isFinite(start.valueOf()) || start.getUTCDay() !== 1) return false;
  if (!date) return true;
  const offset = (Date.parse(`${date}T00:00:00Z`) - start.valueOf()) / 86_400_000;
  return Number.isInteger(offset) && offset >= 0 && offset < 7;
}

function fail(code: string, message: string) {
  return { code, message };
}

export function registerTaskRoutes(app: FastifyInstance, db: DatabaseSync, assignments: {
  detachTask(id: string, remember: boolean): void;
  restoreTask(id: string): void;
}) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY, week TEXT NOT NULL, domain TEXT NOT NULL,
      payload TEXT NOT NULL, deleted INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS tasks_week_domain ON tasks(week, domain, deleted);
  `);

  const list = (week: string, domain?: DomainId): Task[] => {
    const rows = domain
      ? db.prepare('SELECT payload FROM tasks WHERE deleted = 0 AND week = ? AND domain = ? ORDER BY rowid').all(week, domain)
      : db.prepare('SELECT payload FROM tasks WHERE deleted = 0 AND week = ? ORDER BY rowid').all(week);
    return rows.map((row) => JSON.parse(String(row.payload)) as Task);
  };
  const find = (id: string, deleted = 0): Task | undefined => {
    const row = db.prepare('SELECT payload FROM tasks WHERE id = ? AND deleted = ?').get(id, deleted);
    return row ? JSON.parse(String(row.payload)) as Task : undefined;
  };
  const insert = (input: TaskInput & { note?: string }): Task => {
    const task = { ...input, id: randomUUID(), done: false };
    db.prepare('INSERT INTO tasks (id, week, domain, payload) VALUES (?, ?, ?, ?)').run(task.id, task.week, task.domain, JSON.stringify(task));
    return task;
  };
  const transaction = <T>(action: () => T): T => {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = action();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  };

  app.get<{ Querystring: { week: string; domain?: DomainId } }>('/tasks', {
    schema: {
      querystring: { type: 'object', required: ['week'], properties: { week: dateSchema, domain: domainSchema } },
      response: { 200: { type: 'array', items: taskSchema }, 400: errors },
    },
  }, (request, reply) => {
    const { week, domain } = request.query;
    if (!validSchedule(week)) return reply.code(400).send(fail('INVALID_WEEK', 'Week must start on a Monday.'));
    return list(week, domain);
  });

  app.post<{ Body: TaskInput } & WithForce>('/tasks', {
    schema: {
      querystring: forceQuery,
      body: { type: 'object', required: ['week', 'domain', 'text'], properties: taskFields, additionalProperties: false },
      response: { 201: taskSchema, 400: errors, 409: errors },
    },
  }, (request, reply) => {
    const { week, domain, date } = request.body;
    const text = request.body.text.trim();
    if (!text || !validSchedule(week, date)) return reply.code(400).send(fail('INVALID_TASK', 'Enter a task and a date within its Monday-based week.'));
    return transaction(() => {
      if (!request.query.force && list(week, domain).length >= caps[domain]) {
        return reply.code(409).send(fail('CAP_EXCEEDED', 'The domain is at its weekly task cap.'));
      }
      return reply.code(201).send(insert({ ...request.body, text }));
    });
  });

  app.patch<WithId & WithForce & { Body: TaskPatch }>('/tasks/:id', {
    schema: {
      params: idParams, querystring: forceQuery,
      body: {
        type: 'object', minProperties: 1, additionalProperties: false,
        properties: { ...mutableFields, date: { anyOf: [dateSchema, { type: 'null' }] } },
      },
      response: { 200: taskSchema, 400: errors, 404: errors, 409: errors },
    },
  }, (request, reply) => transaction(() => {
    const existing = find(request.params.id);
    if (!existing) return reply.code(404).send(fail('TASK_NOT_FOUND', 'Task was not found.'));
    const { date, ...patch } = request.body;
    const updated = { ...existing, ...patch, text: patch.text?.trim() ?? existing.text };
    if (date === null || (date === undefined && updated.week !== existing.week)) delete updated.date;
    else if (date !== undefined) updated.date = date;
    if (!updated.text || !validSchedule(updated.week, updated.date)) return reply.code(400).send(fail('INVALID_TASK', 'Enter a task and a date within its Monday-based week.'));
    if (!request.query.force && (updated.week !== existing.week || updated.domain !== existing.domain)
      && list(updated.week, updated.domain).length >= caps[updated.domain]) {
      return reply.code(409).send(fail('CAP_EXCEEDED', 'The domain is at its weekly task cap.'));
    }
    if (updated.week !== existing.week) assignments.detachTask(updated.id, false);
    db.prepare('UPDATE tasks SET week = ?, domain = ?, payload = ? WHERE id = ?').run(updated.week, updated.domain, JSON.stringify(updated), updated.id);
    return updated;
  }));

  app.delete<WithId>('/tasks/:id', { schema: { params: idParams } }, (request, reply) => transaction(() => {
    assignments.detachTask(request.params.id, true);
    db.prepare('UPDATE tasks SET deleted = 1 WHERE id = ?').run(request.params.id);
    return reply.code(204).send();
  }));

  app.post<WithId>('/tasks/:id/restore', {
    schema: { params: idParams, response: { 200: taskSchema, 404: errors } },
  }, (request, reply) => transaction(() => {
    const task = find(request.params.id, 1) ?? find(request.params.id);
    if (!task) return reply.code(404).send(fail('TASK_NOT_FOUND', 'Task was not found.'));
    db.prepare('UPDATE tasks SET deleted = 0 WHERE id = ?').run(task.id);
    assignments.restoreTask(task.id);
    return task;
  }));

  app.post<WithId & WithForce & { Body: { toWeek: string } }>('/tasks/:id/carry', {
    schema: {
      params: idParams, querystring: forceQuery,
      body: { type: 'object', required: ['toWeek'], properties: { toWeek: dateSchema } },
      response: { 200: taskSchema, 201: taskSchema, 400: errors, 404: errors, 409: errors },
    },
  }, (request, reply) => transaction(() => {
    const task = find(request.params.id);
    if (!task) return reply.code(404).send(fail('TASK_NOT_FOUND', 'Task was not found.'));
    const week = request.body.toWeek;
    const after = (Date.parse(week) - Date.parse(task.week)) / 86_400_000;
    if (task.done || !validSchedule(week) || after !== 7) return reply.code(400).send(fail('INVALID_CARRY', 'Carry an unfinished task into the following week.'));
    const target = list(week, task.domain);
    const duplicate = target.find(({ text }) => text === task.text);
    if (duplicate) return duplicate;
    if (!request.query.force && target.length >= caps[task.domain]) return reply.code(409).send(fail('CAP_EXCEEDED', 'The domain is at its weekly task cap.'));
    return reply.code(201).send(insert({
      week, domain: task.domain, text: task.text,
      ...(task.kind ? { kind: task.kind } : {}),
      ...(task.note ? { note: task.note } : {}),
    }));
  }));
  return { list };
}
