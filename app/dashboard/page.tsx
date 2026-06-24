"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "./_hooks/usePermissions";
import { ScreenDashboard }     from "./_components/ScreenDashboard";
import { ScreenPipeline }      from "./_components/ScreenPipeline";
import { ScreenClients }       from "./_components/ScreenClients";
import { ScreenSubscriptions } from "./_components/ScreenSubscriptions";
import { ScreenSupport }       from "./_components/ScreenSupport";
import { ScreenInvoices }      from "./_components/ScreenInvoices";
import { ScreenAnalytics }     from "./_components/ScreenAnalytics";
import { ScreenRBAC }          from "./_components/ScreenRBAC";

type User = { name: string; role: string; email: string; permissions: string[] };

const NAV = [
  { key: "dashboard",     icon: "ti-layout-dashboard", label: "Dashboard" },
  { key: "pipeline",      icon: "ti-filter",           label: "Pipeline" },
  { key: "clients",       icon: "ti-building",         label: "Clients" },
  { key: "subscriptions", icon: "ti-refresh",          label: "Subscriptions" },
  { key: "support",       icon: "ti-headset",          label: "Support" },
  { key: "invoices",      icon: "ti-file-invoice",     label: "Invoices" },
  { key: "analytics",     icon: "ti-chart-bar",        label: "Analytics" },
  { key: "rbac",          icon: "ti-shield-lock",      label: "RBAC" },
];

export default function DashboardPage() {
  const [user, setUser]     = useState<User | null>(null);
  const [screen, setScreen] = useState("dashboard");
  const router              = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/signin"); return; }
    setUser(JSON.parse(stored));
  }, [router]);

  if (!user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* ── Sidebar — same for ALL roles ── */}
      <aside style={{
        width: 200, flexShrink: 0,
        background: "var(--bg-panel)",
        borderRight: "0.5px solid var(--border)",
        padding: "18px 12px",
        display: "flex", flexDirection: "column", gap: 3,
      }}>
        <div className="brand" style={{ marginBottom: 18 }}>
          <div className="logo"></div>
          <span>YADA CRM</span>
        </div>

        {NAV.map(n => (
          <button key={n.key} onClick={() => setScreen(n.key)} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 10px", borderRadius: "var(--radius-md)",
            fontSize: 13, border: "none", width: "100%", textAlign: "left", cursor: "pointer",
            background: screen === n.key
              ? (n.key === "rbac" ? "var(--amber-fill)" : "var(--purple-fill)")
              : "transparent",
            color: screen === n.key
              ? (n.key === "rbac" ? "var(--amber-light)" : "var(--purple-text)")
              : "var(--text-3)",
          }}>
            <i className={`ti ${n.icon}`} style={{ fontSize: 16, width: 16 }}></i>
            {n.label}
          </button>
        ))}

        {/* User info + sign out */}
        <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "0.5px solid var(--border)" }}>
          <div style={{ fontSize: 11, color: "var(--text-3)", padding: "0 10px 8px" }}>
            {user.name}<br />
            <span style={{ fontSize: 10, color: "var(--text-4)" }}>
              {user.role.replace(/_/g, " ")}
            </span>
          </div>
          <button onClick={() => { localStorage.clear(); router.push("/signin"); }} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 10px", borderRadius: "var(--radius-md)",
            fontSize: 13, border: "none", width: "100%", textAlign: "left",
            cursor: "pointer", background: "transparent", color: "var(--text-3)",
          }}>
            <i className="ti ti-logout" style={{ fontSize: 16, width: 16 }}></i>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content — what you can DO is determined by permissions ── */}
      <main style={{ flex: 1, padding: "22px 28px", overflowX: "hidden" }}>
        {screen === "dashboard"     && <ScreenDashboard />}
        {screen === "pipeline"      && <ScreenPipeline />}
        {screen === "clients"       && <ScreenClients />}
        {screen === "subscriptions" && <ScreenSubscriptions />}
        {screen === "support"       && <ScreenSupport />}
        {screen === "invoices"      && <ScreenInvoices />}
        {screen === "analytics"     && <ScreenAnalytics />}
        {screen === "rbac"          && <ScreenRBAC />}
      </main>
    </div>
  );
}