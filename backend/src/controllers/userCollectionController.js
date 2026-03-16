import User from '../models/User.js';
import {
  hydrateCartItems,
  hydrateWishlistItems,
  mergeCartCollections,
  mergeWishlistCollections,
  sanitizeIncomingCartItems,
  sanitizeIncomingWishlistItems
} from '../services/userCollectionService.js';

const getUserDocument = async (userId) => User.findById(userId);

const saveCartResponse = async (res, user) => {
  const items = await hydrateCartItems(user?.cartItems || []);
  res.json({
    success: true,
    data: {
      items,
      count: items.reduce((sum, item) => sum + (Number(item?.qty) || 0), 0)
    }
  });
};

const saveWishlistResponse = async (res, user) => {
  const items = await hydrateWishlistItems(user?.wishlistItems || []);
  res.json({
    success: true,
    data: {
      items,
      count: items.length
    }
  });
};

export const getMyCart = async (req, res, next) => {
  try {
    const user = await getUserDocument(req.user?._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return saveCartResponse(res, user);
  } catch (error) {
    return next(error);
  }
};

export const replaceMyCart = async (req, res, next) => {
  try {
    const user = await getUserDocument(req.user?._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.cartItems = sanitizeIncomingCartItems(req.body?.items || []);
    await user.save();

    return saveCartResponse(res, user);
  } catch (error) {
    return next(error);
  }
};

export const mergeMyCart = async (req, res, next) => {
  try {
    const user = await getUserDocument(req.user?._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.cartItems = mergeCartCollections(user.cartItems || [], req.body?.items || []);
    await user.save();

    return saveCartResponse(res, user);
  } catch (error) {
    return next(error);
  }
};

export const getMyWishlist = async (req, res, next) => {
  try {
    const user = await getUserDocument(req.user?._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return saveWishlistResponse(res, user);
  } catch (error) {
    return next(error);
  }
};

export const replaceMyWishlist = async (req, res, next) => {
  try {
    const user = await getUserDocument(req.user?._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.wishlistItems = sanitizeIncomingWishlistItems(req.body?.items || []);
    await user.save();

    return saveWishlistResponse(res, user);
  } catch (error) {
    return next(error);
  }
};

export const mergeMyWishlist = async (req, res, next) => {
  try {
    const user = await getUserDocument(req.user?._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.wishlistItems = mergeWishlistCollections(user.wishlistItems || [], req.body?.items || []);
    await user.save();

    return saveWishlistResponse(res, user);
  } catch (error) {
    return next(error);
  }
};
