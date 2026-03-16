import axios from "axios";
import {
    clearStoredAuth,
    getStoredAuthHeaderToken,
    getStoredRefreshToken,
    storeRefreshedSession,
} from "../utils/authStorage";

const RAW_API_URL = import.meta.env.VITE_API_URL;
const API_URL = RAW_API_URL
    ? `${RAW_API_URL.replace(/\/$/, "")}${RAW_API_URL.endsWith("/api") ? "" : "/api"}`
    : "http://localhost:5000/api";

const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

let refreshPromise = null;

const notifyAuthReset = () => {
    if (typeof window === "undefined") return;
    try {
        window.dispatchEvent(new Event("user:updated"));
        window.dispatchEvent(new Event("cart:updated"));
        window.dispatchEvent(new Event("wishlist:updated"));
    } catch {
        void 0;
    }
};

const refreshAccessToken = async () => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) throw new Error("Missing refresh token");
    const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    const newToken = response.data?.data?.accessToken;
    if (!newToken) throw new Error("Missing access token");
    storeRefreshedSession({
        accessToken: newToken,
        refreshToken: response.data?.data?.refreshToken,
    });
    return newToken;
};

axiosInstance.interceptors.request.use(
    (config) => {
        const token = getStoredAuthHeaderToken();
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest?._retry) {
            originalRequest._retry = true;
            try {
                refreshPromise = refreshPromise || refreshAccessToken().finally(() => {
                    refreshPromise = null;
                });
                const newToken = await refreshPromise;
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return axiosInstance(originalRequest);
            } catch {
                clearStoredAuth();
                notifyAuthReset();
                const requestUrl = String(originalRequest?.url || "");
                if (typeof window !== "undefined" && requestUrl && !requestUrl.includes("/auth/")) {
                    window.location.href = "/";
                }
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
