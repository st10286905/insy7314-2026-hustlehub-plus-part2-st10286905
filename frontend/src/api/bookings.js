import { api, unwrap } from "./client";

export const createBooking = (payload) => api.post("/bookings", payload).then(unwrap);
export const getBooking = (id) => api.get(`/bookings/${id}`).then(unwrap);
export const myBookings = (params) => api.get("/bookings/mine", { params }).then(unwrap);
export const incomingBookings = (params) => api.get("/bookings/incoming", { params }).then(unwrap);
export const setBookingStatus = (id, status) => api.patch(`/bookings/${id}/status`, { status }).then(unwrap);
export const myTransactions = (params) => api.get("/transactions/mine", { params }).then(unwrap);
export const income = () => api.get("/income").then(unwrap);