import User from '../models/User.js';

export const LOYALTY_TIERS = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

const TIER_THRESHOLDS = [
  { tier: 'PLATINUM', minSpent: 70000000 },
  { tier: 'GOLD', minSpent: 30000000 },
  { tier: 'SILVER', minSpent: 10000000 },
  { tier: 'BRONZE', minSpent: 0 }
];

export const getLoyaltyTier = (lifetimeSpent = 0) => {
  const safeSpent = Math.max(0, Number(lifetimeSpent) || 0);
  return TIER_THRESHOLDS.find((entry) => safeSpent >= entry.minSpent)?.tier || 'BRONZE';
};

export const calculateOrderLoyaltyPoints = (order) => {
  const totalAmount = Math.max(0, Number(order?.totalAmount) || 0);
  if (totalAmount <= 0) return 0;
  return Math.max(1, Math.floor(totalAmount / 100000));
};

export const getLoyaltyTierBenefits = (tier = 'BRONZE') => {
  const normalizedTier = String(tier || 'BRONZE').toUpperCase();
  const benefits = {
    BRONZE: {
      pointRate: 1,
      shippingDiscountPercent: 0,
      birthdayVoucherValue: 0
    },
    SILVER: {
      pointRate: 1.1,
      shippingDiscountPercent: 5,
      birthdayVoucherValue: 50000
    },
    GOLD: {
      pointRate: 1.25,
      shippingDiscountPercent: 10,
      birthdayVoucherValue: 100000
    },
    PLATINUM: {
      pointRate: 1.5,
      shippingDiscountPercent: 15,
      birthdayVoucherValue: 200000
    }
  };

  return benefits[normalizedTier] || benefits.BRONZE;
};

export const applyCompletedOrderLoyalty = async (order) => {
  if (!order?.user) return null;
  if (order.status !== 'completed' || order.paymentStatus !== 'paid') return null;
  if (order?.loyalty?.awardedAt) return null;

  const user = await User.findById(order.user);
  if (!user) return null;

  const awardedPoints = calculateOrderLoyaltyPoints(order);
  const previousTier = String(user.memberTier || 'BRONZE').toUpperCase();
  user.loyaltyPoints = Math.max(0, Number(user.loyaltyPoints || 0) + awardedPoints);
  user.lifetimeSpent = Math.max(0, Number(user.lifetimeSpent || 0) + Math.max(0, Number(order.totalAmount) || 0));
  user.memberTier = getLoyaltyTier(user.lifetimeSpent);
  await user.save();

  order.loyalty = {
    ...(order.loyalty || {}),
    awardedPoints,
    awardedAt: new Date(),
    reversedPoints: Number(order.loyalty?.reversedPoints || 0),
    reversedAt: order.loyalty?.reversedAt || null,
    tierAtAward: previousTier,
    tierAfterAward: user.memberTier
  };

  return {
    awardedPoints,
    previousTier,
    nextTier: user.memberTier
  };
};

export const reverseOrderLoyalty = async (order) => {
  if (!order?.user) return null;
  if (!order?.loyalty?.awardedAt) return null;
  if (order?.loyalty?.reversedAt) return null;
  if (order.paymentStatus !== 'refunded') return null;

  const user = await User.findById(order.user);
  if (!user) return null;

  const awardedPoints = Math.max(0, Number(order?.loyalty?.awardedPoints || 0));
  const previousTier = String(user.memberTier || 'BRONZE').toUpperCase();
  user.loyaltyPoints = Math.max(0, Number(user.loyaltyPoints || 0) - awardedPoints);
  user.lifetimeSpent = Math.max(0, Number(user.lifetimeSpent || 0) - Math.max(0, Number(order.totalAmount) || 0));
  user.memberTier = getLoyaltyTier(user.lifetimeSpent);
  await user.save();

  order.loyalty = {
    ...(order.loyalty || {}),
    reversedPoints: awardedPoints,
    reversedAt: new Date(),
    tierAtAward: order.loyalty?.tierAtAward || previousTier,
    tierAfterAward: order.loyalty?.tierAfterAward || previousTier
  };

  return {
    reversedPoints: awardedPoints,
    previousTier,
    nextTier: user.memberTier
  };
};
