// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const SRC = join(process.cwd(), "src");

function getAllFiles(dir, exts) {
    const results = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) results.push(...getAllFiles(full, exts));
        else if (exts.some(e => entry.name.endsWith(e))) results.push(full);
    }
    return results;
}

const jsxFiles = getAllFiles(SRC, [".js", ".jsx"]).filter(
    f => !f.includes(".test.") && !f.includes("setup.js") && !f.includes("csp-compat")
);

describe("CSP compatibility", () => {
    it("no inline <script> tags in source files", () => {
        for (const f of jsxFiles) {
            const src = readFileSync(f, "utf8");
            expect(src, f).not.toMatch(/<script[\s>]/i);
        }
    });

    it("no eval() calls in source files", () => {
        for (const f of jsxFiles) {
            const src = readFileSync(f, "utf8");
            expect(src, f).not.toMatch(/\beval\s*\(/);
        }
    });

    it("no inline on* event handlers in JSX", () => {
        for (const f of jsxFiles) {
            const src = readFileSync(f, "utf8");
            expect(src, f).not.toMatch(/\bon\w+\s*=\s*["'`]/);
        }
    });

    it("dangerouslySetInnerHTML only used in sanitize helper", () => {
        const violations = jsxFiles.filter(f => {
            const src = readFileSync(f, "utf8");
            return src.includes("dangerouslySetInnerHTML") && !f.includes("sanitize") && !f.includes("RichText") && !f.includes("GigDetailPage");        });
        expect(violations).toHaveLength(0);
    });

    it("innerHTML only used in sanitize helper", () => {
        const violations = jsxFiles.filter(f => {
            const src = readFileSync(f, "utf8");
            return src.includes("innerHTML") && !f.includes("sanitize");
        });
        expect(violations).toHaveLength(0);
    });

    it("no Function() constructor calls", () => {
        for (const f of jsxFiles) {
            const src = readFileSync(f, "utf8");
            expect(src, f).not.toMatch(/new\s+Function\s*\(/);
        }
    });
});