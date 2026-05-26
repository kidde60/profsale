import { Response } from 'express';

/**
 * Standardized error response that excludes error details in production
 * @param res - Express response object
 * @param statusCode - HTTP status code
 * @param message - User-friendly error message
 * @param error - Optional error details (only shown in development)
 * @param data - Optional additional error data (always shown)
 */
export const sendErrorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  error?: string | Error,
  data?: any,
): void => {
  const response: any = {
    success: false,
    message,
  };

  // Include additional error data if provided
  if (data) {
    response.data = data;
  }

  // Only include error details in development
  if (process.env.NODE_ENV === 'development' && error) {
    response.error = error instanceof Error ? error.message : error;
  }

  res.status(statusCode).json(response);
};

/**
 * Standardized success response
 * @param res - Express response object
 * @param statusCode - HTTP status code (default 200)
 * @param message - Success message
 * @param data - Response data
 */
export const sendSuccessResponse = (
  res: Response,
  message: string,
  data?: any,
  statusCode: number = 200,
): void => {
  const response: any = {
    success: true,
    message,
  };

  if (data) {
    response.data = data;
  }

  res.status(statusCode).json(response);
};

/**
 * Extract error message safely
 * @param error - Error object or unknown
 * @returns Error message string
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};
