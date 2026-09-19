import jwt from 'jsonwebtoken';

/**
 * Sign a JWT for a given user id.
 * Keep the payload minimal — it is base64, not encrypted, and anyone
 * holding the token can read it.
 */
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

export default generateToken;
