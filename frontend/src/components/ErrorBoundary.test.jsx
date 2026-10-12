import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import ErrorBoundary from "./ErrorBoundary";

function Bomb() {
    throw new Error("test explosion");
}

beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => { }));
afterEach(() => console.error.mockRestore());

describe("ErrorBoundary", () => {
    it("renders children normally", () => {
        render(<ErrorBoundary><p>All good</p></ErrorBoundary>);
        expect(screen.getByText("All good")).toBeInTheDocument();
    });

    it("shows calm fallback when child crashes", () => {
        render(<ErrorBoundary><Bomb /></ErrorBoundary>);
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /reload/i })).toBeInTheDocument();
    });

    it("never shows the raw error message", () => {
        render(<ErrorBoundary><Bomb /></ErrorBoundary>);
        expect(screen.queryByText(/test explosion/i)).toBeNull();
    });
});
