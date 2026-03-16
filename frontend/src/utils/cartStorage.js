import { getMyCart, mergeMyCart, replaceMyCart } from "../services/cartApi";
import { readStoredUserProfile } from "./userProfile";

const CART_KEY = "cart";
const cartHydrationScopes = new Set();
let cartSyncQueue = Promise.resolve();

const canUseBrowserStorage = () => typeof window !== "undefined";

const getUserScope = () => {
    if (!canUseBrowserStorage()) return "guest";
    try {
        const user = readStoredUserProfile();
        const id = user?.id || user?._id || user?.email;
        return id ? String(id) : "guest";
    } catch {
        return "guest";
    }
};

const isSignedInScope = (scope) => scope && scope !== "guest";

const getScopedCartKey = (scope) => `${CART_KEY}:${scope || "guest"}`;

const migrateLegacyCartIfNeeded = (scope) => {
    if (!canUseBrowserStorage()) return;
    try {
        const scopedKey = getScopedCartKey(scope);
        const scoped = window.localStorage.getItem(scopedKey);
        if (scoped != null) return;
        const legacy = window.localStorage.getItem(CART_KEY);
        if (legacy == null) return;
        window.localStorage.setItem(scopedKey, legacy);
        window.localStorage.removeItem(CART_KEY);
    } catch {
        void 0;
    }
};

const safeParse = (value, fallback) => {
    try {
        const parsed = JSON.parse(value);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
};

const notifyCartUpdated = () => {
    if (!canUseBrowserStorage()) return;
    try {
        window.dispatchEvent(new Event("cart:updated"));
    } catch {
        void 0;
    }
};

const readScopedCart = (scope) => {
    if (!canUseBrowserStorage()) return [];
    migrateLegacyCartIfNeeded(scope);
    const raw = window.localStorage.getItem(getScopedCartKey(scope));
    const data = safeParse(raw, []);
    return Array.isArray(data) ? data : [];
};

const writeScopedCart = (scope, items, { dispatch = true } = {}) => {
    if (!canUseBrowserStorage()) return [];
    const normalized = Array.isArray(items) ? items : [];
    window.localStorage.setItem(getScopedCartKey(scope), JSON.stringify(normalized));
    if (dispatch) notifyCartUpdated();
    return normalized;
};

const enqueueCartSync = (handler) => {
    cartSyncQueue = cartSyncQueue
        .catch(() => void 0)
        .then(handler)
        .catch(() => void 0);
    return cartSyncQueue;
};

const buildCartSyncPayload = (items = []) =>
    (Array.isArray(items) ? items : [])
        .map((item) => {
            const productId = String(item?.productId || item?._id || "").trim();
            if (!productId) return null;
            return {
                key: String(item?.key || `${productId}::${String(item?.variant || "").trim()}`),
                productId,
                variant: String(item?.variant || "").trim(),
                qty: Math.max(1, Number(item?.qty) || 1),
            };
        })
        .filter(Boolean);

const scheduleCartReplace = (scope, items) => {
    if (!isSignedInScope(scope)) return Promise.resolve(items);
    const snapshot = buildCartSyncPayload(items);
    return enqueueCartSync(async () => {
        const response = await replaceMyCart(snapshot);
        const nextItems = response?.data?.items || [];
        writeScopedCart(scope, nextItems, { dispatch: true });
        cartHydrationScopes.add(scope);
        return nextItems;
    });
};

const maybeHydrateCartFromServer = (scope) => {
    if (!isSignedInScope(scope) || cartHydrationScopes.has(scope)) return;
    cartHydrationScopes.add(scope);
    enqueueCartSync(async () => {
        try {
            const response = await getMyCart();
            const nextItems = response?.data?.items || [];
            writeScopedCart(scope, nextItems, { dispatch: true });
            return nextItems;
        } catch {
            cartHydrationScopes.delete(scope);
            return readScopedCart(scope);
        }
    });
};

export const loadCart = () => {
    const scope = getUserScope();
    const items = readScopedCart(scope);
    maybeHydrateCartFromServer(scope);
    return items;
};

export const saveCart = (items, options = {}) => {
    const scope = getUserScope();
    const nextItems = writeScopedCart(scope, items || [], { dispatch: true });
    if (!options?.skipServerSync && isSignedInScope(scope)) {
        scheduleCartReplace(scope, nextItems);
    }
    return nextItems;
};

export const syncCartFromServer = async () => {
    const scope = getUserScope();
    if (!isSignedInScope(scope)) return readScopedCart(scope);

    const response = await getMyCart();
    const nextItems = response?.data?.items || [];
    writeScopedCart(scope, nextItems, { dispatch: true });
    cartHydrationScopes.add(scope);
    return nextItems;
};

export const getCartCount = () => loadCart().reduce((sum, it) => sum + (Number(it?.qty) || 0), 0);

export const buildCartItemFromProduct = ({ product, qty = 1, selectedColor }) => {
    const productId = String(product?._id || product?.id || product?.name || "");
    const variant = selectedColor?.name ? String(selectedColor.name) : "";
    const key = `${productId}::${variant}`;
    const unitPrice = Number(product?.salePrice ?? product?.price ?? 0) || 0;
    const image = product?.images?.[0] || product?.img || product?.image || "";
    const brand = product?.brand?.name || product?.brand || product?.category?.name || "";
    const name = product?.name || "";
    const stock = Number(product?.stock) || 0;
    return {
        key,
        productId,
        name,
        brand,
        variant,
        image,
        unitPrice,
        qty: Math.max(1, Number(qty) || 1),
        stock,
    };
};

export const addToCart = (item) => {
    const items = loadCart();
    const idx = items.findIndex((x) => x?.key === item?.key);
    const stock = Number(item?.stock) || 99;
    if (idx >= 0) {
        const next = [...items];
        const nextQty = Math.min(stock, (Number(next[idx].qty) || 0) + (Number(item.qty) || 1));
        next[idx] = { ...next[idx], qty: nextQty };
        saveCart(next);
        return next;
    }
    const finalQty = Math.min(stock, Number(item.qty) || 1);
    const nextItems = [{ ...item, qty: finalQty }, ...items];
    saveCart(nextItems);
    return nextItems;
};

export const updateCartQty = (key, qty) => {
    const items = loadCart();
    const it = items.find((x) => x?.key === key);
    const stock = Number(it?.stock) || 99;
    const nextQty = Math.max(1, Math.min(stock, Number(qty) || 1));
    const next = items.map((entry) => (entry?.key === key ? { ...entry, qty: nextQty } : entry));
    saveCart(next);
    return next;
};

export const removeFromCart = (key) => {
    const items = loadCart();
    const next = items.filter((it) => it?.key !== key);
    saveCart(next);
    return next;
};

export const clearCart = () => {
    saveCart([]);
    return [];
};

export const migrateGuestCartToCurrentUser = async () => {
    if (!canUseBrowserStorage()) return false;
    const scope = getUserScope();
    if (!isSignedInScope(scope)) return false;

    try {
        const guestRaw = window.localStorage.getItem(getScopedCartKey("guest"));
        const guestItems = safeParse(guestRaw, []);
        if (!Array.isArray(guestItems) || guestItems.length === 0) {
            await syncCartFromServer();
            return false;
        }

        const response = await mergeMyCart(buildCartSyncPayload(guestItems));
        const nextItems = response?.data?.items || [];
        writeScopedCart(scope, nextItems, { dispatch: true });
        window.localStorage.removeItem(getScopedCartKey("guest"));
        cartHydrationScopes.add(scope);
        return true;
    } catch {
        const guestRaw = window.localStorage.getItem(getScopedCartKey("guest"));
        const guestItems = safeParse(guestRaw, []);
        if (!Array.isArray(guestItems) || guestItems.length === 0) return false;

        const userItems = readScopedCart(scope);
        const merged = [...userItems];

        guestItems.forEach((it) => {
            const idx = merged.findIndex((x) => x?.key === it?.key);
            const stock = Number(it?.stock) || 99;
            const addQty = Number(it?.qty) || 0;
            if (idx >= 0) {
                const cur = Number(merged[idx]?.qty) || 0;
                merged[idx] = { ...merged[idx], qty: Math.min(stock, cur + addQty) };
            } else {
                merged.unshift({ ...it, qty: Math.min(stock, addQty || 1) });
            }
        });

        window.localStorage.removeItem(getScopedCartKey("guest"));
        saveCart(merged);
        return true;
    }
};
