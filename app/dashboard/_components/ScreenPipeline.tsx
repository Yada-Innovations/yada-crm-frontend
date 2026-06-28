"use client";
import { useEffect, useState, useCallback } from "react";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { Card } from "./Card";
import { Topbar } from "./Topbar";
import { Spinner } from "./Spinner";
import { usePermissions } from "../_hooks/usePermissions";

// ── Lead Stages ──
const LEAD_STAGES = ["lead","qualified","quote_sent","demo_scheduled","demo_completed","technical_review","proposal_sent","negotiation","closed_won","closed_lost"];
const LEAD_LABELS: Record<string,string> = {
  lead: "Lead", qualified: "Qualified", quote_sent: "Quote Sent",
  demo_scheduled: "Demo Scheduled", demo_completed: "Demo Completed",
  technical_review: "Tech Review", proposal_sent: "Proposal Sent",
  negotiation: "Negotiation", closed_won: "Closed Won", closed_lost: "Closed Lost",
};
const LEAD_COLORS: Record<string,string> = {
  lead: "var(--text-2)", qualified: "var(--blue-light)", quote_sent: "var(--purple)",
  demo_scheduled: "var(--amber-light)", demo_completed: "var(--teal-light)",
  technical_review: "var(--coral-light)", proposal_sent: "var(--purple)",
  negotiation: "var(--amber-light)", closed_won: "var(--teal-light)", closed_lost: "var(--red-light)",
};
const LEAD_BG: Record<string,string> = {
  lead: "var(--bg-pill)", qualified: "rgba(133,183,235,0.12)", quote_sent: "var(--purple-fill)",
  demo_scheduled: "var(--amber-fill)", demo_completed: "var(--teal-fill)",
  technical_review: "rgba(240,153,123,0.12)", proposal_sent: "var(--purple-fill)",
  negotiation: "var(--amber-fill)", closed_won: "var(--teal-fill)", closed_lost: "var(--red-fill)",
};

// ── Quote Stages ──
const QUOTE_STAGES = ["draft","sent","viewed","negotiating","accepted","rejected","expired"];
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

type TabType = "leads" | "quotes";

export function ScreenPipeline() {
  const [activeTab, setActiveTab] = useState<TabType>("leads");
  const [leads, setLeads] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company_name: "", contact_name: "", email: "", phone: "", estimated_value: "", notes: "", client_id: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [showDisqualifyModal, setShowDisqualifyModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [disqualifyReason, setDisqualifyReason] = useState("");
  const [disqualifyLoading, setDisqualifyLoading] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ lead_id: "", base_amount: "", discount_pct: "0", valid_until: "" });
  const [quoteFormError, setQuoteFormError] = useState("");
  const [quoteFormLoading, setQuoteFormLoading] = useState(false);
  const { can } = usePermissions();

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiGet('/leads'),
      apiGet('/quotes'),
      apiGet('/clients')
    ]).then(([leadsData, quotesData, clientsData]) => {
      setLeads(Array.isArray(leadsData) ? leadsData : []);
      setQuotes(Array.isArray(quotesData) ? quotesData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Lead Functions ──
  async function moveLeadStage(id: string, stage: string) {
    if (!can('leads.edit')) return;
    await apiPatch(`/leads/${id}`, { stage });
    load();
  }

  async function handleCreateLead() {
    if (!form.company_name || !form.contact_name || !form.email) {
      setFormError("Company name, contact name and email are required.");
      return;
    }
    setFormLoading(true);
    setFormError("");
    try {
      const res = await apiPost("/leads", {
        company_name: form.company_name,
        contact_name: form.contact_name,
        email: form.email,
        phone: form.phone,
        estimated_value: form.estimated_value || 0,
        notes: form.notes,
        client_id: form.client_id || null,
      });
      if (res.id) {
        setShowForm(false);
        setForm({ company_name: "", contact_name: "", email: "", phone: "", estimated_value: "", notes: "", client_id: "" });
        load();
      } else {
        setFormError(res.message ?? "Failed to create lead.");
      }
    } catch {
      setFormError("Could not connect to server.");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDisqualify() {
    if (!disqualifyReason.trim()) {
      alert('Please provide a reason for disqualifying this lead.');
      return;
    }
    setDisqualifyLoading(true);
    try {
      const res = await apiPost(`/leads/${selectedLead.id}/disqualify`, {
        disqualification_reason: disqualifyReason,
      });
      if (res.message) {
        alert('✅ ' + res.message);
        setShowDisqualifyModal(false);
        setSelectedLead(null);
        setDisqualifyReason("");
        load();
      }
    } catch (error) {
      alert('❌ Failed to disqualify lead. Please try again.');
    } finally {
      setDisqualifyLoading(false);
    }
  }

  function openDisqualifyModal(lead: any) {
    setSelectedLead(lead);
    setDisqualifyReason("");
    setShowDisqualifyModal(true);
  }

  // ── Quote Functions ──
  async function moveQuoteStage(id: string, status: string) {
    if (!can('quotes.edit')) return;
    await apiPatch(`/quotes/${id}`, { status });
    load();
  }

  async function handleCreateQuote() {
    if (!quoteForm.lead_id || !quoteForm.base_amount) {
      setQuoteFormError("Lead and base amount are required.");
      return;
    }
    setQuoteFormLoading(true);
    setQuoteFormError("");
    try {
      const res = await apiPost("/quotes", {
        lead_id: quoteForm.lead_id,
        base_amount: quoteForm.base_amount,
        discount_pct: quoteForm.discount_pct || 0,
        valid_until: quoteForm.valid_until || null,
      });
      if (res.id) {
        setShowQuoteForm(false);
        setQuoteForm({ lead_id: "", base_amount: "", discount_pct: "0", valid_until: "" });
        load();
      } else {
        setQuoteFormError(res.message ?? "Failed to create quote.");
      }
    } catch {
      setQuoteFormError("Could not connect to server.");
    } finally {
      setQuoteFormLoading(false);
    }
  }

  const displayLeads = activeStage === "all" ? leads : leads.filter(l => l.stage === activeStage);
  const displayQuotes = activeStage === "all" ? quotes : quotes.filter(q => q.status === activeStage);

  const pipelineValue = leads.filter(l => !["closed_won","closed_lost"].includes(l.stage)).reduce((s, l) => s + Number(l.estimated_value), 0);
  const wonValue = leads.filter(l => l.stage === "closed_won").reduce((s, l) => s + Number(l.estimated_value), 0);
  const winRate = leads.length > 0 ? Math.round((leads.filter(l => l.stage === "closed_won").length / leads.length) * 100) : 0;
  const lostCount = leads.filter(l => l.stage === "closed_lost").length;
  const acceptedQuotes = quotes.filter(q => q.status === "accepted").length;
  const totalQuoteValue = quotes.reduce((s, q) => s + Number(q.final_amount || q.base_amount), 0);

  if (loading) return <Spinner />;

  return (
    <div>
      <Topbar title="Pipeline">
        {activeTab === "leads" && can('leads.create') && (
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setFormError(""); }}>
            <i className="ti ti-plus"></i>Add Lead
          </button>
        )}
        {activeTab === "quotes" && can('quotes.create') && (
          <button className="btn btn-primary" onClick={() => { setShowQuoteForm(true); setQuoteFormError(""); }}>
            <i className="ti ti-plus"></i>Create Quote
          </button>
        )}
      </Topbar>

      {/* ── Tab Navigation ── */}
      <div style={{ 
        display: "flex", 
        gap: 0, 
        marginBottom: 20, 
        borderBottom: "0.5px solid var(--border)",
        background: "var(--bg-panel)",
        borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
        overflow: "hidden",
      }}>
        <button
          onClick={() => setActiveTab("leads")}
          style={{
            padding: "12px 24px",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            background: activeTab === "leads" ? "var(--bg-card)" : "transparent",
            color: activeTab === "leads" ? "var(--purple-text)" : "var(--text-3)",
            cursor: "pointer",
            borderBottom: activeTab === "leads" ? "2px solid var(--purple)" : "2px solid transparent",
            marginBottom: -1,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <i className="ti ti-users"></i> Leads
          <span style={{
            background: "var(--bg-pill)",
            padding: "2px 8px",
            borderRadius: 10,
            fontSize: 10,
            color: "var(--text-3)",
          }}>
            {leads.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("quotes")}
          style={{
            padding: "12px 24px",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            background: activeTab === "quotes" ? "var(--bg-card)" : "transparent",
            color: activeTab === "quotes" ? "var(--purple-text)" : "var(--text-3)",
            cursor: "pointer",
            borderBottom: activeTab === "quotes" ? "2px solid var(--purple)" : "2px solid transparent",
            marginBottom: -1,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <i className="ti ti-file-text"></i> Quotes
          <span style={{
            background: "var(--bg-pill)",
            padding: "2px 8px",
            borderRadius: 10,
            fontSize: 10,
            color: "var(--text-3)",
          }}>
            {quotes.length}
          </span>
        </button>
      </div>

      {/* ── LEADS TAB ── */}
      {activeTab === "leads" && (
        <>
          {/* Summary Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 16 }}>
            <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 14 }}>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>Total Leads</div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{leads.length}</div>
            </div>
            <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 14 }}>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>Pipeline Value</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--purple)" }}>KES {pipelineValue.toLocaleString()}</div>
            </div>
            <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 14 }}>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>Closed Won</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--teal-light)" }}>KES {wonValue.toLocaleString()}</div>
            </div>
            <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 14 }}>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>Win Rate</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: "var(--amber-light)" }}>{winRate}%</div>
            </div>
            <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 14 }}>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>Disqualified</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: "var(--red-light)" }}>{lostCount}</div>
            </div>
          </div>

          {/* Stage Filter Tabs */}
          <div style={{ display: "flex", gap: 2, marginBottom: 16, background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 4, overflowX: "auto", flexWrap: "nowrap" }}>
            <button
              onClick={() => setActiveStage("all")}
              style={{
                flexShrink: 0, padding: "6px 12px", borderRadius: "var(--radius-md)",
                border: "none", cursor: "pointer", fontSize: 11, fontWeight: 500,
                background: activeStage === "all" ? "var(--purple-fill)" : "transparent",
                color: activeStage === "all" ? "var(--purple-text)" : "var(--text-3)",
                display: "flex", alignItems: "center", gap: 4,
              }}>
              All
              <span style={{ background: "var(--bg-pill)", borderRadius: 20, padding: "1px 6px", fontSize: 10 }}>{leads.length}</span>
            </button>
            {LEAD_STAGES.map(stage => {
              const count = leads.filter(l => l.stage === stage).length;
              const isActive = activeStage === stage;
              return (
                <button
                  key={stage}
                  onClick={() => setActiveStage(stage)}
                  style={{
                    flexShrink: 0, padding: "6px 12px", borderRadius: "var(--radius-md)",
                    border: "none", cursor: "pointer", fontSize: 11, fontWeight: 500,
                    background: isActive ? LEAD_BG[stage] : "transparent",
                    color: isActive ? LEAD_COLORS[stage] : "var(--text-3)",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                  {LEAD_LABELS[stage]}
                  <span style={{
                    background: isActive ? "rgba(0,0,0,0.15)" : "var(--bg-pill)",
                    borderRadius: 20, padding: "1px 6px", fontSize: 10,
                    color: isActive ? LEAD_COLORS[stage] : "var(--text-3)",
                  }}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Leads Table */}
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 130px 120px 140px 100px 80px", 
              gap: 14, 
              background: "#0F0F0F", 
              padding: "11px 16px", 
              fontSize: 11, 
              color: "var(--text-3)" 
            }}>
              <span>Company</span>
              <span>Contact</span>
              <span>Value</span>
              <span>Email</span>
              <span>Stage</span>
              <span>Actions</span>
            </div>

            {displayLeads.length === 0 && (
              <div style={{ padding: 24, fontSize: 13, color: "var(--text-4)", textAlign: "center" }}>
                No leads in this stage
              </div>
            )}

            {displayLeads.map(lead => {
              const stageIdx = LEAD_STAGES.indexOf(lead.stage);
              const nextStage = LEAD_STAGES[stageIdx + 1];
              const isWon = lead.stage === "closed_won";
              const isLost = lead.stage === "closed_lost";
              const isFinal = isWon || isLost;
              const isConverted = !!lead.client_id;

              return (
                <div key={lead.id} style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 130px 120px 140px 100px 80px",
                  gap: 14, alignItems: "center",
                  borderTop: "0.5px solid var(--border)", padding: "12px 16px", fontSize: 12,
                  background: isLost ? "var(--red-fill)" : (isConverted ? "var(--teal-fill)" : "transparent"),
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{lead.company_name}</div>
                    <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>
                      {lead.contact_name}
                      {isConverted && (
                        <span style={{ color: "var(--teal-light)", marginLeft: 8 }}>
                          <i className="ti ti-check"></i> Client
                        </span>
                      )}
                      {isLost && lead.disqualification_reason && (
                        <span style={{ color: "var(--red-light)", marginLeft: 8, fontSize: 9 }}>
                          <i className="ti ti-alert-circle"></i> {lead.disqualification_reason}
                        </span>
                      )}
                    </div>
                  </div>

                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>{lead.contact_name}</span>

                  <span style={{ color: isWon ? "var(--teal-light)" : "var(--text-1)", fontWeight: 500 }}>
                    KES {Number(lead.estimated_value).toLocaleString()}
                  </span>

                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>{lead.email}</span>

                  <span style={{
                    fontSize: 10, padding: "3px 8px", borderRadius: 6,
                    background: LEAD_BG[lead.stage], color: LEAD_COLORS[lead.stage],
                    width: "fit-content", fontWeight: 500,
                  }}>
                    {LEAD_LABELS[lead.stage]}
                  </span>

                  <div style={{ display: "flex", gap: 4, flexDirection: "column" }}>
                    {can('leads.edit') && !isFinal && nextStage && (
                      <button
                        onClick={() => moveLeadStage(lead.id, nextStage)}
                        title={`Move to ${LEAD_LABELS[nextStage]}`}
                        style={{
                          fontSize: 10, padding: "3px 8px", borderRadius: 5,
                          border: "0.5px solid var(--border-2)", background: "transparent",
                          color: "var(--text-2)", cursor: "pointer", whiteSpace: "nowrap",
                        }}>
                        → {LEAD_LABELS[nextStage]}
                      </button>
                    )}
                    {isFinal && (
                      <span style={{ fontSize: 10, color: isWon ? "var(--teal-light)" : "var(--red-light)" }}>
                        {isWon ? "✅ Won" : "❌ Disqualified"}
                      </span>
                    )}
                    {can('leads.edit') && !isFinal && (
                      <button
                        onClick={() => openDisqualifyModal(lead)}
                        style={{
                          fontSize: 10, padding: "3px 8px", borderRadius: 5,
                          border: "0.5px solid var(--red)",
                          background: "var(--red-fill)",
                          color: "var(--red-light)",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}>
                        <i className="ti ti-x-circle"></i> Disqualify
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Create Lead Modal */}
          {showForm && (
            <Modal title="Add New Lead" onClose={() => setShowForm(false)}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {formError && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--red-fill)", border: "0.5px solid var(--red)", borderRadius: "var(--radius-md)", padding: "9px 12px", fontSize: 12, color: "var(--red-light)" }}>
                    <i className="ti ti-alert-circle"></i>{formError}
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>COMPANY NAME *</label>
                    <input value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} placeholder="e.g. ABC Bank" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>CONTACT NAME *</label>
                    <input value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} placeholder="e.g. John Kamau" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>EMAIL *</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="john@abcbank.co.ke" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>PHONE</label>
                    <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+254 700 000000" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>ESTIMATED VALUE (KES)</label>
                    <input type="number" value={form.estimated_value} onChange={e => setForm({...form, estimated_value: e.target.value})} placeholder="500000" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>ASSOCIATED CLIENT</label>
                    <select style={selectStyle} value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})}>
                      <option value="">None</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>NOTES</label>
                  <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any additional notes..." rows={3} style={{ ...inputStyle, height: "auto", padding: "8px 12px", resize: "vertical" }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button className="btn" onClick={() => setShowForm(false)} disabled={formLoading}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreateLead} disabled={formLoading}>
                  {formLoading ? <><i className="ti ti-loader"></i>Creating...</> : <><i className="ti ti-plus"></i>Add Lead</>}
                </button>
              </div>
            </Modal>
          )}
        </>
      )}

      {/* ── QUOTES TAB ── */}
      {activeTab === "quotes" && (
        <>
          {/* Summary Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
            <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 14 }}>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>Total Quotes</div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{quotes.length}</div>
            </div>
            <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 14 }}>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>Total Value</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--purple)" }}>KES {totalQuoteValue.toLocaleString()}</div>
            </div>
            <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 14 }}>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>Accepted</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: "var(--teal-light)" }}>{acceptedQuotes}</div>
            </div>
            <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 14 }}>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>Conversion Rate</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: "var(--amber-light)" }}>
                {quotes.length > 0 ? Math.round((acceptedQuotes / quotes.length) * 100) : 0}%
              </div>
            </div>
          </div>

          {/* Quote Stage Filter Tabs */}
          <div style={{ display: "flex", gap: 2, marginBottom: 16, background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 4, overflowX: "auto", flexWrap: "nowrap" }}>
            <button
              onClick={() => setActiveStage("all")}
              style={{
                flexShrink: 0, padding: "6px 12px", borderRadius: "var(--radius-md)",
                border: "none", cursor: "pointer", fontSize: 11, fontWeight: 500,
                background: activeStage === "all" ? "var(--purple-fill)" : "transparent",
                color: activeStage === "all" ? "var(--purple-text)" : "var(--text-3)",
                display: "flex", alignItems: "center", gap: 4,
              }}>
              All
              <span style={{ background: "var(--bg-pill)", borderRadius: 20, padding: "1px 6px", fontSize: 10 }}>{quotes.length}</span>
            </button>
            {QUOTE_STAGES.map(stage => {
              const count = quotes.filter(q => q.status === stage).length;
              const isActive = activeStage === stage;
              return (
                <button
                  key={stage}
                  onClick={() => setActiveStage(stage)}
                  style={{
                    flexShrink: 0, padding: "6px 12px", borderRadius: "var(--radius-md)",
                    border: "none", cursor: "pointer", fontSize: 11, fontWeight: 500,
                    background: isActive ? QUOTE_BG[stage] : "transparent",
                    color: isActive ? QUOTE_COLORS[stage] : "var(--text-3)",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                  {QUOTE_LABELS[stage]}
                  <span style={{
                    background: isActive ? "rgba(0,0,0,0.15)" : "var(--bg-pill)",
                    borderRadius: 20, padding: "1px 6px", fontSize: 10,
                    color: isActive ? QUOTE_COLORS[stage] : "var(--text-3)",
                  }}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Quotes Table */}
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 130px 100px 80px 110px 100px 80px", 
              gap: 12, 
              background: "#0F0F0F", 
              padding: "11px 16px", 
              fontSize: 11, 
              color: "var(--text-3)" 
            }}>
              <span>Lead</span>
              <span>Base Amount</span>
              <span>Discount</span>
              <span>Margin</span>
              <span>Status</span>
              <span>Valid Until</span>
              <span>Actions</span>
            </div>

            {displayQuotes.length === 0 && (
              <div style={{ padding: 24, fontSize: 13, color: "var(--text-4)", textAlign: "center" }}>
                No quotes in this stage
              </div>
            )}

            {displayQuotes.map(quote => {
              const stageIdx = QUOTE_STAGES.indexOf(quote.status);
              const nextStage = QUOTE_STAGES[stageIdx + 1];
              const isFinal = quote.status === "accepted" || quote.status === "rejected" || quote.status === "expired";
              
              return (
                <div key={quote.id} style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 130px 100px 80px 110px 100px 80px",
                  gap: 12, alignItems: "center",
                  borderTop: "0.5px solid var(--border)", padding: "12px 16px", fontSize: 12,
                  background: quote.status === "accepted" ? "var(--teal-fill)" : (quote.status === "rejected" ? "var(--red-fill)" : "transparent"),
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{quote.lead?.company_name ?? "—"}</div>
                    <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>
                      {quote.lead?.contact_name ?? "No contact"}
                    </div>
                  </div>

                  <span style={{ fontWeight: 500 }}>KES {Number(quote.base_amount).toLocaleString()}</span>

                  <span style={{ color: "var(--coral-light)" }}>{quote.discount_pct}%</span>

                  <span style={{ 
                    color: quote.margin_pct >= 50 ? "var(--teal-light)" : "var(--red-light)", 
                    fontWeight: 600 
                  }}>
                    {quote.margin_pct}%
                  </span>

                  <span style={{
                    fontSize: 10, padding: "3px 8px", borderRadius: 6,
                    background: QUOTE_BG[quote.status],
                    color: QUOTE_COLORS[quote.status],
                    width: "fit-content", fontWeight: 500,
                  }}>
                    {QUOTE_LABELS[quote.status]}
                  </span>

                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                    {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : "—"}
                  </span>

                  <div style={{ display: "flex", gap: 4, flexDirection: "column" }}>
                    {can('quotes.edit') && !isFinal && nextStage && (
                      <button
                        onClick={() => moveQuoteStage(quote.id, nextStage)}
                        title={`Move to ${QUOTE_LABELS[nextStage]}`}
                        style={{
                          fontSize: 10, padding: "3px 8px", borderRadius: 5,
                          border: "0.5px solid var(--border-2)", background: "transparent",
                          color: "var(--text-2)", cursor: "pointer", whiteSpace: "nowrap",
                        }}>
                        → {QUOTE_LABELS[nextStage]}
                      </button>
                    )}
                    {isFinal && (
                      <span style={{ 
                        fontSize: 10, 
                        color: quote.status === "accepted" ? "var(--teal-light)" : "var(--red-light)" 
                      }}>
                        {quote.status === "accepted" ? "✅ Accepted" : quote.status === "rejected" ? "❌ Rejected" : "⏰ Expired"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Margin Reminder */}
          <div style={{ 
            marginTop: 14, 
            display: "flex", 
            alignItems: "center", 
            gap: 8, 
            background: "var(--teal-fill)", 
            border: "0.5px solid var(--teal)", 
            borderRadius: "var(--radius-md)", 
            padding: "9px 12px", 
            fontSize: 11, 
            color: "var(--teal-text)" 
          }}>
            <i className="ti ti-shield-check"></i>
            All quotes enforce a minimum 50% profit margin — discounts above 50% are blocked automatically.
          </div>

          {/* Create Quote Modal */}
          {showQuoteForm && (
            <Modal title="Create Quote" onClose={() => setShowQuoteForm(false)}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {quoteFormError && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--red-fill)", border: "0.5px solid var(--red)", borderRadius: "var(--radius-md)", padding: "9px 12px", fontSize: 12, color: "var(--red-light)" }}>
                    <i className="ti ti-alert-circle"></i>{quoteFormError}
                  </div>
                )}
                <div>
                  <label style={labelStyle}>SELECT LEAD *</label>
                  <select 
                    style={selectStyle} 
                    value={quoteForm.lead_id} 
                    onChange={e => setQuoteForm({...quoteForm, lead_id: e.target.value})}
                  >
                    <option value="">Select a lead</option>
                    {leads.filter(l => l.stage !== "closed_won" && l.stage !== "closed_lost").map(l => (
                      <option key={l.id} value={l.id}>{l.company_name} - {l.contact_name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>BASE AMOUNT (KES) *</label>
                    <input 
                      type="number" 
                      value={quoteForm.base_amount} 
                      onChange={e => setQuoteForm({...quoteForm, base_amount: e.target.value})}
                      placeholder="500000" 
                      style={inputStyle} 
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>DISCOUNT %</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="50" 
                      value={quoteForm.discount_pct} 
                      onChange={e => setQuoteForm({...quoteForm, discount_pct: e.target.value})}
                      placeholder="0" 
                      style={inputStyle} 
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>VALID UNTIL</label>
                  <input 
                    type="date" 
                    value={quoteForm.valid_until} 
                    onChange={e => setQuoteForm({...quoteForm, valid_until: e.target.value})}
                    style={inputStyle} 
                  />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button className="btn" onClick={() => setShowQuoteForm(false)} disabled={quoteFormLoading}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreateQuote} disabled={quoteFormLoading}>
                  {quoteFormLoading ? <><i className="ti ti-loader"></i>Creating...</> : <><i className="ti ti-plus"></i>Create Quote</>}
                </button>
              </div>
            </Modal>
          )}
        </>
      )}

      {/* ── DISQUALIFY MODAL ── */}
      {showDisqualifyModal && selectedLead && (
        <div style={{ 
          position: "fixed", 
          inset: 0, 
          background: "rgba(0,0,0,0.7)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          zIndex: 200 
        }}>
          <div style={{ 
            background: "var(--bg-panel)", 
            borderRadius: "var(--radius-lg)", 
            padding: 24, 
            width: 450, 
            border: "0.5px solid var(--border)" 
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ 
                width: 36, 
                height: 36, 
                borderRadius: "50%", 
                background: "var(--red-fill)", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center" 
              }}>
                <i className="ti ti-x-circle" style={{ color: "var(--red-light)", fontSize: 20 }}></i>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--red-light)" }}>
                  Disqualify Lead
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                  {selectedLead.company_name} - {selectedLead.contact_name}
                </div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12 }}>
              Please provide a reason for disqualifying this lead:
            </p>

            <textarea
              value={disqualifyReason}
              onChange={(e) => setDisqualifyReason(e.target.value)}
              placeholder="e.g., Budget too low, Not interested, Competitor chosen..."
              rows={4}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--bg-card)",
                border: "0.5px solid var(--border-2)",
                borderRadius: "var(--radius-md)",
                fontSize: 13,
                color: "var(--text-1)",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button 
                className="btn" 
                onClick={() => {
                  setShowDisqualifyModal(false);
                  setSelectedLead(null);
                  setDisqualifyReason("");
                }}
                disabled={disqualifyLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDisqualify}
                disabled={disqualifyLoading || !disqualifyReason.trim()}
                style={{
                  padding: "7px 16px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: "var(--red)",
                  color: "#fff",
                  fontSize: 13,
                  cursor: disqualifyLoading || !disqualifyReason.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: disqualifyLoading || !disqualifyReason.trim() ? 0.6 : 1,
                }}
              >
                {disqualifyLoading ? (
                  <><i className="ti ti-loader" style={{ animation: "spin 1s linear infinite" }}></i> Disqualifying...</>
                ) : (
                  <><i className="ti ti-x-circle"></i> Disqualify Lead</>
                )}
              </button>
            </div>
          </div>
        </div>
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