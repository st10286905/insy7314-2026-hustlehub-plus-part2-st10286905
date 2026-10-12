import { api, unwrap } from "./client";

export const login = (payload) => api.post("/auth/login", payload).then(unwrap);
export const register = (payload) => api.post("/auth/register", payload).then(unwrap);
export const me = () => api.get("/auth/me").then(unwrap);