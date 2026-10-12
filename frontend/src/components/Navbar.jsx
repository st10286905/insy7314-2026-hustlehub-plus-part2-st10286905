import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoFull from "../assets/logo-full.svg";

const NAV_LINKS = {
    client: [{ label: "Browse gigs", path: "/browse" }, { label: "My bookings", path: "/my-bookings" }],
    freelancer: [{ label: "My gigs", path: "/my-gigs" }, { label: "Bookings & income", path: "/bookings-income" }, { label: "Browse gigs", path: "/gigs" }],
    admin: [{ label: "Overview", path: "/admin" }],
};

function initials(name) {
    return name ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
}

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const links = user ? (NAV_LINKS[user.role] ?? []) : [];

    return (
        <nav style={{
            display: "flex", alignItems: "center", height: "64px",
            padding: "0 32px", background: "var(--hh-card)",
            borderBottom: "1px solid var(--hh-border)",
            position: "sticky", top: 0, zIndex: 100, gap: "40px"
        }}>
            {/* Logo */}
            <button onClick={() => navigate(links[0]?.path ?? "/")}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                <img src={logoFull} alt="HustleHub+" height="32" />
            </button>

            {/* Nav links */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }}>
                {links.map(l => {
                    const active = location.pathname === l.path;
                    return (
                        <button key={l.path} onClick={() => navigate(l.path)} style={{
                            background: "none", border: "none", borderBottom: active ? "2px solid var(--hh-gold)" : "2px solid transparent",
                            color: active ? "var(--hh-text)" : "var(--hh-muted)",
                            fontSize: "15px", fontWeight: active ? 600 : 500,
                            padding: "6px 16px", paddingBottom: "4px", cursor: "pointer",
                            fontFamily: "var(--hh-font)"
                        }}>
                            {l.label}
                        </button>
                    );
                })}
            </div>

            {/* User section */}
            {user && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "auto" }}>
                    <div style={{
                        width: "36px", height: "36px", borderRadius: "50%",
                        background: "var(--hh-purple)", color: "#fff",
                        fontSize: "13px", fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>{initials(user.name)}</div>
                    <span style={{ color: "var(--hh-text)", fontSize: "14px", fontWeight: 500 }}>{user.name}</span>
                    <span style={{ color: "var(--hh-muted)", fontSize: "12px" }}>∨</span>
                    <button onClick={() => { logout(); navigate("/login"); }} style={{
                        background: "none", border: "none", color: "var(--hh-muted)",
                        fontSize: "14px", cursor: "pointer", padding: "6px 10px",
                        borderRadius: "6px", fontFamily: "var(--hh-font)"
                    }}>Log out</button>
                </div>
            )}
        </nav>
    );
}