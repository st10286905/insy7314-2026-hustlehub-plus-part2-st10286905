import React from "react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginSchema } from "../lib/validators";
import { HOME_BY_ROLE } from "../lib/constants";
import { InlineAlert } from "./feedback";

function getFieldErrors(zodError) {
    const out = {};
    for (const issue of zodError.issues) {
        const key = issue.path[0];
        if (key && !out[key]) out[key] = issue.message;
    }
    return out;
}

export default function LoginForm() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [fields, setFields] = useState({ email: "", password: "" });
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
        const parse = loginSchema.safeParse(fields);
        if (!parse.success) { setErrors(getFieldErrors(parse.error)); return; }

        setBusy(true);
        try {
            const user = await login(parse.data);
            const dest = location.state?.from ?? HOME_BY_ROLE[user.role] ?? "/gigs";
            navigate(dest, { replace: true });
        } catch (err) {
            const status = err?.response?.status;
            const code = err?.response?.data?.code;
            const details = err?.response?.data?.details;
            if (status === 401 || code === "INVALID_CREDENTIALS") {
                setFormError("Invalid email or password.");
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
                <label htmlFor="lf-email">Email</label>
                <input id="lf-email" name="email" type="email" autoComplete="email"
                    maxLength={254} value={fields.email} onChange={change}
                    aria-invalid={!!fieldErrors.email} />
                {fieldErrors.email && <span className="field-error" role="alert">{fieldErrors.email}</span>}
            </div>

            <div className="field">
                <label htmlFor="lf-password">Password</label>
                <input id="lf-password" name="password" type="password" autoComplete="current-password"
                    maxLength={128} value={fields.password} onChange={change}
                    aria-invalid={!!fieldErrors.password} />
                {fieldErrors.password && <span className="field-error" role="alert">{fieldErrors.password}</span>}
            </div>

            <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Logging inâ€¦" : "Log in"}
            </button>
        </form>
    );
}
