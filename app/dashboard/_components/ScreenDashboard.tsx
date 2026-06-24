"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Card } from "./Card";
import { Topbar } from "./Topbar";
import { Spinner } from "./Spinner";
import { usePermissions } from "../_hooks/usePermissions";

export function ScreenDashboard() {
  const [data, setData] = useState<any>(null);
  const { can, role }   = usePermissions();

  useEffect(() => { apiGet('/dashboard').then(setData); }, []);
  if (!data) return <Spinner />;

  const funnel = [
    { label: "Leads",       count: data.leads_by_stage?.lead ?? 0,             pct: 100 },
    { label: "Quote",       count: data.leads_by_stage?.quote ?? 0,            pct: 63 },
    { label: "Demo",        count: data.leads_by_stage?.demo ?? 0,             pct: 39 },
    { label: "Tech Review", count: data.leads_by_stage?.technical_review ?? 0, pct: 21 },
    { label: "Closed Won",  count: data.leads_by_stage?.closed_won ?? 0,       pct: 13 },
  ];

  // Stats visible based on permissions
  const stats = [
    { label: "MRR",            value: `KES ${Number(data.mrr).toLocaleString()}`, color: "var(--teal-light)",  show: can('analytics.view') },
    { label: "ARR",            value: `KES ${Number(data.arr).toLocaleString()}`, color: "var(--purple)",      show: can('analytics.view') },
    { label: "Active clients", value: data.active_clients,                        color: "var(--blue-light)",  show: can('clients.view') },
    { label: "Renewals (30d)", value: data.renewals_due,                          color: "var(--amber-light)", show: true },
    { label: "Open tickets",   value: data.open_tickets,                          color: "var(--coral-light)", show: can('tickets.view') },
    { label: "Total leads",    value: data.total_leads,                           color: "var(--purple)",      show: can('leads.view') },
  ].filter(s => s.show);

  return (
    <div>
      <Topbar title="Dashboard" />

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(stats.length, 4)},1fr)`, gap: 12, marginBottom: 16 }}>
        {stats.map(s => (
          <Card key={s.label} style={{ padding: 14 }}>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{s.value}</div>
            <div style={{ fontSize: 11, marginTop: 5, color: s.color }}>live</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: can('leads.view') ? "1.4fr 1fr" : "1fr", gap: 14 }}>
        {can('leads.view') && (
          <Card>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12 }}>Sales funnel</div>
            {funnel.map(f => (
              <div key={f.label} style={{ fontSize: 11, color: "var(--text-2)", marginBottom: 10 }}>
                <span>{f.label}</span>
                <span style={{ float: "right", color: "var(--text-1)" }}>{f.count}</span>
                <div style={{ height: 6, background: "var(--border)", borderRadius: 3, marginTop: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${f.count > 0 ? f.pct : 0}%`, background: "var(--purple)", borderRadius: 3 }}></div>
                </div>
              </div>
            ))}
          </Card>
        )}

        <Card>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12 }}>Recent activity</div>
          {data.recent_activity?.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--text-4)" }}>No recent activity</div>
          )}
          {data.recent_activity?.map((a: any, i: number) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 9 }}>
              <span style={{ fontSize: 11, color: "var(--text-3)", width: 44, flexShrink: 0, paddingTop: 6 }}>{a.time}</span>
              <div style={{ flex: 1, background: "var(--bg-app)", borderRadius: "var(--radius-md)", padding: "7px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 9 }}>
                <i className="ti ti-file-invoice" style={{ color: "var(--purple)", flexShrink: 0 }}></i>
                {a.label}
              </div>
            </div>
          ))}

          {/* Role-specific tip */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "0.5px solid var(--border)", fontSize: 11, color: "var(--text-3)" }}>
            {role === "sales_agent" && "Tip: Quotes enforce a minimum 50% profit margin automatically."}
            {role === "support_agent" && "Tip: Resolve high priority tickets within 4 hours per SLA."}
            {role === "admin" && "You have full system access across all modules."}
          </div>
        </Card>
      </div>
    </div>
  );
}