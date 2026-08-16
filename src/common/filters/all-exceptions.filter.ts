import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

/**
 * Global filter that guarantees every unhandled error returns a response body
 * with the reason. NestJS hides the message of non-HttpExceptions behind a
 * generic "Internal server error"; this filter exposes the actual message so
 * callers know *why* a 500 happened, while HttpExceptions (400/404/409...)
 * keep their original, already-safe shape.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
      json: (body: unknown) => void;
    }>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      response
        .status(status)
        .json(
          typeof res === 'string' ? { statusCode: status, message: res } : res,
        );
      return;
    }

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof Error ? exception.message : 'Internal server error';

    this.logger.error(
      `Unhandled exception: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
