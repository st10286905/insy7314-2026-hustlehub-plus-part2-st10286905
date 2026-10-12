import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import LoginForm from "./LoginForm";

vi.mock("../context/AuthContext", () => ({
    useAuth: vi.fn(),
}));
import { useAuth } from "../context/AuthContext";

const mockLogin = vi.fn();

beforeEach(() => {
    mockLogin.mockReset();
    useAuth.mockReturnValue({ login: mockLogin });
});

function renderForm() {
    return render(
        <MemoryRouter>
            <LoginForm />
        </MemoryRouter>
    );
}

describe("LoginForm", () => {
    it("renders email and password fields", () => {
        renderForm();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it("renders submit button", () => {
        renderForm();
        expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    });

    it("shows error for short password", async () => {
        renderForm();
        const user = userEvent.setup();
        await user.type(screen.getByLabelText(/email/i), "test@example.com");
        await user.type(screen.getByLabelText(/password/i), "abc");
        await user.click(screen.getByRole("button", { name: /log in/i }));
        await waitFor(() => {
            expect(screen.getByRole("alert")).toBeInTheDocument();
        });
    });

    it("calls login with credentials on valid submit", async () => {
        mockLogin.mockResolvedValue({});
        renderForm();
        const user = userEvent.setup();
        await user.type(screen.getByLabelText(/email/i), "test@example.com");
        await user.type(screen.getByLabelText(/password/i), "Password1!");
        await user.click(screen.getByRole("button", { name: /log in/i }));
        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith(
                expect.objectContaining({ email: "test@example.com", password: "Password1!" })
            );
        });
    });

    it("shows an error alert on 401", async () => {
        mockLogin.mockRejectedValue({ response: { status: 401 } });
        renderForm();
        const user = userEvent.setup();
        await user.type(screen.getByLabelText(/email/i), "test@example.com");
        await user.type(screen.getByLabelText(/password/i), "Password1!");
        await user.click(screen.getByRole("button", { name: /log in/i }));
        await waitFor(() => {
            expect(screen.getByRole("alert")).toBeInTheDocument();
        });
    });

    it("shows an error alert on network failure", async () => {
        mockLogin.mockRejectedValue(new Error("Network Error"));
        renderForm();
        const user = userEvent.setup();
        await user.type(screen.getByLabelText(/email/i), "test@example.com");
        await user.type(screen.getByLabelText(/password/i), "Password1!");
        await user.click(screen.getByRole("button", { name: /log in/i }));
        await waitFor(() => {
            expect(screen.getByRole("alert")).toBeInTheDocument();
        });
    });

    it("disables submit button while loading", async () => {
        mockLogin.mockImplementation(() => new Promise(() => { }));
        renderForm();
        const user = userEvent.setup();
        await user.type(screen.getByLabelText(/email/i), "test@example.com");
        await user.type(screen.getByLabelText(/password/i), "Password1!");
        await user.click(screen.getByRole("button", { name: /log in/i }));
        await waitFor(() => {
            const btn = document.querySelector("button[type='submit']");
            expect(btn).toBeDisabled();
        });
    });

    it("does not call login when password is empty", async () => {
        renderForm();
        const user = userEvent.setup();
        await user.type(screen.getByLabelText(/email/i), "test@example.com");
        await user.click(screen.getByRole("button", { name: /log in/i }));
        await waitFor(() => {
            expect(mockLogin).not.toHaveBeenCalled();
        });
    });
});