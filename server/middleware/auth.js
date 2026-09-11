import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Server will not start.');
}

export const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware factory — restricts access to users whose role is in `allowedRoles`.
 * Must be used AFTER verifyToken.
 * @param {...string} allowedRoles
 */
export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
  }
  next();
};

/**
 * Like verifyToken but also accepts a ?token= query parameter.
 * Use this for file-serving routes where browser <a href> and <img src>
 * links cannot set an Authorization header.
 */
export const verifyFileToken = (req, res, next) => {
  let token = (req.header('Authorization') || '').replace('Bearer ', '').trim();
  if (!token && req.query.token) token = String(req.query.token).trim();

  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
