import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRoute({ roles }) {
    const { user } = useAuth();
    if (!user || !roles.includes(user.role))
        return <Navigate to="/not-authorised" replace />;
    return <Outlet />;
}
