import { minLength, object, optional, string } from 'valibot';

export const CredentialSchema = object({
  name: string([minLength(1, 'Name is required')]),
  category: string([minLength(1, 'Category is required')]),
  username: optional(string()),
  password: optional(string()),
  notes: optional(string()),
});

export type Credential = typeof CredentialSchema._output;
