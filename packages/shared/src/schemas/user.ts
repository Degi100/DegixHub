import { minLength, object, string } from 'valibot';

export const UserLoginSchema = object({
  username: string([minLength(3, 'Username must be at least 3 characters')]),
  password: string([minLength(8, 'Password must be at least 8 characters')]),
});

export const UserRegisterSchema = object({
  username: string([minLength(3, 'Username must be at least 3 characters')]),
  password: string([minLength(8, 'Password must be at least 8 characters')]),
});

export type UserLogin = typeof UserLoginSchema._output;
export type UserRegister = typeof UserRegisterSchema._output;
