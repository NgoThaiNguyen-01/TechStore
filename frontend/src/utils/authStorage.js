const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const REFRESH_TOKEN_COOKIE = "refreshToken";
const USER_KEY = "user";
const REMEMBER_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const canUseBrowserStorage = () => typeof window !== "undefined";

const getCookieValue = (name) => {
    if (typeof document === "undefined") return null;
    const prefix = `${name}=`;
    const entry = document.cookie
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(prefix));

    if (!entry) return null;

    try {
        return decodeURIComponent(entry.slice(prefix.length));
    } catch {
        return entry.slice(prefix.length);
    }
};

const setRefreshTokenCookie = (token) => {
    if (typeof document === "undefined") return;
    document.cookie = `${REFRESH_TOKEN_COOKIE}=${encodeURIComponent(token)}; Max-Age=${REMEMBER_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
};

const clearRefreshTokenCookie = () => {
    if (typeof document === "undefined") return;
    document.cookie = `${REFRESH_TOKEN_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
};

const removeLocalStorageKey = (key) => {
    if (!canUseBrowserStorage()) return;
    window.localStorage.removeItem(key);
};

const getStoredRefreshTokenMode = () => {
    if (!canUseBrowserStorage()) return "localStorage";
    const localToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
    if (localToken) return "localStorage";
    const cookieToken = getCookieValue(REFRESH_TOKEN_COOKIE);
    if (cookieToken) return "cookie";
    return "localStorage";
};

export const getStoredAccessToken = () => {
    if (!canUseBrowserStorage()) return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getStoredRefreshToken = () => {
    if (!canUseBrowserStorage()) return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY) || getCookieValue(REFRESH_TOKEN_COOKIE);
};

export const getStoredAuthHeaderToken = () => {
    if (!canUseBrowserStorage()) return null;

    const accessToken = getStoredAccessToken();
    if (accessToken) return accessToken;

    try {
        const rawUser = window.localStorage.getItem(USER_KEY);
        if (!rawUser) return null;
        const user = JSON.parse(rawUser);
        return user?.token || user?.accessToken || null;
    } catch {
        return null;
    }
};

export const setStoredAccessToken = (token) => {
    if (!canUseBrowserStorage()) return;

    if (token) {
        window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
        return;
    }

    removeLocalStorageKey(ACCESS_TOKEN_KEY);
};

export const setStoredRefreshToken = (token, mode = "localStorage") => {
    if (!canUseBrowserStorage()) return;

    removeLocalStorageKey(REFRESH_TOKEN_KEY);
    clearRefreshTokenCookie();

    if (!token) return;

    if (mode === "cookie") {
        setRefreshTokenCookie(token);
        return;
    }

    window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const persistAuthSession = ({ accessToken, refreshToken, user, remember = false } = {}) => {
    if (!canUseBrowserStorage()) return;

    setStoredAccessToken(accessToken || null);
    setStoredRefreshToken(refreshToken || null, remember ? "cookie" : "localStorage");

    if (user !== undefined) {
        if (user) {
            window.localStorage.setItem(USER_KEY, JSON.stringify(user));
        } else {
            removeLocalStorageKey(USER_KEY);
        }
    }
};

export const storeRefreshedSession = ({ accessToken, refreshToken } = {}) => {
    if (!canUseBrowserStorage()) return;

    if (accessToken) {
        setStoredAccessToken(accessToken);
    }

    if (refreshToken) {
        setStoredRefreshToken(refreshToken, getStoredRefreshTokenMode());
    }
};

export const clearStoredAuth = () => {
    if (!canUseBrowserStorage()) {
        clearRefreshTokenCookie();
        return;
    }

    removeLocalStorageKey(ACCESS_TOKEN_KEY);
    removeLocalStorageKey(REFRESH_TOKEN_KEY);
    removeLocalStorageKey(USER_KEY);
    clearRefreshTokenCookie();
};
