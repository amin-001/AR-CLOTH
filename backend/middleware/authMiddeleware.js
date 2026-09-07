/**
 * Authentication Middleware
 *
 * Protects routes by verifying JWT tokens and checking user authentication.
 * Adds authenticated user to request object for downstream handlers.
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import blacklistTokenModel from '../models/blacklistToken.js';

// JWT authentication middleware
export const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from cookies or Authorization header
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if token is blacklisted (logged out)
    const isBlacklisted = await blacklistTokenModel.findOne({token});
    if(isBlacklisted){
       return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify and decode JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID from token payload
    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Attach user to request object for use in route handlers
    req.user = user;
    return next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
}