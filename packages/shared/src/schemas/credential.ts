import { minLength, object, pipe, string } from 'valibot';

export const CredentialCreateSchema = object({
  name: pipe(string(), minLength(1, 'Name is required')),
  category: pipe(string(), minLength(1, 'Category is required')),
  data: pipe(string(), minLength(1, 'Credential data is required')),
});

export const CredentialUpdateSchema = object({
  id: pipe(string(), minLength(1, 'ID is required')),
  name: pipe(string(), minLength(1, 'Name is required')),
  category: pipe(string(), minLength(1, 'Category is required')),
  data: pipe(string(), minLength(1, 'Credential data is required')),
});

export const CredentialDeleteSchema = object({
  id: pipe(string(), minLength(1, 'ID is required')),
});
