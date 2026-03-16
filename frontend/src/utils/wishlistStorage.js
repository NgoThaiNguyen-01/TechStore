import { getMyWishlist, mergeMyWishlist, replaceMyWishlist } from "../services/wishlistApi";
import { readStoredUserProfile } from "./userProfile";

const WISHLIST_KEY = "tech_store_wishlist";
const wishlistHydrationScopes = new Set();
let wishlistSyncQueue = Promise.resolve();

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

const getScopedWishlistKey = (scope) => `${WISHLIST_KEY}:${scope || "guest"}`;

const safeParse = (value, fallback) => {
    try {
        const parsed = JSON.parse(value);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
};

const migrateLegacyWishlistIfNeeded = (scope) => {
    if (!canUseBrowserStorage()) return;
    try {
        const scopedKey = getScopedWishlistKey(scope);
        const scoped = window.localStorage.getItem(scopedKey);
        if (scoped != null) return;
        const legacy = window.localStorage.getItem(WISHLIST_KEY);
        if (legacy == null) return;
        window.localStorage.setItem(scopedKey, legacy);
        window.localStorage.removeItem(WISHLIST_KEY);
    } catch {
        void 0;
    }
};

const notifyWishlistUpdated = () => {
    if (!canUseBrowserStorage()) return;
    try {
        window.dispatchEvent(new Event("wishlist:updated"));
    } catch {
        void 0;
    }
};

const readScopedWishlist = (scope) => {
    if (!canUseBrowserStorage()) return [];
    migrateLegacyWishlistIfNeeded(scope);
    const stored = window.localStorage.getItem(getScopedWishlistKey(scope));
    const data = stored ? safeParse(stored, []) : [];
    return Array.isArray(data) ? data : [];
};

const writeScopedWishlist = (scope, items, { dispatch = true } = {}) => {
    if (!canUseBrowserStorage()) return [];
    const normalized = Array.isArray(items) ? items : [];
    window.localStorage.setItem(getScopedWishlistKey(scope), JSON.stringify(normalized));
    if (dispatch) notifyWishlistUpdated();
    return normalized;
};

const enqueueWishlistSync = (handler) => {
    wishlistSyncQueue = wishlistSyncQueue
        .catch(() => void 0)
        .then(handler)
        .catch(() => void 0);
    return wishlistSyncQueue;
};

const buildWishlistSyncPayload = (items = []) =>
    (Array.isArray(items) ? items : [])
        .map((item) => {
            const productId = String(item?.productId || item?._id || item?.id || "").trim();
            if (!productId) return null;
            return { productId };
        })
        .filter(Boolean);

const scheduleWishlistReplace = (scope, items) => {
    if (!isSignedInScope(scope)) return Promise.resolve(items);
    const snapshot = buildWishlistSyncPayload(items);
    return enqueueWishlistSync(async () => {
        const response = await replaceMyWishlist(snapshot);
        const nextItems = response?.data?.items || [];
        writeScopedWishlist(scope, nextItems, { dispatch: true });
        wishlistHydrationScopes.add(scope);
        return nextItems;
    });
};

const maybeHydrateWishlistFromServer = (scope) => {
    if (!isSignedInScope(scope) || wishlistHydrationScopes.has(scope)) return;
    wishlistHydrationScopes.add(scope);
    enqueueWishlistSync(async () => {
        try {
            const response = await getMyWishlist();
            const nextItems = response?.data?.items || [];
            writeScopedWishlist(scope, nextItems, { dispatch: true });
            return nextItems;
        } catch {
            wishlistHydrationScopes.delete(scope);
            return readScopedWishlist(scope);
        }
    });
};

export const loadWishlist = () => {
    const scope = getUserScope();
    const items = readScopedWishlist(scope);
    maybeHydrateWishlistFromServer(scope);
    return items;
};

export const saveWishlist = (items, options = {}) => {
    const scope = getUserScope();
    const nextItems = writeScopedWishlist(scope, items || [], { dispatch: true });
    if (!options?.skipServerSync && isSignedInScope(scope)) {
        scheduleWishlistReplace(scope, nextItems);
    }
    return nextItems;
};

export const syncWishlistFromServer = async () => {
    const scope = getUserScope();
    if (!isSignedInScope(scope)) return readScopedWishlist(scope);

    const response = await getMyWishlist();
    const nextItems = response?.data?.items || [];
    writeScopedWishlist(scope, nextItems, { dispatch: true });
    wishlistHydrationScopes.add(scope);
    return nextItems;
};

export const toggleWishlist = (product) => {
    const items = loadWishlist();
    const productId = String(product?._id || product?.productId || "");
    const exists = items.find((entry) => String(entry?._id || entry?.productId || "") === productId);
    let next;
    if (exists) {
        next = items.filter((entry) => String(entry?._id || entry?.productId || "") !== productId);
    } else {
        next = [product, ...items];
    }
    saveWishlist(next);
    return next;
};

export const isInWishlist = (productId) => {
    const items = loadWishlist();
    return items.some((entry) => String(entry?._id || entry?.productId || "") === String(productId));
};

export const getWishlistCount = () => loadWishlist().length;

export const migrateGuestWishlistToCurrentUser = async () => {
    if (!canUseBrowserStorage()) return false;
    const scope = getUserScope();
    if (!isSignedInScope(scope)) return false;

    try {
        const guestRaw = window.localStorage.getItem(getScopedWishlistKey("guest"));
        const guestItems = safeParse(guestRaw, []);
        if (!Array.isArray(guestItems) || guestItems.length === 0) {
            await syncWishlistFromServer();
            return false;
        }

        const response = await mergeMyWishlist(buildWishlistSyncPayload(guestItems));
        const nextItems = response?.data?.items || [];
        writeScopedWishlist(scope, nextItems, { dispatch: true });
        window.localStorage.removeItem(getScopedWishlistKey("guest"));
        wishlistHydrationScopes.add(scope);
        return true;
    } catch {
        const guestRaw = window.localStorage.getItem(getScopedWishlistKey("guest"));
        const guestItems = safeParse(guestRaw, []);
        if (!Array.isArray(guestItems) || guestItems.length === 0) return false;

        const userItems = readScopedWishlist(scope);
        const merged = Array.isArray(userItems) ? [...userItems] : [];
        const existingIds = new Set(merged.map((item) => String(item?._id || item?.productId || "")));

        guestItems.forEach((item) => {
            const id = String(item?._id || item?.productId || "");
            if (!id || existingIds.has(id)) return;
            existingIds.add(id);
            merged.unshift(item);
        });

        window.localStorage.removeItem(getScopedWishlistKey("guest"));
        saveWishlist(merged);
        return true;
    }
};
