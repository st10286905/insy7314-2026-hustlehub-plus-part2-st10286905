import axios from "axios";

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

const TOKEN_KEY = "hh_token";

let token = null;
try {
    token = sessionStorage.getItem(TOKEN_KEY);
} catch {
    token = null;
}

export function getToken() {
    return token;
}
export function setToken(next) {
    token = next || null;
    try {
        if (token) sessionStorage.setItem(TOKEN_KEY, token);
        else sessionStorage.removeItem(TOKEN_KEY);
    } catch { }
}

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api",
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
});

let mockAdapterPromise = null;

api.interceptors.request.use(async (config) => {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (USE_MOCK) {
        mockAdapterPromise ??= import("./mock/adapter").then((m) => m.mockAdapter);
        config.adapter = await mockAdapterPromise;
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err.response?.status;
        const url = err.config?.url || "";
        const isAuthCall = url.includes("/auth/login") || url.includes("/auth/register");
        if (status === 401 && !isAuthCall && token) {
            setToken(null);
            window.dispatchEvent(new CustomEvent("auth:expired"));
        }
        return Promise.reject(err);
    }
);

export function parseApiError(err, fallback = "Something went wrong. Please try again.") {
    const status = err?.response?.status;
    const body = err?.response?.data;
    const fields = {};
    if (Array.isArray(body?.errors)) {
        for (const e of body.errors) {
            const key = e.field || e.path || e.param;
            if (key && !fields[key]) fields[key] = e.message || e.msg;
        }
    }
    let message = body?.message || body?.error || "";
    if (!err?.response) message = "Can't reach the server. Check your connection and try again.";
    else if (status === 429) message = message || "Too many attempts. Please wait a few minutes and try again.";
    else if (status === 403) message = message || "You don't have permission to do that.";
    else if (status >= 500) message = "The server hit a problem. Please try again.";
    return { status, message: message || fallback, fields };
}

export const unwrap = (res) => res.data;