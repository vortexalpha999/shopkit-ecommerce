import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  getCategories,
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Static path must be declared before '/:id', otherwise Express would
// treat "categories" as an id.
router.get('/categories', getCategories);

router.route('/').get(getProducts).post(protect, createProduct);
router.route('/:id').get(getProductById);

export default router;
