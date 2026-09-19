/**
 * Seeds the database with demo products and an admin user.
 * Run against whichever DB your .env points at:
 *
 *   npm run seed          # insert demo data
 *   npm run seed -- --wipe  # delete existing products first
 *
 * Safe to run against Atlas — it only touches the products collection
 * and one seed user.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const { default: connectDB } = await import('./config/db.js');
const { default: Product } = await import('./models/Product.js');
const { default: User } = await import('./models/User.js');

const demoProducts = [
  { name: 'Wireless Over-Ear Headphones', description: '40-hour battery, active noise cancelling.', price: 129.99, category: 'electronics', image: 'https://picsum.photos/seed/headphones/600', stock: 24 },
  { name: 'Mechanical Keyboard 75%', description: 'Hot-swappable switches, PBT keycaps.', price: 89.0, category: 'electronics', image: 'https://picsum.photos/seed/keyboard/600', stock: 12 },
  { name: 'Aluminium Laptop Stand', description: 'Adjustable height, fits up to 16".', price: 34.5, category: 'accessories', image: 'https://picsum.photos/seed/stand/600', stock: 40 },
  { name: 'Canvas Weekender Bag', description: 'Water-resistant, leather trim.', price: 74.0, category: 'bags', image: 'https://picsum.photos/seed/bag/600', stock: 8 },
  { name: 'Ceramic Pour-Over Set', description: 'Dripper, carafe and filters.', price: 42.0, category: 'kitchen', image: 'https://picsum.photos/seed/coffee/600', stock: 3 },
  { name: 'Linen Throw Blanket', description: 'Stonewashed, 130 × 170 cm.', price: 58.0, category: 'home', image: 'https://picsum.photos/seed/blanket/600', stock: 0 },
  { name: 'USB-C 8-in-1 Hub', description: 'HDMI, ethernet, SD, 100W passthrough.', price: 49.99, category: 'electronics', image: 'https://picsum.photos/seed/hub/600', stock: 31 },
  { name: 'Leather Card Wallet', description: 'Full-grain, holds six cards.', price: 29.0, category: 'accessories', image: 'https://picsum.photos/seed/wallet/600', stock: 17 },
];

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set. Copy .env.example to .env first.');
    process.exit(1);
  }

  await connectDB();

  if (process.argv.includes('--wipe')) {
    const { deletedCount } = await Product.deleteMany({});
    console.log(`Removed ${deletedCount} existing products`);
  }

  // An admin to authenticate POST /api/products with.
  let admin = await User.findOne({ email: 'admin@shopkit.dev' });
  if (!admin) {
    admin = await User.create({
      name: 'Seed Admin',
      email: 'admin@shopkit.dev',
      password: 'changeme123',
      role: 'admin',
    });
    console.log('Created admin@shopkit.dev / changeme123 — change this password.');
  }

  const created = await Product.insertMany(
    demoProducts.map((p) => ({ ...p, createdBy: admin._id }))
  );
  console.log(`Inserted ${created.length} products`);

  await mongoose.connection.close();
  process.exit(0);
};

run().catch(async (err) => {
  console.error(`Seed failed: ${err.message}`);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
