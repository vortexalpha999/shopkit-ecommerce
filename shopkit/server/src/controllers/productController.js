import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';

/**
 * @desc    List products with optional filtering, search, sorting, pagination
 * @route   GET /api/products
 * @access  Public
 * @query   keyword, category, minPrice, maxPrice, sort, page, limit
 */
export const getProducts = asyncHandler(async (req, res) => {
  const { keyword, category, minPrice, maxPrice, sort } = req.query;

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(60, Math.max(1, Number(req.query.limit) || 12));

  const filter = {};

  if (keyword) {
    filter.name = { $regex: keyword, $options: 'i' };
  }
  if (category && category !== 'all') {
    filter.category = category.toLowerCase();
  }
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const sortMap = {
    newest: { createdAt: -1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    name: { name: 1 },
  };
  const sortBy = sortMap[sort] || sortMap.newest;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    products,
    page,
    pages: Math.ceil(total / limit) || 1,
    total,
  });
});

/**
 * @desc    Fetch a single product by id
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json(product);
});

/**
 * @desc    Create a product
 * @route   POST /api/products
 * @access  Private (any authenticated user; swap `protect` for
 *          `protect, admin` in the route to restrict to admins)
 * @body    { name, price, category, image, stock, description? }
 */
export const createProduct = asyncHandler(async (req, res) => {
  const { name, price, category, image, stock, description } = req.body;

  if (!name || price === undefined || !category || !image || stock === undefined) {
    res.status(400);
    throw new Error('name, price, category, image and stock are required');
  }

  const product = await Product.create({
    name,
    price,
    category,
    image,
    stock,
    description: description || '',
    createdBy: req.user._id,
  });

  res.status(201).json(product);
});

/**
 * @desc    Return the distinct category list (used to build UI filters)
 * @route   GET /api/products/categories
 * @access  Public
 */
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category');
  res.json(categories.sort());
});
