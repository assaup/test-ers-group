import { loginSchema, registerSchema } from '@test-ers/shared';
import { Router, type CookieOptions, type RequestHandler, type Response } from 'express';
import { SESSION_COOKIE } from '../../lib/session-token';
import { getAuthUser, readSessionToken } from '../../middleware/require-auth';
import { parseInput } from '../../middleware/validate';
import type { AuthResult, AuthService } from './auth.service';

interface AuthRouterDeps {
  authService: AuthService;
  requireAuth: RequestHandler;
  rateLimit: RequestHandler;
  sessionTtlSeconds: number;
  secureCookies: boolean;
}

export function createAuthRouter(deps: AuthRouterDeps) {
  const { authService, requireAuth, rateLimit } = deps;
  const router = Router();

  const cookieOptions: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: deps.secureCookies,
    path: '/',
  };

  function sendSession(res: Response, status: number, { user, token }: AuthResult) {
    res
      .cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: deps.sessionTtlSeconds * 1000 })
      .status(status)
      .json({ user });
  }

  router.post('/register', rateLimit, async (req, res) => {
    const input = parseInput(registerSchema, req.body);
    sendSession(res, 201, await authService.register(input));
  });

  router.post('/login', rateLimit, async (req, res) => {
    const input = parseInput(loginSchema, req.body);
    sendSession(res, 200, await authService.login(input));
  });

  router.post('/logout', requireAuth, (req, res) => {
    const token = readSessionToken(req);
    if (token) authService.logout(token);
    res.clearCookie(SESSION_COOKIE, cookieOptions).status(204).end();
  });

  router.get('/me', requireAuth, (req, res) => {
    res.json({ user: getAuthUser(req) });
  });

  return router;
}
