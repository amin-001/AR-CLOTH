/**
 * User Model
 *
 * Defines the schema for user accounts in the system.
 * Handles authentication, profile data, and user management.
 */

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // User's full name
  name: { type: String, required: true },

  // User's email address (unique, used for login)
  email: { type: String, unique: true, sparse: true },

  // Hashed password (excluded from queries by default for security)
  password: { type: String, select: false },

  // Email verification status
  is_verified: { type: Boolean, default: false },

}, {
  // Automatically add createdAt and updatedAt timestamps
  timestamps: true
});

export default mongoose.model('User', userSchema);
