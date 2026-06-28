"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Card } from "./Card";
import { Topbar } from "./Topbar";
import { Spinner } from "./Spinner";
import { usePermissions } from "../_hooks/usePermissions";

export function ScreenPayments() {
  const [invoices, setInvoices]   = useState<any[]>([]);
  const [selected, setSelected]   = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<"overview"|"invoices">("overview");
  const { can }                   = usePermissions();

  function load() {
    setLoading(true);
    apiGet('/invoices').then(data => {
      setInvoices(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, []);

  if (loading) return <Spinner />;

  const totalBilled  = invoices.reduce((s, inv) => s + Number(inv.total), 0);
  const totalPaid    = invoices.filter(inv => inv.status === "paid").reduce((s, inv) => s + Number(inv.total), 0);
  const totalDue     = invoices.filter(inv => inv.status !== "paid").reduce((s, inv) => s + Number(inv.total), 0);
  const paidCount    = invoices.filter(inv => inv.status === "paid").length;
  const overdueCount = invoices.filter(inv => inv.status === "overdue").length;

  const statusColor: Record<string,string> = {
    draft:    "var(--text-3)",
    sent:     "var(--blue-light)",
    paid:     "var(--teal-light)",
    overdue:  "var(--red-light)",
  };
  const statusBg: Record<string,string> = {
    draft:    "var(--bg-pill)",
    sent:     "rgba(133,183,235,0.12)",
    paid:     "var(--teal-fill)",
    overdue:  "var(--red-fill)",
  };

  return (
    <div>
      <Topbar title="Payments">
        <button className="btn" onClick={() => setTab(tab === "overview" ? "invoices" : "overview")}>
          <i className={`ti ${tab === "overview" ? "ti-file-invoice" : "ti-chart-bar"}`}></i>
          {tab === "overview" ? "Invoice list" : "Overview"}
        </button>
      </Topbar>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Total billed",  value: `KES ${totalBilled.toLocaleString()}`,  color: "var(--purple)" },
          { label: "Total paid",    value: `KES ${totalPaid.toLocaleString()}`,    color: "var(--teal-light)" },
          { label: "Outstanding",   value: `KES ${totalDue.toLocaleString()}`,     color: "var(--coral-light)" },
          { label: "Overdue",       value: overdueCount,                           color: "var(--red-light)" },
        ].map(s => (
          <Card key={s.label} style={{ padding: 14 }}>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {tab === "overview" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Payment status breakdown */}
          <Card>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 14 }}>Payment status breakdown</div>
            {[
              { label: "Paid",    count: paidCount,                                       color: "var(--teal-light)",  bg: "var(--teal-fill)" },
              { label: "Sent",    count: invoices.filter(i => i.status === "sent").length,   color: "var(--blue-light)",  bg: "rgba(133,183,235,0.12)" },
              { label: "Overdue", count: overdueCount,                                    color: "var(--red-light)",   bg: "var(--red-fill)" },
              { label: "Draft",   count: invoices.filter(i => i.status === "draft").length,  color: "var(--text-3)",      bg: "var(--bg-pill)" },
            ].map(s => (
              <div key={s.label} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                  <span style={{ color: "var(--text-2)" }}>{s.label}</span>
                  <span style={{ color: s.color, fontWeight: 600 }}>{s.count} invoices</span>
                </div>
                <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${invoices.length > 0 ? (s.count / invoices.length) * 100 : 0}%`, background: s.color, borderRadius: 3 }}></div>
                </div>
              </div>
            ))}
          </Card>

          {/* Recent payments */}
          <Card>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 14 }}>Recent invoices</div>
            {invoices.slice(0,5).map(inv => (
              <div
                key={inv.id}
                onClick={() => { setSelected(inv); setTab("invoices"); }}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "0.5px solid var(--border)", cursor: "pointer" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{inv.invoice_number}</div>
                  <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>{inv.client?.name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "var(--teal-light)" }}>KES {Number(inv.total).toLocaleString()}</div>
                  <div style={{ fontSize: 10, padding: "1px 7px", borderRadius: 4, background: statusBg[inv.status], color: statusColor[inv.status], marginTop: 3 }}>{inv.status}</div>
                </div>
              </div>
            ))}
            {invoices.length === 0 && <div style={{ fontSize: 12, color: "var(--text-4)" }}>No invoices yet</div>}
          </Card>
        </div>
      ) : (
        /* Invoice list with payment details */
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 130px 70px 100px 100px 90px", gap: 12, background: "#0F0F0F", padding: "11px 16px", fontSize: 11, color: "var(--text-3)" }}>
            <span>Invoice #</span><span>Client</span><span>Total</span><span>Margin</span><span>eTIMS</span><span>Status</span><span>Actions</span>
          </div>
          {invoices.map(inv => (
            <div key={inv.id}>
              <div
                onClick={() => setSelected(selected?.id === inv.id ? null : inv)}
                style={{ display: "grid", gridTemplateColumns: "110px 1fr 130px 70px 100px 100px 90px", gap: 12, alignItems: "center", borderTop: "0.5px solid var(--border)", padding: "12px 16px", fontSize: 12, cursor: "pointer", background: selected?.id === inv.id ? "var(--bg-pill)" : "transparent" }}>
                <span style={{ color: "var(--text-3)", fontWeight: 500 }}>{inv.invoice_number}</span>
                <span style={{ fontWeight: 500 }}>{inv.client?.name}</span>
                <span>KES {Number(inv.total).toLocaleString()}</span>
                <span style={{ color: "var(--teal-light)" }}>{inv.margin_pct}%</span>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: inv.etims_status === "synced" ? "var(--teal-fill)" : "var(--amber-fill)", color: inv.etims_status === "synced" ? "var(--teal-light)" : "var(--amber-light)", width: "fit-content" }}>{inv.etims_status}</span>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: statusBg[inv.status], color: statusColor[inv.status], width: "fit-content" }}>{inv.status}</span>
                <button style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, border: "0.5px solid var(--border-2)", background: "transparent", color: "var(--text-2)", cursor: "pointer" }}>
                  {selected?.id === inv.id ? "▲ Hide" : "▼ Details"}
                </button>
              </div>

              {/* Expanded payment details */}
              {selected?.id === inv.id && (
                <div style={{ background: "var(--bg-app)", borderLeft: "3px solid var(--purple)", margin: "0 16px 12px", borderRadius: "0 var(--radius-md) var(--radius-md) 0", padding: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 3 }}>SUBTOTAL</div>
                      <div style={{ fontSize: 13 }}>KES {Number(inv.subtotal).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 3 }}>DISCOUNT</div>
                      <div style={{ fontSize: 13, color: "var(--coral-light)" }}>{inv.discount_pct}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 3 }}>PROFIT MARGIN</div>
                      <div style={{ fontSize: 13, color: "var(--teal-light)" }}>{inv.margin_pct}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 3 }}>DUE DATE</div>
                      <div style={{ fontSize: 13 }}>{inv.due_date ?? "—"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 3 }}>eTIMS CODE</div>
                      <div style={{ fontSize: 11, color: "var(--purple-text)" }}>{inv.etims_code ?? "Pending"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 3 }}>CREATED BY</div>
                      <div style={{ fontSize: 13 }}>{inv.creator?.name ?? "—"}</div>
                    </div>
                  </div>

                  {/* Payment action */}
                  {inv.status !== "paid" && can('invoices.edit') && (
                    <button
                      style={{ fontSize: 12, padding: "6px 14px", borderRadius: "var(--radius-md)", border: "none", background: "var(--teal)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                      <i className="ti ti-check"></i>Mark as paid
                    </button>
                  )}
                  {inv.status === "paid" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--teal-light)" }}>
                      <i className="ti ti-circle-check"></i>Payment received
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {invoices.length === 0 && <div style={{ padding: 16, fontSize: 12, color: "var(--text-4)" }}>No invoices yet</div>}
        </Card>
      )}
    </div>
  );
}