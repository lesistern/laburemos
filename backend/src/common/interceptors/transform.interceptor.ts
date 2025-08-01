import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>> {
  
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // Handle different response formats
        let responseData = data;
        let message: string | undefined;
        let pagination: any;

        // Check if data has a specific structure
        if (data && typeof data === 'object') {
          // Handle paginated responses
          if ('items' in data && 'pagination' in data) {
            responseData = data.items;
            pagination = {
              page: data.pagination.page,
              limit: data.pagination.limit,
              total: data.pagination.total,
              totalPages: data.pagination.totalPages,
              hasNext: data.pagination.hasNext,
              hasPrev: data.pagination.hasPrev,
            };
          }
          
          // Handle responses with message
          if ('message' in data && 'data' in data) {
            message = data.message;
            responseData = data.data;
          }
          
          // Handle responses with message only
          if ('message' in data && !('data' in data)) {
            message = data.message;
            responseData = data;
          }
        }

        const transformedResponse: ApiResponse<T> = {
          success: true,
          data: responseData,
          statusCode: response.statusCode,
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
        };

        if (message) {
          transformedResponse.message = message;
        }

        if (pagination) {
          transformedResponse.pagination = pagination;
        }

        return transformedResponse;
      }),
    );
  }
}