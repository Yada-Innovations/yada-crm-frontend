"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { Topbar } from "./Topbar";
import { Spinner } from "./Spinner";

type ModalMode = "view" | "edit" | "create" | "delete" | null;

const LEAD_STATUSES = ["new", "contacted", "qualified", "disqualified", "converted"] as const;
const STATUS_COLORS: Record<string, string> = {
  new: "#F59E0B",
  contacted: "#3B82F6",
  qualified: "#10B981",
  disqualified: "#EF4444",
  converted: "#8B5CF6",
};
const STATUS_BG: Record<string, string> = {
  new: "#FEF3C7",
  contacted: "#DBEAFE",
  qualified: "#D1FAE5",
  disqualified: "#FEE2E2",
  converted: "#EDE9FE",
};

export function ScreenLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    title: "",
    status: "new",
    source: "",
    notes: "",
    address: "",
    city: "",
    country: "Kenya",
    industry: "",
    company_size: "",
    website: "",
    score: 0,
    priority: "medium",
    sales_stage: "prospecting",
    assigned_to: "",
    expected_close_date: "",
    estimated_value: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  function load() {
    setLoading(true);
    apiGet('/leads').then(data => {
      setLeads(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, []);

  const stats = [
    { label: "TOTAL", value: leads.length, color: "#6B7280" },
    { label: "NEW", value: leads.filter(l => l.status === "new").length, color: "#F59E0B" },
    { label: "CONTACTED", value: leads.filter(l => l.status === "contacted").length, color: "#3B82F6" },
    { label: "QUALIFIED", value: leads.filter(l => l.status === "qualified").length, color: "#10B981" },
    { label: "LOST", value: leads.filter(l => l.status === "disqualified").length, color: "#EF4444" },
  ];

  const filtered = leads.filter(l => {
    const matchSearch = l.name?.toLowerCase().includes(search.toLowerCase()) ||
                        l.email?.toLowerCase().includes(search.toLowerCase()) ||
                        l.company?.toLowerCase().includes(search.toLowerCase()) ||
                        l.company_name?.toLowerCase().includes(search.toLowerCase()) ||
                        l.contact_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function resetForm() {
    setForm({
      name: "",
      email: "",
      phone: "",
      company: "",
      title: "",
      status: "new",
      source: "",
      notes: "",
      address: "",
      city: "",
      country: "Kenya",
      industry: "",
      company_size: "",
      website: "",
      score: 0,
      priority: "medium",
      sales_stage: "prospecting",
      assigned_to: "",
      expected_close_date: "",
      estimated_value: "",
    });
  }

  async function handleCreate() {
    const errors = [];
    if (!form.name || form.name.trim() === '') errors.push("Name is required");
    if (!form.email || form.email.trim() === '') errors.push("Email is required");
    if (!form.company || form.company.trim() === '') errors.push("Company name is required");
    
    if (errors.length > 0) {
      setFormError(errors.join(". "));
      return;
    }

    setFormLoading(true);
    setFormError("");
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim(),
        phone: form.phone || "",
        title: form.title || "",
        status: form.status || "new",
        source: form.source || "",
        notes: form.notes || "",
        address: form.address || "",
        city: form.city || "",
        country: form.country || "Kenya",
        industry: form.industry || "",
        company_size: form.company_size || "",
        website: form.website || "",
        score: parseInt(form.score.toString()) || 0,
        priority: form.priority || "medium",
        sales_stage: form.sales_stage || "prospecting",
        assigned_to: form.assigned_to || "",
        expected_close_date: form.expected_close_date || "",
        estimated_value: parseFloat(form.estimated_value) || 0,
      };

      const res = await apiPost("/leads", payload);
      
      if (res.id || res.message) {
        resetForm();
        closeModal();
      } else {
        setFormError(res.message || "Failed to create lead.");
      }
    } catch (error) {
      console.error('Create error:', error);
      setFormError("Could not connect to server.");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleUpdate() {
    const errors = [];
    if (!form.name || form.name.trim() === '') errors.push("Name is required");
    if (!form.email || form.email.trim() === '') errors.push("Email is required");
    if (!form.company || form.company.trim() === '') errors.push("Company name is required");
    
    if (errors.length > 0) {
      setFormError(errors.join(". "));
      return;
    }

    setFormLoading(true);
    setFormError("");
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim(),
        phone: form.phone || "",
        title: form.title || "",
        status: form.status || "new",
        source: form.source || "",
        notes: form.notes || "",
        address: form.address || "",
        city: form.city || "",
        country: form.country || "Kenya",
        industry: form.industry || "",
        company_size: form.company_size || "",
        website: form.website || "",
        score: parseInt(form.score.toString()) || 0,
        priority: form.priority || "medium",
        sales_stage: form.sales_stage || "prospecting",
        assigned_to: form.assigned_to || "",
        expected_close_date: form.expected_close_date || "",
        estimated_value: parseFloat(form.estimated_value) || 0,
      };

      const res = await apiPatch(`/leads/${selected.id}`, payload);
      
      if (res.id || res.message) {
        // Check if lead was converted to client
        if (res.converted) {
          alert(`🎉 Lead converted to client successfully!`);
        }
        closeModal();
      } else {
        setFormError(res.message || "Failed to update lead.");
      }
    } catch (error) {
      console.error('Update error:', error);
      setFormError("Could not connect to server.");
    } finally {
      setFormLoading(false);
    }
  }

  function openEdit(lead: any) {
    setSelected(lead);
    setForm({
      name: lead.contact_name || lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company_name || lead.company || "",
      title: lead.title || "",
      status: lead.status || "new",
      source: lead.source || "",
      notes: lead.notes || "",
      address: lead.address || "",
      city: lead.city || "",
      country: lead.country || "Kenya",
      industry: lead.industry || "",
      company_size: lead.company_size || "",
      website: lead.website || "",
      score: lead.score || 0,
      priority: lead.priority || "medium",
      sales_stage: lead.sales_stage || "prospecting",
      assigned_to: lead.assigned_to || "",
      expected_close_date: lead.expected_close_date || "",
      estimated_value: lead.estimated_value?.toString() || "",
    });
    setModal("edit");
    setFormError("");
  }

  function openCreate() {
    resetForm();
    setModal("create");
    setFormError("");
  }

  function closeModal() {
    setModal(null);
    setSelected(null);
    setFormError("");
    load();
  }

  function getStatusColor(status: string) {
    return STATUS_COLORS[status] || "#6B7280";
  }

  function getStatusBg(status: string) {
    return STATUS_BG[status] || "#F3F4F6";
  }

  function getDisplayName(lead: any) {
    return lead.contact_name || lead.name || "Unknown";
  }

  function getDisplayCompany(lead: any) {
    return lead.company_name || lead.company || "—";
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ background: "#F9FAFB", minHeight: "100vh" }}>
      {/* Topbar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 28px",
        background: "#FFFFFF",
        borderBottom: "1px solid #E5E7EB",
      }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "#1F2937", margin: 0 }}>Leads</h1>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>Manage your prospective clients.</p>
        </div>
        <button 
          onClick={openCreate}
          style={{
            background: "linear-gradient(135deg, #0E8C73 0%, #0A6B58 100%)",
            color: "#FFFFFF",
            border: "none",
            padding: "8px 18px",
            borderRadius: "6px",
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <i className="ti ti-plus" style={{ fontSize: 14 }}></i> Add Lead
        </button>
      </div>

      {/* Stats */}
      <div style={{ 
        display: "flex", 
        gap: 12, 
        padding: "16px 28px",
        background: "#FFFFFF",
        borderBottom: "1px solid #E5E7EB",
        flexWrap: "wrap",
      }}>
        {stats.map(s => (
          <div key={s.label} style={{ 
            padding: "4px 16px",
            borderRadius: "4px",
          }}>
            <div style={{ fontSize: 11, color: "#6B7280" }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ 
        display: "flex", 
        gap: 12, 
        padding: "16px 28px",
        background: "#FFFFFF",
        borderBottom: "1px solid #E5E7EB",
        alignItems: "center",
      }}>
        <div style={{ flex: 1, position: "relative", maxWidth: 400 }}>
          <i className="ti ti-search" style={{ 
            position: "absolute", 
            left: 12, 
            top: "50%", 
            transform: "translateY(-50%)", 
            color: "#9CA3AF", 
            fontSize: 14 
          }}></i>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search leads"
            style={{
              width: "100%", 
              height: 36, 
              background: "#F9FAFB",
              border: "1px solid #E5E7EB", 
              borderRadius: "6px",
              padding: "0 12px 0 36px", 
              fontSize: 13, 
              color: "#1F2937",
            }}
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{
            height: 36, 
            background: "#F9FAFB", 
            border: "1px solid #E5E7EB",
            borderRadius: "6px", 
            padding: "0 12px", 
            fontSize: 13,
            color: "#1F2937", 
            cursor: "pointer",
          }}
        >
          <option value="all">All statuses</option>
          {LEAD_STATUSES.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Leads Table */}
      <div style={{ padding: "16px 28px" }}>
        <div style={{ 
          background: "#FFFFFF", 
          borderRadius: "8px", 
          overflow: "hidden",
          border: "1px solid #E5E7EB",
        }}>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 180px 140px 100px 100px 80px",
            gap: 10, 
            background: "#F9FAFB", 
            padding: "12px 18px", 
            fontSize: 11, 
            color: "#6B7280",
            fontWeight: 600,
            borderBottom: "1px solid #E5E7EB",
          }}>
            <span>Name</span>
            <span>Email</span>
            <span>Company</span>
            <span>Phone</span>
            <span>Status</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: 40, fontSize: 13, color: "#9CA3AF", textAlign: "center" }}>
              No leads found matching the criteria.
            </div>
          )}

          {filtered.map((lead, i) => (
            <div key={lead.id} style={{
              display: "grid", 
              gridTemplateColumns: "1fr 180px 140px 100px 100px 80px",
              gap: 10, 
              alignItems: "center", 
              padding: "12px 18px",
              borderBottom: i < filtered.length - 1 ? "1px solid #F3F4F6" : "none",
              background: i % 2 === 0 ? "#FFFFFF" : "#FAFBFC",
            }}>
              {/* Name */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "rgba(14, 140, 115, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#0E8C73",
                  flexShrink: 0,
                }}>
                  {getDisplayName(lead)?.[0]?.toUpperCase() || "L"}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#1F2937" }}>{getDisplayName(lead)}</div>
                  <div style={{ fontSize: 10, color: "#9CA3AF" }}>Score: {lead.score || 0}</div>
                </div>
              </div>

              {/* Email */}
              <div style={{ fontSize: 12, color: "#1F2937" }}>{lead.email || "—"}</div>

              {/* Company */}
              <div style={{ fontSize: 12, color: "#1F2937" }}>{getDisplayCompany(lead)}</div>

              {/* Phone */}
              <div style={{ fontSize: 12, color: "#1F2937" }}>{lead.phone || "—"}</div>

              {/* Status with Client Badge */}
              <div>
                <span style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: getStatusBg(lead.status),
                  color: getStatusColor(lead.status),
                  display: "inline-block",
                }}>
                  {lead.status?.charAt(0).toUpperCase() + lead.status?.slice(1) || "New"}
                </span>
                {/* Show Client badge if lead has been converted to client */}
                {lead.client_id && (
                  <span style={{
                    fontSize: 9,
                    padding: "2px 8px",
                    borderRadius: 12,
                    background: "#D1FAE5",
                    color: "#065F46",
                    display: "inline-block",
                    marginLeft: 4,
                  }}>
                    <i className="ti ti-check" style={{ fontSize: 10 }}></i> Client
                  </span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button
                  onClick={() => { setSelected(lead); setModal("view"); }}
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    border: "1px solid #E5E7EB",
                    background: "transparent", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#6B7280",
                  }}
                >
                  <i className="ti ti-eye" style={{ fontSize: 13 }}></i>
                </button>
                <button
                  onClick={() => openEdit(lead)}
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    border: "1px solid #E5E7EB",
                    background: "transparent", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#0E8C73",
                  }}
                >
                  <i className="ti ti-edit" style={{ fontSize: 13 }}></i>
                </button>
                <button
                  onClick={() => { setSelected(lead); setModal("delete"); }}
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    border: "1px solid #E5E7EB",
                    background: "transparent", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#EF4444",
                  }}
                >
                  <i className="ti ti-trash" style={{ fontSize: 13 }}></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── VIEW LEAD MODAL ── */}
      {modal === "view" && selected && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            background: "#FFFFFF", borderRadius: "12px",
            width: 580, maxHeight: "90vh", display: "flex", flexDirection: "column",
            border: "1px solid #E5E7EB",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 20px", borderBottom: "1px solid #E5E7EB", flexShrink: 0,
            }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#1F2937" }}>Lead Details</span>
              <button onClick={closeModal} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#6B7280", fontSize: 22, lineHeight: 1,
              }}>×</button>
            </div>
            <div style={{ overflowY: "auto", padding: 20 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 14,
                marginBottom: 20, padding: 16,
                background: "#F9FAFB", borderRadius: "8px",
              }}>
                <div style={{
                  width: 60, height: 60, borderRadius: "50%",
                  background: "rgba(14, 140, 115, 0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, fontWeight: 700, color: "#0E8C73",
                  flexShrink: 0,
                }}>
                  {getDisplayName(selected)?.[0]?.toUpperCase() || "L"}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: "#1F2937" }}>{getDisplayName(selected)}</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>{selected.email}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span style={{
                      fontSize: 11, padding: "2px 10px", borderRadius: 12,
                      background: getStatusBg(selected.status),
                      color: getStatusColor(selected.status),
                    }}>
                      {selected.status?.charAt(0).toUpperCase() + selected.status?.slice(1) || "New"}
                    </span>
                    {selected.client_id && (
                      <span style={{
                        fontSize: 10, padding: "2px 10px", borderRadius: 12,
                        background: "#D1FAE5",
                        color: "#065F46",
                      }}>
                        <i className="ti ti-check" style={{ fontSize: 10 }}></i> Converted to Client
                      </span>
                    )}
                    <span style={{
                      fontSize: 11, padding: "2px 10px", borderRadius: 12,
                      background: selected.priority === "high" ? "#FEE2E2" : selected.priority === "medium" ? "#FEF3C7" : "#D1FAE5",
                      color: selected.priority === "high" ? "#991B1B" : selected.priority === "medium" ? "#B45309" : "#065F46",
                    }}>
                      {selected.priority?.charAt(0).toUpperCase() + selected.priority?.slice(1) || "Medium"} Priority
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 12 }}>
                  <div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                    Company Information
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #E5E7EB" }}>
                    <span style={{ color: "#6B7280" }}>Company</span>
                    <span style={{ color: "#1F2937" }}>{getDisplayCompany(selected)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #E5E7EB" }}>
                    <span style={{ color: "#6B7280" }}>Industry</span>
                    <span style={{ color: "#1F2937" }}>{selected.industry || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
                    <span style={{ color: "#6B7280" }}>Website</span>
                    <span style={{ color: "#1F2937" }}>{selected.website || "—"}</span>
                  </div>
                </div>

                <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 12 }}>
                  <div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                    Contact Information
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #E5E7EB" }}>
                    <span style={{ color: "#6B7280" }}>Phone</span>
                    <span style={{ color: "#1F2937" }}>{selected.phone || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #E5E7EB" }}>
                    <span style={{ color: "#6B7280" }}>Email</span>
                    <span style={{ color: "#1F2937" }}>{selected.email || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
                    <span style={{ color: "#6B7280" }}>Title</span>
                    <span style={{ color: "#1F2937" }}>{selected.title || "—"}</span>
                  </div>
                </div>

                <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 12 }}>
                  <div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                    Location
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #E5E7EB" }}>
                    <span style={{ color: "#6B7280" }}>Address</span>
                    <span style={{ color: "#1F2937" }}>{selected.address || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #E5E7EB" }}>
                    <span style={{ color: "#6B7280" }}>City</span>
                    <span style={{ color: "#1F2937" }}>{selected.city || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
                    <span style={{ color: "#6B7280" }}>Country</span>
                    <span style={{ color: "#1F2937" }}>{selected.country || "Kenya"}</span>
                  </div>
                </div>

                <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 12 }}>
                  <div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                    Sales Pipeline
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #E5E7EB" }}>
                    <span style={{ color: "#6B7280" }}>Stage</span>
                    <span style={{ color: "#1F2937" }}>{selected.sales_stage?.replace(/_/g, " ") || "Prospecting"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #E5E7EB" }}>
                    <span style={{ color: "#6B7280" }}>Expected Close</span>
                    <span style={{ color: "#1F2937" }}>{selected.expected_close_date ? new Date(selected.expected_close_date).toLocaleDateString() : "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
                    <span style={{ color: "#6B7280" }}>Estimated Value</span>
                    <span style={{ color: "#0E8C73", fontWeight: 600 }}>
                      {selected.estimated_value ? `KES ${Number(selected.estimated_value).toLocaleString()}` : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {selected.notes && (
                <div style={{ marginTop: 12, background: "#F9FAFB", borderRadius: "8px", padding: 12 }}>
                  <div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                    Notes
                  </div>
                  <div style={{ fontSize: 13, color: "#1F2937" }}>{selected.notes}</div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <button className="btn" onClick={closeModal} style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid #E5E7EB",
                  background: "transparent",
                  color: "#6B7280",
                  cursor: "pointer",
                  fontSize: 13,
                }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE LEAD MODAL ── */}
      {modal === "create" && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            background: "#FFFFFF", borderRadius: "12px",
            width: 560, maxHeight: "90vh", display: "flex", flexDirection: "column",
            border: "1px solid #E5E7EB",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 20px", borderBottom: "1px solid #E5E7EB", flexShrink: 0,
            }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#1F2937" }}>Add New Lead</span>
              <button onClick={closeModal} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#6B7280", fontSize: 22, lineHeight: 1,
              }}>×</button>
            </div>
            <div style={{ overflowY: "auto", padding: 20 }}>
              <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {formError && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: "#FEE2E2", border: "1px solid #FCA5A5",
                      borderRadius: "6px", padding: "9px 12px",
                      fontSize: 12, color: "#991B1B",
                    }}>
                      <i className="ti ti-alert-circle"></i>{formError}
                    </div>
                  )}

                  {/* Company Details */}
                  <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 16, border: "1px solid #E5E7EB" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-building" style={{ color: "#0E8C73", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1F2937" }}>Company Details</span>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>
                        Company Name <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <input
                        value={form.company}
                        onChange={e => setForm({ ...form, company: e.target.value })}
                        placeholder="Company Name"
                        style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                      />
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>
                        Company Email <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="company@email.com"
                        style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Company Phone</label>
                        <input
                          value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                          placeholder="+254 700 000000"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Company Address</label>
                        <input
                          value={form.address}
                          onChange={e => setForm({ ...form, address: e.target.value })}
                          placeholder="123 Main Street"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 16, border: "1px solid #E5E7EB" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-details" style={{ color: "#3B82F6", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1F2937" }}>Additional Details</span>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>
                        Contact Name <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <input
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="John Doe"
                        style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Status</label>
                        <select
                          value={form.status}
                          onChange={e => setForm({ ...form, status: e.target.value })}
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                        >
                          {LEAD_STATUSES.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Notes</label>
                        <textarea
                          value={form.notes}
                          onChange={e => setForm({ ...form, notes: e.target.value })}
                          placeholder="Additional notes..."
                          rows={2}
                          style={{ width: "100%", padding: "8px 10px", background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", fontSize: 13, color: "#1F2937", resize: "vertical", fontFamily: "inherit", minHeight: 60 }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={formLoading}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        border: "1px solid #E5E7EB",
                        background: "transparent",
                        color: "#6B7280",
                        cursor: formLoading ? "not-allowed" : "pointer",
                        opacity: formLoading ? 0.5 : 1,
                        fontSize: 13,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      style={{
                        padding: "8px 20px",
                        borderRadius: "6px",
                        border: "none",
                        background: "linear-gradient(135deg, #0E8C73 0%, #0A6B58 100%)",
                        color: "#FFFFFF",
                        cursor: formLoading ? "not-allowed" : "pointer",
                        opacity: formLoading ? 0.5 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                      }}
                    >
                      {formLoading ? (
                        <><i className="ti ti-loader" style={{ animation: "spin 1s linear infinite" }}></i> Saving...</>
                      ) : (
                        <><i className="ti ti-check"></i> Save Lead</>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT LEAD MODAL ── */}
      {modal === "edit" && selected && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            background: "#FFFFFF", borderRadius: "12px",
            width: 560, maxHeight: "90vh", display: "flex", flexDirection: "column",
            border: "1px solid #E5E7EB",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 20px", borderBottom: "1px solid #E5E7EB", flexShrink: 0,
            }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#1F2937" }}>Edit Lead</span>
              <button onClick={closeModal} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#6B7280", fontSize: 22, lineHeight: 1,
              }}>×</button>
            </div>
            <div style={{ overflowY: "auto", padding: 20 }}>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {formError && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: "#FEE2E2", border: "1px solid #FCA5A5",
                      borderRadius: "6px", padding: "9px 12px",
                      fontSize: 12, color: "#991B1B",
                    }}>
                      <i className="ti ti-alert-circle"></i>{formError}
                    </div>
                  )}

                  {/* Company Details */}
                  <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 16, border: "1px solid #E5E7EB" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-building" style={{ color: "#0E8C73", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1F2937" }}>Company Details</span>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>
                        Company Name <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <input
                        value={form.company}
                        onChange={e => setForm({ ...form, company: e.target.value })}
                        placeholder="Company Name"
                        style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                      />
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>
                        Company Email <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="company@email.com"
                        style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Company Phone</label>
                        <input
                          value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                          placeholder="+254 700 000000"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Company Address</label>
                        <input
                          value={form.address}
                          onChange={e => setForm({ ...form, address: e.target.value })}
                          placeholder="123 Main Street"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 16, border: "1px solid #E5E7EB" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-details" style={{ color: "#3B82F6", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1F2937" }}>Additional Details</span>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>
                        Contact Name <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <input
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="John Doe"
                        style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Status</label>
                        <select
                          value={form.status}
                          onChange={e => setForm({ ...form, status: e.target.value })}
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                        >
                          {LEAD_STATUSES.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Notes</label>
                        <textarea
                          value={form.notes}
                          onChange={e => setForm({ ...form, notes: e.target.value })}
                          placeholder="Additional notes..."
                          rows={2}
                          style={{ width: "100%", padding: "8px 10px", background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", fontSize: 13, color: "#1F2937", resize: "vertical", fontFamily: "inherit", minHeight: 60 }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={formLoading}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        border: "1px solid #E5E7EB",
                        background: "transparent",
                        color: "#6B7280",
                        cursor: formLoading ? "not-allowed" : "pointer",
                        opacity: formLoading ? 0.5 : 1,
                        fontSize: 13,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      style={{
                        padding: "8px 20px",
                        borderRadius: "6px",
                        border: "none",
                        background: "linear-gradient(135deg, #0E8C73 0%, #0A6B58 100%)",
                        color: "#FFFFFF",
                        cursor: formLoading ? "not-allowed" : "pointer",
                        opacity: formLoading ? 0.5 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                      }}
                    >
                      {formLoading ? (
                        <><i className="ti ti-loader" style={{ animation: "spin 1s linear infinite" }}></i> Updating...</>
                      ) : (
                        <><i className="ti ti-check"></i> Update Lead</>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE MODAL ── */}
      {modal === "delete" && selected && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001,
        }}>
          <div style={{ 
            background: "#FFFFFF", 
            borderRadius: "12px", 
            padding: 24, 
            width: 400, 
            border: "1px solid #E5E7EB",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ 
                width: 36, height: 36, borderRadius: "50%", 
                background: "#FEE2E2", 
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <i className="ti ti-trash" style={{ color: "#EF4444", fontSize: 18 }}></i>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1F2937" }}>Delete Lead</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>This action cannot be undone</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#1F2937", marginBottom: 20 }}>
              Are you sure you want to delete <strong>{getDisplayName(selected)}</strong>?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button 
                onClick={closeModal}
                style={{
                  padding: "7px 16px",
                  borderRadius: "6px",
                  border: "1px solid #E5E7EB",
                  background: "transparent",
                  color: "#6B7280",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await apiDelete(`/leads/${selected.id}`);
                    closeModal();
                  } catch {
                    alert("Failed to delete lead.");
                  }
                }}
                style={{
                  padding: "7px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#EF4444",
                  color: "#FFFFFF",
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <i className="ti ti-trash"></i> Delete Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}