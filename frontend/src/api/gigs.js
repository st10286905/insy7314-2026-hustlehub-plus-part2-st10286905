import { api, unwrap } from "./client";

export const listGigs = (params) => api.get("/gigs", { params }).then(unwrap);
export const gigCategories = (params) => api.get("/gigs/categories", { params }).then(unwrap);
export const getGig = (id) => api.get(`/gigs/${id}`).then(unwrap);

export const myGigs = () => api.get("/gigs/mine").then(unwrap);
export const createGig = (payload) => api.post("/gigs", payload).then(unwrap);
export const updateGig = (id, payload) => api.put(`/gigs/${id}`, payload).then(unwrap);
export const setGigStatus = (id, status) => api.patch(`/gigs/${id}/status`, { status }).then(unwrap);
export const deleteGig = (id) => api.delete(`/gigs/${id}`).then(unwrap);