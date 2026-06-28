"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { Card } from "./Card";
import { Topbar } from "./Topbar";
import { Spinner } from "./Spinner";
import { usePermissions } from "../_hooks/usePermissions";

type InvoiceItem = { description: string; quantity: number; unit_price: number };

export function ScreenInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ client_id: "", discount_pct: "0", due_date: "" });
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, unit_price: 0 }]);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [marginWarning, setMarginWarning] = useState("");
  const { can } = usePermissions();

  function load() {
    setLoading(true);
    Promise.all([apiGet('/invoices'), apiGet('/clients')]).then(([inv, c]) => {
      setInvoices(Array.isArray(inv) ? inv : []);
      setClients(Array.isArray(c) ? c : []);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, []);

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
  }

  function removeItem(i: number) {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, field: keyof InvoiceItem, value: string | number) {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    setItems(updated);

    // Live margin check
    const subtotal = updated.reduce((s, it) => s + it.quantity * it.unit_price, 0);
    const discount = Number(form.discount_pct) || 0;
    const total = subtotal * (1 - discount / 100);
    const cost = subtotal * 0.5;
    const margin = total > 0 ? ((total - cost) / total) * 100 : 100;
    setMarginWarning(margin < 50 ? `Warning: margin is ${margin.toFixed(1)}% — below the 50% minimum. Reduce the discount.` : "");
  }

  // Compute totals for preview
  const subtotal = items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
  const discount = Number(form.discount_pct) || 0;
  const total = subtotal * (1 - discount / 100);
  const cost = subtotal * 0.5;
  const margin = total > 0 ? ((total - cost) / total) * 100 : 100;

  async function handleCreate() {
    if (!form.client_id) { 
      setFormError("Please select a client."); 
      return; 
    }
    if (items.some(it => !it.description || it.unit_price <= 0)) {
      setFormError("All items need a description and price.");
      return;
    }
    if (margin < 50) {
      setFormError("Cannot create invoice — margin is below 50%. Reduce the discount.");
      return;
    }
    
    setFormLoading(true);
    setFormError("");
    
    try {
      console.log('Creating invoice with:', {
        client_id: form.client_id,
        discount_pct: discount,
        due_date: form.due_date || undefined,
        items: items.map(it => ({
          description: it.description,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
        })),
      });

      const res = await apiPost("/invoices", {
        client_id: form.client_id,
        discount_pct: discount,
        due_date: form.due_date || undefined,
        items: items.map(it => ({
          description: it.description,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
        })),
      });

      console.log('Response:', res);

      if (res.id) {
        setShowForm(false);
        setForm({ client_id: "", discount_pct: "0", due_date: "" });
        setItems([{ description: "", quantity: 1, unit_price: 0 }]);
        load();
      } else {
        setFormError(res.message ?? "Failed to create invoice.");
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      setFormError("Could not connect to server.");
    } finally {
      setFormLoading(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <Topbar title="Invoices">
        {can('invoices.create') && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <i className="ti ti-plus"></i>New invoice
          </button>
        )}
      </Topbar>

      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--teal-fill)", border: "0.5px solid var(--teal)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 12, color: "var(--teal-text)", marginBottom: 12 }}>
        <i className="ti ti-shield-check"></i>
        Profit margin lock active — minimum 50% margin enforced on all invoices.
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--purple-fill)", border: "0.5px solid var(--purple-deep)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 12, color: "var(--purple-text)", marginBottom: 16 }}>
        <i className="ti ti-building-bank"></i>
        eTIMS integration active — invoices submitted to KRA automatically on generation.
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 130px 70px 100px 90px", gap: 14, background: "#0F0F0F", padding: "11px 14px", fontSize: 11, color: "var(--text-3)" }}>
          <span>Number</span><span>Client</span><span>Total</span><span>Margin</span><span>eTIMS</span><span>Status</span>
        </div>
        {invoices.map(inv => (
          <div key={inv.id} style={{ display: "grid", gridTemplateColumns: "110px 1fr 130px 70px 100px 90px", gap: 14, alignItems: "center", borderTop: "0.5px solid var(--border)", padding: "11px 14px", fontSize: 12 }}>
            <span style={{ color: "var(--text-3)" }}>{inv.invoice_number}</span>
            <span>{inv.client?.name}</span>
            <span>KES {Number(inv.total).toLocaleString()}</span>
            <span style={{ color: "var(--teal-light)" }}>{inv.margin_pct}%</span>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: inv.etims_status === "synced" ? "var(--green-fill)" : "var(--amber-fill)", color: inv.etims_status === "synced" ? "var(--green-text)" : "var(--amber-light)", width: "fit-content" }}>{inv.etims_status}</span>
            <span style={{ color: inv.status === "paid" ? "var(--teal-light)" : "var(--amber-light)" }}>{inv.status}</span>
          </div>
        ))}
        {invoices.length === 0 && <div style={{ padding: 16, fontSize: 12, color: "var(--text-4)" }}>No invoices yet</div>}
      </Card>

      {/* ── Create Invoice Modal ── */}
      {showForm && (
        <Modal title="New Invoice" onClose={() => setShowForm(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {formError && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--red-fill)", border: "0.5px solid var(--red)", borderRadius: "var(--radius-md)", padding: "9px 12px", fontSize: 12, color: "var(--red-light)" }}>
                <i className="ti ti-alert-circle"></i>{formError}
              </div>
            )}
            {marginWarning && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--amber-fill)", border: "0.5px solid var(--amber)", borderRadius: "var(--radius-md)", padding: "9px 12px", fontSize: 12, color: "var(--amber-light)" }}>
                <i className="ti ti-alert-triangle"></i>{marginWarning}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>CLIENT *</label>
                <select 
                  value={form.client_id} 
                  onChange={e => setForm({...form, client_id: e.target.value})} 
                  style={selectStyle}
                >
                  <option value="">Select client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>DUE DATE</label>
                <input 
                  type="date" 
                  value={form.due_date} 
                  onChange={e => setForm({...form, due_date: e.target.value})} 
                  style={inputStyle} 
                />
              </div>
            </div>

            {/* Line items */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={labelStyle}>LINE ITEMS *</label>
                <button onClick={addItem} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, border: "0.5px solid var(--border-2)", background: "transparent", color: "var(--text-2)", cursor: "pointer" }}>
                  <i className="ti ti-plus"></i> Add item
                </button>
              </div>

              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 110px 30px", gap: 8, marginBottom: 6, fontSize: 10, color: "var(--text-3)", padding: "0 4px" }}>
                <span>Description</span><span>Qty</span><span>Unit price (KES)</span><span></span>
              </div>

              {items.map((item, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 70px 110px 30px", gap: 8, marginBottom: 6 }}>
                  <input
                    value={item.description}
                    onChange={e => updateItem(i, "description", e.target.value)}
                    placeholder="Description"
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    min={1}
                    onChange={e => updateItem(i, "quantity", Number(e.target.value))}
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    value={item.unit_price || ""}
                    placeholder="0"
                    onChange={e => updateItem(i, "unit_price", Number(e.target.value))}
                    style={inputStyle}
                  />
                  <button onClick={() => removeItem(i)} style={{ height: 38, width: 30, borderRadius: 5, border: "0.5px solid var(--border)", background: "transparent", color: "var(--red-light)", cursor: "pointer", fontSize: 14 }}>×</button>
                </div>
              ))}
            </div>

            {/* Discount */}
            <div>
              <label style={labelStyle}>DISCOUNT % (max 50)</label>
              <input
                type="number"
                min={0}
                max={50}
                value={form.discount_pct}
                onChange={e => {
                  setForm({...form, discount_pct: e.target.value});
                  // Trigger recalculation
                  const subtotal = items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
                  const discount = Number(e.target.value) || 0;
                  const total = subtotal * (1 - discount / 100);
                  const cost = subtotal * 0.5;
                  const margin = total > 0 ? ((total - cost) / total) * 100 : 100;
                  setMarginWarning(margin < 50 ? `Warning: margin is ${margin.toFixed(1)}% — below the 50% minimum.` : "");
                }}
                style={inputStyle}
              />
            </div>

            {/* Live totals */}
            <div style={{ background: "var(--bg-app)", borderRadius: "var(--radius-md)", padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "var(--text-3)" }}>Subtotal</span>
                <span>KES {subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "var(--text-3)" }}>Discount ({discount}%)</span>
                <span style={{ color: "var(--coral-light)" }}>- KES {(subtotal - total).toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 600, borderTop: "0.5px solid var(--border)", paddingTop: 6 }}>
                <span>Total</span>
                <span>KES {total.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: "var(--text-3)" }}>Profit margin</span>
                <span style={{ color: margin >= 50 ? "var(--teal-light)" : "var(--red-light)", fontWeight: 600 }}>
                  {margin.toFixed(1)}% {margin >= 50 ? "✓" : "✗ below minimum"}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <button className="btn" onClick={() => setShowForm(false)} disabled={formLoading}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={formLoading || margin < 50}>
              {formLoading ? <><i className="ti ti-loader"></i>Creating...</> : <><i className="ti ti-file-invoice"></i>Create invoice</>}
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
      <div style={{ background: "var(--bg-panel)", borderRadius: "var(--radius-lg)", width: 640, maxHeight: "90vh", display: "flex", flexDirection: "column", border: "0.5px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "0.5px solid var(--border)", flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 22 }}>×</button>
        </div>
        <div style={{ overflowY: "auto", padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}