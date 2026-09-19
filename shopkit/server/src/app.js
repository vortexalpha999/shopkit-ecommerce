import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Render and most PaaS hosts sit behind a proxy. Without this, req.ip is the
// proxy's address and secure cookies / rate limiters misbehave.
app.set('trust proxy', 1);

/**
 * CLIENT_URL accepts a comma-separated list so one API can serve the
 * production site and a preview/staging deploy at the same time.
 */
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // No origin = same-origin, curl, or a mobile app — allow it.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);

      // Throwing (rather than silently omitting the header) puts the exact
      // rejected origin in the logs — usually the fastest way to spot a
      // trailing slash or an http/https mismatch in CLIENT_URL.
      const err = new Error(`CORS blocked for origin: ${origin}`);
      err.status = 403;
      return callback(err);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', uptime: process.uptime() })
);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Error handling must be registered last.
app.use(notFound);
app.use(errorHandler);

export default app;
