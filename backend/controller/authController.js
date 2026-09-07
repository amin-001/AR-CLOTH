/**
 * Authentication Controller
 *
 * Handles user authentication operations including:
 * - User registration with email validation
 * - User login with JWT token generation
 * - Password reset via OTP
 * - User logout with token blacklisting
 * - OTP verification for password reset
 */

import User from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import jwt from 'jsonwebtoken';
import blacklistToken from '../models/blacklistToken.js';
import { generateOtp } from '../utils/otpHelper.js';
import { sendEmail } from '../utils/sendEmail.js';
import Otp from '../models/Otp.js';

// User registration endpoint
export const registerUser = async (req, res) => {
    try {

      console.log(`[ENTRY registerUser] ${req.method} ${req.originalUrl} params:${JSON.stringify(req.params||{})} query:${JSON.stringify(req.query||{})} body:${JSON.stringify(req.body||{})}`);
      // Accept both JSON and multipart/form-data
      const { name, email, password } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(409).json({ message: 'Email already registered' });

      // Hash the password for security
      let hashed = '';
      hashed = await hashPassword(password);

      // Create new user in database
      const user = await User.create({
        name,
        email,
        password: hashed,
      });

      res.status(201).json({ message: 'User registered successfully', user_id: user._id });
  }
   catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Registration failed', error: err.message });
    }
  };

  
  

// User login endpoint
export const loginUser = async (req, res) => {
    try {
      console.log(`[ENTRY loginUser] ${req.method} ${req.originalUrl} params:${JSON.stringify(req.params||{})} query:${JSON.stringify(req.query||{})} body:${JSON.stringify(req.body||{})}`);

      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res
          .status(400)
          .json({
            message:
              "Email and password are required",
          });
      }

      // Find user and include password field for comparison
      const user = await User.findOne({ email }).select('+password');
      if (!user){
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isMatch = await comparePassword(password, user.password);
      if (!isMatch){
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create JWT payload with user info
      const payload = {
        _id: user._id,
        email: user?.email,
      };

      // Generate JWT token (expires in 7 days)
      const token = jwt.sign( payload , process.env.JWT_SECRET, {expiresIn: '7d'});

      // Set secure cookie options
      const cookieOptions = {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      };

      const responsePayload = { message: 'Login successful', token, user: { id: user._id, role: user.role, email: user.email, phone: user.phone } };
      console.log('[RESPONSE loginUser]', responsePayload);
      res.cookie('token', token, cookieOptions).status(200).json(responsePayload);

      
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };


// User logout endpoint
export const logoutUser = async (req, res) => {
    try {
      // Clear the authentication cookie
      res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });

      // Get token from cookie or Authorization header
      const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

      // Add token to blacklist to prevent reuse
      await blacklistToken.create({token});

      res.status(200).json({ message: 'Logout successful' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Logout failed', error: err.message });
    }
  }

//   export const changePassword = async (req, res) => {
//     try {
//         const { oldPassword, newPassword } = req.body;
//         const userId = req.user._id; // user is set in auth middleware

//         if (!oldPassword || !newPassword) {
//             return res.status(400).json({ message: 'Old and new passwords are required' });
//         }

//         const user = await User.findById(userId).select('+password'); 
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         const isMatch = await comparePassword(oldPassword, user.password);
//         if (!isMatch) {
//             return res.status(401).json({ message: 'Old password is incorrect' });
//         }

//         const hashedNewPassword = await hashPassword(newPassword);
//         user.password = hashedNewPassword;
//         await user.save();

//         res.status(200).json({ message: 'Password changed successfully' });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: 'Failed to change password', error: err.message });
//     }
//   }

// Send OTP to email for password reset
export const sendOtpToEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate and store OTP
    const otp = generateOtp();
    await Otp.findOneAndUpdate(
      { email },
      { otp },
      { upsert: true, new: true }
    );

    // Send OTP via email
    await sendEmail(email, 'Password Reset OTP', `Your OTP is: ${otp}`);

    res.status(200).json({ message: 'OTP sent to email' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
  };

// Verify OTP and reset password
export const verifyOtpAndResetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    // Validate all required fields
    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate password length
    if (newPassword.length < 6 || confirmPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Verify OTP
    const record = await Otp.findOne({ email });
    if (!record || record.otp !== otp) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Find user and update password
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = await hashPassword(newPassword);
    await user.save();

    // Clean up OTP record
    await Otp.deleteOne({ email });

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset password', error: err.message });
  }
  };

// // RESET PASSWORD (Manual - without OTP flow)
//   export const resetPassword = async (req, res) => {
//   try {
//     const { identifier, newPassword } = req.body;

//     if (!identifier || !newPassword) {
//       return res.status(400).json({ message: 'Identifier (email/phone) and new password are required' });
//     }

//     if (newPassword.length < 6) {
//       return res.status(400).json({ message: 'Password must be at least 6 characters long' });
//     }

//     const query = identifier.includes('@') ? { email: identifier } : { phone: identifier };
//     const user = await User.findOne(query);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const hashed = await hashPassword(newPassword);
//     user.password = hashed;
//     await user.save();

//     res.status(200).json({ message: 'Password updated successfully' });
//   } catch (err) {
//     res.status(500).json({ message: 'Reset password error', error: err.message });
//   }
//   };



