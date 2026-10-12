import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { registerSchema } from "../lib/validators";
import { HOME_BY_ROLE } from "../lib/constants";
import { InlineAlert } from "./feedback";
import PasswordRules from "./PasswordRules";

const ALLOWED_ROLES = ["client", "freelancer"];

function getFieldErrors(zodError) {
    const out = {};
    for (const issue of zodError.issues) {
        const key = issue.path[0];
        if (key && !out[key]) out[key] = issue.message;
    }
    return out;
}

export default function RegisterForm() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [fields, setFields] = useState({ name: "", email: "", password: "", role: "client" });
    const [fieldErrors, setErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [busy, setBusy] = useState(false);

    function change(e) {
        setFields((p) => ({ ...p, [e.target.name]: e.target.value }));
        setErrors((p) => ({ ...p, [e.target.name]: "" }));
        setFormError("");
    }

    async function submit(e) {
        e.preventDefault();
        setFormError("");
        const safeRole = ALLOWED_ROLES.includes(fields.role) ? fields.role : "client";
        const payload = { ...fields, role: safeRole };
        const parse = registerSchema.safeParse(payload);
        if (!parse.success) { setErrors(getFieldErrors(parse.error)); return; }

        setBusy(true);
        try {
            const user = await register(parse.data);
            navigate(HOME_BY_ROLE[user.role] ?? "/gigs", { replace: true });
        } catch (err) {
            const status = err?.response?.status;
            const code = err?.response?.data?.code;
            const details = err?.response?.data?.details;
            if (code === "DUPLICATE_EMAIL" || status === 409) {
                setErrors((p) => ({ ...p, email: "An account with this email already exists." }));
            } else if (details && typeof details === "object") {
                const mapped = {};
                for (const [k, v] of Object.entries(details)) mapped[k] = Array.isArray(v) ? v[0] : String(v);
                setErrors(mapped);
            } else {
                setFormError("Something went wrong. Please try again.");
            }
        } finally {
            setBusy(false);
        }
    }

    return (
        <form onSubmit={submit} noValidate>
            {formError && <InlineAlert tone="error">{formError}</InlineAlert>}

            <div className="field">
                <label htmlFor="rf-name">Name</label>
                <input id="rf-name" name="name" type="text" autoComplete="name"
                    maxLength={60} value={fields.name} onChange={change} aria-invalid={!!fieldErrors.name} />
                {fieldErrors.name && <span className="field-error" role="alert">{fieldErrors.name}</span>}
            </div>

            <div className="field">
                <label htmlFor="rf-email">Email</label>
                <input id="rf-email" name="email" type="email" autoComplete="email"
                    maxLength={254} value={fields.email} onChange={change} aria-invalid={!!fieldErrors.email} />
                {fieldErrors.email && <span className="field-error" role="alert">{fieldErrors.email}</span>}
            </div>

            <div className="field">
                <label htmlFor="rf-password">Password</label>
                <input id="rf-password" name="password" type="password" autoComplete="new-password"
                    maxLength={128} value={fields.password} onChange={change}
                    aria-describedby="pw-rules" aria-invalid={!!fieldErrors.password} />
                <PasswordRules password={fields.password} id="pw-rules" />
                {fieldErrors.password && <span className="field-error" role="alert">{fieldErrors.password}</span>}
            </div>

            <fieldset className="role-cards">
                <legend>I want to join as</legend>
                <div className="role-cards-grid">
                    {ALLOWED_ROLES.map((r) => (
                        <label key={r} className={`radio-card ${fields.role === r ? "selected" : ""}`}>
                            <input type="radio" name="role" value={r} checked={fields.role === r} onChange={change} />
                            <div className="card-body">
                                <strong>{r.charAt(0).toUpperCase() + r.slice(1)}</strong>
                                <span>{r === "client" ? "Hire freelancers to get projects done." : "Offer your services and grow your income."}</span>
                            </div>
                        </label>
                    ))}
                </div>
                {fieldErrors.role && <span className="field-error" role="alert">{fieldErrors.role}</span>}
            </fieldset>

            <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Creating accountâ€¦" : "Create account"}
            </button>
        </form>
    );
}
