"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Card } from "./Card";
import { Topbar } from "./Topbar";
import { Spinner } from "./Spinner";
import { usePermissions } from "../_hooks/usePermissions";

export function ScreenSubscriptions() {
  const [subs, setSubs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { can }               = usePermissions();

  useEffect(() => {
    apiGet('/subscriptions').then(data => {
      setSubs(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;

  const statusColor: Record<string,string> = { active: "var(--teal-light)", expired: "var(--red-light)", cancelled: "var(--text-3)" };
  const statusBg: Record<string,string>    = { active: "var(--teal-fill)",  expired: "var(--red-fill)",  cancelled: "var(--bg-pill)" };

  return (
    <div>
      <Topbar title="Subscriptions">
        {can('subscriptions.create') && (
          <button className="btn btn-primary"><i className="ti ti-plus"></i>New subscription</button>
        )}
      </Topbar>

      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--amber-fill)", border: "0.5px solid var(--amber)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 12, color: "var(--amber-light)", marginBottom: 16 }}>
        <i className="ti ti-bell"></i>
        Automated renewal alerts active — clients emailed 30 days before expiry via Laravel scheduled jobs.
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 140px 130px 90px" + (can('subscriptions.delete') ? " 70px" : ""), gap: 14, background: "#0F0F0F", padding: "11px 14px", fontSize: 11, color: "var(--text-3)" }}>
          <span>Client</span><span>Plan</span><span>Seat usage</span><span>Renews</span><span>Status</span>
          {can('subscriptions.delete') && <span>Actions</span>}
        </div>
        {subs.map(s => (
          <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 90px 140px 130px 90px" + (can('subscriptions.delete') ? " 70px" : ""), gap: 14, alignItems: "center", borderTop: "0.5px solid var(--border)", padding: "11px 14px", fontSize: 12 }}>
            <span style={{ fontWeight: 500 }}>{s.client?.name}</span>
            <span style={{ color: "var(--text-3)" }}>{s.plan?.name}</span>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 3 }}>{s.seats_used} / {s.plan?.max_seats}</div>
              <div style={{ height: 5, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.round((s.seats_used/s.plan?.max_seats)*100)}%`, background: s.seats_used/s.plan?.max_seats > 0.9 ? "var(--coral-light)" : "var(--teal)" }}></div>
              </div>
            </div>
            <span style={{ color: "var(--text-2)" }}>{s.ends_at}</span>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: statusBg[s.status], color: statusColor[s.status], width: "fit-content" }}>{s.status}</span>
            {can('subscriptions.delete') && (
              <button style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, border: "0.5px solid var(--red)", background: "transparent", color: "var(--red-light)", cursor: "pointer" }}>Cancel</button>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}