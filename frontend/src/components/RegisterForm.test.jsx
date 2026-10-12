import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import RegisterForm from "./RegisterForm";

vi.mock("../context/AuthContext", () => ({
    useAuth: vi.fn(),
}));
import { useAuth } from "../context/AuthContext";

const mockRegister = vi.fn();

beforeEach(() => {
    mockRegister.mockReset();
    useAuth.mockReturnValue({ register: mockRegister });
});

function renderForm() {
    return render(
        <MemoryRouter>
            <RegisterForm />
        </MemoryRouter>
    );
}

// Use the specific input id 
function getPasswordInput() {
    return document.getElementById("rf-password");
}

describe("RegisterForm", () => {
    it("renders all fields", () => {
        renderForm();
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(document.getElementById("rf-password")).toBeInTheDocument();
        expect(screen.getByRole("radio", { name: /client/i })).toBeInTheDocument();
        expect(document.querySelector('input[type="radio"][value="freelancer"]')).toBeInTheDocument();
    });

    it("does not offer admin as a role option", () => {
        renderForm();
        expect(screen.queryByRole("radio", { name: /admin/i })).toBeNull();
    });

    it("calls register with valid data", async () => {
        mockRegister.mockResolvedValue({});
        renderForm();
        const user = userEvent.setup();
        await user.type(screen.getByLabelText(/name/i), "Test User");
        await user.type(screen.getByLabelText(/email/i), "test@example.com");
        await user.type(getPasswordInput(), "Password1!");
        await user.click(screen.getByRole("radio", { name: /client/i }));
        await user.click(screen.getByRole("button", { name: /create account/i }));
        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalledWith(
                expect.objectContaining({ email: "test@example.com", role: "client" })
            );
        });
    });

    it("shows an error when name is missing", async () => {
        renderForm();
        const user = userEvent.setup();
        await user.type(screen.getByLabelText(/email/i), "test@example.com");
        await user.type(getPasswordInput(), "Password1!");
        await user.click(screen.getByRole("radio", { name: /client/i }));
        await user.click(screen.getByRole("button", { name: /create account/i }));
        await waitFor(() => {
            expect(screen.getByRole("alert")).toBeInTheDocument();
        });
    });

    it("shows an error when email is invalid", async () => {
        renderForm();
        const user = userEvent.setup();
        await user.type(screen.getByLabelText(/name/i), "Test User");
        await user.type(screen.getByLabelText(/email/i), "notanemail");
        await user.type(getPasswordInput(), "Password1!");
        await user.click(screen.getByRole("radio", { name: /client/i }));
        await user.click(screen.getByRole("button", { name: /create account/i }));
        await waitFor(() => {
            expect(screen.getByRole("alert")).toBeInTheDocument();
        });
    });

    it("shows an error when password is too weak", async () => {
        renderForm();
        const user = userEvent.setup();
        await user.type(screen.getByLabelText(/name/i), "Test User");
        await user.type(screen.getByLabelText(/email/i), "test@example.com");
        await user.type(getPasswordInput(), "weak");
        await user.click(screen.getByRole("radio", { name: /client/i }));
        await user.click(screen.getByRole("button", { name: /create account/i }));
        await waitFor(() => {
            expect(screen.getByRole("alert")).toBeInTheDocument();
        });
    });

    it("shows an error when no role is selected", async () => {
        renderForm();
        const user = userEvent.setup();
        await user.type(screen.getByLabelText(/name/i), "Test User");
        await user.type(screen.getByLabelText(/email/i), "test@example.com");
        await user.type(getPasswordInput(), "Password1!");
        await user.click(screen.getByRole("button", { name: /create account/i }));
        await waitFor(() => {
            expect(screen.getByRole("alert")).toBeInTheDocument();
        });
    });

    it("shows a server error alert on failure", async () => {
        mockRegister.mockRejectedValue(new Error("Server Error"));
        renderForm();
        const user = userEvent.setup();
        await user.type(screen.getByLabelText(/name/i), "Test User");
        await user.type(screen.getByLabelText(/email/i), "test@example.com");
        await user.type(getPasswordInput(), "Password1!");
        await user.click(screen.getByRole("radio", { name: /client/i }));
        await user.click(screen.getByRole("button", { name: /create account/i }));
        await waitFor(() => {
            expect(screen.getByRole("alert")).toBeInTheDocument();
        });
    });
});