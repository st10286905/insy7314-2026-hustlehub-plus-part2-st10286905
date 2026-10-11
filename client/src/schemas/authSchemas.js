import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required" })
    .email({ message: "Email must be valid" })
    .max(254, { message: "Email cannot exceed 254 characters" }),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .max(128, { message: "Password cannot exceed 128 characters" }),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, { message: "Email is required" })
      .email({ message: "Email must be valid" })
      .max(254, { message: "Email cannot exceed 254 characters" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(128, { message: "Password cannot exceed 128 characters" })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,128}$/, {
        message:
          "Password must include uppercase, lowercase, number, and special character",
      }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password" }),
    role: z.enum(["client", "freelancer"], {
      errorMap: () => ({ message: "Role must be either client or freelancer" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
