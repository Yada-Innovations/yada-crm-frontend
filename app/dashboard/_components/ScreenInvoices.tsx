"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Card } from "./Card";
import { Topbar } from "./Topbar";
import { Spinner } from "./Spinner";
import { usePermissions } from "../_hooks/usePermissions";

export function ScreenInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const { can }                 = usePermissions();

  useEffect(() => {
    apiGet('/invoices').then(data => {
      setInvoices(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <Topbar title="Invoices">
        {can('invoices.create') && (
          <button className="btn btn-primary"><i className="ti ti-plus"></i>New invoice</button>
        )}
      </Topbar>

      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--teal-fill)", border: "0.5px solid var(--teal)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 12, color: "var(--teal-text)", marginBottom: 12 }}>
        <i className="ti ti-shield-check"></i>
        Profit margin lock active — minimum 50% margin enforced on all quotes and invoices.
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--purple-fill)", border: "0.5px solid var(--purple-deep)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 12, color: "var(--purple-text)", marginBottom: 16 }}>
        <i className="ti ti-building-bank"></i>
        eTIMS integration active — invoices submitted to KRA automatically on generation.
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 130px 70px 100px 90px" + (can('invoices.delete') ? " 70px" : ""), gap: 14, background: "#0F0F0F", padding: "11px 14px", fontSize: 11, color: "var(--text-3)" }}>
          <span>Number</span><span>Client</span><span>Total</span><span>Margin</span><span>eTIMS</span><span>Status</span>
          {can('invoices.delete') && <span>Actions</span>}
        </div>
        {invoices.map(inv => (
          <div key={inv.id} style={{ display: "grid", gridTemplateColumns: "110px 1fr 130px 70px 100px 90px" + (can('invoices.delete') ? " 70px" : ""), gap: 14, alignItems: "center", borderTop: "0.5px solid var(--border)", padding: "11px 14px", fontSize: 12 }}>
            <span style={{ color: "var(--text-3)" }}>{inv.invoice_number}</span>
            <span>{inv.client?.name}</span>
            <span>KES {Number(inv.total).toLocaleString()}</span>
            <span style={{ color: "var(--teal-light)" }}>{inv.margin_pct}%</span>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: inv.etims_status === "synced" ? "var(--green-fill)" : "var(--amber-fill)", color: inv.etims_status === "synced" ? "var(--green-text)" : "var(--amber-light)", width: "fit-content" }}>{inv.etims_status}</span>
            <span style={{ color: inv.status === "paid" ? "var(--teal-light)" : "var(--amber-light)" }}>{inv.status}</span>
            {can('invoices.delete') && (
              <button style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, border: "0.5px solid var(--red)", background: "transparent", color: "var(--red-light)", cursor: "pointer" }}>Delete</button>
            )}
          </div>
        ))}
        {invoices.length === 0 && <div style={{ padding: 16, fontSize: 12, color: "var(--text-4)" }}>No invoices yet</div>}
      </Card>
    </div>
  );
}