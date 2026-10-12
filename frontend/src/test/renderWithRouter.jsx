import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

export function renderWithRouter(ui, { route = "/", path = "/" } = {}) {
    const [pathname, search = ""] = route.split("?");
    const initialEntry = search ? `${pathname}?${search}` : pathname;

    return render(
        <MemoryRouter
            initialEntries={[initialEntry]}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
            <Routes>
                <Route path={path} element={ui} />
                <Route path="*" element={null} />
            </Routes>
        </MemoryRouter>
    );
}