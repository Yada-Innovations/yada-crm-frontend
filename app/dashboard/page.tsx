"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "./_hooks/usePermissions";
import { NotificationBell } from "./_components/NotificationBell";
import { ScreenDashboard } from "./_components/ScreenDashboard";
import { ScreenLeads } from "./_components/ScreenLeads";
import { ScreenQuotes } from "./_components/ScreenQuotes";
import { ScreenServices } from "./_components/ScreenServices";
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
      { key: "services", icon: "ti-settings", label: "Services", permission: "services.view" },
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
  admin: ["dashboard", "leads", "quotes", "services", "clients", "invoices", "payments", "support", "analytics", "employees", "payroll", "users", "rbac"],
  sales_agent: ["dashboard", "leads", "quotes", "services", "clients", "invoices", "payments"],
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
    <div style={{ display: "flex", minHeight: "100vh", background: "#F9FAFB" }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        background: "linear-gradient(180deg, rgba(14,140,115,0.55) 0%, rgba(22,160,133,0.25) 18%, #FFFFFF 45%)",
        borderRight: "1px solid #E5E7EB",
        padding: "18px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        overflowY: "auto",
        position: "relative",
      }}>
        {/* Brand */}
        
        <div className="brand" style={{ marginBottom: 18, position: "relative", zIndex: 2 }}>
  <div className="logo" style={{ background: "#0E8C73", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>Y</div>
  <span style={{ color: "#1F2937" }}>YADA CRM</span>
</div>

        {/* Navigation with Categories */}
        {filteredCategories.map((category, idx) => (
          <div key={idx} style={{ marginBottom: 8, position: "relative", zIndex: 2 }}>
            {/* Category Label */}
            <div style={{
              fontSize: 9,
              color: "#9CA3AF",
              textTransform: "uppercase",
              letterSpacing: "1px",
              padding: "4px 10px 6px",
              fontWeight: 600,
            }}>
              {category.label}
            </div>

            {/* Category Items */}
            {category.items.map((n) => {
              const isActive = screen === n.key;
              const isRbac = n.key === "rbac";
              return (
                <button
                  key={n.key}
                  onClick={() => setScreen(n.key)}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: "6px",
                    fontSize: 13,
                    border: "none",
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                    background: isActive
                      ? "rgba(255,255,255,0.9)"
                      : "transparent",
                    color: isActive
                      ? (isRbac ? "#B45309" : "#0E8C73")
                      : "#374151",
                    fontWeight: isActive ? 600 : 400,
                    transition: "all 0.15s ease",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
  if (!isActive) {
    e.currentTarget.style.background = "rgba(14,140,115,0.08)";
    e.currentTarget.style.color = "#0E8C73";
  }
}}
onMouseLeave={(e) => {
  if (!isActive) {
    e.currentTarget.style.background = "transparent";
    e.currentTarget.style.color = "#374151";
  }
}}
                >
                  <i className={`ti ${n.icon}`} style={{ fontSize: 16, width: 18, flexShrink: 0 }}></i>
                  {n.label}
                  {isActive && (
                    <span style={{
                      position: "absolute",
                      right: 8,
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: isRbac ? "#F59E0B" : "#0E8C73",
                      boxShadow: `0 0 8px ${isRbac ? "#F59E0B" : "#0E8C73"}`,
                    }}></span>
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* Spacer */}
        <div style={{ flex: 1, position: "relative", zIndex: 2 }}></div>

        {/* Bottom: User info + Notification Bell + Sign out */}
        <div style={{
          paddingTop: 16,
          borderTop: "1px solid #E5E7EB",
          position: "relative",
          zIndex: 2
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 4px 8px"
          }}>
            <div style={{ fontSize: 11, color: "#374151" }}>
              {user.name}<br />
              <span style={{ fontSize: 10, color: "#6B7280" }}>
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
              borderRadius: "6px",
              fontSize: 13,
              border: "none",
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
              background: "transparent",
              color: "#374151",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F3F4F6";
              e.currentTarget.style.color = "#1F2937";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#374151";
            }}
          >
            <i className="ti ti-logout" style={{ fontSize: 16, width: 18, flexShrink: 0 }}></i>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{
        flex: 1,
        padding: "0",
        overflowX: "hidden",
        background: "#F9FAFB"
      }}>
        {screen === "dashboard" && <ScreenDashboard />}
        {screen === "leads" && <ScreenLeads />}
        {screen === "quotes" && <ScreenQuotes />}
        {screen === "services" && <ScreenServices />}
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