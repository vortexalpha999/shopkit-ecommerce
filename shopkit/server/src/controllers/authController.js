import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 * @body    { name, email, password }
 */
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are all required');
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(409);
    throw new Error('An account with that email already exists');
  }

  // Password hashing happens in the User model's pre-save hook.
  const user = await User.create({ name, email, password });

  res.status(201).json({
    user: user.toPublicJSON(),
    token: generateToken(user._id),
  });
});

/**
 * @desc    Authenticate a user and return a JWT
 * @route   POST /api/auth/login
 * @access  Public
 * @body    { email, password }
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  // password has select:false on the schema, so ask for it explicitly.
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  // Same message for "no such user" and "wrong password" — do not leak
  // which emails are registered.
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({
    user: user.toPublicJSON(),
    token: generateToken(user._id),
  });
});

/**
 * @desc    Return the currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
});
