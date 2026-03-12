export class AppError extends Error {
  constructor(
    public statusCode: number,
    public override message: string,
    public code: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, `${resource} '${id}' not found`, 'RESOURCE_NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown) {
    super(400, 'Validation failed', 'VALIDATION_ERROR', details);
  }
}

export class ExternalAPIError extends AppError {
  constructor(service: string, statusCode: number, message: string) {
    super(502, `${service} API error: ${message}`, 'EXTERNAL_API_ERROR', {
      service,
      upstreamStatus: statusCode,
    });
  }
}

export class RateLimitError extends AppError {
  constructor(service: string) {
    super(429, `Rate limit exceeded for ${service}`, 'RATE_LIMIT_EXCEEDED');
  }
}

export class AIResponseError extends AppError {
  constructor(message: string, rawResponse?: string) {
    super(502, message, 'AI_RESPONSE_ERROR', { rawResponse });
  }
}
