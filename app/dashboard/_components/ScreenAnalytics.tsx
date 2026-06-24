"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Card } from "./Card";
import { Topbar } from "./Topbar";
import { Spinner } from "./Spinner";

export function ScreenAnalytics() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { apiGet('/dashboard').then(setData); }, []);
  if (!data) return <Spinner />;

  const months = ["Jan","Feb","Mar","Apr","May","Jun"];
  const mrr    = [1200000, 1450000, 1800000, 2000000, 2200000, Number(data.mrr)];
  const maxMrr = Math.max(...mrr);

  const conversionStages = [
    { label: "Leads → Quotes",      rate: 63, color: "var(--purple)" },
    { label: "Quotes → Demos",      rate: 62, color: "var(--blue-light)" },
    { label: "Demos → Tech Review", rate: 53, color: "var(--teal-light)" },
    { label: "Tech Review → Won",   rate: 62, color: "var(--coral-light)" },
    { label: "Overall conversion",  rate: 13, color: "var(--amber-light)" },
  ];

  const metrics = [
    { label: "Active clients", value: data.active_clients, color: "var(--teal-light)" },
    { label: "Open tickets",   value: data.open_tickets,   color: "var(--red-light)" },
    { label: "Total leads",    value: data.total_leads,    color: "var(--purple)" },
    { label: "Renewals (30d)", value: data.renewals_due,   color: "var(--amber-light)" },
  ];

  return (
    <div>
      <Topbar title="Analytics" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        {metrics.map(m => (
          <Card key={m.label} style={{ padding: 14 }}>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: m.color }}>{m.value}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        <Card>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16 }}>MRR trend</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 140 }}>
            {mrr.map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 9, color: "var(--text-4)" }}>{(v/1000000).toFixed(1)}M</div>
                <div style={{ width: "100%", background: "var(--purple)", borderRadius: "3px 3px 0 0", height: `${Math.round((v/maxMrr)*100)}px`, opacity: i === mrr.length-1 ? 1 : 0.5 }}></div>
                <div style={{ fontSize: 10, color: "var(--text-3)" }}>{months[i]}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12 }}>Sales conversion rates</div>
          {conversionStages.map(s => (
            <div key={s.label} style={{ fontSize: 11, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "var(--text-2)" }}>{s.label}</span>
                <span style={{ color: s.color, fontWeight: 600 }}>{s.rate}%</span>
              </div>
              <div style={{ height: 5, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${s.rate}%`, background: s.color, borderRadius: 3 }}></div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}