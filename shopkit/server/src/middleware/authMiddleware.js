import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

/**
 * Gate for private routes.
 * Expects: Authorization: Bearer <token>
 * On success, attaches the full user document to req.user.
 */
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Not authorized — no token provided');
  }

  const token = header.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized — token invalid or expired');
  }

  // Look the user up fresh on every request: a deleted or demoted user
  // must not keep access just because their token has not expired yet.
  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(401);
    throw new Error('Not authorized — user no longer exists');
  }

  req.user = user;
  next();
});

/** Use after `protect` to restrict a route to admins. */
export const admin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }
  next();
};
