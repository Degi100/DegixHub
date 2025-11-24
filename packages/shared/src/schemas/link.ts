import { minLength, object, optional, string, url } from 'valibot';

export const LinkSchema = object({
  name: string([minLength(1, 'Name is required')]),
  url: string([url('Must be a valid URL')]),
  category: string([minLength(1, 'Category is required')]),
  description: optional(string()),
});

export type Link = typeof LinkSchema._output;
