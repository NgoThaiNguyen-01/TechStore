const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ');

export const normalizeEmailValue = (value) => String(value || '').trim().toLowerCase();

export const normalizePhoneValue = (value) => String(value || '').trim();

export const normalizeAddressValue = (value) => normalizeText(value);

const normalizeLabel = (value) => String(value || '').trim().slice(0, 80);

const normalizeContactValue = (type, value) => {
  if (type === 'email') return normalizeEmailValue(value);
  if (type === 'phone') return normalizePhoneValue(value);
  if (type === 'address') return normalizeAddressValue(value);
  return normalizeText(value);
};

const getFallbackValue = (source, type) => {
  if (type === 'email') return normalizeEmailValue(source?.email);
  if (type === 'phone') return normalizePhoneValue(source?.phone);
  if (type === 'address') return normalizeAddressValue(source?.address);
  return '';
};

const getSourceItems = (source, key) => {
  const raw = source?.[key];
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
};

const toContactItem = (raw, type) => {
  if (!raw) return null;

  if (typeof raw === 'string') {
    const value = normalizeContactValue(type, raw);
    return value ? { value, label: '', isDefault: false } : null;
  }

  const value = normalizeContactValue(type, raw.value);
  if (!value) return null;

  const next = {
    value,
    label: normalizeLabel(raw.label),
    isDefault: Boolean(raw.isDefault)
  };

  if (raw._id) {
    next._id = raw._id;
  }

  return next;
};

const dedupeContacts = (items) => {
  const unique = new Map();

  items.forEach((item) => {
    if (!item?.value) return;
    const key = item.value;
    const existing = unique.get(key);

    if (!existing) {
      unique.set(key, { ...item });
      return;
    }

    existing.isDefault = existing.isDefault || item.isDefault;
    if (!existing.label && item.label) existing.label = item.label;
    if (!existing._id && item._id) existing._id = item._id;
  });

  return Array.from(unique.values());
};

const normalizeContactList = (source, { key, type }) => {
  const fallbackValue = getFallbackValue(source, type);
  const candidates = getSourceItems(source, key)
    .map((item) => toContactItem(item, type))
    .filter(Boolean);

  if (fallbackValue) {
    candidates.unshift({ value: fallbackValue, label: '', isDefault: false });
  }

  const unique = dedupeContacts(candidates);
  if (unique.length === 0) return [];

  let defaultIndex = unique.findIndex((item) => item.isDefault);
  if (defaultIndex < 0 && fallbackValue) {
    defaultIndex = unique.findIndex((item) => item.value === fallbackValue);
  }
  if (defaultIndex < 0) defaultIndex = 0;

  return unique.map((item, index) => ({
    ...item,
    isDefault: index === defaultIndex
  }));
};

export const normalizeUserContactProfile = (source = {}) => {
  const emails = normalizeContactList(source, { key: 'emails', type: 'email' });
  const phones = normalizeContactList(source, { key: 'phones', type: 'phone' });
  const addresses = normalizeContactList(source, { key: 'addresses', type: 'address' });

  const defaultEmail = emails.find((item) => item.isDefault)?.value || normalizeEmailValue(source.email);
  const defaultPhone = phones.find((item) => item.isDefault)?.value || normalizePhoneValue(source.phone);
  const defaultAddress = addresses.find((item) => item.isDefault)?.value || normalizeAddressValue(source.address);

  return {
    emails,
    phones,
    addresses,
    email: defaultEmail,
    phone: defaultPhone,
    address: defaultAddress
  };
};

export const formatUserProfileResponse = (user) => {
  if (!user) return null;

  const raw = typeof user.toObject === 'function' ? user.toObject() : user;
  const { password, __v, cartItems, wishlistItems, ...rest } = raw;
  const contacts = normalizeUserContactProfile(rest);

  return {
    ...rest,
    ...contacts
  };
};

export const extractUserContactValues = (profile = {}) => ({
  emails: Array.from(new Set((profile.emails || []).map((item) => normalizeEmailValue(item?.value)).filter(Boolean))),
  phones: Array.from(new Set((profile.phones || []).map((item) => normalizePhoneValue(item?.value)).filter(Boolean)))
});
