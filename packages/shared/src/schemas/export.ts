import { object, string, array, optional, type InferOutput } from 'valibot';
import { LinkSchema } from './link.js';
import { CredentialSchema } from './credential.js';
import { TagSchema } from './tag.js';

export const ExportDataSchema = object({
  version: string(),
  exportedAt: string(),
  data: object({
    links: array(LinkSchema),
    credentials: array(CredentialSchema),
    tags: array(TagSchema),
  }),
  metadata: optional(object({
    encrypted: optional(string()),
  })),
});

export const ImportDataSchema = ExportDataSchema;

export type ExportData = InferOutput<typeof ExportDataSchema>;
export type ImportData = InferOutput<typeof ImportDataSchema>;
