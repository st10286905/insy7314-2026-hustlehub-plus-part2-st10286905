import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";
import ProtectedRoute from "./ProtectedRoute";

vi.mock("../context/AuthContext", () => ({
    useAuth: vi.fn(),
}));
import { useAuth } from "../context/AuthContext";

function wrap(authValue) {
    useAuth.mockReturnValue(authValue);
    return render(
        <MemoryRouter initialEntries={["/secret"]}>
            <Routes>
                <Route element={<ProtectedRoute />}>
                    <Route path="/secret" element={<p>secret</p>} />
                </Route>
                <Route path="/login" element={<p>login page</p>} />
            </Routes>
        </MemoryRouter>
    );
}

describe("ProtectedRoute", () => {
    it("shows outlet when authenticated", () => {
        wrap({ user: { role: "client" }, loading: false, isAuthenticated: true });
        expect(screen.getByText("secret")).toBeInTheDocument();
    });

    it("redirects to /login when not authenticated", () => {
        wrap({ user: null, loading: false, isAuthenticated: false });
        expect(screen.getByText("login page")).toBeInTheDocument();
        expect(screen.queryByText("secret")).toBeNull();
    });

    it("shows nothing while loading", () => {
        wrap({ user: null, loading: true, isAuthenticated: false });
        expect(screen.queryByText("secret")).toBeNull();
        expect(screen.queryByText("login page")).toBeNull();
    });
});