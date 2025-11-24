import { object, string, pipe, minLength, optional, InferOutput } from 'valibot';

export const ActivityLogQuerySchema = object({
  limit: optional(pipe(string(), minLength(1))),
  offset: optional(pipe(string(), minLength(1))),
  resourceType: optional(pipe(string(), minLength(1))),
});

export type ActivityLogQuery = InferOutput<typeof ActivityLogQuerySchema>;
