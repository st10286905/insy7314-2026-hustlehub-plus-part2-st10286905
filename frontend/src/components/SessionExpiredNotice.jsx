import React from "react";
import { useEffect, useState } from "react";
import { InlineAlert } from "./feedback";
import { clearSessionExpired, peekSessionExpired } from "../lib/sessionNotice";

export default function SessionExpiredNotice() {
    const [show] = useState(peekSessionExpired);
    useEffect(() => { clearSessionExpired(); }, []);
    if (!show) return null;
    return (
        <div className="notice-slot">
            <InlineAlert tone="info">Your session has ended. Please log in again.</InlineAlert>
        </div>
    );
}
