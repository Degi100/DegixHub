import { array, minLength, object, optional, pipe, string } from 'valibot';

export const TagCreateSchema = object({
  name: pipe(string(), minLength(1, 'Name is required')),
  color: pipe(string(), minLength(1, 'Color is required')),
});

export const TagUpdateSchema = object({
  id: pipe(string(), minLength(1, 'ID is required')),
  name: pipe(string(), minLength(1, 'Name is required')),
  color: pipe(string(), minLength(1, 'Color is required')),
});

export const TagDeleteSchema = object({
  id: pipe(string(), minLength(1, 'ID is required')),
});

export const TagAssignSchema = object({
  tagId: pipe(string(), minLength(1, 'Tag ID is required')),
  linkId: optional(pipe(string(), minLength(1))),
  credentialId: optional(pipe(string(), minLength(1))),
});

export const TagUnassignSchema = object({
  tagId: pipe(string(), minLength(1, 'Tag ID is required')),
  linkId: optional(pipe(string(), minLength(1))),
  credentialId: optional(pipe(string(), minLength(1))),
});
