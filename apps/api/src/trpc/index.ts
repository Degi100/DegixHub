import { initTRPC, TRPCError } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { lucia } from '../auth/lucia';
import type { User, Session } from 'lucia';

// Context type
export interface Context {
  user: User | null;
  session: Session | null;
}

// Create context from request
export async function createContext(opts: FetchCreateContextFnOptions) {
  const sessionId = lucia.readSessionCookie(opts.req.headers.get('Cookie') ?? '');

  if (!sessionId) {
    return { user: null, session: null };
  }

  const { session, user } = await lucia.validateSession(sessionId);
  return { user, session };
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user || !ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      user: ctx.user,
      session: ctx.session,
    },
  });
});
