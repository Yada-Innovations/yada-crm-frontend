"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { Card } from "./Card";
import { Topbar } from "./Topbar";
import { Spinner } from "./Spinner";
import { usePermissions } from "../_hooks/usePermissions";

export function ScreenSupport() {
  const [tickets, setTickets]   = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [clients, setClients]   = useState<any[]>([]);
  const [tab, setTab]           = useState<"tickets"|"features">("tickets");
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ subject: "", description: "", client_id: "", priority: "medium" });
  const [formError, setFormError]     = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const { can } = usePermissions();

  function load() {
    setLoading(true);
    Promise.all([
      apiGet('/tickets'),
      apiGet('/feature-requests'),
      apiGet('/clients'),
    ]).then(([t, f, c]) => {
      setTickets(Array.isArray(t) ? t : []);
      setFeatures(Array.isArray(f) ? f : []);
      setClients(Array.isArray(c) ? c : []);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!form.subject || !form.description) {
      setFormError("Subject and description are required.");
      return;
    }
    setFormLoading(true);
    setFormError("");
    try {
      const res = await apiPost("/tickets", {
        subject:     form.subject,
        description: form.description,
        client_id:   form.client_id || undefined,
        priority:    form.priority,
      });
      if (res.id) {
        setShowForm(false);
        setForm({ subject: "", description: "", client_id: "", priority: "medium" });
        load();
      } else {
        setFormError(res.message ?? "Failed to create ticket.");
      }
    } catch {
      setFormError("Could not connect to server.");
    } finally {
      setFormLoading(false);
    }
  }

  const statusColor: Record<string,string> = {
    open: "var(--amber-light)", in_progress: "var(--blue-light)",
    resolved: "var(--teal-light)", closed: "var(--text-3)", assigned: "var(--purple)",
    backlog: "var(--text-3)", under_review: "var(--purple)", planned: "var(--teal-light)",
  };

  const priorityColor: Record<string,string> = {
    critical: "var(--red-light)", high: "var(--coral-light)",
    medium: "var(--amber-light)", low: "var(--text-3)",
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
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <i className="ti ti-plus"></i>New ticket
          </button>
        )}
        {tab === "features" && can('feature_requests.create') && (
          <button className="btn btn-primary"><i className="ti ti-plus"></i>New request</button>
        )}
      </Topbar>

      {tab === "tickets" ? (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 140px 110px 90px", gap: 14, background: "#0F0F0F", padding: "11px 14px", fontSize: 11, color: "var(--text-3)" }}>
            <span>ID</span><span>Subject</span><span>Client</span><span>Status</span><span>Priority</span>
          </div>
          {tickets.map((t, i) => (
            <div key={t.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr 140px 110px 90px", gap: 14, alignItems: "center", borderTop: "0.5px solid var(--border)", padding: "11px 14px", fontSize: 12 }}>
              <span style={{ color: "var(--text-3)" }}>TK-{String(i+39).padStart(3,"0")}</span>
              <span>{t.subject}</span>
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>{t.client?.name ?? "—"}</span>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "var(--bg-pill)", color: statusColor[t.status], width: "fit-content" }}>{t.status.replace("_"," ")}</span>
              <span style={{ fontSize: 11, color: priorityColor[t.priority] }}>{t.priority}</span>
            </div>
          ))}
          {tickets.length === 0 && <div style={{ padding: 16, fontSize: 12, color: "var(--text-4)" }}>No tickets yet</div>}
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

      {/* ── Create Ticket Modal ── */}
      {showForm && (
        <Modal title="New Support Ticket" onClose={() => setShowForm(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {formError && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--red-fill)", border: "0.5px solid var(--red)", borderRadius: "var(--radius-md)", padding: "9px 12px", fontSize: 12, color: "var(--red-light)" }}>
                <i className="ti ti-alert-circle"></i>{formError}
              </div>
            )}
            <div>
              <label style={labelStyle}>SUBJECT *</label>
              <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Brief description of the issue" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>DESCRIPTION *</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Detailed description of the issue..." rows={4} style={{ ...inputStyle, height: "auto", padding: "8px 12px", resize: "vertical" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>CLIENT (optional)</label>
                <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} style={selectStyle}>
                  <option value="">No client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>PRIORITY</label>
                <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} style={selectStyle}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <button className="btn" onClick={() => setShowForm(false)} disabled={formLoading}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={formLoading}>
              {formLoading ? <><i className="ti ti-loader"></i>Creating...</> : <><i className="ti ti-plus"></i>Create ticket</>}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties  = { fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 };
const inputStyle: React.CSSProperties  = { width: "100%", height: 38, background: "var(--bg-card)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 12px", fontSize: 13, color: "var(--text-1)" };
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "var(--bg-panel)", borderRadius: "var(--radius-lg)", width: 600, maxHeight: "88vh", display: "flex", flexDirection: "column", border: "0.5px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "0.5px solid var(--border)", flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 22 }}>×</button>
        </div>
        <div style={{ overflowY: "auto", padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}