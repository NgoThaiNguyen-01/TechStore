import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import authRoutes from './routes/authRoutes.js';
import flashSaleRoutes from './routes/flashSaleRoutes.js';
import postRoutes from './routes/postRoutes.js';
import postCategoryRoutes from './routes/postCategoryRoutes.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import errorMiddleware from './middlewares/errorMiddleware.js';
import Product from './models/Product.js';
import Brand from './models/Brand.js';
import path from 'path';
import { attachRealtimeServer } from './services/realtimeService.js';

const app = express();
const corsOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173'
].filter(Boolean);

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/flash-sales', flashSaleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/post-categories', postCategoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/uploads', uploadRoutes);
app.use(errorMiddleware);

const port = process.env.PORT || 5000;

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const migrateProductBrands = async () => {
  const cursor = Product.collection.find({ brand: { $type: 'string', $ne: '' } });
  for await (const doc of cursor) {
    const brandName = String(doc.brand || '').trim();
    if (!brandName) continue;
    const brandDoc = await Brand.collection.findOne({ name: { $regex: `^${escapeRegex(brandName)}$`, $options: 'i' } });
    if (!brandDoc?._id) continue;
    await Product.collection.updateOne({ _id: doc._id }, { $set: { brand: brandDoc._id } });
  }
};

const start = async () => {
  try {
    await connectDB();
    await migrateProductBrands();
    const server = http.createServer(app);
    attachRealtimeServer(server);

    // Function to find available port
    const findAvailablePort = (startPort) => {
      return new Promise((resolve) => {
        const testServer = http.createServer();
        testServer.listen(startPort, () => {
          testServer.once('close', () => {
            resolve(startPort);
          });
          testServer.close();
        });
        testServer.on('error', () => {
          resolve(findAvailablePort(startPort + 1));
        });
      });
    };

    // Get available port and start server
    const availablePort = await findAvailablePort(parseInt(port));
    server.listen(availablePort, () => {
      console.log(`Server running on port ${availablePort}`);
    });

    server.on('error', (error) => {
      console.error('Server error:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

start();
