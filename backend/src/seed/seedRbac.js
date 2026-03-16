import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import { ensureDefaultRbacData } from '../services/rbacService.js';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();
    await ensureDefaultRbacData();

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed();
