import { getStoredAccessToken } from "../utils/authStorage";

const RAW_API_URL = import.meta.env.VITE_API_URL;
const API_ORIGIN = RAW_API_URL
    ? String(RAW_API_URL).replace(/\/$/, "").replace(/\/api\/?$/, "")
    : "http://localhost:5000";

const buildRealtimeUrl = () => {
    const token = getStoredAccessToken();
    if (!token) return "";

    try {
        const wsBase = API_ORIGIN.replace(/^http:/i, "ws:").replace(/^https:/i, "wss:");
        const url = new URL("/ws", wsBase);
        url.searchParams.set("token", token);
        return url.toString();
    } catch {
        return "";
    }
};

let socket = null;
let reconnectTimer = null;
let manualClose = false;
const listeners = new Set();

const clearReconnectTimer = () => {
    if (!reconnectTimer) return;
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
};

const notifyListeners = (payload) => {
    listeners.forEach((listener) => {
        try {
            listener(payload);
        } catch {
            void 0;
        }
    });

    try {
        window.dispatchEvent(new CustomEvent("techstore:realtime", { detail: payload }));
    } catch {
        void 0;
    }
};

const scheduleReconnect = () => {
    clearReconnectTimer();
    if (manualClose || listeners.size === 0 || !getStoredAccessToken()) return;
    reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connectRealtime();
    }, 2500);
};

export const closeRealtimeConnection = (isManual = true) => {
    manualClose = isManual;
    clearReconnectTimer();

    if (!socket) return;

    try {
        socket.close();
    } catch {
        void 0;
    }
    socket = null;
};

export const connectRealtime = () => {
    const nextUrl = buildRealtimeUrl();
    if (!nextUrl || socket) return;

    manualClose = false;
    socket = new WebSocket(nextUrl);

    socket.addEventListener("message", (event) => {
        try {
            notifyListeners(JSON.parse(event.data || "{}"));
        } catch {
            void 0;
        }
    });

    socket.addEventListener("close", () => {
        socket = null;
        scheduleReconnect();
    });

    socket.addEventListener("error", () => {
        if (socket) {
            try {
                socket.close();
            } catch {
                void 0;
            }
        }
    });
};

export const refreshRealtimeConnection = () => {
    closeRealtimeConnection(false);
    connectRealtime();
};

export const subscribeRealtime = (listener) => {
    if (typeof listener !== "function") {
        return () => {};
    }

    listeners.add(listener);
    connectRealtime();

    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
            closeRealtimeConnection(true);
        }
    };
};
