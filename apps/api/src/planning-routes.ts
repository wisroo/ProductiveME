import type { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';

const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const categories = ['sleep', 'career', 'rest', 'church', 'exercise', 'games', 'meal', 'other'] as const;
const protectIds = ['sat', 'sun', 'wed', 'fri'] as const;
type Day = typeof days[number];
type Protection = typeof protectIds[number];
type Category = typeof categories[number];
type SlotPlan = { cat: Category; title: string; note?: string; taskId?: string; protect?: Protection };
type Actual = { cat: Category; title: string; note?: string; status: 'asplan' | 'changed' | 'skipped' };
type Slot = { plan?: SlotPlan; act?: Actual };
type WeekData = Partial<Record<Day, Partial<Record<number, Slot>>>>;
type WeekParams = { week: string };
type SlotParams = WeekParams & { day: Day; block: number };
type PlanPatch = { focus?: string; locked?: boolean; protect?: Partial<Record<Protection, boolean>> };

const protections: Record<Protection, { block: number; cat: Category; title: string }> = {
  sat: { block: 4, cat: 'exercise', title: 'Exercise' },
  sun: { block: 5, cat: 'church', title: 'Church' },
  wed: { block: 9, cat: 'rest', title: 'Rest evening' },
  fri: { block: 9, cat: 'games', title: 'Friends' },
};
const week = { type: 'string', format: 'date' } as const;
const string = { type: 'string', minLength: 1, maxLength: 500 } as const;
const bool = { type: 'boolean' } as const;
const weekParams = { type: 'object', required: ['week'], properties: { week } } as const;
const slotParams = {
  type: 'object', required: ['week', 'day', 'block'],
  properties: { week, day: { type: 'string', enum: days }, block: { type: 'integer', minimum: 0, maximum: 11 } },
} as const;
const protect = {
  type: 'object', properties: { sat: bool, sun: bool, wed: bool, fri: bool }, additionalProperties: false,
} as const;
const planFields = { focus: { type: 'string', maxLength: 500 }, locked: bool, protect } as const;
const blockFields = { cat: { type: 'string', enum: categories }, title: string, note: { type: 'string', maxLength: 4000 } } as const;
const slotPlan = {
  type: 'object', required: ['cat', 'title'], additionalProperties: false,
  properties: { ...blockFields, taskId: { type: 'string', format: 'uuid' } },
} as const;
const slotActual = {
  type: 'object', required: ['cat', 'title', 'status'], additionalProperties: false,
  properties: { ...blockFields, status: { type: 'string', enum: ['asplan', 'changed', 'skipped'] } },
} as const;
const cellSchema = { type: 'object', properties: {
  plan: { ...slotPlan, properties: { ...slotPlan.properties, protect: { type: 'string', enum: protectIds } } },
  act: slotActual,
} } as const;
const problem = { type: 'object', required: ['code', 'message'], properties: { code: { type: 'string' }, message: { type: 'string' } } } as const;
const problemBody = (code: string, message: string) => ({ code, message });
const invalidWeek = () => problemBody('INVALID_WEEK', 'Week must start on a Monday.');
const isMonday = (value: string) => new Date(`${value}T00:00:00Z`).getUTCDay() === 1;

export function registerPlanningRoutes(app: FastifyInstance, db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS week_plans (week TEXT PRIMARY KEY, focus TEXT NOT NULL, locked INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS life_slots (
      week TEXT NOT NULL, day TEXT NOT NULL, block INTEGER NOT NULL,
      plan TEXT, act TEXT, task_id TEXT,
      PRIMARY KEY (week, day, block), UNIQUE (week, task_id)
    );
    CREATE TABLE IF NOT EXISTS detached_task_slots (
      task_id TEXT PRIMARY KEY, week TEXT NOT NULL, day TEXT NOT NULL, block INTEGER NOT NULL,
      plan_without_task TEXT NOT NULL
    );
  `);

  const readSlot = ({ week, day, block }: SlotParams): Slot => {
    const row = db.prepare('SELECT plan, act FROM life_slots WHERE week = ? AND day = ? AND block = ?').get(week, day, block);
    return {
      ...(row?.plan ? { plan: JSON.parse(String(row.plan)) as SlotPlan } : {}),
      ...(row?.act ? { act: JSON.parse(String(row.act)) as Actual } : {}),
    };
  };
  const readLife = (week: string): WeekData => {
    const data: WeekData = {};
    const rows = db.prepare('SELECT day, block, plan, act FROM life_slots WHERE week = ? ORDER BY block').all(week);
    for (const row of rows) {
      if (!row.plan && !row.act) continue;
      const day = row.day as Day;
      const date = data[day] ??= {};
      date[Number(row.block)] = {
        ...(row.plan ? { plan: JSON.parse(String(row.plan)) as SlotPlan } : {}),
        ...(row.act ? { act: JSON.parse(String(row.act)) as Actual } : {}),
      };
    }
    return data;
  };
  const writePlan = ({ week, day, block }: SlotParams, plan: SlotPlan | null) => {
    db.prepare(`INSERT INTO life_slots (week, day, block, plan, task_id) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(week, day, block) DO UPDATE SET plan = excluded.plan, task_id = excluded.task_id`)
      .run(week, day, block, plan ? JSON.stringify(plan) : null, plan?.taskId ?? null);
  };
  const readPlan = (week: string) => {
    const row = db.prepare('SELECT focus, locked FROM week_plans WHERE week = ?').get(week);
    const flags: Partial<Record<Protection, boolean>> = {};
    for (const day of protectIds) if (readSlot({ week, day, block: protections[day].block }).plan?.protect === day) flags[day] = true;
    return { week, focus: String(row?.focus ?? ''), locked: Boolean(row?.locked), protect: flags };
  };

  const planSchema = { type: 'object', required: ['week', 'focus', 'locked', 'protect'], properties: { week, ...planFields } } as const;
  app.get<{ Params: WeekParams }>('/weeks/:week/plan', {
    schema: { params: weekParams, response: { 200: planSchema, 400: problem } },
  }, ({ params }, reply) => isMonday(params.week) ? readPlan(params.week) : reply.code(400).send(invalidWeek()));

  app.put<{ Params: WeekParams; Body: PlanPatch }>('/weeks/:week/plan', {
    schema: {
      params: weekParams, body: { type: 'object', properties: planFields, additionalProperties: false },
      response: { 200: planSchema, 400: problem, 409: problem },
    },
  }, ({ params, body }, reply) => {
    const { week } = params;
    if (!isMonday(week)) return reply.code(400).send(invalidWeek());
    db.exec('BEGIN IMMEDIATE');
    try {
      const previous = readPlan(week);
      for (const day of protectIds) {
        if (body.protect?.[day] === undefined) continue;
        const { block, cat, title } = protections[day];
        const target = { week, day, block };
        const existing = readSlot(target).plan;
        if (body.protect[day] && existing && existing.protect !== day) {
          db.exec('ROLLBACK');
          return reply.code(409).send(problemBody('PROTECTED_SLOT_OCCUPIED', 'That protected time overlaps an existing plan.'));
        }
        if (body.protect[day] && !existing) writePlan(target, { cat, title, protect: day });
        if (!body.protect[day] && existing?.protect === day) writePlan(target, null);
      }
      db.prepare(`INSERT INTO week_plans (week, focus, locked) VALUES (?, ?, ?)
        ON CONFLICT(week) DO UPDATE SET focus = excluded.focus, locked = excluded.locked`)
        .run(week, body.focus ?? previous.focus, Number(body.locked ?? previous.locked));
      const result = readPlan(week);
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  });

  app.get<{ Params: WeekParams }>('/weeks/:week/life', {
    schema: { params: weekParams, response: { 200: { type: 'object', additionalProperties: { type: 'object', additionalProperties: cellSchema } }, 400: problem } },
  }, ({ params }, reply) => isMonday(params.week) ? readLife(params.week) : reply.code(400).send(invalidWeek()));

  app.put<{ Params: SlotParams; Body: { value: Omit<SlotPlan, 'protect'> | null } }>('/weeks/:week/life/:day/:block/plan', {
    schema: { params: slotParams, body: { type: 'object', required: ['value'], properties: { value: { anyOf: [slotPlan, { type: 'null' }] } } }, response: { 200: cellSchema, 400: problem, 409: problem } },
  }, ({ params, body }, reply) => {
    if (!isMonday(params.week)) return reply.code(400).send(invalidWeek());
    const value = body.value;
    if (value && !value.title.trim()) return reply.code(400).send(problemBody('INVALID_SLOT', 'A plan needs a title.'));
    db.exec('BEGIN IMMEDIATE');
    try {
      if (value?.taskId) {
        const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND week = ? AND deleted = 0').get(value.taskId, params.week);
        const assigned = db.prepare('SELECT day, block FROM life_slots WHERE week = ? AND task_id = ?').get(params.week, value.taskId);
        if (!task || (assigned && (assigned.day !== params.day || assigned.block !== params.block))) {
          db.exec('ROLLBACK');
          return reply.code(409).send(problemBody('TASK_SLOT_CONFLICT', 'The task is unavailable or assigned to another slot.'));
        }
      }
      writePlan(params, value);
      const result = readSlot(params);
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  });

  app.put<{ Params: SlotParams; Body: { value: Actual | null } }>('/weeks/:week/life/:day/:block/act', {
    schema: { params: slotParams, body: { type: 'object', required: ['value'], properties: { value: { anyOf: [slotActual, { type: 'null' }] } } }, response: { 200: cellSchema, 400: problem } },
  }, ({ params, body }, reply) => {
    if (!isMonday(params.week)) return reply.code(400).send(invalidWeek());
    if (body.value && !body.value.title.trim()) return reply.code(400).send(problemBody('INVALID_SLOT', 'A record needs a title.'));
    db.prepare(`INSERT INTO life_slots (week, day, block, act) VALUES (?, ?, ?, ?)
      ON CONFLICT(week, day, block) DO UPDATE SET act = excluded.act`)
      .run(params.week, params.day, params.block, body.value ? JSON.stringify(body.value) : null);
    return readSlot(params);
  });

  return {
    detachTask(id: string, remember: boolean) {
      const row = db.prepare('SELECT week, day, block, plan FROM life_slots WHERE task_id = ?').get(id);
      if (!row?.plan) return;
      const plan = JSON.parse(String(row.plan)) as SlotPlan;
      delete plan.taskId;
      const target = { week: String(row.week), day: row.day as Day, block: Number(row.block) };
      writePlan(target, plan);
      if (remember) db.prepare('INSERT OR REPLACE INTO detached_task_slots VALUES (?, ?, ?, ?, ?)')
        .run(id, target.week, target.day, target.block, JSON.stringify(plan));
    },
    restoreTask(id: string) {
      const row = db.prepare('SELECT * FROM detached_task_slots WHERE task_id = ?').get(id);
      if (!row) return;
      const target = { week: String(row.week), day: row.day as Day, block: Number(row.block) };
      const slot = readSlot(target);
      if (slot.plan && JSON.stringify(slot.plan) === row.plan_without_task) writePlan(target, { ...slot.plan, taskId: id });
      db.prepare('DELETE FROM detached_task_slots WHERE task_id = ?').run(id);
    },
  };
}
