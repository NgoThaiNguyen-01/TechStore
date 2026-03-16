import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const FOUNDERS = [
  'superadmin1@techstore.com',
  'superadmin2@techstore.com',
  'superadmin3@techstore.com'
];

const run = async () => {
  await connectDB();
  await User.updateMany(
    { email: { $in: FOUNDERS } },
    { $set: { role: 'SUPER_ADMIN', superAdminType: 'FOUNDING', isActive: true } }
  );
  await User.updateMany(
    { role: 'SUPER_ADMIN', email: { $nin: FOUNDERS } },
    { $set: { superAdminType: 'REGULAR' } }
  );
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
