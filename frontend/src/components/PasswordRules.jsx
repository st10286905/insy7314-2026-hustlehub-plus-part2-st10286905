import React from "react";
import { Check } from "lucide-react";
import { PASSWORD_RULES } from "../lib/validators";

export default function PasswordRules({ password = "", id = "pw-rules" }) {
    return (
        <ul className="rules" id={id} aria-label="Password requirements">
            {PASSWORD_RULES.map((rule) => {
                const met = rule.test(password);
                return (
                    <li key={rule.id} className={met ? "is-met" : ""}>
                        <span className="rule-dot" aria-hidden="true">
                            {met && <Check size={14} strokeWidth={3} />}
                        </span>
                        <span>
                            {rule.label}
                            <span className="sr-only">{met ? " (done)" : " (not yet)"}</span>
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}
