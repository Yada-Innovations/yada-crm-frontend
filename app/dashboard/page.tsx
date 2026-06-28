"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "./_hooks/usePermissions";
import { NotificationBell } from "./_components/NotificationBell";
import { ScreenDashboard } from "./_components/ScreenDashboard";
import { ScreenClients } from "./_components/ScreenClients";
import { ScreenSubscriptions } from "./_components/ScreenSubscriptions";
import { ScreenSupport } from "./_components/ScreenSupport";
import { ScreenInvoices } from "./_components/ScreenInvoices";
import { ScreenAnalytics } from "./_components/ScreenAnalytics";
import { ScreenRBAC } from "./_components/ScreenRBAC";
import { ScreenUsers } from "./_components/ScreenUsers";

// Import the separate components
import { ScreenLeads } from "./_components/ScreenLeads";
import { ScreenQuotes } from "./_components/ScreenQuotes";

type User = { name: string; role: string; email: string; permissions: string[] };

// ── Define ALL possible nav items with their required permissions ──
const ALL_NAV = [
  { key: "dashboard", icon: "ti-layout-dashboard", label: "Dashboard", permission: null },
  { key: "leads", icon: "ti-users", label: "Leads", permission: "leads.view" },
  { key: "quotes", icon: "ti-file-text", label: "Quotes", permission: "quotes.view" },
  { key: "clients", icon: "ti-building", label: "Clients", permission: "clients.view" },
  { key: "subscriptions", icon: "ti-refresh", label: "Subscriptions", permission: "subscriptions.view" },
  { key: "support", icon: "ti-headset", label: "Support", permission: "tickets.view" },
  { key: "invoices", icon: "ti-file-invoice", label: "Invoices", permission: "invoices.view" },
  { key: "analytics", icon: "ti-chart-bar", label: "Analytics", permission: "analytics.view" },
  { key: "users", icon: "ti-users", label: "Users", permission: "users.view" },
  { key: "rbac", icon: "ti-shield-lock", label: "Roles & Permissions", permission: "users.view" },
];

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [screen, setScreen] = useState("dashboard");
  const router = useRouter();
  const { can, role, permissions } = usePermissions();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/signin"); return; }
    setUser(JSON.parse(stored));
  }, [router]);

  if (!user) return null;

  // ── Filter nav items based on permissions ──
  const visibleNav = ALL_NAV.filter(navItem => {
    if (navItem.permission === null) return true;
    return can(navItem.permission);
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
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

        {visibleNav.map(n => (
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

        <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "0.5px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 10px 8px" }}>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>
              {user.name}<br />
              <span style={{ fontSize: 10, color: "var(--text-4)" }}>
                {user.role.replace(/_/g, " ")}
              </span>
            </div>
            <NotificationBell />
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

      <main style={{ flex: 1, padding: "22px 28px", overflowX: "hidden" }}>
        {screen === "dashboard" && <ScreenDashboard />}
        {screen === "leads" && <ScreenLeads />}
        {screen === "quotes" && <ScreenQuotes />}
        {screen === "clients" && <ScreenClients />}
        {screen === "subscriptions" && <ScreenSubscriptions />}
        {screen === "support" && <ScreenSupport />}
        {screen === "invoices" && <ScreenInvoices />}
        {screen === "analytics" && <ScreenAnalytics />}
        {screen === "users" && <ScreenUsers />}
        {screen === "rbac" && <ScreenRBAC />}
      </main>
    </div>
  );
}