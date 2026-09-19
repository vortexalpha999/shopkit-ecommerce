import mongoose from 'mongoose';

/**
 * Connect to MongoDB. Called once at boot from server.js.
 * Fails fast: if the DB is unreachable there is no point serving requests.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
