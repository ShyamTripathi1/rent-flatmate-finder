import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';

export function roleMiddleware(allowedRoles: ('TENANT' | 'OWNER' | 'ADMIN')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Please log in first.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. Insufficient permissions for this action.' });
    }

    next();
  };
}
export default roleMiddleware;
