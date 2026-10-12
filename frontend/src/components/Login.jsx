import React from "react";
import { Link } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import SessionExpiredNotice from "../components/SessionExpiredNotice";

export default function Login() {
    return (
        <main className="auth-shell">
            <div className="auth-card">
                <h1 className="auth-title">Log in to HustleHub+</h1>
                <SessionExpiredNotice />
                <LoginForm />
                <p className="card-foot">
                    Don't have an account? <Link to="/register">Sign up</Link>
                </p>
            </div>
        </main>
    );
}
