import { minLength, object, string, pipe, InferOutput } from 'valibot';

export const UserLoginSchema = object({
  username: pipe(string(), minLength(3, 'Username must be at least 3 characters')),
  password: pipe(string(), minLength(8, 'Password must be at least 8 characters')),
});

export const UserRegisterSchema = object({
  username: pipe(string(), minLength(3, 'Username must be at least 3 characters')),
  password: pipe(string(), minLength(8, 'Password must be at least 8 characters')),
});

export type UserLogin = InferOutput<typeof UserLoginSchema>;
export type UserRegister = InferOutput<typeof UserRegisterSchema>;
