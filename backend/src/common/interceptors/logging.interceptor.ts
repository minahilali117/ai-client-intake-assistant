import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { REQUEST_ID_HEADER } from '../middleware/request-id.middleware';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const started = Date.now();
    const requestId =
      request.headers[REQUEST_ID_HEADER]?.toString() ?? 'unknown';

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            JSON.stringify({
              level: 'info',
              requestId,
              method: request.method,
              path: request.url,
              statusCode: response.statusCode,
              durationMs: Date.now() - started,
              userId: (request as Request & { user?: { id: string } }).user?.id,
            }),
          );
        },
        error: (error: Error) => {
          this.logger.error(
            JSON.stringify({
              level: 'error',
              requestId,
              method: request.method,
              path: request.url,
              durationMs: Date.now() - started,
              message: error.message,
            }),
          );
        },
      }),
    );
  }
}
