import mongoose from 'mongoose';
import slugify from 'slugify';
import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Order from '../models/Order.js';
import {
  hasActiveOrders,
  hasAnyOrders,
  performSoftDelete,
  performHardDelete
} from '../services/productDeleteService.js';

const normalizeName = (value) => value.trim().replace(/\s+/g, ' ');

const parseNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const HEX_REGEX = /^#([0-9A-Fa-f]{6})$/;
const VALID_STATUSES = ['active', 'hidden', 'draft', 'archived', 'out_of_stock'];

const normalizeStatusByStock = ({ stock, status, previousStatus }) => {
  if (stock === 0) return 'out_of_stock';
  if (status === 'out_of_stock') {
    return previousStatus && VALID_STATUSES.includes(previousStatus) ? previousStatus : 'active';
  }
  return status;
};

const normalizeColorName = (value) => value.trim().replace(/\s+/g, ' ');

const validateColors = (colors) => {
  if (colors === undefined) return { colors: undefined };
  if (!Array.isArray(colors)) {
    return { error: 'Colors must be an array' };
  }

  const normalized = colors.map((color) => ({
    name: normalizeColorName(String(color?.name || '')),
    hex: String(color?.hex || '').trim()
  }));

  for (const color of normalized) {
    if (!color.name) {
      return { error: 'Tên màu là bắt buộc' };
    }
    if (!color.hex) {
      return { error: 'Mã màu là bắt buộc' };
    }
    if (!HEX_REGEX.test(color.hex)) {
      return { error: `Mã màu không hợp lệ: ${color.hex}` };
    }
  }

  const nameSet = new Set();
  for (const color of normalized) {
    const key = color.name.toLowerCase();
    if (nameSet.has(key)) {
      return { error: `Màu bị trùng: ${color.name}` };
    }
    nameSet.add(key);
  }

  const hexSet = new Set();
  for (const color of normalized) {
    const key = color.hex.toLowerCase();
    if (hexSet.has(key)) {
      return { error: `Mã màu bị trùng: ${color.hex}` };
    }
    hexSet.add(key);
  }

  return { colors: normalized };
};

const normalizeSpec = (value) => value.trim().replace(/\s+/g, ' ');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const resolveBrandId = async (brandInput) => {
  if (!brandInput) return null;
  const raw = String(brandInput).trim();
  if (!raw) return null;
  if (mongoose.Types.ObjectId.isValid(raw)) {
    const brand = await Brand.findById(raw).select('_id');
    return brand?._id || null;
  }
  const brand = await Brand.findOne({ name: { $regex: `^${escapeRegex(raw)}$`, $options: 'i' } }).select('_id');
  return brand?._id || null;
};

const buildDateRange = (dateInput) => {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { $gte: start, $lte: end };
};

const getDateTimestamp = (value) => {
  const timestamp = new Date(value || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const buildSoldCountMap = async (productIds) => {
  const ids = productIds
    .map((id) => String(id || '').trim())
    .filter(Boolean)
    .filter((id, index, arr) => arr.indexOf(id) === index)
    .map((id) => new mongoose.Types.ObjectId(id));

  if (ids.length === 0) {
    return new Map();
  }

  const sales = await Order.aggregate([
    {
      $match: {
        status: 'completed',
        paymentStatus: { $ne: 'refunded' }
      }
    },
    { $unwind: '$items' },
    { $match: { 'items.productId': { $in: ids } } },
    {
      $group: {
        _id: '$items.productId',
        soldCount: { $sum: '$items.quantity' }
      }
    }
  ]);

  return new Map(sales.map((entry) => [String(entry._id), Number(entry.soldCount) || 0]));
};

const validateSpecs = (specs) => {
  if (specs === undefined) return { specs: undefined };
  if (!Array.isArray(specs)) {
    return { error: 'Specs must be an array' };
  }

  const normalized = specs.map((spec) => ({
    key: normalizeSpec(String(spec?.key || '')),
    value: normalizeSpec(String(spec?.value || ''))
  }));

  for (const spec of normalized) {
    if (!spec.key) {
      return { error: 'Thông số là bắt buộc' };
    }
    if (!spec.value) {
      return { error: 'Mô tả thông số là bắt buộc' };
    }
  }

  return { specs: normalized };
};

export const createProduct = async (req, res, next) => {
  try {
    const { name, brand, description, shortDesc, seoTitle, seoDesc, price, salePrice, stock, category, images, isFeatured, isActive, colors, specs, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const resolvedBrandId = await resolveBrandId(brand);
    if (!resolvedBrandId) {
      return res.status(400).json({ success: false, message: 'Brand is required' });
    }
    if (price === undefined || Number(price) < 0) {
      return res.status(400).json({ success: false, message: 'Price must be >= 0' });
    }
    if (salePrice !== undefined && Number(salePrice) < 0) {
      return res.status(400).json({ success: false, message: 'Sale price must be >= 0' });
    }
    if (salePrice !== undefined && Number(salePrice) > Number(price)) {
      return res.status(400).json({ success: false, message: 'Sale price must be <= price' });
    }
    if (stock === undefined || Number(stock) < 0) {
      return res.status(400).json({ success: false, message: 'Stock must be >= 0' });
    }
    if (!category || !mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ success: false, message: 'Category is invalid' });
    }
    if (images !== undefined && !Array.isArray(images)) {
      return res.status(400).json({ success: false, message: 'Images must be an array' });
    }

    const colorValidation = validateColors(colors);
    if (colorValidation.error) {
      return res.status(400).json({ success: false, message: colorValidation.error });
    }
    const specsValidation = validateSpecs(specs);
    if (specsValidation.error) {
      return res.status(400).json({ success: false, message: specsValidation.error });
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const normalizedName = normalizeName(name);
    const slug = slugify(normalizedName, { lower: true, strict: true });
    const normalizedStock = Number(stock);
    const inputStatus = status || 'draft';
    const normalizedStatus = normalizeStatusByStock({ stock: normalizedStock, status: inputStatus });
    const previousStatus = normalizedStock === 0 && inputStatus !== 'out_of_stock' ? inputStatus : null;
    const created = await Product.create({
      name: normalizedName,
      brand: resolvedBrandId,
      slug,
      description: description || '',
      shortDesc: shortDesc || '',
      seoTitle: seoTitle || '',
      seoDesc: seoDesc || '',
      price: Number(price),
      salePrice: salePrice === undefined || salePrice === '' ? undefined : Number(salePrice),
      stock: normalizedStock,
      stockQuantity: normalizedStock,
      category,
      images: images || [],
      colors: colorValidation.colors || [],
      specs: specsValidation.specs || [],
      status: normalizedStatus,
      previousStatus,
      isFeatured: Boolean(isFeatured),
      isActive: isActive === undefined ? true : Boolean(isActive)
    });
    const populated = await Product.findById(created._id).populate('category').populate('brand');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'Sản phẩm đã tồn tại' });
    }
    next(error);
  }
};

export const getProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseNumber(req.query.page, 1));
    const limit = Math.max(1, parseNumber(req.query.limit, 10));
    const search = req.query.search ? req.query.search.trim() : '';
    const category = req.query.category;
    const status = req.query.status;
    const sortParam = req.query.sort;
    const brand = req.query.brand ? String(req.query.brand).trim() : '';
    const minStock = req.query.minStock;
    const maxStock = req.query.maxStock;
    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;
    const createdDate = req.query.createdDate;
    const updatedDate = req.query.updatedDate;

    const filter = { isActive: { $ne: false }, isDeleted: { $ne: true } };
    const includeDeleted = req.query.includeDeleted === 'true';
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';
    if (includeDeleted && isAdmin) {
      delete filter.isDeleted;
      delete filter.isActive;
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (brand) {
      if (mongoose.Types.ObjectId.isValid(brand)) {
        filter.brand = brand;
      } else {
        const brandIds = await Brand.find({ name: { $regex: escapeRegex(brand), $options: 'i' } }).select('_id');
        filter.brand = { $in: brandIds.map((b) => b._id) };
      }
    }
    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({ success: false, message: 'Category is invalid' });
      }
      filter.category = category;
    }
    if (status) {
      if (VALID_STATUSES.includes(status)) {
        filter.status = status;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
    }
    if (minStock !== undefined || maxStock !== undefined) {
      const stockFilter = {};
      if (minStock !== undefined && minStock !== '') {
        stockFilter.$gte = Number(minStock);
      }
      if (maxStock !== undefined && maxStock !== '') {
        stockFilter.$lte = Number(maxStock);
      }
      filter.stock = stockFilter;
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter = {};
      if (minPrice !== undefined && minPrice !== '') {
        priceFilter.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        priceFilter.$lte = Number(maxPrice);
      }
      filter.price = priceFilter;
    }
    const createdRange = buildDateRange(createdDate);
    if (createdRange) {
      filter.createdAt = createdRange;
    }
    const updatedRange = buildDateRange(updatedDate);
    if (updatedRange) {
      filter.updatedAt = updatedRange;
    }

    const totalItems = await Product.countDocuments(filter);
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
    const normalizedSortParam = String(sortParam || '').trim();
    const isBestSellingSort = ['bestSelling', 'bestSelling:desc', 'best_selling', 'best_selling:desc']
      .includes(normalizedSortParam);

    if (isBestSellingSort) {
      const matchedProducts = await Product.find(filter)
        .populate('category')
        .populate('brand');

      const soldCountMap = await buildSoldCountMap(matchedProducts.map((product) => product._id));
      const sortedProducts = matchedProducts
        .map((product) => {
          const plain = product.toObject();
          plain.soldCount = soldCountMap.get(String(product._id)) || 0;
          return plain;
        })
        .sort((a, b) => {
          const soldDiff = (Number(b.soldCount) || 0) - (Number(a.soldCount) || 0);
          if (soldDiff !== 0) return soldDiff;
          return getDateTimestamp(b.createdAt) - getDateTimestamp(a.createdAt);
        });

      const products = sortedProducts.slice((page - 1) * limit, page * limit);
      return res.json({
        success: true,
        data: products,
        pagination: { page, totalPages, totalItems }
      });
    }

    let sort = { createdAt: -1 };
    if (normalizedSortParam === 'newest') {
      sort = { createdAt: -1 };
    } else if (normalizedSortParam === 'oldest') {
      sort = { createdAt: 1 };
    } else if (normalizedSortParam) {
      const [field, order] = normalizedSortParam.split(':');
      if (field && order) {
        sort = { [field]: order === 'asc' ? 1 : -1 };
      }
    }

    const products = await Product.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category')
      .populate('brand');

    res.json({
      success: true,
      data: products,
      pagination: { page, totalPages, totalItems }
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const product = await Product.findOne({ _id: id, isActive: { $ne: false }, isDeleted: { $ne: true } })
      .populate('category')
      .populate('brand');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const updates = {};
    if (req.body.name !== undefined) {
      if (!req.body.name || !req.body.name.trim()) {
        return res.status(400).json({ success: false, message: 'Name is required' });
      }
      const normalizedName = normalizeName(req.body.name);
      updates.name = normalizedName;
      updates.slug = slugify(normalizedName, { lower: true, strict: true });
    }
    if (req.body.brand !== undefined) {
      const resolvedBrandId = await resolveBrandId(req.body.brand);
      if (!resolvedBrandId) {
        return res.status(400).json({ success: false, message: 'Brand is required' });
      }
      updates.brand = resolvedBrandId;
    }
    if (req.body.description !== undefined) {
      updates.description = req.body.description || '';
    }
    if (req.body.shortDesc !== undefined) {
      updates.shortDesc = req.body.shortDesc || '';
    }
    if (req.body.seoTitle !== undefined) {
      updates.seoTitle = req.body.seoTitle || '';
    }
    if (req.body.seoDesc !== undefined) {
      updates.seoDesc = req.body.seoDesc || '';
    }
    if (req.body.price !== undefined) {
      if (Number(req.body.price) < 0) {
        return res.status(400).json({ success: false, message: 'Price must be >= 0' });
      }
      updates.price = Number(req.body.price);
    }
    if (req.body.salePrice !== undefined) {
      if (Number(req.body.salePrice) < 0) {
        return res.status(400).json({ success: false, message: 'Sale price must be >= 0' });
      }
      let basePrice = updates.price;
      if (basePrice === undefined) {
        const current = await Product.findOne({ _id: id, isActive: { $ne: false }, isDeleted: { $ne: true } }).select('price');
        if (!current) {
          return res.status(404).json({ success: false, message: 'Product not found' });
        }
        basePrice = current.price;
      }
      if (Number(req.body.salePrice) > Number(basePrice)) {
        return res.status(400).json({ success: false, message: 'Sale price must be <= price' });
      }
      updates.salePrice = req.body.salePrice === '' ? undefined : Number(req.body.salePrice);
    }
    if (req.body.stock !== undefined) {
      if (Number(req.body.stock) < 0) {
        return res.status(400).json({ success: false, message: 'Stock must be >= 0' });
      }
      updates.stock = Number(req.body.stock);
      updates.stockQuantity = Number(req.body.stock);
    }
    if (req.body.category !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
        return res.status(400).json({ success: false, message: 'Category is invalid' });
      }
      updates.category = req.body.category;
    }
    if (req.body.images !== undefined) {
      if (!Array.isArray(req.body.images)) {
        return res.status(400).json({ success: false, message: 'Images must be an array' });
      }
      updates.images = req.body.images;
    }
    if (req.body.colors !== undefined) {
      const colorValidation = validateColors(req.body.colors);
      if (colorValidation.error) {
        return res.status(400).json({ success: false, message: colorValidation.error });
      }
      updates.colors = colorValidation.colors || [];
    }
    if (req.body.specs !== undefined) {
      const specsValidation = validateSpecs(req.body.specs);
      if (specsValidation.error) {
        return res.status(400).json({ success: false, message: specsValidation.error });
      }
      updates.specs = specsValidation.specs || [];
    }
    if (req.body.status !== undefined) {
      if (!VALID_STATUSES.includes(req.body.status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      updates.status = req.body.status;
    }
    if (req.body.isFeatured !== undefined) {
      updates.isFeatured = Boolean(req.body.isFeatured);
    }
    if (req.body.isActive !== undefined) {
      updates.isActive = Boolean(req.body.isActive);
    }

    if (updates.stock !== undefined) {
      const current = await Product.findOne({ _id: id, isActive: { $ne: false }, isDeleted: { $ne: true } }).select('status previousStatus');
      if (!current) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      const nextStatus = updates.status ?? current.status;
      if (updates.stock === 0) {
        if (nextStatus !== 'out_of_stock') {
          updates.previousStatus = nextStatus;
          updates.status = 'out_of_stock';
        }
      } else {
        if (nextStatus === 'out_of_stock') {
          updates.status = current.previousStatus && VALID_STATUSES.includes(current.previousStatus)
            ? current.previousStatus
            : 'active';
          updates.previousStatus = null;
        }
      }
    }

    const updated = await Product.findOneAndUpdate({ _id: id, isActive: { $ne: false }, isDeleted: { $ne: true } }, updates, {
      new: true,
      runValidators: true
    }).populate('category').populate('brand');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'Sản phẩm đã tồn tại' });
    }
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const force = req.query.force === 'true';
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';

    if (force) {
      if (!isAdmin) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      if ((product.stock ?? 0) !== 0 || (product.stockQuantity ?? 0) !== 0) {
        return res.status(409).json({ success: false, message: 'Sản phẩm còn tồn kho, không thể xóa vĩnh viễn.' });
      }
      const anyOrders = await hasAnyOrders(id);
      if (anyOrders) {
        return res.status(409).json({ success: false, message: 'Sản phẩm đã phát sinh đơn hàng, không thể xóa vĩnh viễn.' });
      }
      await performHardDelete({ productId: id });
      return res.json({ success: true, message: 'Đã xóa vĩnh viễn sản phẩm' });
    }

    const activeOrders = await hasActiveOrders(id);
    if (activeOrders) {
      return res.status(409).json({ success: false, message: 'Sản phẩm đang nằm trong đơn hàng đang xử lý, không thể xóa.' });
    }
    const deleted = await performSoftDelete({ productId: id, userId: req.user?._id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Đã lưu trữ sản phẩm', data: deleted });
  } catch (error) {
    next(error);
  }
};

export const restoreProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const restoredStatus = product.previousStatus && VALID_STATUSES.includes(product.previousStatus)
      ? product.previousStatus
      : 'draft';
    const restored = await Product.findByIdAndUpdate(
      id,
      {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        status: restoredStatus,
        isActive: true,
        previousStatus: null
      },
      { new: true }
    ).populate('category').populate('brand');
    res.json({ success: true, message: 'Đã khôi phục sản phẩm', data: restored });
  } catch (error) {
    next(error);
  }
};

export const updateProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const current = await Product.findOne({ _id: id, isActive: { $ne: false }, isDeleted: { $ne: true } }).select('stock previousStatus status');
    if (!current) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    let nextStatus = status;
    let nextPreviousStatus = current.previousStatus;
    if (current.stock === 0) {
      if (status !== 'out_of_stock') {
        nextPreviousStatus = status;
        nextStatus = 'out_of_stock';
      }
    } else if (status === 'out_of_stock') {
      nextStatus = current.previousStatus && VALID_STATUSES.includes(current.previousStatus)
        ? current.previousStatus
        : 'active';
      nextPreviousStatus = null;
    }
    const updated = await Product.findOneAndUpdate(
      { _id: id, isActive: { $ne: false }, isDeleted: { $ne: true } },
      { status: nextStatus, previousStatus: nextPreviousStatus },
      { new: true, runValidators: true }
    ).populate('category').populate('brand');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Ids must be an array' });
    }
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const result = await Product.updateMany(
      { _id: { $in: ids }, isActive: { $ne: false }, isDeleted: { $ne: true } },
      { status }
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteProducts = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Ids must be an array' });
    }

    const result = await Product.updateMany(
      { _id: { $in: ids }, isActive: { $ne: false }, isDeleted: { $ne: true } },
      { isActive: false, isDeleted: true, deletedAt: new Date(), deletedBy: req.user?._id, status: 'archived', stock: 0, stockQuantity: 0 }
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
