import mongoose from 'mongoose';
import Product from '../models/Product.js';

const toObjectId = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!mongoose.Types.ObjectId.isValid(raw)) return null;
  return new mongoose.Types.ObjectId(raw);
};

const normalizeVariant = (value) => String(value || '').trim().slice(0, 120);

const normalizeCartKey = (productId, variant, rawKey) => {
  const normalizedId = String(productId || '').trim();
  const normalizedVariant = normalizeVariant(variant);
  const fallbackKey = `${normalizedId}::${normalizedVariant}`;
  const key = String(rawKey || '').trim();
  return (key || fallbackKey).slice(0, 255);
};

const normalizeCartQty = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return parsed;
};

export const sanitizeIncomingCartItems = (items = []) => {
  const rawItems = Array.isArray(items) ? items : [];
  const deduped = new Map();

  rawItems.forEach((item) => {
    const productId = toObjectId(item?.productId || item?._id || item?.product?._id);
    if (!productId) return;

    const variant = normalizeVariant(item?.variant);
    const key = normalizeCartKey(productId, variant, item?.key);
    const qty = normalizeCartQty(item?.qty);
    const existing = deduped.get(key);

    if (!existing) {
      deduped.set(key, {
        key,
        productId,
        variant,
        qty,
        addedAt: item?.addedAt ? new Date(item.addedAt) : new Date()
      });
      return;
    }

    existing.qty += qty;
  });

  return Array.from(deduped.values());
};

export const sanitizeIncomingWishlistItems = (items = []) => {
  const rawItems = Array.isArray(items) ? items : [];
  const deduped = new Map();

  rawItems.forEach((item) => {
    const productId = toObjectId(item?.productId || item?._id || item?.product?._id);
    if (!productId) return;
    const key = String(productId);
    if (deduped.has(key)) return;
    deduped.set(key, {
      productId,
      addedAt: item?.addedAt ? new Date(item.addedAt) : new Date()
    });
  });

  return Array.from(deduped.values());
};

const getProductsByIds = async (ids = []) => {
  const uniqueIds = Array.from(new Set(ids.map((id) => String(id)).filter(Boolean)));
  if (uniqueIds.length === 0) return new Map();

  const products = await Product.find({
    _id: { $in: uniqueIds },
    isDeleted: false
  })
    .select('name brand category images price salePrice stock colors status isActive ratingAverage reviewCount createdAt')
    .populate('brand', 'name')
    .populate('category', 'name');

  return new Map(products.map((product) => [String(product._id), product]));
};

export const hydrateCartItems = async (items = []) => {
  const sanitized = sanitizeIncomingCartItems(items);
  const productMap = await getProductsByIds(sanitized.map((item) => item.productId));

  return sanitized
    .map((item) => {
      const product = productMap.get(String(item.productId));
      if (!product) return null;
      const unitPrice = Number(product.salePrice ?? product.price ?? 0) || 0;
      const brandName = product.brand?.name || '';

      return {
        key: item.key,
        productId: String(product._id),
        name: product.name,
        brand: brandName,
        variant: item.variant || '',
        image: product.images?.[0] || '',
        unitPrice,
        qty: normalizeCartQty(item.qty),
        stock: Number(product.stock) || 0,
        status: product.status,
        isActive: Boolean(product.isActive),
        ratingAverage: Number(product.ratingAverage || 0),
        reviewCount: Number(product.reviewCount || 0),
        addedAt: item.addedAt || null
      };
    })
    .filter(Boolean);
};

export const hydrateWishlistItems = async (items = []) => {
  const sanitized = sanitizeIncomingWishlistItems(items);
  const productMap = await getProductsByIds(sanitized.map((item) => item.productId));

  return sanitized
    .map((item) => {
      const product = productMap.get(String(item.productId));
      if (!product) return null;

      return {
        ...product.toObject(),
        wishlistAddedAt: item.addedAt || null
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.wishlistAddedAt || 0).getTime() - new Date(a.wishlistAddedAt || 0).getTime());
};

export const mergeCartCollections = (existingItems = [], incomingItems = []) => {
  const merged = new Map();

  sanitizeIncomingCartItems(existingItems).forEach((item) => {
    merged.set(item.key, { ...item });
  });

  sanitizeIncomingCartItems(incomingItems).forEach((item) => {
    const current = merged.get(item.key);
    if (!current) {
      merged.set(item.key, { ...item });
      return;
    }

    current.qty += item.qty;
    current.addedAt = current.addedAt || item.addedAt || new Date();
  });

  return Array.from(merged.values());
};

export const mergeWishlistCollections = (existingItems = [], incomingItems = []) => {
  const merged = new Map();

  sanitizeIncomingWishlistItems(existingItems).forEach((item) => {
    merged.set(String(item.productId), { ...item });
  });

  sanitizeIncomingWishlistItems(incomingItems).forEach((item) => {
    const key = String(item.productId);
    if (merged.has(key)) return;
    merged.set(key, { ...item });
  });

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime()
  );
};
