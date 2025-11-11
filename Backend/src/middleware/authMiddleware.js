const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authMiddleware = async (req, res, next) => {
  console.log('Auth middleware triggered for:', req.path);
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Auth middleware: No token provided.');
    return res.status(401).json({ message: 'Authentication token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    console.log('Auth middleware: Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware: Token verified for user ID:', decoded.id);

    const [rows] = await db.query('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);

    if (rows.length === 0) {
      console.log('Auth middleware: User not found in DB for ID:', decoded.id);
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = rows[0];
    console.log('Auth middleware: User attached to request.');
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    console.error('Auth middleware: An unexpected error occurred:', error);
    return res.status(500).json({ message: 'An internal server error occurred during authentication.' });
  }
};

module.exports = authMiddleware;