"use client";

import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError(true);
      return;
    }
    setError(false);
    // TODO: wire this up to POST /api/auth/login on the Laravel backend
    console.log("Sign in attempt:", email);
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSignIn}>
        <div className="auth-head">
          <div className="logo"></div>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Sign in to YADA CRM</span>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>Use your work email</span>
        </div>

        {error && (
          <div className="error-banner">
            <i className="ti ti-alert-circle"></i>
            <span>Enter your email and password to continue.</span>
          </div>
        )}

        <div>
          <label className="field-label">Email</label>
          <input
            className="field"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Password</label>
          <input
            className="field"
            type="password"
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 11, color: "var(--purple)", cursor: "pointer" }}>Forgot password?</span>
        </div>
        <button type="submit" className="btn btn-primary" style={{ height: 38, justifyContent: "center" }}>
          Sign in
        </button>
      </form>
    </div>
  );
}