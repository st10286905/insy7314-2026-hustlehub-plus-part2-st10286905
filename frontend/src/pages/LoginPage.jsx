import React from "react";
import { Link } from "react-router-dom";
import LoginForm from "../components/LoginForm";

const authBg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 1024" fill="none"><g opacity=".82"><path d="M0 285 420 0h280L0 475Z" fill="#5E1BFF" opacity=".16"/><path d="M0 505 750 0h270L0 700Z" fill="#7A25FF" opacity=".10"/><path d="M1536 1024 900 400l260-220 376 390Z" fill="#6D28FF" opacity=".13"/><path d="M1536 820 1080 420l180-150 276 250Z" fill="#8B35FF" opacity=".09"/></g></svg>`;

export default function LoginPage() {
    return (
        <div className="auth-page">
            <img className="auth-bg" src={`data:image/svg+xml,${encodeURIComponent(authBg)}`} aria-hidden="true" alt="" />

            <div className="auth-left">
                <div className="auth-logo">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 72" fill="none" height="36">
                        <defs>
                            <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#6D28FF" /><stop offset="1" stopColor="#4A1DFF" /></linearGradient>
                            <linearGradient id="lg2" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8B35FF" /><stop offset="1" stopColor="#5B21FF" /></linearGradient>
                        </defs>
                        <g transform="translate(0,8)">
                            <path d="M18 8 42 0v14L30 18v20l12-4v14L18 56V8Z" fill="url(#lg)" />
                            <path d="M42 0 66 8v48L42 48V34l12 4V18L42 14V0Z" fill="url(#lg2)" />
                            <path d="M30 18 42 14v20l-12 4V18Z" fill="#7C3CFF" opacity=".95" />
                        </g>
                        <text x="76" y="48" fontFamily="Inter,system-ui,sans-serif" fontWeight="700" fontSize="28" fill="#F5F7FF">Hustle</text>
                        <text x="176" y="48" fontFamily="Inter,system-ui,sans-serif" fontWeight="700" fontSize="28" fill="#7C3CFF">Hub</text>
                        <text x="222" y="48" fontFamily="Inter,system-ui,sans-serif" fontWeight="700" fontSize="28" fill="#FFC400">+</text>
                    </svg>
                </div>

                <h1>Pick up where<br />you <em>left off.</em></h1>
                <p className="tagline">
                    Log in to your HustleHub+ account and continue finding talent,
                    booking services and growing your projects.
                </p>

                <ul className="auth-features">
                    <li>
                        <div className="feat-icon">
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div className="feat-text">
                            <strong>Find top talent</strong>
                            <span>Browse and book trusted freelancers.</span>
                        </div>
                    </li>
                    <li>
                        <div className="feat-icon">
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                            </svg>
                        </div>
                        <div className="feat-text">
                            <strong>Manage your projects</strong>
                            <span>Keep track of your bookings in one place.</span>
                        </div>
                    </li>
                    <li>
                        <div className="feat-icon">
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>
                        <div className="feat-text">
                            <strong>Safe and secure</strong>
                            <span>A simple and reliable platform built for South Africa.</span>
                        </div>
                    </li>
                </ul>
            </div>

            <div className="auth-right">
                <div className="auth-card">
                    <h2>Log in to your account</h2>
                    <p className="subtitle">Access your HustleHub+ account.</p>
                    <LoginForm />
                    <p className="auth-footer">
                        Don't have an account? <Link to="/register">Register</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}