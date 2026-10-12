import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import SessionExpiredNotice from "./SessionExpiredNotice";
import { markSessionExpired } from "../lib/sessionNotice";

beforeEach(() => sessionStorage.clear());

describe("SessionExpiredNotice", () => {
    it("shows nothing by default", () => {
        render(<SessionExpiredNotice />);
        expect(screen.queryByRole("alert")).toBeNull();
    });

    it("shows banner after markSessionExpired", () => {
        markSessionExpired();
        render(<SessionExpiredNotice />);
        expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("clears the flag after showing", () => {
        markSessionExpired();
        render(<SessionExpiredNotice />);
        expect(sessionStorage.getItem("session_expired")).toBeNull();
    });
});
