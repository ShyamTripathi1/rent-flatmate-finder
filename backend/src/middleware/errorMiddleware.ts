import { Request, Response, NextFunction } from 'express';

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Unhandled server exception caught by middleware:', err);
  
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}
export default errorMiddleware;
