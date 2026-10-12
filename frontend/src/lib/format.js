const NBSP = " ";

export function formatRand(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "R0";
    const hasCents = Math.round(n * 100) % 100 !== 0;
    const fixed = Math.abs(n).toFixed(hasCents ? 2 : 0);
    const [int, dec] = fixed.split(".");
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
    return `${n < 0 ? "-" : ""}R${grouped}${dec ? "." + dec : ""}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatMonth(ym) {
    const [y, m] = String(ym).split("-").map(Number);
    if (!y || !m) return String(ym);
    return `${MONTHS[m - 1]} ${y}`;
}

export function formatHours(h) {
    const n = Number(h);
    return `${n} ${n === 1 ? "hour" : "hours"}`;
}

export function displayName(name) {
    if (!name) return "";
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export function initials(name) {
    if (!name) return "?";
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function refDate(iso) {
    const d = new Date(iso || Date.now());
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}`;
}
function refSeq(id) {
    const digits = String(id || "").replace(/\D/g, "");
    return (digits.slice(-4) || "0000").padStart(4, "0");
}

export function bookingRef(b) {
    if (!b) return "";
    return b.reference || `#HHB-${refDate(b.createdAt)}-${refSeq(b.id || b._id)}`;
}
export function transactionRef(t) {
    if (!t) return "";
    return t.reference || `#TRX-${refDate(t.createdAt)}-${refSeq(t.id || t._id)}`;
}