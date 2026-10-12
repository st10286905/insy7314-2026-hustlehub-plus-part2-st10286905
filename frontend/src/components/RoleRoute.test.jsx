import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";
import RoleRoute from "./RoleRoute";

vi.mock("../context/AuthContext", () => ({
    useAuth: vi.fn(),
}));
import { useAuth } from "../context/AuthContext";

function wrap(allowedRoles, userRole) {
    useAuth.mockReturnValue({ user: { role: userRole }, loading: false });
    return render(
        <MemoryRouter initialEntries={["/protected"]}>
            <Routes>
                <Route element={<RoleRoute roles={allowedRoles} />}>
                    <Route path="/protected" element={<p>protected page</p>} />
                </Route>
                <Route path="/" element={<p>home page</p>} />
            </Routes>
        </MemoryRouter>
    );
}

describe("RoleRoute", () => {
    it("renders outlet when role is allowed", () => {
        wrap(["client"], "client");
        expect(screen.getByText("protected page")).toBeInTheDocument();
    });

    it("redirects when role is not allowed", () => {
        wrap(["client"], "freelancer");
        expect(screen.queryByText("protected page")).toBeNull();
    });

    it("allows multiple roles", () => {
        wrap(["client", "freelancer"], "freelancer");
        expect(screen.getByText("protected page")).toBeInTheDocument();
    });

    it("blocks a role not in the list", () => {
        wrap(["client"], "admin");
        expect(screen.queryByText("protected page")).toBeNull();
    });

    it("renders outlet for freelancer on freelancer route", () => {
        wrap(["freelancer"], "freelancer");
        expect(screen.getByText("protected page")).toBeInTheDocument();
    });

    it("blocks unauthenticated user (no user)", () => {
        useAuth.mockReturnValue({ user: null, loading: false });
        render(
            <MemoryRouter initialEntries={["/protected"]}>
                <Routes>
                    <Route element={<RoleRoute roles={["client"]} />}>
                        <Route path="/protected" element={<p>protected page</p>} />
                    </Route>
                    <Route path="/" element={<p>home page</p>} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.queryByText("protected page")).toBeNull();
    });
});