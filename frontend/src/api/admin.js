import { api, unwrap } from "./client";

export const overview = () => api.get("/admin/overview").then(unwrap);
export const adminList = (kind, params) => api.get(`/admin/${kind}`, { params }).then(unwrap);