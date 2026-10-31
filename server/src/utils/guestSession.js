import crypto from 'node:crypto';

export const GUEST_COOKIE_NAME = 'codeassess_guest_id';

export function resolveGuestId(req, res) {
  const headerGuestId = req.headers['x-guest-session-id'];
  const cookieGuestId = req.cookies?.[GUEST_COOKIE_NAME];

  const existing = headerGuestId || cookieGuestId;
  if (existing && typeof existing === 'string' && /^[a-zA-Z0-9_-]{16,80}$/.test(existing)) {
    return existing;
  }

  const freshId = `guest_${crypto.randomBytes(16).toString('hex')}`;
  if (res && typeof res.cookie === 'function') {
    res.cookie(GUEST_COOKIE_NAME, freshId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }
  return freshId;
}
