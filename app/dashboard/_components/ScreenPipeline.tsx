"use client";
import { useEffect, useState, useCallback } from "react";
import { apiGet, apiPatch } from "@/lib/api";
import { Card } from "./Card";
import { Topbar } from "./Topbar";
import { Spinner } from "./Spinner";
import { usePermissions } from "../_hooks/usePermissions";

export function ScreenPipeline() {
  const [leads, setLeads]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<"kanban"|"list">("kanban");
  const { can }               = usePermissions();

  const load = useCallback(() => {
    setLoading(true);
    apiGet('/leads').then(data => {
      setLeads(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const stages = ["lead","quote","demo","technical_review","closed_won"];
  const stageLabels: Record<string,string> = {
    lead: "Lead", quote: "Quote", demo: "Demo",
    technical_review: "Tech Review", closed_won: "Closed Won",
  };

  async function moveStage(id: string, stage: string) {
    if (!can('leads.edit')) return;
    await apiPatch(`/leads/${id}`, { stage });
    load();
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <Topbar title="Pipeline">
        <button className="btn" onClick={() => setTab(tab === "kanban" ? "list" : "kanban")}>
          <i className={`ti ${tab === "kanban" ? "ti-list" : "ti-layout-kanban"}`}></i>
          {tab === "kanban" ? "List view" : "Kanban view"}
        </button>
        {can('leads.create') && (
          <button className="btn btn-primary"><i className="ti ti-plus"></i>Add lead</button>
        )}
      </Topbar>

      {tab === "kanban" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
          {stages.map(stage => (
            <div key={stage} style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 10, display: "flex", flexDirection: "column", gap: 8, minHeight: 300 }}>
              <div style={{ fontSize: 11, color: "var(--text-3)", padding: "0 4px 4px", borderBottom: "0.5px solid var(--border)" }}>
                {stageLabels[stage]}
                <span style={{ float: "right" }}>{leads.filter(l => l.stage === stage).length}</span>
              </div>
              {leads.filter(l => l.stage === stage).map(lead => (
                <div key={lead.id} style={{
                  background: stage === "closed_won" ? "var(--teal-fill)" : "var(--bg-pill)",
                  border: stage === "closed_won" ? "0.5px solid var(--teal)" : "none",
                  borderRadius: "var(--radius-md)", padding: 10, fontSize: 12,
                }}>
                  <div style={{ fontWeight: 500 }}>{lead.company_name}</div>
                  <div style={{ fontSize: 10, color: stage === "closed_won" ? "var(--teal-light)" : "var(--text-3)", marginTop: 4 }}>
                    KES {Number(lead.estimated_value).toLocaleString()}
                  </div>
                  {can('leads.edit') && stage !== "closed_won" && (
                    <button onClick={() => moveStage(lead.id, stages[stages.indexOf(stage)+1])} style={{ marginTop: 6, fontSize: 10, padding: "2px 6px", borderRadius: 4, border: "0.5px solid var(--border-2)", background: "transparent", color: "var(--text-3)", cursor: "pointer" }}>
                      Move →
                    </button>
                  )}
                  {can('leads.delete') && (
                    <button style={{ marginTop: 4, fontSize: 10, padding: "2px 6px", borderRadius: 4, border: "0.5px solid var(--red)", background: "transparent", color: "var(--red-light)", cursor: "pointer" }}>
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 130px" + (can('leads.delete') ? " 80px" : ""), gap: 14, background: "#0F0F0F", padding: "11px 14px", fontSize: 11, color: "var(--text-3)" }}>
            <span>Company</span><span>Stage</span><span>Value</span>
            {can('leads.delete') && <span>Actions</span>}
          </div>
          {leads.map(l => (
            <div key={l.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 130px" + (can('leads.delete') ? " 80px" : ""), gap: 14, alignItems: "center", borderTop: "0.5px solid var(--border)", padding: "11px 14px", fontSize: 12 }}>
              <span>{l.company_name} — {l.contact_name}</span>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "var(--purple-fill)", color: "var(--purple-text)", width: "fit-content" }}>{stageLabels[l.stage]}</span>
              <span style={{ color: "var(--teal-light)" }}>KES {Number(l.estimated_value).toLocaleString()}</span>
              {can('leads.delete') && (
                <button style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, border: "0.5px solid var(--red)", background: "transparent", color: "var(--red-light)", cursor: "pointer" }}>Delete</button>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}