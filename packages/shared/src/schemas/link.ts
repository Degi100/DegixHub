import { minLength, object, optional, pipe, string, url } from 'valibot';

export const LinkCreateSchema = object({
  name: pipe(string(), minLength(1, 'Name is required')),
  url: pipe(string(), url('Must be a valid URL')),
  category: pipe(string(), minLength(1, 'Category is required')),
  description: optional(string()),
});

export const LinkUpdateSchema = object({
  id: pipe(string(), minLength(1, 'ID is required')),
  name: pipe(string(), minLength(1, 'Name is required')),
  url: pipe(string(), url('Must be a valid URL')),
  category: pipe(string(), minLength(1, 'Category is required')),
  description: optional(string()),
});

export const LinkDeleteSchema = object({
  id: pipe(string(), minLength(1, 'ID is required')),
});
