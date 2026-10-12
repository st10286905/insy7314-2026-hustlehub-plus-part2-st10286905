import React from "react";
import { Link } from "react-router-dom";
import RegisterForm from "../components/RegisterForm";

export default function Register() {
    return (
        <main className="auth-shell">
            <div className="auth-card">
                <h1 className="auth-title">Join HustleHub+</h1>
                <RegisterForm />
                <p className="card-foot">
                    Already have an account? <Link to="/login">Log in</Link>
                </p>
            </div>
        </main>
    );
}
