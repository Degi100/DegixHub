import { array, minLength, object, optional, pipe, string, url } from 'valibot';

export const LinkCreateSchema = object({
  name: pipe(string(), minLength(1, 'Name is required')),
  url: pipe(string(), url('Must be a valid URL')),
  category: pipe(string(), minLength(1, 'Category is required')),
  description: optional(string()),
  favicon: optional(string()),
  tagIds: optional(array(string())),
});

export const LinkUpdateSchema = object({
  id: pipe(string(), minLength(1, 'ID is required')),
  name: pipe(string(), minLength(1, 'Name is required')),
  url: pipe(string(), url('Must be a valid URL')),
  category: pipe(string(), minLength(1, 'Category is required')),
  description: optional(string()),
  favicon: optional(string()),
  tagIds: optional(array(string())),
});

export const LinkDeleteSchema = object({
  id: pipe(string(), minLength(1, 'ID is required')),
});

// Schema for exported link data
export const LinkSchema = object({
  id: optional(string()),
  title: string(),
  url: string(),
  description: optional(string()),
  category: optional(string()),
  favicon: optional(string()),
  tags: optional(array(string())),
  createdAt: optional(string()),
});
