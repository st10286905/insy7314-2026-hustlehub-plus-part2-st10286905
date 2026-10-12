import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";
import GuestRoute from "./GuestRoute";

vi.mock("../context/AuthContext", () => ({
    useAuth: vi.fn(),
}));
import { useAuth } from "../context/AuthContext";

function wrap(authValue) {
    useAuth.mockReturnValue(authValue);
    return render(
        <MemoryRouter initialEntries={["/login"]}>
            <Routes>
                <Route element={<GuestRoute />}>
                    <Route path="/login" element={<p>login page</p>} />
                </Route>
                <Route path="/gigs" element={<p>gigs page</p>} />
                <Route path="/my-gigs" element={<p>my gigs page</p>} />
            </Routes>
        </MemoryRouter>
    );
}

describe("GuestRoute", () => {
    it("shows login page when not authenticated", () => {
        wrap({ user: null, loading: false, isAuthenticated: false });
        expect(screen.getByText("login page")).toBeInTheDocument();
    });

    it("redirects client to /gigs", () => {
        wrap({ user: { role: "client" }, loading: false, isAuthenticated: true });
        expect(screen.getByText("gigs page")).toBeInTheDocument();
        expect(screen.queryByText("login page")).toBeNull();
    });

    it("redirects freelancer to /my-gigs", () => {
        wrap({ user: { role: "freelancer" }, loading: false, isAuthenticated: true });
        expect(screen.getByText("my gigs page")).toBeInTheDocument();
        expect(screen.queryByText("login page")).toBeNull();
    });

    it("redirects unknown role to /gigs as fallback", () => {
        wrap({ user: { role: "other" }, loading: false, isAuthenticated: true });
        expect(screen.getByText("gigs page")).toBeInTheDocument();
    });

    it("shows nothing while loading", () => {
        wrap({ user: null, loading: true, isAuthenticated: false });
        expect(screen.queryByText("login page")).toBeNull();
    });
});