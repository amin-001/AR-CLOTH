/**
 * Blacklist Token Model
 *
 * Stores JWT tokens that have been invalidated (e.g., during logout).
 * Prevents reuse of tokens and implements token revocation.
 * Tokens automatically expire after 7 days to clean up the collection.
 */

import mongoose from 'mongoose';

const blacklistTokenSchema = new mongoose.Schema({
  // The JWT token string to blacklist
  token: { type: String, required: true, unique: true },

  // Creation timestamp (automatically expires after 7 days)
  createdAt: { type: Date, default: Date.now, expires: '7d' },
});

export default mongoose.model('blacklistToken', blacklistTokenSchema);