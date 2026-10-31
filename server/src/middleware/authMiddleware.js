import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env.js';
import { repository } from '../services/repositoryService.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const AUTH_COOKIE_NAME = 'codeassess_token';

export function signAuthToken(userId) {
  const env = getEnv();
  return jwt.sign({ sub: String(userId) }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function extractToken(req) {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const env = getEnv();
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await repository.findUserById(decoded.sub);
    req.user = user || null;
  } catch {
    req.user = null;
  }
  return next();
});

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) {
    throw new AppError(
      'Authentication required. Please log in to access this resource.',
      401,
      'UNAUTHORIZED'
    );
  }

  let decoded;
  try {
    const env = getEnv();
    decoded = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new AppError(
      'Your session is invalid or has expired. Please log in again.',
      401,
      'INVALID_TOKEN'
    );
  }

  const user = await repository.findUserById(decoded.sub);
  if (!user) {
    throw new AppError(
      'Authenticated user account could not be found.',
      401,
      'USER_NOT_FOUND'
    );
  }

  req.user = user;
  return next();
});
