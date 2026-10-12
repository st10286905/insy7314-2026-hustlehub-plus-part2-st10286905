import { z } from "zod";

export const PASSWORD_RULES = [
    { id: "len", label: "At least 8 characters", test: (v) => v.length >= 8 },
    { id: "upper", label: "One uppercase letter (A–Z)", test: (v) => /[A-Z]/.test(v) },
    { id: "lower", label: "One lowercase letter (a–z)", test: (v) => /[a-z]/.test(v) },
    { id: "digit", label: "One number (0–9)", test: (v) => /\d/.test(v) },
    { id: "sym", label: "One special character (!@#…)", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const emailField = z
    .string()
    .min(1, "Email is required")
    .max(254, "Email is too long")
    .email("Enter a valid email address");

const passwordField = z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be 128 characters or fewer")
    .regex(/[A-Z]/, "Add at least one uppercase letter")
    .regex(/[a-z]/, "Add at least one lowercase letter")
    .regex(/\d/, "Add at least one number")
    .regex(/[^A-Za-z0-9]/, "Add at least one special character");

export const loginSchema = z.object({
    email: emailField,
    password: z.string().min(1, "Password is required").max(128, "Password must be 128 characters or fewer"),
});

export const registerSchema = z.object({
    name: z.string().min(1, "Name is required").max(60, "Name must be 60 characters or fewer"),
    email: emailField,
    password: passwordField,
    role: z.enum(["client", "freelancer"], { errorMap: () => ({ message: "Select a role" }) }),
});