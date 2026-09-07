/**
 * OTP (One-Time Password) Model
 *
 * Stores temporary OTP codes for password reset and account verification.
 * Supports both email and phone-based OTP delivery.
 * OTPs automatically expire after 15 minutes for security.
 */

import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  // Email address for OTP delivery (optional, can use phone instead)
  email: {
    type: String,
    lowercase: true,
  },

  // Phone number for OTP delivery (optional, can use email instead)
  phone: { type: String },

  // The actual OTP code
  otp: {
    type: String,
    required: true,
  },

  // Whether the OTP has been successfully verified
  verified: {
    type: Boolean,
    default: false,
  },

  // Creation timestamp (automatically expires after 15 minutes)
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 900, // 15 minutes
  },
});

export default mongoose.model('Otp', otpSchema);
