export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
  error?: string;
}

export interface ApiErrorResponse extends ApiResponse<null> {
  error: string;
}
