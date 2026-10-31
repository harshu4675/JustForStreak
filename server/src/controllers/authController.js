import bcrypt from 'bcryptjs';
import { getEnv } from '../config/env.js';
import { repository } from '../services/repositoryService.js';
import { AUTH_COOKIE_NAME, signAuthToken } from '../middleware/authMiddleware.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const SALT_ROUNDS = 12;

function attachAuthCookie(res, token) {
  const env = getEnv();
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.validatedBody;

  const existing = await repository.findUserByEmail(email);
  if (existing) {
    throw new AppError(
      'An account with this email address already exists.',
      409,
      'EMAIL_EXISTS'
    );
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await repository.createUser({ name, email, passwordHash });
  const token = signAuthToken(user.id);
  attachAuthCookie(res, token);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validatedBody;

  const user = await repository.findUserByEmail(email, { includePasswordHash: true });
  if (!user || !user.passwordHash) {
    throw new AppError(
      'Invalid email address or password.',
      401,
      'INVALID_CREDENTIALS'
    );
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw new AppError(
      'Invalid email address or password.',
      401,
      'INVALID_CREDENTIALS'
    );
  }

  const token = signAuthToken(user.id);
  attachAuthCookie(res, token);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    },
  });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });

  res.status(200).json({
    success: true,
    data: {
      message: 'Logged out successfully.',
    },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt,
      },
    },
  });
});
