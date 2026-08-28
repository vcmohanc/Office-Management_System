import { can, PERMISSIONS } from '../constants/permissions.js';

// §1-20 権限ごとに操作を制御する。verifyToken の後に使うこと。
export const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Access denied' });
  }
  if (!can(req.user.role, permission)) {
    return res.status(403).json({ error: `この操作の権限がありません（${permission}）` });
  }
  next();
};

export { PERMISSIONS };
