export interface AppErrorAttributes {
  statusCode: number;
  status: string;
  isOperational: boolean;
  message: string;
  stack?: string;
}
