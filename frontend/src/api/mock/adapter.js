import { AxiosError } from "axios";
import { users, gigs, bookings, transactions, addBooking, newId } from "./db";

const LATENCY = 250;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const CATEGORIES = ["Development", "Design", "Writing", "Marketing", "Other"];

class HttpError extends Error {
    constructor(status, message, errors) {
        super(message);
        this.status = status;
        this.errors = errors;
    }
}

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt });
const person = (id) => {
    const u = users.find((x) => x.id === id);
    return u ? { id: u.id, name: u.name } : null;
};
const gigOut = (g) => ({ ...g, freelancer: person(g.freelancer) });
const gigBrief = (g) => g && { id: g.id, title: g.title, category: g.category, rate: g.rate, durationHours: g.durationHours };
const txOut = (t) => t && { id: t.id, amount: t.amount, status: t.status, createdAt: t.createdAt };

function bookingOut(b) {
    const gig = gigs.find((g) => g.id === b.gig);
    const tx = transactions.find((t) => t.booking === b.id);
    return {
        id: b.id, status: b.status, notes: b.notes, createdAt: b.createdAt,
        gig: gigBrief(gig), client: person(b.client), freelancer: person(b.freelancer), transaction: txOut(tx),
    };
}
function transactionOut(t) {
    const b = bookings.find((x) => x.id === t.booking);
    const gig = b && gigs.find((g) => g.id === b.gig);
    return {
        ...txOut(t), booking: { id: t.booking }, gig: gigBrief(gig),
        client: person(t.client), freelancer: person(t.freelancer),
    };
}

function paginate(list, query) {
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 10));
    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(Math.max(1, Number(query.page) || 1), pages);
    return { data: list.slice((page - 1) * limit, page * limit), meta: { page, limit, total, pages } };
}

const failedLogins = new Map();

function authUser(config) {
    const header = config.headers?.Authorization || config.headers?.get?.("Authorization") || "";
    const m = /^Bearer mock\.(.+)$/.exec(header);
    const u = m && users.find((x) => x.id === m[1]);
    if (!u) throw new HttpError(401, "Please log in to continue.");
    return u;
}
function need(user, ...roles) {
    if (!roles.includes(user.role)) throw new HttpError(403, "You don't have permission to do that.");
}

function validateGig(body) {
    const errors = [];
    const text = String(body.description || "").replace(/<[^>]*>/g, "").trim();
    if (!body.title || String(body.title).length > 100) errors.push({ field: "title", message: "Title is required (max 100 characters)." });
    if (!CATEGORIES.includes(body.category)) errors.push({ field: "category", message: "Choose a valid category." });
    if (!text || text.length > 2000) errors.push({ field: "description", message: "Description is required (max 2000 characters)." });
    if (!(Number(body.rate) >= 1)) errors.push({ field: "rate", message: "Rate must be at least R1." });
    const h = Number(body.durationHours);
    if (!(Number.isInteger(h) && h >= 1 && h <= 40)) errors.push({ field: "durationHours", message: "Duration must be 1 to 40 hours." });
    if (errors.length) throw new HttpError(422, "Please fix the highlighted fields.", errors);
}

const routes = [];
const route = (method, pattern, handler) =>
    routes.push({ method, re: new RegExp("^" + pattern.replace(/:(\w+)/g, "(?<$1>[^/]+)") + "$"), handler });

route("post", "/auth/register", ({ body }) => {
    const errors = [];
    if (!/^\S+@\S+\.\S+$/.test(body.email || "")) errors.push({ field: "email", message: "Enter a valid email address." });
    if (!["client", "freelancer"].includes(body.role)) errors.push({ field: "role", message: "Choose a role." });
    if (!body.name || !String(body.name).trim()) errors.push({ field: "name", message: "Enter your name." });
    if (errors.length) throw new HttpError(422, "Please fix the highlighted fields.", errors);
    const email = body.email.trim().toLowerCase();
    if (users.some((u) => u.email === email)) throw new HttpError(409, "We couldn't create that account. Try logging in instead.");
    const u = { id: newId(), name: body.name.trim(), email, role: body.role, password: body.password, createdAt: new Date().toISOString() };
    users.push(u);
    return { status: 201, data: { data: { token: "mock." + u.id, user: publicUser(u) } } };
});
route("post", "/auth/login", ({ body }) => {
    const email = String(body.email || "").trim().toLowerCase();
    if ((failedLogins.get(email) || 0) >= 5) throw new HttpError(429, "Too many attempts. Please try again in 15 minutes.");
    const u = users.find((x) => x.email === email && x.password === body.password);
    if (!u) {
        failedLogins.set(email, (failedLogins.get(email) || 0) + 1);
        throw new HttpError(401, "Invalid email or password.");
    }
    failedLogins.delete(email);
    return { data: { data: { token: "mock." + u.id, user: publicUser(u) } } };
});
route("get", "/auth/me", ({ user }) => ({ data: { data: publicUser(user) } }));

route("get", "/gigs/categories", ({ query }) => {
    const q = String(query.search || "").toLowerCase();
    const active = gigs.filter((g) => g.status === "Active" && (!q || g.title.toLowerCase().includes(q)));
    return { data: { data: CATEGORIES.map((c) => ({ category: c, count: active.filter((g) => g.category === c).length })) } };
});
route("get", "/gigs/mine", ({ user }) => {
    need(user, "freelancer");
    return { data: { data: gigs.filter((g) => g.freelancer === user.id).map(gigOut) } };
});
route("get", "/gigs", ({ query }) => {
    let list = gigs.filter((g) => g.status === "Active");
    const q = String(query.search || "").trim().toLowerCase();
    if (q) list = list.filter((g) => (g.title + " " + g.description).toLowerCase().includes(q));
    const cats = String(query.category || "").split(",").filter(Boolean);
    if (cats.length) list = list.filter((g) => cats.includes(g.category));
    if (query.minRate) list = list.filter((g) => g.rate >= Number(query.minRate));
    if (query.maxRate) list = list.filter((g) => g.rate <= Number(query.maxRate));
    if (query.sort === "price_asc") list = [...list].sort((a, b) => a.rate - b.rate);
    else if (query.sort === "price_desc") list = [...list].sort((a, b) => b.rate - a.rate);
    else list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const out = paginate(list, { ...query, limit: query.limit || 6 });
    return { data: { data: out.data.map(gigOut), meta: out.meta } };
});
route("get", "/gigs/:id", ({ params }) => {
    const g = gigs.find((x) => x.id === params.id);
    if (!g) throw new HttpError(404, "That gig doesn't exist.");
    return { data: { data: gigOut(g) } };
});
route("post", "/gigs", ({ user, body }) => {
    need(user, "freelancer");
    validateGig(body);
    const g = {
        id: newId(), freelancer: user.id, title: body.title.trim(), category: body.category,
        description: body.description, rate: Number(body.rate), durationHours: Number(body.durationHours),
        status: body.status === "Paused" ? "Paused" : "Active", createdAt: new Date().toISOString(),
    };
    gigs.unshift(g);
    return { status: 201, data: { data: gigOut(g) } };
});
const ownGig = (id, user) => {
    const g = gigs.find((x) => x.id === id);
    if (!g) throw new HttpError(404, "That gig doesn't exist.");
    if (user.role !== "admin" && g.freelancer !== user.id) throw new HttpError(403, "You can only change your own gigs.");
    return g;
};
route("put", "/gigs/:id", ({ user, params, body }) => {
    need(user, "freelancer");
    const g = ownGig(params.id, user);
    validateGig(body);
    Object.assign(g, {
        title: body.title.trim(), category: body.category, description: body.description,
        rate: Number(body.rate), durationHours: Number(body.durationHours),
        status: body.status === "Paused" ? "Paused" : "Active",
    });
    return { data: { data: gigOut(g) } };
});
route("patch", "/gigs/:id/status", ({ user, params, body }) => {
    need(user, "freelancer");
    const g = ownGig(params.id, user);
    if (!["Active", "Paused"].includes(body.status)) throw new HttpError(422, "Status must be Active or Paused.");
    g.status = body.status;
    return { data: { data: gigOut(g) } };
});
route("delete", "/gigs/:id", ({ user, params }) => {
    need(user, "freelancer", "admin");
    const g = ownGig(params.id, user);
    gigs.splice(gigs.indexOf(g), 1);
    return { data: { data: { id: g.id } } };
});

route("post", "/bookings", ({ user, body }) => {
    need(user, "client");
    const g = gigs.find((x) => x.id === body.gigId);
    if (!g) throw new HttpError(404, "That gig doesn't exist.");
    if (g.status !== "Active") throw new HttpError(409, "This gig isn't taking bookings right now.");
    if ((body.notes || "").length > 500) throw new HttpError(422, "Please fix the highlighted fields.", [{ field: "notes", message: "Notes must be 500 characters or fewer." }]);
    const { b } = addBooking({ gig: g, client: user, createdAt: new Date().toISOString(), status: "Confirmed", notes: body.notes || "" });
    return { status: 201, data: { data: bookingOut(b) } };
});
route("get", "/bookings/mine", ({ user, query }) => {
    need(user, "client");
    const out = paginate(bookings.filter((b) => b.client === user.id), { ...query, limit: query.limit || 5 });
    return { data: { data: out.data.map(bookingOut), meta: out.meta } };
});
route("get", "/bookings/incoming", ({ user, query }) => {
    need(user, "freelancer");
    const out = paginate(bookings.filter((b) => b.freelancer === user.id), { ...query, limit: query.limit || 8 });
    return { data: { data: out.data.map(bookingOut), meta: out.meta } };
});
route("get", "/bookings/:id", ({ user, params }) => {
    const b = bookings.find((x) => x.id === params.id);
    if (!b) throw new HttpError(404, "That booking doesn't exist.");
    if (user.role !== "admin" && b.client !== user.id && b.freelancer !== user.id) throw new HttpError(403, "You can't view this booking.");
    return { data: { data: bookingOut(b) } };
});
route("patch", "/bookings/:id/status", ({ user, params, body }) => {
    const b = bookings.find((x) => x.id === params.id);
    if (!b) throw new HttpError(404, "That booking doesn't exist.");
    const tx = transactions.find((t) => t.booking === b.id);
    if (body.status === "Cancelled") {
        if (b.client !== user.id && b.freelancer !== user.id) throw new HttpError(403, "You can't change this booking.");
        if (!["Pending", "Confirmed"].includes(b.status)) throw new HttpError(409, "This booking can no longer be cancelled.");
        b.status = "Cancelled";
        if (tx) tx.status = "Refunded";
    } else if (body.status === "Completed") {
        if (b.freelancer !== user.id) throw new HttpError(403, "Only the freelancer can complete a booking.");
        if (!["Pending", "Confirmed"].includes(b.status)) throw new HttpError(409, "This booking can't be completed.");
        b.status = "Completed";
        if (tx) tx.status = "Completed";
    } else {
        throw new HttpError(422, "Status must be Cancelled or Completed.");
    }
    return { data: { data: bookingOut(b) } };
});
route("get", "/transactions/mine", ({ user, query }) => {
    need(user, "client");
    const out = paginate(transactions.filter((t) => t.client === user.id), { ...query, limit: query.limit || 5 });
    return { data: { data: out.data.map(transactionOut), meta: out.meta } };
});
route("get", "/income", ({ user }) => {
    need(user, "freelancer");
    const mine = transactions.filter((t) => t.freelancer === user.id);
    const done = mine.filter((t) => t.status === "Completed");
    const months = new Map();
    for (const t of done) {
        const key = t.createdAt.slice(0, 7);
        const m = months.get(key) || { month: key, count: 0, amount: 0 };
        m.count += 1;
        m.amount += t.amount;
        months.set(key, m);
    }
    const mineBookings = bookings.filter((b) => b.freelancer === user.id);
    return {
        data: {
            data: {
                totalEarned: done.reduce((s, t) => s + t.amount, 0),
                completedCount: mineBookings.filter((b) => b.status === "Completed").length,
                pendingCount: mineBookings.filter((b) => b.status === "Pending").length,
                byMonth: [...months.values()].sort((a, b) => b.month.localeCompare(a.month)).slice(0, 5),
                recent: mine.slice(0, 10).map(transactionOut),
            },
        },
    };
});

route("get", "/admin/overview", ({ user }) => {
    need(user, "admin");
    return { data: { data: { users: users.length, gigs: gigs.length, bookings: bookings.length, transactions: transactions.length } } };
});
route("get", "/admin/users", ({ user, query }) => {
    need(user, "admin");
    const out = paginate([...users].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), query);
    return { data: { data: out.data.map(publicUser), meta: out.meta } };
});
route("get", "/admin/gigs", ({ user, query }) => {
    need(user, "admin");
    const out = paginate([...gigs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), query);
    return { data: { data: out.data.map(gigOut), meta: out.meta } };
});
route("get", "/admin/bookings", ({ user, query }) => {
    need(user, "admin");
    const out = paginate(bookings, query);
    return { data: { data: out.data.map(bookingOut), meta: out.meta } };
});

const PUBLIC = [/^\/gigs(\/categories)?$/, /^\/gigs\/(?!mine$)[^/]+$/, /^\/auth\/(login|register)$/];

export async function mockAdapter(config) {
    await wait(LATENCY);
    const method = (config.method || "get").toLowerCase();
    const url = new URL(config.url, "http://mock");
    const path = url.pathname.replace(/^\/api/, "");
    const query = { ...Object.fromEntries(url.searchParams), ...(config.params || {}) };
    let body = config.data;
    if (typeof body === "string") {
        try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const respond = (status, data) => {
        const response = { data, status, statusText: String(status), headers: {}, config, request: {} };
        if (status < 400) return response;
        throw new AxiosError(data.message, status >= 500 ? "ERR_BAD_RESPONSE" : "ERR_BAD_REQUEST", config, {}, response);
    };

    try {
        for (const r of routes) {
            if (r.method !== method) continue;
            const m = r.re.exec(path);
            if (!m) continue;
            const isPublic = PUBLIC.some((p) => p.test(path));
            const user = isPublic && !config.headers?.Authorization ? null : isPublic ? tryUser(config) : authUser(config);
            const result = r.handler({ user, params: m.groups || {}, query, body });
            return respond(result.status || 200, result.data);
        }
        throw new HttpError(404, "Not found.");
    } catch (e) {
        if (e instanceof AxiosError) throw e;
        if (e instanceof HttpError) return respond(e.status, { message: e.message, errors: e.errors });
        throw e;
    }
}

function tryUser(config) {
    try { return authUser(config); } catch { return null; }
}