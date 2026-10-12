import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PasswordRules from "./PasswordRules";

describe("PasswordRules", () => {
    it("renders all five rules", () => {
        render(<PasswordRules password="" />);
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/uppercase/i)).toBeInTheDocument();
        expect(screen.getByText(/lowercase/i)).toBeInTheDocument();
        expect(screen.getByText(/number/i)).toBeInTheDocument();
        expect(screen.getByText(/special character/i)).toBeInTheDocument();
    });

    it("marks a rule met when password satisfies it", () => {
        render(<PasswordRules password="ABCDEFGH" />);
        // The uppercase rule should be met — its li gets class "met"
        const items = screen.getAllByRole("listitem");
        // Rule index 1 = uppercase
        const upperItem = items[1];
        expect(upperItem.className).toMatch(/met/);
    });

    it("has sr-only text for screen readers", () => {
        render(<PasswordRules password="" />);
        // The component renders " (not yet)" in sr-only spans
        const srSpans = document.querySelectorAll(".sr-only");
        expect(srSpans.length).toBeGreaterThan(0);
        expect(srSpans[0].textContent).toMatch(/not yet/i);
    });
});