/**
 * File Upload Middleware
 *
 * Configures Multer for handling file uploads in memory storage.
 * Used for processing avatar images and other media files.
 */

import multer from 'multer';

// Configure multer to store files in memory (not on disk)
// This allows direct upload to cloud storage services like Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

export default upload; 