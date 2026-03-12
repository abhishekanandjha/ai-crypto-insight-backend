import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors.js';

interface ValidationSchemas {
  params?: ZodSchema;
  query?: ZodSchema;
  body?: ZodSchema;
}

export function validateRequest(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new ValidationError(
            error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          ),
        );
        return;
      }
      next(error);
    }
  };
}
