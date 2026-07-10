import { parse } from 'yaml';
import { z } from 'zod';
import { CADENCES, DOMAIN_IDS, type RegistryEntry } from './types.js';

export class RegistryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegistryValidationError';
  }
}

const entrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['repo', 'notion-page', 'folder', 'tool', 'project']),
  domain: z.enum(DOMAIN_IDS),
  subdomain: z.string().min(1).optional(),
  locator: z.string().min(1),
  connector: z.string().min(1),
  cadence: z.enum(CADENCES).optional(),
});

const registrySchema = z
  .object({ entries: z.array(entrySchema) })
  .superRefine((registry, ctx) => {
    const seen = new Set<string>();
    registry.entries.forEach((entry, index) => {
      if (seen.has(entry.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['entries', index, 'id'],
          message: `duplicate entry id "${entry.id}"`,
        });
      }
      seen.add(entry.id);
    });
  });

export function parseRegistry(yamlText: string): RegistryEntry[] {
  const data: unknown = parse(yamlText);
  const result = registrySchema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new RegistryValidationError(`invalid registry: ${details}`);
  }
  return result.data.entries;
}
