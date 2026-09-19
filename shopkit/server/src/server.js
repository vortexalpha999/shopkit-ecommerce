import dotenv from 'dotenv';

// Load .env before anything else reads process.env.
dotenv.config();

const { default: connectDB } = await import('./config/db.js');
const { default: app } = await import('./app.js');

const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

await connectDB();

const server = app.listen(PORT, () =>
  console.log(`API running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`)
);

// Do not leave a half-dead process behind on an unhandled rejection.
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
