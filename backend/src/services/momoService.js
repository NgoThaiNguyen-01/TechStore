import crypto from 'crypto';
import dotenv from 'dotenv';

const DEFAULT_MOMO_CREATE_ENDPOINT = 'https://test-payment.momo.vn/v2/gateway/api/create';
const DEFAULT_MOMO_QUERY_ENDPOINT = 'https://test-payment.momo.vn/v2/gateway/api/query';

const normalizeUrl = (value) => String(value || '').trim().replace(/\/$/, '');
const normalizeBoolean = (value, fallback = true) => {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return fallback;
};

const loadMomoEnv = () => {
  dotenv.config({ override: true });
};

const getMomoConfig = () => {
  loadMomoEnv();

  return {
    partnerCode: String(process.env.MOMO_PARTNER_CODE || '').trim(),
    accessKey: String(process.env.MOMO_ACCESS_KEY || '').trim(),
    secretKey: String(process.env.MOMO_SECRET_KEY || '').trim(),
    partnerName: String(process.env.MOMO_PARTNER_NAME || 'TechStore').trim(),
    storeId: String(process.env.MOMO_STORE_ID || 'TechStore').trim(),
    requestType: String(process.env.MOMO_REQUEST_TYPE || 'payWithMethod').trim() || 'payWithMethod',
    orderInfoPrefix: String(process.env.MOMO_ORDER_INFO_PREFIX || 'Thanh toan don hang').trim() || 'Thanh toan don hang',
    paymentCode: String(process.env.MOMO_PAYMENT_CODE || '').trim(),
    orderGroupId: String(process.env.MOMO_ORDER_GROUP_ID || '').trim(),
    autoCapture: normalizeBoolean(process.env.MOMO_AUTO_CAPTURE, true),
    createEndpoint: normalizeUrl(process.env.MOMO_ENDPOINT || DEFAULT_MOMO_CREATE_ENDPOINT),
    queryEndpoint: normalizeUrl(process.env.MOMO_QUERY_ENDPOINT || DEFAULT_MOMO_QUERY_ENDPOINT),
    frontendUrl: normalizeUrl(process.env.FRONTEND_URL || 'http://localhost:5173'),
    backendPublicUrl: normalizeUrl(process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`)
  };
};

const createSignature = (payload, secretKey) =>
  crypto.createHmac('sha256', secretKey).update(payload).digest('hex');

const encodeExtraData = (value) => Buffer.from(JSON.stringify(value || {})).toString('base64');

export const isMomoConfigured = () => {
  const config = getMomoConfig();
  return Boolean(config.partnerCode && config.accessKey && config.secretKey);
};

export const isMomoAutoCaptureEnabled = () => getMomoConfig().autoCapture;

export const buildFrontendMomoReturnUrl = ({ orderId, resultCode, message }) => {
  const { frontendUrl, autoCapture } = getMomoConfig();
  const url = new URL(frontendUrl || 'http://localhost:5173');
  url.searchParams.set('page', 'orders');
  url.searchParams.set('momoReturn', '1');
  if (orderId) url.searchParams.set('orderNumber', orderId);
  if (message) url.searchParams.set('paymentMessage', String(message));
  if (resultCode !== undefined && resultCode !== null && resultCode !== '') {
    url.searchParams.set('paymentCode', String(resultCode));
    if (Number(resultCode) === 0) {
      url.searchParams.set('paymentResult', 'success');
    } else if (Number(resultCode) === 9000) {
      url.searchParams.set('paymentResult', autoCapture ? 'success' : 'pending');
    } else if ([7000, 7002, 9100, 9101].includes(Number(resultCode))) {
      url.searchParams.set('paymentResult', 'pending');
    } else {
      url.searchParams.set('paymentResult', 'failed');
    }
  }
  return url.toString();
};

export const createMomoPayment = async ({ order, lang = 'vi' }) => {
  const config = getMomoConfig();
  if (!config.partnerCode || !config.accessKey || !config.secretKey) {
    throw new Error('Thanh toan chuyen khoan chua duoc cau hinh');
  }

  const requestType = config.requestType;
  const requestId = `REQ-${order.orderNumber}-${Date.now()}`;
  const orderId = order.orderNumber;
  const amount = String(Math.round(Number(order.totalAmount) || 0));
  const redirectUrl = buildFrontendMomoReturnUrl({ orderId: order.orderNumber });
  const ipnUrl = `${config.backendPublicUrl}/api/orders/payment/momo/ipn`;
  const orderInfo = `${config.orderInfoPrefix} ${order.orderNumber}`.trim();
  const extraData = encodeExtraData({
    orderDbId: String(order._id),
    userId: String(order.user),
    orderNumber: order.orderNumber
  });
  const signaturePayload =
    `accessKey=${config.accessKey}&amount=${amount}&extraData=${extraData}`
    + `&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}`
    + `&partnerCode=${config.partnerCode}&redirectUrl=${redirectUrl}`
    + `&requestId=${requestId}&requestType=${requestType}`;

  const body = {
    partnerCode: config.partnerCode,
    partnerName: config.partnerName,
    storeId: config.storeId,
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    requestType,
    extraData,
    lang: lang === 'en' ? 'en' : 'vi',
    autoCapture: config.autoCapture,
    orderGroupId: config.orderGroupId,
    signature: createSignature(signaturePayload, config.secretKey)
  };
  if (config.paymentCode) {
    body.paymentCode = config.paymentCode;
  }

  const response = await fetch(config.createEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const result = await response.json();
  if (!response.ok || Number(result?.resultCode) !== 0 || !result?.payUrl) {
    throw new Error(result?.message || 'Khong the tao giao dich thanh toan chuyen khoan');
  }

  return {
    requestId,
    payUrl: result.payUrl,
    deeplink: result.deeplink || '',
    qrCodeUrl: result.qrCodeUrl || '',
    responseTime: result.responseTime || Date.now(),
    message: result.message || '',
    raw: result
  };
};

export const queryMomoPayment = async ({ orderId, lang = 'vi' }) => {
  const config = getMomoConfig();
  if (!config.partnerCode || !config.accessKey || !config.secretKey) {
    throw new Error('Thanh toan chuyen khoan chua duoc cau hinh');
  }

  const requestId = `QUERY-${orderId}-${Date.now()}`;
  const signaturePayload =
    `accessKey=${config.accessKey}&orderId=${orderId}&partnerCode=${config.partnerCode}`
    + `&requestId=${requestId}`;

  const response = await fetch(config.queryEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      partnerCode: config.partnerCode,
      requestId,
      orderId,
      lang: lang === 'en' ? 'en' : 'vi',
      signature: createSignature(signaturePayload, config.secretKey)
    })
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result?.message || 'Khong the truy van giao dich thanh toan chuyen khoan');
  }

  return result;
};

export const verifyMomoResultSignature = (payload) => {
  const config = getMomoConfig();
  if (!config.partnerCode || !config.accessKey || !config.secretKey) {
    return false;
  }

  const normalized = normalizeMomoResultPayload(payload);
  const signaturePayload =
    `accessKey=${config.accessKey}&amount=${normalized.amount}&extraData=${normalized.extraData}`
    + `&message=${normalized.message}&orderId=${normalized.orderId}&orderInfo=${normalized.orderInfo}`
    + `&orderType=${normalized.orderType}&partnerCode=${normalized.partnerCode}&payType=${normalized.payType}`
    + `&requestId=${normalized.requestId}&responseTime=${normalized.responseTime}`
    + `&resultCode=${normalized.resultCode}&transId=${normalized.transId}`;

  return createSignature(signaturePayload, config.secretKey) === normalized.signature;
};

export const normalizeMomoResultPayload = (payload = {}) => ({
  partnerCode: String(payload.partnerCode || ''),
  orderId: String(payload.orderId || ''),
  requestId: String(payload.requestId || ''),
  amount: String(payload.amount || ''),
  orderInfo: String(payload.orderInfo || ''),
  orderType: String(payload.orderType || 'momo_wallet'),
  transId: String(payload.transId || ''),
  resultCode: String(payload.resultCode ?? ''),
  message: String(payload.message || ''),
  payType: String(payload.payType || ''),
  responseTime: String(payload.responseTime || ''),
  extraData: String(payload.extraData || ''),
  signature: String(payload.signature || '')
});
