import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HOME_BY_ROLE } from "../lib/constants";
import { PageLoader } from "./feedback";

export default function GuestRoute() {
    const { isAuthenticated, loading, user } = useAuth();
    if (loading) return <PageLoader />;
    if (isAuthenticated)
        return <Navigate to={HOME_BY_ROLE[user.role] ?? "/gigs"} replace />;
    return <Outlet />;
}
