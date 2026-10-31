export function validateBody(validatorFn) {
  return function bodyValidationMiddleware(req, _res, next) {
    try {
      req.validatedBody = validatorFn(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}
