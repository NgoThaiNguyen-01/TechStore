import AuditLog from '../models/AuditLog.js';
import FlashSale from '../models/FlashSale.js';
import { emitRealtimeEvent } from '../services/realtimeService.js';

const FLASH_SALE_POPULATE = [
  { path: 'createdBy', select: 'name email avatar role' },
  { path: 'closedBy', select: 'name email avatar role' }
];

const serializeActor = (user) =>
  user
    ? {
        _id: user._id,
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || '',
        role: user.role || ''
      }
    : null;

const getFlashSaleStatus = (flashSale, now = new Date()) => {
  if (!flashSale) return 'inactive';
  if (flashSale.isPublished && new Date(flashSale.endAt).getTime() > now.getTime()) {
    return 'active';
  }
  if (flashSale.closeReason === 'cleared') return 'cleared';
  if (flashSale.closeReason === 'replaced') return 'replaced';
  return 'expired';
};

const serializeFlashSale = (flashSale, now = new Date()) => ({
  _id: flashSale?._id || '',
  endAt: flashSale?.endAt || null,
  isPublished: Boolean(flashSale?.isPublished),
  closeReason: flashSale?.closeReason || null,
  closedAt: flashSale?.closedAt || null,
  createdAt: flashSale?.createdAt || null,
  updatedAt: flashSale?.updatedAt || null,
  createdBy: serializeActor(flashSale?.createdBy),
  closedBy: serializeActor(flashSale?.closedBy),
  status: getFlashSaleStatus(flashSale, now)
});

const expirePublishedFlashSales = async () => {
  const now = new Date();
  await FlashSale.updateMany(
    {
      isPublished: true,
      endAt: { $lte: now }
    },
    {
      $set: {
        isPublished: false,
        closeReason: 'expired',
        closedAt: now
      }
    }
  );
};

const getCurrentFlashSale = async () => {
  await expirePublishedFlashSales();
  return FlashSale.findOne({
    isPublished: true,
    endAt: { $gt: new Date() }
  })
    .sort({ createdAt: -1 })
    .populate(FLASH_SALE_POPULATE);
};

const parseFlashSaleDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getPublicFlashSale = async (req, res, next) => {
  try {
    const current = await getCurrentFlashSale();
    res.json({
      success: true,
      data: current ? serializeFlashSale(current) : null
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminFlashSales = async (req, res, next) => {
  try {
    const current = await getCurrentFlashSale();
    const items = await FlashSale.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .populate(FLASH_SALE_POPULATE);

    const now = new Date();
    res.json({
      success: true,
      data: {
        current: current ? serializeFlashSale(current, now) : null,
        items: items.map((item) => serializeFlashSale(item, now))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createFlashSale = async (req, res, next) => {
  try {
    const endAt = parseFlashSaleDate(req.body?.endAt);
    if (!endAt) {
      return res.status(400).json({ success: false, message: 'Invalid flash sale end time' });
    }

    const now = new Date();
    if (endAt.getTime() <= now.getTime()) {
      return res.status(400).json({ success: false, message: 'Flash sale end time must be in the future' });
    }

    await expirePublishedFlashSales();

    await FlashSale.updateMany(
      { isPublished: true },
      {
        $set: {
          isPublished: false,
          closeReason: 'replaced',
          closedAt: now,
          closedBy: req.user?._id || null
        }
      }
    );

    const flashSale = await FlashSale.create({
      endAt,
      isPublished: true,
      createdBy: req.user?._id
    });

    await AuditLog.create({
      actor: req.user?._id,
      action: 'flashSale.create',
      resource: 'flash_sale',
      details: { endAt },
      ip: req.ip
    });

    const current = await FlashSale.findById(flashSale._id).populate(FLASH_SALE_POPULATE);

    res.status(201).json({
      success: true,
      message: 'Flash sale created successfully',
      data: current ? serializeFlashSale(current) : null
    });
    emitRealtimeEvent({ type: 'flashsale.updated', audience: 'all', data: { status: 'active' } });
  } catch (error) {
    next(error);
  }
};

export const clearFlashSale = async (req, res, next) => {
  try {
    await expirePublishedFlashSales();

    const current = await FlashSale.findOne({
      isPublished: true,
      endAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!current) {
      return res.status(404).json({ success: false, message: 'No active flash sale found' });
    }

    current.isPublished = false;
    current.closeReason = 'cleared';
    current.closedAt = new Date();
    current.closedBy = req.user?._id || null;
    await current.save();

    await AuditLog.create({
      actor: req.user?._id,
      action: 'flashSale.clear',
      resource: 'flash_sale',
      details: { flashSaleId: current._id },
      ip: req.ip
    });

    const cleared = await FlashSale.findById(current._id).populate(FLASH_SALE_POPULATE);

    res.json({
      success: true,
      message: 'Flash sale cleared successfully',
      data: cleared ? serializeFlashSale(cleared) : null
    });
    emitRealtimeEvent({ type: 'flashsale.updated', audience: 'all', data: { status: 'inactive' } });
  } catch (error) {
    next(error);
  }
};
