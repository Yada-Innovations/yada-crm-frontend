"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/signin");
      return;
    }
    setUser(JSON.parse(stored));
  }, [router]);

  if (!user) return null;

  return (
    <div style={{ padding: 32 }}>
      <nav className="landing-nav" style={{ marginBottom: 32 }}>
        <div className="brand">
          <div className="logo"></div>
          <span>YADA CRM</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>
            {user.name} · {user.role}
          </span>
          <button
            className="btn"
            onClick={() => {
              localStorage.clear();
              router.push("/signin");
            }}
          >
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", paddingTop: 60 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
          Welcome back, {user.name.split(" ")[0]} 
        </h1>
        <p style={{ color: "var(--text-3)", fontSize: 14 }}>
          Your YADA CRM dashboard is being built. More modules coming soon.
        </p>
      </div>
    </div>
  );
}