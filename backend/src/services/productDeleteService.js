import Order from '../models/Order.js';
import Product from '../models/Product.js';

export const ACTIVE_ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'packing', 'shipping'];

export const hasActiveOrders = async (productId) =>
  Order.exists({ status: { $in: ACTIVE_ORDER_STATUSES }, 'items.productId': productId });

export const hasAnyOrders = async (productId) =>
  Order.exists({ 'items.productId': productId });

export const performSoftDelete = async ({ productId, userId }) => {
  const product = await Product.findOne({ _id: productId, isDeleted: { $ne: true } });
  if (!product) return null;
  const nextStatus = product.status === 'archived' ? product.status : 'archived';
  const updated = await Product.findOneAndUpdate(
    { _id: productId, isDeleted: { $ne: true } },
    {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId,
      previousStatus: product.status,
      status: nextStatus,
      stock: 0,
      stockQuantity: 0,
      isActive: false
    },
    { new: true }
  ).populate('category');
  return updated;
};

export const performHardDelete = async ({ productId }) => {
  const product = await Product.findById(productId);
  if (!product) return null;
  const removed = await Product.findByIdAndDelete(productId);
  return removed;
};
