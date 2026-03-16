const parseNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeAddress = (value) => String(value || '')
  .trim()
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .toLowerCase();

const SHIPPING_ZONE_CONFIG = {
  local_hcm: {
    carrier: 'Ahamove',
    service: 'Noi thanh nhanh',
    estimatedMinDays: 0,
    estimatedMaxDays: 1,
    baseFee: 18000,
    extraItemFee: 3000,
    freeThreshold: 1500000
  },
  south: {
    carrier: 'GHN',
    service: 'Tieu chuan mien Nam',
    estimatedMinDays: 2,
    estimatedMaxDays: 3,
    baseFee: 28000,
    extraItemFee: 4000,
    freeThreshold: 3000000
  },
  central: {
    carrier: 'Viettel Post',
    service: 'Lien vung mien Trung',
    estimatedMinDays: 3,
    estimatedMaxDays: 4,
    baseFee: 36000,
    extraItemFee: 5000,
    freeThreshold: 4000000
  },
  north: {
    carrier: 'GHTK',
    service: 'Lien vung mien Bac',
    estimatedMinDays: 4,
    estimatedMaxDays: 6,
    baseFee: 42000,
    extraItemFee: 6000,
    freeThreshold: 5000000
  },
  remote: {
    carrier: 'VNPost',
    service: 'Vung xa',
    estimatedMinDays: 5,
    estimatedMaxDays: 8,
    baseFee: 60000,
    extraItemFee: 8000,
    freeThreshold: 7000000
  }
};

const ZONE_KEYWORDS = {
  remote: [
    'phu quoc',
    'con dao',
    'truong sa',
    'hoang sa',
    'dien bien',
    'lai chau',
    'ha giang',
    'cao bang',
    'bac kan',
    'son la',
    'yen bai',
    'lao cai'
  ],
  local_hcm: [
    'ho chi minh',
    'tp hcm',
    'tphcm',
    'sai gon'
  ],
  north: [
    'ha noi',
    'hai phong',
    'quang ninh',
    'bac ninh',
    'bac giang',
    'thai nguyen',
    'lang son',
    'phu tho',
    'nam dinh',
    'ninh binh',
    'hai duong',
    'hung yen',
    'thanh hoa',
    'nghe an'
  ],
  central: [
    'da nang',
    'thua thien hue',
    'hue',
    'quang nam',
    'quang ngai',
    'binh dinh',
    'phu yen',
    'khanh hoa',
    'nha trang',
    'dak lak',
    'dak nong',
    'gia lai',
    'kon tum',
    'lam dong'
  ],
  south: [
    'binh duong',
    'dong nai',
    'ba ria',
    'vung tau',
    'can tho',
    'long an',
    'tay ninh',
    'tien giang',
    'ben tre',
    'tra vinh',
    'vinh long',
    'hau giang',
    'soc trang',
    'bac lieu',
    'ca mau',
    'kien giang',
    'an giang',
    'dong thap'
  ]
};

export const detectShippingZone = (address) => {
  const normalized = normalizeAddress(address);
  if (!normalized) return 'south';

  const matchedZone = Object.entries(ZONE_KEYWORDS).find(([, keywords]) =>
    keywords.some((keyword) => normalized.includes(keyword))
  );

  return matchedZone?.[0] || 'south';
};

export const calculateShippingEstimate = ({
  address,
  subtotal,
  itemCount,
  paymentMethod,
  shippingDiscountPercent = 0
} = {}) => {
  const zone = detectShippingZone(address);
  const config = SHIPPING_ZONE_CONFIG[zone] || SHIPPING_ZONE_CONFIG.south;
  const normalizedSubtotal = Math.max(0, parseNumber(subtotal, 0));
  const normalizedItemCount = Math.max(1, Math.round(parseNumber(itemCount, 1)));
  const normalizedDiscountPercent = Math.max(0, parseNumber(shippingDiscountPercent, 0));

  const baseFee = config.baseFee;
  const itemSurcharge = Math.max(0, normalizedItemCount - 1) * config.extraItemFee;
  const paymentSurcharge = paymentMethod === 'cod' && zone === 'remote' ? 5000 : 0;
  const rawFee = baseFee + itemSurcharge + paymentSurcharge;
  const isFreeShipping = normalizedSubtotal >= config.freeThreshold;
  const loyaltyDiscountAmount = isFreeShipping
    ? 0
    : Math.round(rawFee * (normalizedDiscountPercent / 100));

  return {
    zone,
    carrier: config.carrier,
    service: config.service,
    estimatedMinDays: config.estimatedMinDays,
    estimatedMaxDays: config.estimatedMaxDays,
    baseFee,
    itemSurcharge,
    paymentSurcharge,
    freeThreshold: config.freeThreshold,
    shippingDiscountPercent: normalizedDiscountPercent,
    loyaltyDiscountAmount,
    shippingFee: isFreeShipping ? 0 : Math.max(0, rawFee - loyaltyDiscountAmount),
    isFreeShipping,
    itemCount: normalizedItemCount,
    subtotal: normalizedSubtotal
  };
};

export const buildOrderShipmentFromEstimate = (estimate = {}) => ({
  zone: String(estimate.zone || '').trim(),
  carrier: String(estimate.carrier || '').trim(),
  service: String(estimate.service || '').trim(),
  trackingNumber: '',
  trackingUrl: '',
  estimatedMinDays: Number(estimate.estimatedMinDays) || null,
  estimatedMaxDays: Number(estimate.estimatedMaxDays) || null,
  shippedAt: null,
  deliveredAt: null,
  lastUpdatedAt: new Date()
});

export const buildShippingEstimateTimelineNote = (estimate = {}) => (
  [
    estimate.zone ? `zone:${estimate.zone}` : '',
    estimate.carrier ? `carrier:${estimate.carrier}` : '',
    estimate.service ? `service:${estimate.service}` : '',
    Number.isFinite(Number(estimate.estimatedMinDays)) || Number.isFinite(Number(estimate.estimatedMaxDays))
      ? `eta:${Number(estimate.estimatedMinDays) || 0}-${Number(estimate.estimatedMaxDays) || Number(estimate.estimatedMinDays) || 0}`
      : '',
    Number.isFinite(Number(estimate.shippingFee)) ? `fee:${Math.round(Number(estimate.shippingFee) || 0)}` : '',
    Number.isFinite(Number(estimate.loyaltyDiscountAmount)) && Number(estimate.loyaltyDiscountAmount) > 0
      ? `loyalty_discount:${Math.round(Number(estimate.loyaltyDiscountAmount) || 0)}`
      : '',
    Number.isFinite(Number(estimate.shippingDiscountPercent)) && Number(estimate.shippingDiscountPercent) > 0
      ? `loyalty_rate:${Math.round(Number(estimate.shippingDiscountPercent) || 0)}`
      : ''
  ]
    .filter(Boolean)
    .join(' | ')
);
