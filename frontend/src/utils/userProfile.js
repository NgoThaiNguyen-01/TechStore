const normalizeText = (value) => String(value || "").trim().replace(/\s+/g, " ");

export const normalizeEmailValue = (value) => String(value || "").trim().toLowerCase();

export const normalizePhoneValue = (value) => String(value || "").trim();

export const normalizeAddressValue = (value) => normalizeText(value);

const normalizeLabel = (value) => String(value || "").trim().slice(0, 80);

const normalizeContactValue = (type, value) => {
    if (type === "email") return normalizeEmailValue(value);
    if (type === "phone") return normalizePhoneValue(value);
    if (type === "address") return normalizeAddressValue(value);
    return normalizeText(value);
};

const getFallbackValue = (source, type) => {
    if (type === "email") return normalizeEmailValue(source?.email);
    if (type === "phone") return normalizePhoneValue(source?.phone);
    if (type === "address") return normalizeAddressValue(source?.address);
    return "";
};

const toContactItem = (raw, type) => {
    if (!raw) return null;

    if (typeof raw === "string") {
        const value = normalizeContactValue(type, raw);
        return value ? { value, label: "", isDefault: false } : null;
    }

    const value = normalizeContactValue(type, raw.value);
    if (!value) return null;

    return {
        _id: raw._id || raw.id || `${type}:${value}`,
        value,
        label: normalizeLabel(raw.label),
        isDefault: Boolean(raw.isDefault),
    };
};

const dedupeContacts = (items) => {
    const map = new Map();

    items.forEach((item) => {
        if (!item?.value) return;
        const key = item.value;
        const existing = map.get(key);
        if (!existing) {
            map.set(key, { ...item, _id: item._id || key });
            return;
        }
        existing.isDefault = existing.isDefault || item.isDefault;
        if (!existing.label && item.label) existing.label = item.label;
        if (!existing._id && item._id) existing._id = item._id;
    });

    return Array.from(map.values());
};

const normalizeContactList = (source, listKey, type) => {
    const rawList = Array.isArray(source?.[listKey]) ? source[listKey] : [];
    const fallbackValue = getFallbackValue(source, type);
    const items = rawList
        .map((item) => toContactItem(item, type))
        .filter(Boolean);

    if (fallbackValue) {
        items.unshift({
            _id: `${type}:${fallbackValue}`,
            value: fallbackValue,
            label: "",
            isDefault: false,
        });
    }

    const unique = dedupeContacts(items);
    if (unique.length === 0) return [];

    let defaultIndex = unique.findIndex((item) => item.isDefault);
    if (defaultIndex < 0 && fallbackValue) {
        defaultIndex = unique.findIndex((item) => item.value === fallbackValue);
    }
    if (defaultIndex < 0) defaultIndex = 0;

    return unique.map((item, index) => ({
        ...item,
        isDefault: index === defaultIndex,
    }));
};

export const normalizeUserProfile = (user = {}) => {
    const emails = normalizeContactList(user, "emails", "email");
    const phones = normalizeContactList(user, "phones", "phone");
    const addresses = normalizeContactList(user, "addresses", "address");
    const normalizedId = String(user.id || user._id || "").trim();
    const permissions = Array.from(
        new Set(
            (Array.isArray(user.permissions) ? user.permissions : [])
                .concat(Array.isArray(user.roles) ? user.roles.flatMap((r) => r?.permissions || []) : [])
                .map((permission) => String(permission || "").trim())
                .filter(Boolean)
        )
    );

    return {
        ...user,
        id: normalizedId,
        _id: user._id || normalizedId,
        name: normalizeText(user.name),
        avatar: String(user.avatar || "").trim(),
        loyaltyPoints: Math.max(0, Number(user.loyaltyPoints || 0)),
        lifetimeSpent: Math.max(0, Number(user.lifetimeSpent || 0)),
        memberTier: String(user.memberTier || "BRONZE").trim().toUpperCase(),
        emails,
        phones,
        addresses,
        permissions,
        email: emails.find((item) => item.isDefault)?.value || normalizeEmailValue(user.email),
        phone: phones.find((item) => item.isDefault)?.value || normalizePhoneValue(user.phone),
        address: addresses.find((item) => item.isDefault)?.value || normalizeAddressValue(user.address),
    };
};

export const readStoredUserProfile = () => {
    if (typeof window === "undefined") return null;

    try {
        const raw = window.localStorage.getItem("user");
        if (!raw) return null;
        return normalizeUserProfile(JSON.parse(raw));
    } catch {
        return null;
    }
};

export const writeStoredUserProfile = (profile) => {
    if (typeof window === "undefined") return null;

    const nextProfile = normalizeUserProfile(profile);

    try {
        const current = JSON.parse(window.localStorage.getItem("user") || "{}");
        const merged = {
            ...current,
            ...nextProfile,
        };
        window.localStorage.setItem("user", JSON.stringify(merged));
    } catch {
        window.localStorage.setItem("user", JSON.stringify(nextProfile));
    }

    return nextProfile;
};

export const getDefaultContact = (items = []) => items.find((item) => item?.isDefault) || items[0] || null;

export const getContactById = (items = [], id) => items.find((item) => String(item?._id) === String(id)) || null;

export const setDefaultContact = (items = [], id) => {
    const normalized = items.map((item) => ({ ...item, isDefault: String(item?._id) === String(id) }));
    if (normalized.length > 0 && !normalized.some((item) => item.isDefault)) {
        normalized[0].isDefault = true;
    }
    return normalized;
};

export const removeContactItem = (items = [], id) => {
    const filtered = items.filter((item) => String(item?._id) !== String(id));
    if (filtered.length > 0 && !filtered.some((item) => item.isDefault)) {
        filtered[0] = { ...filtered[0], isDefault: true };
    }
    return filtered;
};

export const upsertContactItem = (items = [], type, rawValue, options = {}) => {
    const value = normalizeContactValue(type, rawValue);
    if (!value) return items;

    const nextLabel = normalizeLabel(options.label);
    const nextId = options.id ? String(options.id) : null;

    const nextItems = items.map((item) => ({
        ...item,
        isDefault: options.makeDefault ? false : item.isDefault,
    }));

    const matchIndex = nextItems.findIndex((item) =>
        (nextId && String(item?._id) === nextId) || item.value === value
    );

    const nextItem = {
        _id: nextId || nextItems[matchIndex]?._id || `${type}:${value}`,
        value,
        label: nextLabel || nextItems[matchIndex]?.label || "",
        isDefault: Boolean(options.makeDefault),
    };

    if (matchIndex >= 0) {
        nextItems[matchIndex] = nextItem;
    } else {
        nextItems.push(nextItem);
    }

    if (!nextItems.some((item) => item.isDefault) && nextItems.length > 0) {
        nextItems[0] = { ...nextItems[0], isDefault: true };
    }

    return nextItems;
};
