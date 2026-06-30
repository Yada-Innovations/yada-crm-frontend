"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { Spinner } from "./Spinner";

type ModalMode = "view" | "edit" | "create" | "delete" | null;

const CLIENT_STATUSES = ["active", "inactive", "suspended"] as const;
const STATUS_COLORS: Record<string, string> = {
  active: "#10B981",
  inactive: "#9CA3AF",
  suspended: "#EF4444",
};
const STATUS_BG: Record<string, string> = {
  active: "#D1FAE5",
  inactive: "#F3F4F6",
  suspended: "#FEE2E2",
};

export function ScreenClients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    company_name: "",
    company_phone: "",
    company_email: "",
    status: "active",
    address: "",
    city: "",
    country: "Kenya",
    notes: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  function load() {
    setLoading(true);
    apiGet('/clients').then(data => {
      setClients(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, []);

  const stats = [
    { label: "Total Clients", value: clients.length, color: "#6B7280" },
    { label: "Active", value: clients.filter(c => c.status === "active").length, color: "#10B981" },
    { label: "Inactive", value: clients.filter(c => c.status === "inactive").length, color: "#9CA3AF" },
    { label: "Suspended", value: clients.filter(c => c.status === "suspended").length, color: "#EF4444" },
  ];

  const filtered = clients.filter(c => {
    const fullName = `${c.first_name || ''} ${c.middle_name || ''} ${c.last_name || ''}`.toLowerCase();
    const matchSearch = fullName.includes(search.toLowerCase()) ||
                        c.email?.toLowerCase().includes(search.toLowerCase()) ||
                        c.company_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function resetForm() {
    setForm({
      first_name: "",
      middle_name: "",
      last_name: "",
      email: "",
      phone: "",
      company_name: "",
      company_phone: "",
      company_email: "",
      status: "active",
      address: "",
      city: "",
      country: "Kenya",
      notes: "",
    });
  }

  async function handleCreate() {
    const errors = [];
    if (!form.first_name || form.first_name.trim() === '') errors.push("First Name is required");
    if (!form.last_name || form.last_name.trim() === '') errors.push("Last Name is required");
    if (!form.email || form.email.trim() === '') errors.push("Email is required");
    if (!form.company_name || form.company_name.trim() === '') errors.push("Company Name is required");
    
    if (errors.length > 0) {
      setFormError(errors.join(". "));
      return;
    }

    setFormLoading(true);
    setFormError("");
    try {
      const payload = {
        first_name: form.first_name.trim(),
        middle_name: form.middle_name?.trim() || "",
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone || "",
        company_name: form.company_name.trim(),
        company_phone: form.company_phone || "",
        company_email: form.company_email || "",
        status: form.status || "active",
        address: form.address || "",
        city: form.city || "",
        country: form.country || "Kenya",
        notes: form.notes || "",
      };

      const res = await apiPost("/clients", payload);
      
      if (res.id || res.message) {
        resetForm();
        closeModal();
      } else {
        setFormError(res.message || "Failed to create client.");
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
    if (!form.first_name || form.first_name.trim() === '') errors.push("First Name is required");
    if (!form.last_name || form.last_name.trim() === '') errors.push("Last Name is required");
    if (!form.email || form.email.trim() === '') errors.push("Email is required");
    if (!form.company_name || form.company_name.trim() === '') errors.push("Company Name is required");
    
    if (errors.length > 0) {
      setFormError(errors.join(". "));
      return;
    }

    setFormLoading(true);
    setFormError("");
    try {
      const payload = {
        first_name: form.first_name.trim(),
        middle_name: form.middle_name?.trim() || "",
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone || "",
        company_name: form.company_name.trim(),
        company_phone: form.company_phone || "",
        company_email: form.company_email || "",
        status: form.status || "active",
        address: form.address || "",
        city: form.city || "",
        country: form.country || "Kenya",
        notes: form.notes || "",
      };

      const res = await apiPatch(`/clients/${selected.id}`, payload);
      
      if (res.id || res.message) {
        closeModal();
      } else {
        setFormError(res.message || "Failed to update client.");
      }
    } catch (error) {
      console.error('Update error:', error);
      setFormError("Could not connect to server.");
    } finally {
      setFormLoading(false);
    }
  }

  function openEdit(client: any) {
    setSelected(client);
    setForm({
      first_name: client.first_name || "",
      middle_name: client.middle_name || "",
      last_name: client.last_name || "",
      email: client.email || "",
      phone: client.phone || "",
      company_name: client.company_name || "",
      company_phone: client.company_phone || "",
      company_email: client.company_email || "",
      status: client.status || "active",
      address: client.address || "",
      city: client.city || "",
      country: client.country || "Kenya",
      notes: client.notes || "",
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

  function getFullName(client: any) {
    return `${client.first_name || ''} ${client.middle_name || ''} ${client.last_name || ''}`.trim() || "Unknown";
  }

  function getStatusColor(status: string) {
    return STATUS_COLORS[status] || "#6B7280";
  }

  function getStatusBg(status: string) {
    return STATUS_BG[status] || "#F3F4F6";
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
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "#1F2937", margin: 0 }}>Clients</h1>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>Manage your clients.</p>
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
          <i className="ti ti-plus" style={{ fontSize: 14 }}></i> Add Client
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
            placeholder="Search clients..."
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
          {CLIENT_STATUSES.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Clients Table */}
      <div style={{ padding: "16px 28px" }}>
        <div style={{ 
          background: "#FFFFFF", 
          borderRadius: "8px", 
          overflow: "hidden",
          border: "1px solid #E5E7EB",
        }}>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 160px 140px 100px 100px 80px",
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
              No clients found.
            </div>
          )}

          {filtered.map((client, i) => (
            <div key={client.id} style={{
              display: "grid", 
              gridTemplateColumns: "1fr 160px 140px 100px 100px 80px",
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
                  {getFullName(client)?.[0]?.toUpperCase() || "C"}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#1F2937" }}>{getFullName(client)}</div>
                </div>
              </div>

              {/* Email */}
              <div style={{ fontSize: 12, color: "#1F2937" }}>{client.email || "—"}</div>

              {/* Company */}
              <div style={{ fontSize: 12, color: "#1F2937" }}>{client.company_name || "—"}</div>

              {/* Phone */}
              <div style={{ fontSize: 12, color: "#1F2937" }}>{client.phone || "—"}</div>

              {/* Status */}
              <div>
                <span style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: getStatusBg(client.status),
                  color: getStatusColor(client.status),
                  display: "inline-block",
                }}>
                  {client.status?.charAt(0).toUpperCase() + client.status?.slice(1) || "Active"}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button
                  onClick={() => { setSelected(client); setModal("view"); }}
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
                  onClick={() => openEdit(client)}
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
                  onClick={() => { setSelected(client); setModal("delete"); }}
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

      {/* ── VIEW CLIENT MODAL ── */}
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
              <span style={{ fontSize: 15, fontWeight: 600, color: "#1F2937" }}>Client Details</span>
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
                  {getFullName(selected)?.[0]?.toUpperCase() || "C"}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: "#1F2937" }}>{getFullName(selected)}</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>{selected.email}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span style={{
                      fontSize: 11, padding: "2px 10px", borderRadius: 12,
                      background: getStatusBg(selected.status),
                      color: getStatusColor(selected.status),
                    }}>
                      {selected.status?.charAt(0).toUpperCase() + selected.status?.slice(1) || "Active"}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 12 }}>
                  <div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                    Contact Details
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #E5E7EB" }}>
                    <span style={{ color: "#6B7280" }}>First Name</span>
                    <span style={{ color: "#1F2937" }}>{selected.first_name || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #E5E7EB" }}>
                    <span style={{ color: "#6B7280" }}>Middle Name</span>
                    <span style={{ color: "#1F2937" }}>{selected.middle_name || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #E5E7EB" }}>
                    <span style={{ color: "#6B7280" }}>Last Name</span>
                    <span style={{ color: "#1F2937" }}>{selected.last_name || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
                    <span style={{ color: "#6B7280" }}>Email</span>
                    <span style={{ color: "#1F2937" }}>{selected.email || "—"}</span>
                  </div>
                </div>

                <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 12 }}>
                  <div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                    Company Details
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #E5E7EB" }}>
                    <span style={{ color: "#6B7280" }}>Company Name</span>
                    <span style={{ color: "#1F2937" }}>{selected.company_name || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #E5E7EB" }}>
                    <span style={{ color: "#6B7280" }}>Company Phone</span>
                    <span style={{ color: "#1F2937" }}>{selected.company_phone || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
                    <span style={{ color: "#6B7280" }}>Company Email</span>
                    <span style={{ color: "#1F2937" }}>{selected.company_email || "—"}</span>
                  </div>
                </div>
              </div>

              {selected.address && (
                <div style={{ marginTop: 12, background: "#F9FAFB", borderRadius: "8px", padding: 12 }}>
                  <div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                    Address
                  </div>
                  <div style={{ fontSize: 13, color: "#1F2937" }}>{selected.address}</div>
                </div>
              )}

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

      {/* ── CREATE CLIENT MODAL ── */}
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
              <span style={{ fontSize: 15, fontWeight: 600, color: "#1F2937" }}>Add New Client</span>
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

                  {/* Contact Details */}
                  <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 16, border: "1px solid #E5E7EB" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-user" style={{ color: "#0E8C73", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1F2937" }}>Contact Details</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>
                          First Name <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <input
                          value={form.first_name}
                          onChange={e => setForm({ ...form, first_name: e.target.value })}
                          placeholder="First Name"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Middle Name</label>
                        <input
                          value={form.middle_name}
                          onChange={e => setForm({ ...form, middle_name: e.target.value })}
                          placeholder="Middle Name"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                        />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>
                          Last Name <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <input
                          value={form.last_name}
                          onChange={e => setForm({ ...form, last_name: e.target.value })}
                          placeholder="Last Name"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>
                          Email <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          placeholder="email@example.com"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Phone</label>
                      <input
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="+254 700 000000"
                        style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                      />
                    </div>
                  </div>

                  {/* Company Details */}
                  <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 16, border: "1px solid #E5E7EB" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-building" style={{ color: "#3B82F6", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1F2937" }}>Company Details</span>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>
                        Company Name <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <input
                        value={form.company_name}
                        onChange={e => setForm({ ...form, company_name: e.target.value })}
                        placeholder="Company Name"
                        style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Company Phone</label>
                        <input
                          value={form.company_phone}
                          onChange={e => setForm({ ...form, company_phone: e.target.value })}
                          placeholder="+254 700 000000"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Company Email</label>
                        <input
                          type="email"
                          value={form.company_email}
                          onChange={e => setForm({ ...form, company_email: e.target.value })}
                          placeholder="company@email.com"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                        />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Status</label>
                        <select
                          value={form.status}
                          onChange={e => setForm({ ...form, status: e.target.value })}
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                        >
                          {CLIENT_STATUSES.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Address</label>
                        <input
                          value={form.address}
                          onChange={e => setForm({ ...form, address: e.target.value })}
                          placeholder="123 Main Street"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
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
                        <><i className="ti ti-check"></i> Save Client</>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT CLIENT MODAL ── */}
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
              <span style={{ fontSize: 15, fontWeight: 600, color: "#1F2937" }}>Edit Client</span>
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

                  {/* Same form fields as create */}
                  <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 16, border: "1px solid #E5E7EB" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-user" style={{ color: "#0E8C73", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1F2937" }}>Contact Details</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>
                          First Name <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <input
                          value={form.first_name}
                          onChange={e => setForm({ ...form, first_name: e.target.value })}
                          placeholder="First Name"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Middle Name</label>
                        <input
                          value={form.middle_name}
                          onChange={e => setForm({ ...form, middle_name: e.target.value })}
                          placeholder="Middle Name"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                        />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>
                          Last Name <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <input
                          value={form.last_name}
                          onChange={e => setForm({ ...form, last_name: e.target.value })}
                          placeholder="Last Name"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>
                          Email <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          placeholder="email@example.com"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Phone</label>
                      <input
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="+254 700 000000"
                        style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                      />
                    </div>
                  </div>

                  <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 16, border: "1px solid #E5E7EB" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-building" style={{ color: "#3B82F6", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1F2937" }}>Company Details</span>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>
                        Company Name <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <input
                        value={form.company_name}
                        onChange={e => setForm({ ...form, company_name: e.target.value })}
                        placeholder="Company Name"
                        style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Company Phone</label>
                        <input
                          value={form.company_phone}
                          onChange={e => setForm({ ...form, company_phone: e.target.value })}
                          placeholder="+254 700 000000"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Company Email</label>
                        <input
                          type="email"
                          value={form.company_email}
                          onChange={e => setForm({ ...form, company_email: e.target.value })}
                          placeholder="company@email.com"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                        />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Status</label>
                        <select
                          value={form.status}
                          onChange={e => setForm({ ...form, status: e.target.value })}
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                        >
                          {CLIENT_STATUSES.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Address</label>
                        <input
                          value={form.address}
                          onChange={e => setForm({ ...form, address: e.target.value })}
                          placeholder="123 Main Street"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
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
                        <><i className="ti ti-check"></i> Update Client</>
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
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1F2937" }}>Delete Client</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>This action cannot be undone</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#1F2937", marginBottom: 20 }}>
              Are you sure you want to delete <strong>{getFullName(selected)}</strong>?
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
                    await apiDelete(`/clients/${selected.id}`);
                    closeModal();
                  } catch {
                    alert("Failed to delete client.");
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
                <i className="ti ti-trash"></i> Delete Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}