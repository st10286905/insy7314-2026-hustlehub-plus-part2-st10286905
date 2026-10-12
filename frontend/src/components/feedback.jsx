import React from "react";
import { Loader2, AlertCircle, Info, CheckCircle2 } from "lucide-react";

const TONE_ICON = { error: AlertCircle, info: Info, success: CheckCircle2 };
const TONE_CLASS = { error: "alert-error", info: "alert-info", success: "alert-success" };

export function InlineAlert({ tone = "error", children }) {
    const Icon = TONE_ICON[tone];
    return (
        <div className={`inline-alert ${TONE_CLASS[tone]}`} role="alert">
            {Icon && <Icon size={16} aria-hidden="true" />}
            <span>{children}</span>
        </div>
    );
}

export function PageLoader() {
    return (
        <div className="page-loader" role="status" aria-label="Loading">
            <Loader2 size={40} className="spin" aria-hidden="true" />
        </div>
    );
}

export function EmptyState({ title, message, action }) {
    return (
        <div className="empty-state">
            <p className="empty-title">{title}</p>
            {message && <p className="empty-message">{message}</p>}
            {action && (
                <button onClick={action.onClick} className="btn btn-primary">
                    {action.label}
                </button>
            )}
        </div>
    );
}
