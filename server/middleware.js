import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'life-audit-os-secret-2026';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Splits "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Access token invalid or expired' });
    }
    
    // Assign validated user details to req.user
    req.user = user;
    next();
  });
}
