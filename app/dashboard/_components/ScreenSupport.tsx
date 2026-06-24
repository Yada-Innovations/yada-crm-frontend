"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Card } from "./Card";
import { Topbar } from "./Topbar";
import { Spinner } from "./Spinner";
import { usePermissions } from "../_hooks/usePermissions";

export function ScreenSupport() {
  const [tickets, setTickets]   = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [tab, setTab]           = useState<"tickets"|"features">("tickets");
  const [loading, setLoading]   = useState(true);
  const { can }                 = usePermissions();

  useEffect(() => {
    Promise.all([apiGet('/tickets'), apiGet('/feature-requests')]).then(([t, f]) => {
      setTickets(Array.isArray(t) ? t : []);
      setFeatures(Array.isArray(f) ? f : []);
      setLoading(false);
    });
  }, []);

  const statusColor: Record<string,string> = {
    open: "var(--amber-light)", in_progress: "var(--blue-light)",
    resolved: "var(--teal-light)", closed: "var(--text-3)", assigned: "var(--purple)",
    backlog: "var(--text-3)", under_review: "var(--purple)", planned: "var(--teal-light)",
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <Topbar title="Support">
        <button className="btn" onClick={() => setTab(tab === "tickets" ? "features" : "tickets")}>
          <i className={`ti ${tab === "tickets" ? "ti-bulb" : "ti-ticket"}`}></i>
          {tab === "tickets" ? "Feature requests" : "Tickets"}
        </button>
        {tab === "tickets" && can('tickets.create') && (
          <button className="btn btn-primary"><i className="ti ti-plus"></i>New ticket</button>
        )}
        {tab === "features" && can('feature_requests.create') && (
          <button className="btn btn-primary"><i className="ti ti-plus"></i>New request</button>
        )}
      </Topbar>

      {tab === "tickets" ? (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 110px 90px" + (can('tickets.delete') ? " 70px" : ""), gap: 14, background: "#0F0F0F", padding: "11px 14px", fontSize: 11, color: "var(--text-3)" }}>
            <span>ID</span><span>Subject</span><span>Status</span><span>Priority</span>
            {can('tickets.delete') && <span>Actions</span>}
          </div>
          {tickets.map((t, i) => (
            <div key={t.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr 110px 90px" + (can('tickets.delete') ? " 70px" : ""), gap: 14, alignItems: "center", borderTop: "0.5px solid var(--border)", padding: "11px 14px", fontSize: 12 }}>
              <span style={{ color: "var(--text-3)" }}>TK-{String(i+39).padStart(3,"0")}</span>
              <span>{t.subject}</span>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "var(--bg-pill)", color: statusColor[t.status], width: "fit-content" }}>{t.status.replace("_"," ")}</span>
              <span style={{ color: "var(--text-2)" }}>{t.priority}</span>
              {can('tickets.delete') && (
                <button style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, border: "0.5px solid var(--red)", background: "transparent", color: "var(--red-light)", cursor: "pointer" }}>Delete</button>
              )}
            </div>
          ))}
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 130px", gap: 14, background: "#0F0F0F", padding: "11px 14px", fontSize: 11, color: "var(--text-3)" }}>
            <span>Feature</span><span>Votes</span><span>Status</span>
          </div>
          {features.map(f => (
            <div key={f.id} style={{ display: "grid", gridTemplateColumns: "1fr 60px 130px", gap: 14, alignItems: "center", borderTop: "0.5px solid var(--border)", padding: "11px 14px", fontSize: 12 }}>
              <span>{f.title}</span>
              <span style={{ color: "var(--purple)" }}>{f.votes}</span>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "var(--bg-pill)", color: statusColor[f.status], width: "fit-content" }}>{f.status.replace("_"," ")}</span>
            </div>
          ))}
          {features.length === 0 && <div style={{ padding: 16, fontSize: 12, color: "var(--text-4)" }}>No feature requests yet</div>}
        </Card>
      )}
    </div>
  );
}