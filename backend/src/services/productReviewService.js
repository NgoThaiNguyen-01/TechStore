import mongoose from 'mongoose';
import Product from '../models/Product.js';
import ProductReview from '../models/ProductReview.js';

const roundRating = (value) => Math.round(Number(value || 0) * 10) / 10;

export const syncProductRatingSummary = async (productId) => {
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return { ratingAverage: 0, reviewCount: 0 };
  }

  const objectId = new mongoose.Types.ObjectId(String(productId));
  const [summary] = await ProductReview.aggregate([
    {
      $match: {
        product: objectId,
        $or: [
          { status: 'approved' },
          { status: { $exists: false } },
          { status: null },
          { status: '' }
        ]
      }
    },
    {
      $group: {
        _id: '$product',
        reviewCount: { $sum: 1 },
        ratingAverage: { $avg: '$rating' }
      }
    }
  ]);

  const ratingAverage = roundRating(summary?.ratingAverage);
  const reviewCount = Number(summary?.reviewCount || 0);

  await Product.findByIdAndUpdate(
    productId,
    { ratingAverage, reviewCount },
    { runValidators: true }
  );

  return { ratingAverage, reviewCount };
};
