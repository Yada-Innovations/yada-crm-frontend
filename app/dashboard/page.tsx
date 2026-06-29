"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "./_hooks/usePermissions";
import { NotificationBell } from "./_components/NotificationBell";
import { ScreenDashboard } from "./_components/ScreenDashboard";
import { ScreenLeads } from "./_components/ScreenLeads";
import { ScreenQuotes } from "./_components/ScreenQuotes";
import { ScreenClients } from "./_components/ScreenClients";
import { ScreenPayments } from "./_components/ScreenPayments";
import { ScreenSupport } from "./_components/ScreenSupport";
import { ScreenInvoices } from "./_components/ScreenInvoices";
import { ScreenAnalytics } from "./_components/ScreenAnalytics";
import { ScreenRBAC } from "./_components/ScreenRBAC";
import { ScreenUsers } from "./_components/ScreenUsers";
import { ScreenEmployees } from "./_components/ScreenEmployees";
import { ScreenPayroll } from "./_components/ScreenPayroll";

type User = { name: string; role: string; email: string; permissions: string[] };

// ── Navigation with Categories ──
const NAV_CATEGORIES = [
  {
    label: "Main",
    items: [
      { key: "dashboard", icon: "ti-layout-dashboard", label: "Dashboard", permission: null },
      { key: "leads", icon: "ti-users", label: "Leads", permission: "leads.view" },
      { key: "quotes", icon: "ti-file-text", label: "Quotes", permission: "quotes.view" },
      { key: "clients", icon: "ti-building", label: "Clients", permission: "clients.view" },
    ]
  },
  {
    label: "Finance",
    items: [
      { key: "invoices", icon: "ti-file-invoice", label: "Invoices", permission: "invoices.view" },
      { key: "payments", icon: "ti-credit-card", label: "Payments", permission: "invoices.view" },
    ]
  },
  {
    label: "Operations",
    items: [
      { key: "support", icon: "ti-headset", label: "Support", permission: "tickets.view" },
      { key: "analytics", icon: "ti-chart-bar", label: "Analytics", permission: "analytics.view" },
    ]
  },
  {
    label: "HR & Payroll",
    items: [
      { key: "employees", icon: "ti-users", label: "Employees", permission: "users.view" },
      { key: "payroll", icon: "ti-credit-card", label: "Payroll", permission: "users.view" },
    ]
  },
  {
    label: "Administration",
    items: [
      { key: "users", icon: "ti-users", label: "Users", permission: "users.view" },
      { key: "rbac", icon: "ti-shield-lock", label: "Roles & Permissions", permission: "users.view" },
    ]
  }
];

const ROLE_ACCESS: Record<string, string[]> = {
  admin: ["dashboard", "leads", "quotes", "clients", "invoices", "payments", "support", "analytics", "employees", "payroll", "users", "rbac"],
  sales_agent: ["dashboard", "leads", "quotes", "clients", "invoices", "payments"],
  support_agent: ["dashboard", "support", "clients"],
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [screen, setScreen] = useState("dashboard");
  const router = useRouter();
  const { can } = usePermissions();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/signin"); return; }
    setUser(JSON.parse(stored));
  }, [router]);

  if (!user) return null;

  const allowed = ROLE_ACCESS[user.role] ?? ROLE_ACCESS["admin"];

  // Filter categories based on permissions
  const filteredCategories = NAV_CATEGORIES.map(category => ({
    ...category,
    items: category.items.filter(item => 
      item.permission === null || can(item.permission)
    )
  })).filter(category => category.items.length > 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        background: "var(--bg-panel)",
        borderRight: "0.5px solid var(--border)",
        padding: "18px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        overflowY: "auto",
      }}>
        {/* Brand */}
        <div className="brand" style={{ marginBottom: 18 }}>
          <div className="logo"></div>
          <span>YADA CRM</span>
        </div>

        {/* Navigation with Categories */}
        {filteredCategories.map((category, idx) => (
          <div key={idx} style={{ marginBottom: 8 }}>
            {/* Category Label */}
            <div style={{
              fontSize: 9,
              color: "var(--text-4)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              padding: "4px 10px 6px",
              fontWeight: 600,
            }}>
              {category.label}
            </div>

            {/* Category Items */}
            {category.items.map((n) => (
              <button
                key={n.key}
                onClick={() => setScreen(n.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: "var(--radius-md)",
                  fontSize: 13,
                  border: "none",
                  width: "100%",
                  textAlign: "left",
                  cursor: "pointer",
                  background: screen === n.key
                    ? (n.key === "rbac" ? "var(--amber-fill)" : "var(--purple-fill)")
                    : "transparent",
                  color: screen === n.key
                    ? (n.key === "rbac" ? "var(--amber-light)" : "var(--purple-text)")
                    : "var(--text-3)",
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (screen !== n.key) {
                    e.currentTarget.style.background = "var(--bg-hover)";
                    e.currentTarget.style.color = "var(--text-1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (screen !== n.key) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-3)";
                  }
                }}
              >
                <i className={`ti ${n.icon}`} style={{ fontSize: 16, width: 18, flexShrink: 0 }}></i>
                {n.label}
              </button>
            ))}
          </div>
        ))}

        {/* Spacer */}
        <div style={{ flex: 1 }}></div>

        {/* Bottom: User info + Notification Bell + Sign out */}
        <div style={{ paddingTop: 16, borderTop: "0.5px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px 8px" }}>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>
              {user.name}<br />
              <span style={{ fontSize: 10, color: "var(--text-4)" }}>
                {user.role.replace(/_/g, " ")}
              </span>
            </div>
            <NotificationBell />
          </div>
          <button
            onClick={() => { localStorage.clear(); router.push("/signin"); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: "var(--radius-md)",
              fontSize: 13,
              border: "none",
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
              background: "transparent",
              color: "var(--text-3)",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
              e.currentTarget.style.color = "var(--text-1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-3)";
            }}
          >
            <i className="ti ti-logout" style={{ fontSize: 16, width: 18, flexShrink: 0 }}></i>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, padding: "22px 28px", overflowX: "hidden" }}>
        {screen === "dashboard" && <ScreenDashboard />}
        {screen === "leads" && <ScreenLeads />}
        {screen === "quotes" && <ScreenQuotes />}
        {screen === "clients" && <ScreenClients />}
        {screen === "invoices" && <ScreenInvoices />}
        {screen === "payments" && <ScreenPayments />}
        {screen === "support" && <ScreenSupport />}
        {screen === "analytics" && <ScreenAnalytics />}
        {screen === "employees" && <ScreenEmployees />}
        {screen === "payroll" && <ScreenPayroll />}
        {screen === "users" && <ScreenUsers />}
        {screen === "rbac" && <ScreenRBAC />}
      </main>
    </div>
  );
}