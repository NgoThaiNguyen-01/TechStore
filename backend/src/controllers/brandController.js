import mongoose from 'mongoose';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';

const parseNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ');
const VALID_STATUSES = ['active', 'hidden', 'draft', 'archived'];

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

export const getBrands = async (req, res, next) => {
  try {
    const page = Math.max(1, parseNumber(req.query.page, 1));
    const limit = Math.max(1, parseNumber(req.query.limit, 10));
    const search = req.query.search ? String(req.query.search).trim() : '';
    const status = req.query.status;
    const createdDate = req.query.createdDate;
    const updatedDate = req.query.updatedDate;
    const productCountMin = req.query.productCountMin !== undefined ? parseNumber(req.query.productCountMin, null) : null;
    const productCountMax = req.query.productCountMax !== undefined ? parseNumber(req.query.productCountMax, null) : null;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      if (VALID_STATUSES.includes(status)) {
        filter.status = status;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
    }
    const createdRange = buildDateRange(createdDate);
    if (createdRange) {
      filter.createdAt = createdRange;
    }
    const updatedRange = buildDateRange(updatedDate);
    if (updatedRange) {
      filter.updatedAt = updatedRange;
    }

    let sortOption = { createdAt: -1 };
    if (req.query.sort) {
      const [field, order] = req.query.sort.split(':');
      if (field && order) {
        sortOption = { [field]: order === 'asc' ? 1 : -1 };
      }
    }

    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'products',
          let: { bid: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$brand', '$$bid'] },
                    { $ne: ['$isDeleted', true] }
                  ]
                }
              }
            },
            { $count: 'cnt' }
          ],
          as: 'prodCount'
        }
      },
      { $addFields: { productCount: { $ifNull: [{ $first: '$prodCount.cnt' }, 0] } } }
    ];

    if (productCountMin !== null || productCountMax !== null) {
      const pc = {};
      if (productCountMin !== null) pc.$gte = productCountMin;
      if (productCountMax !== null) pc.$lte = productCountMax;
      pipeline.push({ $match: { productCount: pc } });
    }

    const facet = {
      data: [
        { $sort: sortOption },
        { $skip: (page - 1) * limit },
        { $limit: limit }
      ],
      total: [{ $count: 'count' }]
    };

    const agg = await Brand.aggregate([...pipeline, { $facet: facet }]);
    const data = (agg[0]?.data || []).map((b) => {
      const obj = typeof b.toObject === 'function' ? b.toObject() : b;
      return { ...obj, productCount: b.productCount || 0 };
    });
    const total = agg[0]?.total?.[0]?.count || 0;

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getBrandById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Brand is invalid' });
    }
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }
    res.json({ success: true, data: brand });
  } catch (error) {
    next(error);
  }
};

export const createBrand = async (req, res, next) => {
  try {
    const { name, logo, image, description, descriptionVi, descriptionEn, status } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const normalizedDescription =
      description !== undefined
        ? String(description)
        : descriptionVi !== undefined
          ? String(descriptionVi)
          : descriptionEn !== undefined
            ? String(descriptionEn)
            : '';

    const normalizedLogo = logo || image || '';
    if (!normalizedLogo) {
      return res.status(400).json({ success: false, message: 'Logo is required' });
    }
    if (!String(normalizedDescription).trim()) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const created = await Brand.create({
      name: normalizeText(name),
      logo: normalizedLogo,
      image: image || '',
      description: normalizedDescription,
      status: status || 'active'
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'Thương hiệu đã tồn tại' });
    }
    next(error);
  }
};

export const updateBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Brand is invalid' });
    }

    const updates = {};
    if (req.body.name !== undefined) {
      if (!String(req.body.name).trim()) {
        return res.status(400).json({ success: false, message: 'Name is required' });
      }
      updates.name = normalizeText(req.body.name);
    }
    if (req.body.logo !== undefined) {
      if (!String(req.body.logo || '').trim()) {
        return res.status(400).json({ success: false, message: 'Logo is required' });
      }
      updates.logo = req.body.logo;
    }
    if (req.body.image !== undefined) {
      if (!String(req.body.image || '').trim()) {
        return res.status(400).json({ success: false, message: 'Logo is required' });
      }
      updates.image = req.body.image;
      if (updates.logo === undefined) {
        updates.logo = req.body.image;
      }
    }
    if (req.body.description !== undefined) {
      if (!String(req.body.description || '').trim()) {
        return res.status(400).json({ success: false, message: 'Description is required' });
      }
      updates.description = String(req.body.description);
    } else if (req.body.descriptionVi !== undefined) {
      if (!String(req.body.descriptionVi || '').trim()) {
        return res.status(400).json({ success: false, message: 'Description is required' });
      }
      updates.description = String(req.body.descriptionVi);
    } else if (req.body.descriptionEn !== undefined) {
      if (!String(req.body.descriptionEn || '').trim()) {
        return res.status(400).json({ success: false, message: 'Description is required' });
      }
      updates.description = String(req.body.descriptionEn);
    }
    if (req.body.status !== undefined) {
      if (!VALID_STATUSES.includes(req.body.status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      updates.status = req.body.status;
    }

    const updated = await Brand.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'Thương hiệu đã tồn tại' });
    }
    next(error);
  }
};

export const deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Brand is invalid' });
    }
    const productUsing = await Product.countDocuments({ brand: id, isDeleted: { $ne: true } });
    if (productUsing > 0) {
      return res.status(400).json({ success: false, message: 'Brand has products; cannot delete' });
    }
    const deleted = await Brand.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    next(error);
  }
};
