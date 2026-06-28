"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { Card } from "./Card";
import { Topbar } from "./Topbar";
import { Spinner } from "./Spinner";
import { usePermissions } from "../_hooks/usePermissions";

export function ScreenClients() {
  const [clients, setClients] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", industry: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [convertForm, setConvertForm] = useState({ 
    lead_id: "", 
    company_name: "", 
    contact_name: "", 
    email: "", 
    phone: "", 
    estimated_value: "" 
  });
  const { can } = usePermissions();

  function load() {
    setLoading(true);
    Promise.all([
      apiGet('/clients'),
      apiGet('/leads')
    ]).then(([clientsData, leadsData]) => {
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setLeads(Array.isArray(leadsData) ? leadsData : []);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, []);

  async function selectClient(c: any) {
    const full = await apiGet(`/clients/${c.id}`);
    setSelected(full);
  }

  async function handleCreate() {
    if (!form.name || !form.email) {
      setFormError("Name and email are required.");
      return;
    }
    setFormLoading(true);
    setFormError("");
    try {
      const res = await apiPost("/clients", form);
      if (res.id) {
        setShowForm(false);
        setForm({ name: "", email: "", phone: "", company: "", industry: "" });
        load();
      } else {
        setFormError(res.message ?? "Failed to create client.");
      }
    } catch {
      setFormError("Could not connect to server.");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleConvertToClient() {
    if (!convertForm.lead_id || !convertForm.company_name || !convertForm.email) {
      setFormError("Lead, company name, and email are required.");
      return;
    }
    setFormLoading(true);
    setFormError("");
    try {
      const res = await apiPost("/clients", {
        name: convertForm.company_name,
        email: convertForm.email,
        phone: convertForm.phone || "",
        company: convertForm.company_name,
        industry: "Technology",
      });
      
      if (res.id) {
        // Update lead to mark as converted
        await apiPatch(`/leads/${convertForm.lead_id}`, { 
          client_id: res.id,
          stage: "closed_won"
        });
        
        setShowConvertForm(false);
        setConvertForm({ lead_id: "", company_name: "", contact_name: "", email: "", phone: "", estimated_value: "" });
        load();
      } else {
        setFormError(res.message ?? "Failed to convert lead.");
      }
    } catch {
      setFormError("Could not connect to server.");
    } finally {
      setFormLoading(false);
    }
  }

  if (loading) return <Spinner />;

  // Client Detail View
  if (selected) return (
    <div>
      <Topbar title={`Client — ${selected.name}`}>
        <button className="btn" onClick={() => setSelected(null)}><i className="ti ti-arrow-left"></i>Back</button>
        {can('clients.edit') && <button className="btn"><i className="ti ti-edit"></i>Edit</button>}
        {can('clients.delete') && <button className="btn" style={{ color: "var(--red-light)", borderColor: "var(--red)" }}><i className="ti ti-trash"></i>Delete</button>}
      </Topbar>

      <div style={{ display: "flex", gap: 22 }}>
        {/* Left Panel - Client Info */}
        <div style={{ width: 240, flexShrink: 0 }}>
          <Card style={{ padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--purple-fill)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "var(--purple-text)" }}>
                {selected.name?.[0] || "C"}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{selected.name}</div>
                <div style={{ fontSize: 11, color: "var(--teal-light)" }}>{selected.industry || "N/A"} · {selected.status || "Active"}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 2 }}>Email</div>
            <div style={{ fontSize: 12, marginBottom: 10 }}>{selected.email}</div>
            {selected.phone && (
              <>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 2 }}>Phone</div>
                <div style={{ fontSize: 12, marginBottom: 10 }}>{selected.phone}</div>
              </>
            )}
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

        {/* Right Panel - Tickets */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12 }}>Tickets</div>
          {selected.tickets?.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--text-4)" }}>No tickets</div>
          )}
          {selected.tickets?.map((t: any) => (
            <div key={t.id} style={{ background: "var(--bg-card)", borderRadius: "var(--radius-md)", padding: "8px 12px", fontSize: 12, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
              <span>{t.subject}</span>
              <span style={{ fontSize: 10, color: "var(--text-3)" }}>{t.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Client List View
  return (
    <div>
      <Topbar title="Clients">
        {can('clients.create') && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <i className="ti ti-plus"></i>New client
          </button>
        )}
      </Topbar>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <input
            placeholder="Search clients..."
            style={{
              width: "100%",
              height: 36,
              background: "var(--bg-card)",
              border: "0.5px solid var(--border-2)",
              borderRadius: "var(--radius-md)",
              padding: "0 12px",
              fontSize: 13,
              color: "var(--text-1)",
            }}
          />
        </div>
        <button 
          className="btn"
          onClick={() => setShowConvertForm(true)}
          style={{
            border: "0.5px solid var(--purple)",
            color: "var(--purple-text)",
          }}
        >
          <i className="ti ti-arrow-right"></i> Convert Lead
        </button>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 180px 100px", gap: 14, background: "#0F0F0F", padding: "11px 14px", fontSize: 11, color: "var(--text-3)" }}>
          <span>Name</span><span>Industry</span><span>Email</span><span>Status</span>
        </div>
        {clients.map(c => (
          <div key={c.id} onClick={() => selectClient(c)} style={{ display: "grid", gridTemplateColumns: "1fr 120px 180px 100px", gap: 14, alignItems: "center", borderTop: "0.5px solid var(--border)", padding: "11px 14px", fontSize: 12, cursor: "pointer" }}>
            <span style={{ fontWeight: 500 }}>{c.name}</span>
            <span style={{ color: "var(--text-3)" }}>{c.industry ?? "—"}</span>
            <span style={{ color: "var(--text-3)" }}>{c.email}</span>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "var(--teal-fill)", color: "var(--teal-light)", width: "fit-content" }}>{c.status || "Active"}</span>
          </div>
        ))}
        {clients.length === 0 && <div style={{ padding: 16, fontSize: 12, color: "var(--text-4)" }}>No clients yet</div>}
      </Card>

      {/* ── Create Client Modal ── */}
      {showForm && (
        <Modal title="New Client" onClose={() => setShowForm(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {formError && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--red-fill)", border: "0.5px solid var(--red)", borderRadius: "var(--radius-md)", padding: "9px 12px", fontSize: 12, color: "var(--red-light)" }}>
                <i className="ti ti-alert-circle"></i>{formError}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>CLIENT NAME *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. XYZ Ltd" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>EMAIL *</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="info@xyz.co.ke" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>PHONE</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+254 700 000000" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>COMPANY</label>
                <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} placeholder="Company name" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>INDUSTRY</label>
                <select value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} style={selectStyle}>
                  <option value="">Select industry</option>
                  <option>Banking</option>
                  <option>Finance</option>
                  <option>Telecom</option>
                  <option>Insurance</option>
                  <option>Technology</option>
                  <option>Healthcare</option>
                  <option>Retail</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <button className="btn" onClick={() => setShowForm(false)} disabled={formLoading}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={formLoading}>
              {formLoading ? <><i className="ti ti-loader"></i>Creating...</> : <><i className="ti ti-plus"></i>Create client</>}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Convert Lead to Client Modal ── */}
      {showConvertForm && (
        <Modal title="Convert Lead to Client" onClose={() => setShowConvertForm(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {formError && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--red-fill)", border: "0.5px solid var(--red)", borderRadius: "var(--radius-md)", padding: "9px 12px", fontSize: 12, color: "var(--red-light)" }}>
                <i className="ti ti-alert-circle"></i>{formError}
              </div>
            )}
            <div>
              <label style={labelStyle}>SELECT LEAD *</label>
              <select 
                value={convertForm.lead_id} 
                onChange={e => {
                  const lead = leads.find(l => l.id === e.target.value);
                  setConvertForm({
                    ...convertForm,
                    lead_id: e.target.value,
                    company_name: lead?.company_name || "",
                    contact_name: lead?.contact_name || "",
                    email: lead?.email || "",
                    phone: lead?.phone || "",
                    estimated_value: lead?.estimated_value || "",
                  });
                }} 
                style={selectStyle}
              >
                <option value="">Select a lead</option>
                {leads.filter(l => l.stage !== "closed_won" && l.stage !== "closed_lost").map(l => (
                  <option key={l.id} value={l.id}>{l.company_name} - {l.contact_name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>COMPANY NAME *</label>
                <input value={convertForm.company_name} onChange={e => setConvertForm({...convertForm, company_name: e.target.value})} placeholder="Company name" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>CONTACT NAME</label>
                <input value={convertForm.contact_name} onChange={e => setConvertForm({...convertForm, contact_name: e.target.value})} placeholder="Contact name" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>EMAIL *</label>
                <input type="email" value={convertForm.email} onChange={e => setConvertForm({...convertForm, email: e.target.value})} placeholder="Email" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>PHONE</label>
                <input value={convertForm.phone} onChange={e => setConvertForm({...convertForm, phone: e.target.value})} placeholder="Phone" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>ESTIMATED VALUE</label>
              <input value={convertForm.estimated_value} disabled style={{...inputStyle, opacity: 0.7}} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <button className="btn" onClick={() => setShowConvertForm(false)} disabled={formLoading}>Cancel</button>
            <button className="btn btn-primary" onClick={handleConvertToClient} disabled={formLoading}>
              {formLoading ? <><i className="ti ti-loader"></i>Converting...</> : <><i className="ti ti-arrow-right"></i>Convert to Client</>}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", height: 38, background: "var(--bg-card)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 12px", fontSize: 13, color: "var(--text-1)" };
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