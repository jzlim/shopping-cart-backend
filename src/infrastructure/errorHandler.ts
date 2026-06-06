import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import {
  CurrencyMismatchError,
  DomainError,
  EmptyCartError,
  InvalidMoneyError,
  InvalidProductIdError,
  InvalidQuantityError,
  ItemNotFoundError,
  ProductNotFoundError,
} from '../domain/errors/index.js';

type ErrorResponse = {
  error: {
    type: string;
    message: string;
    details?: unknown;
  };
};

/** Map a domain error to its HTTP status code. */
const statusForDomainError = (error: DomainError): number => {
  if (
    error instanceof InvalidQuantityError ||
    error instanceof InvalidProductIdError ||
    error instanceof InvalidMoneyError
  ) {
    return 400;
  }
  if (
    error instanceof ProductNotFoundError ||
    error instanceof ItemNotFoundError
  ) {
    return 404;
  }
  if (
    error instanceof CurrencyMismatchError ||
    error instanceof EmptyCartError
  ) {
    return 409;
  }
  return 500;
};

/**
 * Single Express error-handling middleware. It is the only place domain errors
 * are translated to HTTP, so no inner layer ever imports an HTTP concept.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const body: ErrorResponse = {
      error: {
        type: 'ValidationError',
        message: 'Request validation failed',
        details: err.issues,
      },
    };
    res.status(400).json(body);
    return;
  }

  if (err instanceof DomainError) {
    const body: ErrorResponse = {
      error: { type: err.name, message: err.message },
    };
    res.status(statusForDomainError(err)).json(body);
    return;
  }

  const body: ErrorResponse = {
    error: {
      type: 'InternalServerError',
      message: 'An unexpected error occurred',
    },
  };
  res.status(500).json(body);
};

/** 404 handler for unmatched routes. */
export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    error: { type: 'NotFound', message: 'Route not found' },
  });
};
