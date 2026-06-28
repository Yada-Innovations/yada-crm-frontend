"use client";

import { useEffect, useState, useCallback } from "react";
import { usePermissions } from "../_hooks/usePermissions";
import { apiGet, apiPost, apiPatch } from "@/lib/api";

function Topbar({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
      <h1 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{title}</h1>
      <div style={{ display: "flex", gap: 8 }}>{children}</div>
    </div>
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 16, ...style }}>{children}</div>;
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 60 }}>
      <i className="ti ti-loader" style={{ fontSize: 24, color: "var(--text-3)", animation: "spin 1s linear infinite" }}></i>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", height: 38, background: "var(--bg-card)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 12px", fontSize: 13, color: "var(--text-1)" };
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "var(--bg-panel)", borderRadius: "var(--radius-lg)", width: 620, maxHeight: "88vh", display: "flex", flexDirection: "column", border: "0.5px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "0.5px solid var(--border)", flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 22 }}>×</button>
        </div>
        <div style={{ overflowY: "auto", padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

export function ScreenQuotes() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ lead_id: "", base_amount: "", discount_pct: "0", valid_until: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const { can } = usePermissions();

  const QUOTE_STAGES = ["draft", "sent", "viewed", "negotiating", "accepted", "rejected", "expired"];
  const QUOTE_LABELS: Record<string,string> = {
    draft: "Draft", sent: "Sent", viewed: "Viewed",
    negotiating: "Negotiating", accepted: "Accepted", rejected: "Rejected", expired: "Expired",
  };
  const QUOTE_COLORS: Record<string,string> = {
    draft: "var(--text-3)", sent: "var(--blue-light)", viewed: "var(--purple)",
    negotiating: "var(--amber-light)", accepted: "var(--teal-light)", rejected: "var(--red-light)", expired: "var(--text-4)",
  };
  const QUOTE_BG: Record<string,string> = {
    draft: "var(--bg-pill)", sent: "rgba(133,183,235,0.12)", viewed: "var(--purple-fill)",
    negotiating: "var(--amber-fill)", accepted: "var(--teal-fill)", rejected: "var(--red-fill)", expired: "var(--bg-pill)",
  };

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([apiGet('/quotes'), apiGet('/leads')]).then(([quotesData, leadsData]) => {
      setQuotes(Array.isArray(quotesData) ? quotesData : []);
      setLeads(Array.isArray(leadsData) ? leadsData : []);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  async function moveQuoteStage(id: string, status: string) {
    if (!can('quotes.edit')) return;
    try {
      const res = await apiPatch(`/quotes/${id}`, { status });
      if (res.message) {
        alert('✅ ' + res.message);
      }
      load();
    } catch (error) {
      console.error('Failed to move quote:', error);
      alert('❌ Failed to update quote status');
    }
  }

  async function handleCreateQuote() {
    if (!form.lead_id || !form.base_amount) {
      setFormError("Lead and base amount are required.");
      return;
    }
    setFormLoading(true);
    setFormError("");
    try {
      const res = await apiPost("/quotes", {
        lead_id: form.lead_id,
        base_amount: form.base_amount,
        discount_pct: form.discount_pct || 0,
        valid_until: form.valid_until || null,
      });
      if (res.id) {
        alert('✅ Quote created successfully!');
        setShowForm(false);
        setForm({ lead_id: "", base_amount: "", discount_pct: "0", valid_until: "" });
        load();
      } else {
        setFormError(res.message ?? "Failed to create quote.");
      }
    } catch {
      setFormError("Could not connect to server.");
    } finally {
      setFormLoading(false);
    }
  }

  const displayQuotes = activeStatus === "all" ? quotes : quotes.filter(q => q.status === activeStatus);
  const totalValue = quotes.reduce((s, q) => s + Number(q.final_amount || q.base_amount), 0);
  const acceptedCount = quotes.filter(q => q.status === "accepted").length;
  const conversionRate = quotes.length > 0 ? Math.round((acceptedCount / quotes.length) * 100) : 0;

  if (loading) return <Spinner />;

  return (
    <div>
      <Topbar title="Quotes">
        {can('quotes.create') && (
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setFormError(""); }}>
            <i className="ti ti-plus"></i>Create Quote
          </button>
        )}
      </Topbar>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 14 }}>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>Total Quotes</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{quotes.length}</div>
        </div>
        <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 14 }}>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>Total Value</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--purple)" }}>KES {totalValue.toLocaleString()}</div>
        </div>
        <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 14 }}>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>Accepted</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: "var(--teal-light)" }}>{acceptedCount}</div>
        </div>
        <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 14 }}>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>Conversion Rate</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: "var(--amber-light)" }}>{conversionRate}%</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 2, marginBottom: 16, background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 4, overflowX: "auto", flexWrap: "nowrap" }}>
        <button onClick={() => setActiveStatus("all")} style={{ flexShrink: 0, padding: "6px 12px", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 500, background: activeStatus === "all" ? "var(--purple-fill)" : "transparent", color: activeStatus === "all" ? "var(--purple-text)" : "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
          All <span style={{ background: "var(--bg-pill)", borderRadius: 20, padding: "1px 6px", fontSize: 10 }}>{quotes.length}</span>
        </button>
        {QUOTE_STAGES.map(status => {
          const count = quotes.filter(q => q.status === status).length;
          const isActive = activeStatus === status;
          return (
            <button key={status} onClick={() => setActiveStatus(status)} style={{ flexShrink: 0, padding: "6px 12px", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 500, background: isActive ? QUOTE_BG[status] : "transparent", color: isActive ? QUOTE_COLORS[status] : "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
              {QUOTE_LABELS[status]}
              <span style={{ background: isActive ? "rgba(0,0,0,0.15)" : "var(--bg-pill)", borderRadius: 20, padding: "1px 6px", fontSize: 10, color: isActive ? QUOTE_COLORS[status] : "var(--text-3)" }}>{count}</span>
            </button>
          );
        })}
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 100px 80px 110px 100px 80px", gap: 12, background: "#0F0F0F", padding: "11px 16px", fontSize: 11, color: "var(--text-3)" }}>
          <span>Lead / Company</span>
          <span>Base Amount</span>
          <span>Discount</span>
          <span>Margin</span>
          <span>Status</span>
          <span>Valid Until</span>
          <span>Actions</span>
        </div>
        {displayQuotes.length === 0 && <div style={{ padding: 24, fontSize: 13, color: "var(--text-4)", textAlign: "center" }}>No quotes found</div>}
        {displayQuotes.map(quote => {
          const stageIdx = QUOTE_STAGES.indexOf(quote.status);
          const nextStage = QUOTE_STAGES[stageIdx + 1];
          const isFinal = quote.status === "accepted" || quote.status === "rejected" || quote.status === "expired";
          const lead = quote.lead;
          
          return (
            <div key={quote.id} style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 130px 100px 80px 110px 100px 80px", 
              gap: 12, 
              alignItems: "center", 
              borderTop: "0.5px solid var(--border)", 
              padding: "12px 16px", 
              fontSize: 12, 
              background: quote.status === "accepted" ? "var(--teal-fill)" : (quote.status === "rejected" ? "var(--red-fill)" : "transparent") 
            }}>
              <div>
                <div style={{ fontWeight: 600 }}>{lead?.company_name || "No Lead"}</div>
                <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>
                  {lead?.contact_name || "No contact"}
                </div>
                {lead?.stage && (
                  <div style={{ 
                    fontSize: 9, 
                    color: "var(--text-4)", 
                    marginTop: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}>
                    <span>Lead Stage: </span>
                    <span style={{ 
                      padding: "1px 6px", 
                      borderRadius: 3, 
                      background: "var(--bg-pill)",
                      fontSize: 9,
                    }}>
                      {lead.stage.replace(/_/g, " ")}
                    </span>
                  </div>
                )}
              </div>
              <span style={{ fontWeight: 500 }}>KES {Number(quote.base_amount).toLocaleString()}</span>
              <span style={{ color: "var(--coral-light)" }}>{quote.discount_pct}%</span>
              <span style={{ color: quote.margin_pct >= 50 ? "var(--teal-light)" : "var(--red-light)", fontWeight: 600 }}>
                {quote.margin_pct}%
              </span>
              <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: QUOTE_BG[quote.status], color: QUOTE_COLORS[quote.status], width: "fit-content", fontWeight: 500 }}>
                {QUOTE_LABELS[quote.status]}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : "—"}
              </span>
              <div style={{ display: "flex", gap: 4, flexDirection: "column" }}>
                {can('quotes.edit') && !isFinal && nextStage && (
                  <button 
                    onClick={() => moveQuoteStage(quote.id, nextStage)} 
                    style={{ fontSize: 10, padding: "3px 8px", borderRadius: 5, border: "0.5px solid var(--border-2)", background: "transparent", color: "var(--text-2)", cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    → {QUOTE_LABELS[nextStage]}
                  </button>
                )}
                {isFinal && (
                  <span style={{ fontSize: 10, color: quote.status === "accepted" ? "var(--teal-light)" : "var(--red-light)" }}>
                    {quote.status === "accepted" ? "✅ Accepted" : quote.status === "rejected" ? "❌ Rejected" : "⏰ Expired"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </Card>

      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, background: "var(--teal-fill)", border: "0.5px solid var(--teal)", borderRadius: "var(--radius-md)", padding: "9px 12px", fontSize: 11, color: "var(--teal-text)" }}>
        <i className="ti ti-shield-check"></i> All quotes enforce a minimum 50% profit margin — discounts above 50% are blocked automatically.
      </div>

      {showForm && (
        <Modal title="Create Quote" onClose={() => setShowForm(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {formError && <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--red-fill)", border: "0.5px solid var(--red)", borderRadius: "var(--radius-md)", padding: "9px 12px", fontSize: 12, color: "var(--red-light)" }}><i className="ti ti-alert-circle"></i>{formError}</div>}
            <div>
              <label style={labelStyle}>SELECT LEAD *</label>
              <select 
                style={selectStyle} 
                value={form.lead_id} 
                onChange={(e) => setForm({...form, lead_id: e.target.value})}
              >
                <option value="">Select a lead</option>
                {leads
                  .filter(l => l.stage !== "closed_won" && l.stage !== "closed_lost" && !l.quotes?.length)
                  .map(l => (
                    <option key={l.id} value={l.id}>
                      {l.company_name} - {l.contact_name} ({l.stage.replace(/_/g, " ")})
                    </option>
                  ))}
              </select>
              {leads.filter(l => l.stage !== "closed_won" && l.stage !== "closed_lost").length === 0 && (
                <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 4 }}>
                  No leads available for quotes. All leads either have quotes or are closed.
                </div>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>BASE AMOUNT (KES) *</label>
                <input 
                  type="number" 
                  value={form.base_amount} 
                  onChange={e => setForm({...form, base_amount: e.target.value})} 
                  placeholder="500000" 
                  style={inputStyle} 
                />
              </div>
              <div>
                <label style={labelStyle}>DISCOUNT % (max 50)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="50" 
                  value={form.discount_pct} 
                  onChange={e => setForm({...form, discount_pct: e.target.value})} 
                  placeholder="0" 
                  style={inputStyle} 
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>VALID UNTIL</label>
              <input 
                type="date" 
                value={form.valid_until} 
                onChange={e => setForm({...form, valid_until: e.target.value})} 
                style={inputStyle} 
              />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <button className="btn" onClick={() => setShowForm(false)} disabled={formLoading}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateQuote} disabled={formLoading}>
              {formLoading ? <><i className="ti ti-loader"></i>Creating...</> : <><i className="ti ti-plus"></i>Create Quote</>}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}