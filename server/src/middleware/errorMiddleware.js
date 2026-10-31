import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, _res, next) {
  next(
    new AppError(
      `API endpoint not found: ${req.method} ${req.originalUrl}`,
      404,
      'ROUTE_NOT_FOUND'
    )
  );
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  if (err?.name === 'ValidationError') {
    const details = {};
    Object.keys(err.errors || {}).forEach((field) => {
      details[field] = err.errors[field].message;
    });
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request data failed validation.',
        details,
      },
    });
  }

  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed JSON request body.',
      },
    });
  }

  // Log unexpected errors server-side without exposing internal stack traces to clients
  if (process.env.NODE_ENV !== 'test') {
    console.error('[Server Error]', err?.message || err);
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        'An unexpected server error occurred while processing the request. Please try again.',
    },
  });
}
