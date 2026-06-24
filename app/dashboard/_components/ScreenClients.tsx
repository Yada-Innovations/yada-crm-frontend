"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Card } from "./Card";
import { Topbar } from "./Topbar";
import { Spinner } from "./Spinner";
import { usePermissions } from "../_hooks/usePermissions";

export function ScreenClients() {
  const [clients, setClients]   = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const { can }                 = usePermissions();

  useEffect(() => {
    apiGet('/clients').then(data => {
      setClients(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  async function selectClient(c: any) {
    const full = await apiGet(`/clients/${c.id}`);
    setSelected(full);
  }

  if (loading) return <Spinner />;

  if (selected) return (
    <div>
      <Topbar title={`Client — ${selected.name}`}>
        <button className="btn" onClick={() => setSelected(null)}><i className="ti ti-arrow-left"></i>Back</button>
        {can('clients.edit') && <button className="btn"><i className="ti ti-edit"></i>Edit</button>}
        {can('clients.delete') && <button className="btn" style={{ color: "var(--red-light)", borderColor: "var(--red)" }}><i className="ti ti-trash"></i>Delete</button>}
      </Topbar>
      <div style={{ display: "flex", gap: 22 }}>
        <div style={{ width: 240, flexShrink: 0 }}>
          <Card style={{ padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--purple-fill)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "var(--purple-text)" }}>
                {selected.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{selected.name}</div>
                <div style={{ fontSize: 11, color: "var(--teal-light)" }}>{selected.industry} · {selected.status}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 2 }}>Email</div>
            <div style={{ fontSize: 12, marginBottom: 10 }}>{selected.email}</div>
            {selected.subscriptions?.[0] && (
              <>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>
                  Seats — {selected.subscriptions[0].seats_used} / {selected.subscriptions[0].plan?.max_seats}
                </div>
                <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.round((selected.subscriptions[0].seats_used / selected.subscriptions[0].plan?.max_seats) * 100)}%`, background: "var(--teal)" }}></div>
                </div>
              </>
            )}
          </Card>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12 }}>Tickets</div>
          {selected.tickets?.map((t: any) => (
            <div key={t.id} style={{ background: "var(--bg-card)", borderRadius: "var(--radius-md)", padding: "8px 12px", fontSize: 12, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
              <span>{t.subject}</span>
              <span style={{ fontSize: 10, color: "var(--text-3)" }}>{t.status}</span>
            </div>
          ))}
          {selected.tickets?.length === 0 && <div style={{ fontSize: 12, color: "var(--text-4)" }}>No tickets</div>}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <Topbar title="Clients">
        {can('clients.create') && (
          <button className="btn btn-primary"><i className="ti ti-plus"></i>New client</button>
        )}
      </Topbar>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 160px 100px", gap: 14, background: "#0F0F0F", padding: "11px 14px", fontSize: 11, color: "var(--text-3)" }}>
          <span>Name</span><span>Industry</span><span>Email</span><span>Status</span>
        </div>
        {clients.map(c => (
          <div key={c.id} onClick={() => selectClient(c)} style={{ display: "grid", gridTemplateColumns: "1fr 120px 160px 100px", gap: 14, alignItems: "center", borderTop: "0.5px solid var(--border)", padding: "11px 14px", fontSize: 12, cursor: "pointer" }}>
            <span style={{ fontWeight: 500 }}>{c.name}</span>
            <span style={{ color: "var(--text-3)" }}>{c.industry ?? "—"}</span>
            <span style={{ color: "var(--text-3)" }}>{c.email}</span>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "var(--teal-fill)", color: "var(--teal-light)", width: "fit-content" }}>{c.status}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}