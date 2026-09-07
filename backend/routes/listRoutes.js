/**
 * List Routes
 *
 * Defines routes for retrieving lists of data:
 * - Customer/user listings
 * - Fashion news articles
 * - Asset management endpoints
 */

import express from 'express';
import { authMiddleware } from '../middleware/authMiddeleware.js';
import {
    getAllCustomers,
    getAllNews

} from '../controller/listController.js';
import { recommendProducts, searchProducts } from '../controller/recommendController.js';
import multer from "multer";
import { bulkCreateProducts } from '../controller/productController.js';

const upload = multer();
const router = express.Router();

// Get all fashion news articles (public endpoint)
router.get('/all-news', getAllNews);

router.post("/recommend", upload.single("image"), recommendProducts);

router.post("/products/search", searchProducts);

router.post("/bulk", bulkCreateProducts);



// Get all customers (commented out - requires authentication)
// router.get('/all-customers', authMiddleware, getAllCustomers);

export default router;
