"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, saveToken } from "@/lib/api";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password to continue.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await apiPost("/auth/login", { email, password });

      if (data.token) {
        saveToken(data.token);
        // Store user info for later use
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/dashboard");
      } else {
        setError(data.message || "Invalid credentials.");
      }
    } catch {
      setError("Could not connect to server. Is the backend running?");
    } finally {
      setLoading(false);
    }
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
            <span>{error}</span>
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
          <span style={{ fontSize: 11, color: "var(--purple)", cursor: "pointer" }}>
            Forgot password?
          </span>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ height: 38, justifyContent: "center" }}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}