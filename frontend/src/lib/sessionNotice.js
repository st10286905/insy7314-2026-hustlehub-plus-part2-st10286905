const KEY = "hustlehub_session_expired";

export function markSessionExpired() {
    try { sessionStorage.setItem(KEY, "1"); } catch { /* private mode */ }
}

export function peekSessionExpired() {
    try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; }
}

export function clearSessionExpired() {
    try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}