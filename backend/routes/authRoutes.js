/**
 * Authentication Routes
 *
 * Defines all authentication-related API endpoints:
 * - User registration and login
 * - Password reset via OTP
 * - User logout with token management
 */

import express from 'express';
import {
    registerUser,
    loginUser,
    logoutUser,
    sendOtpToEmail,
    verifyOtpAndResetPassword,
    } from '../controller/authController.js';
import { authMiddleware } from '../middleware/authMiddeleware.js';

const router = express.Router();

// User registration endpoint
router.post('/register', registerUser);

// User login endpoint
router.post('/login', loginUser);

// Password reset: Send OTP to email
router.post('/forget-password-admin', sendOtpToEmail);

// Password reset: Verify OTP and reset password
router.post('/verify-otp', verifyOtpAndResetPassword);

// User logout (requires authentication)
router.get('/logout', authMiddleware, logoutUser);

export default router;
