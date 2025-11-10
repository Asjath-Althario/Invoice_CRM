const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  console.log('=== AUTH MIDDLEWARE ===');
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);
  console.log('Auth Header:', req.headers.authorization);
  
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid auth header found');
      return res.status(401).json({ message: 'Access token required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('✅ Token found, verifying...');

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    console.log('✅ Token verified successfully for user:', decoded);

    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;