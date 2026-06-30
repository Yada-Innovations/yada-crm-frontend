"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { Topbar } from "./Topbar";
import { Spinner } from "./Spinner";

type ModalMode = "view" | "edit" | "create" | "delete" | null;

const SERVICE_STATUSES = ["active", "inactive", "draft"] as const;
const STATUS_COLORS: Record<string, string> = {
  active: "var(--teal-light)",
  inactive: "var(--text-3)",
  draft: "var(--amber-light)",
};
const STATUS_BG: Record<string, string> = {
  active: "var(--teal-fill)",
  inactive: "var(--bg-pill)",
  draft: "var(--amber-fill)",
};

export function ScreenServices() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    tax_rate: 16,
    category: "",
    duration: "",
    delivery_time: "",
    status: "active",
    features: [] as string[],
    is_available: true,
    requires_consultation: false,
    notes: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [newFeature, setNewFeature] = useState("");

  function load() {
    setLoading(true);
    apiGet('/services').then(data => {
      setServices(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, []);

  const stats = [
    { label: "Total Services", value: services.length, color: "var(--purple)" },
    { label: "Active", value: services.filter(s => s.status === "active").length, color: STATUS_COLORS.active },
    { label: "Inactive", value: services.filter(s => s.status === "inactive").length, color: STATUS_COLORS.inactive },
    { label: "Draft", value: services.filter(s => s.status === "draft").length, color: STATUS_COLORS.draft },
  ];

  const filtered = services.filter(s => {
    const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase()) ||
                        s.category?.toLowerCase().includes(search.toLowerCase()) ||
                        s.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Add feature to list
  const addFeature = () => {
    if (newFeature.trim()) {
      setForm(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature("");
    }
  };

  // Remove feature from list
  const removeFeature = (index: number) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  async function handleCreate() {
    if (!form.name) {
      setFormError("Service name is required.");
      return;
    }
    if (!form.price) {
      setFormError("Price is required.");
      return;
    }

    setFormLoading(true);
    setFormError("");
    try {
      const payload = {
        name: form.name,
        description: form.description || "",
        price: parseFloat(form.price) || 0,
        tax_rate: parseFloat(form.tax_rate.toString()) || 16,
        category: form.category || "",
        duration: form.duration || "",
        delivery_time: form.delivery_time || "",
        status: form.status || "active",
        features: form.features || [],
        is_available: form.is_available,
        requires_consultation: form.requires_consultation,
        notes: form.notes || "",
      };

      const res = await apiPost("/services", payload);
      if (res.id) {
        setForm({
          name: "",
          description: "",
          price: "",
          tax_rate: 16,
          category: "",
          duration: "",
          delivery_time: "",
          status: "active",
          features: [],
          is_available: true,
          requires_consultation: false,
          notes: "",
        });
        setNewFeature("");
        closeModal();
      } else {
        setFormError(res.message || "Failed to create service.");
      }
    } catch {
      setFormError("Could not connect to server.");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleUpdate() {
    if (!form.name) {
      setFormError("Service name is required.");
      return;
    }
    if (!form.price) {
      setFormError("Price is required.");
      return;
    }

    setFormLoading(true);
    setFormError("");
    try {
      const payload = {
        name: form.name,
        description: form.description || "",
        price: parseFloat(form.price) || 0,
        tax_rate: parseFloat(form.tax_rate.toString()) || 16,
        category: form.category || "",
        duration: form.duration || "",
        delivery_time: form.delivery_time || "",
        status: form.status || "active",
        features: form.features || [],
        is_available: form.is_available,
        requires_consultation: form.requires_consultation,
        notes: form.notes || "",
      };

      const res = await apiPatch(`/services/${selected.id}`, payload);
      if (res.id) {
        closeModal();
      } else {
        setFormError(res.message || "Failed to update service.");
      }
    } catch {
      setFormError("Could not connect to server.");
    } finally {
      setFormLoading(false);
    }
  }

  function openEdit(service: any) {
    setSelected(service);
    setForm({
      name: service.name || "",
      description: service.description || "",
      price: service.price?.toString() || "",
      tax_rate: service.tax_rate || 16,
      category: service.category || "",
      duration: service.duration || "",
      delivery_time: service.delivery_time || "",
      status: service.status || "active",
      features: service.features || [],
      is_available: service.is_available ?? true,
      requires_consultation: service.requires_consultation ?? false,
      notes: service.notes || "",
    });
    setNewFeature("");
    setModal("edit");
    setFormError("");
  }

  function openCreate() {
    setForm({
      name: "",
      description: "",
      price: "",
      tax_rate: 16,
      category: "",
      duration: "",
      delivery_time: "",
      status: "active",
      features: [],
      is_available: true,
      requires_consultation: false,
      notes: "",
    });
    setNewFeature("");
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
    return STATUS_COLORS[status] || "var(--text-3)";
  }

  function getStatusBg(status: string) {
    return STATUS_BG[status] || "var(--bg-pill)";
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh" }}>
      <Topbar title="Services">
        <button 
          className="btn btn-primary" 
          onClick={openCreate}
          style={{
            background: "var(--gradient-purple)",
            color: "#EEEDFE",
            border: "none",
            padding: "8px 18px",
            borderRadius: "var(--radius-md)",
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <i className="ti ti-plus"></i>Add Service
        </button>
      </Topbar>

      {/* Stats */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(4,1fr)", 
        gap: 12, 
        marginBottom: 20,
        marginTop: 14,
      }}>
        {stats.map(s => (
          <div key={s.label} style={{ 
            background: "#FFFFFF", 
            borderRadius: "var(--radius-lg)", 
            padding: 14, 
            border: "1px solid #E8E8E8",
          }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 600, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <i className="ti ti-search" style={{ 
            position: "absolute", 
            left: 10, 
            top: "50%", 
            transform: "translateY(-50%)", 
            color: "#999", 
            fontSize: 14 
          }}></i>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search services by name, category or description..."
            style={{
              width: "100%", height: 36, background: "#F5F5F5",
              border: "1px solid #E0E0E0", borderRadius: "var(--radius-md)",
              padding: "0 12px 0 32px", fontSize: 13, color: "#1A1A1A",
            }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{
            height: 36, background: "#F5F5F5", border: "1px solid #E0E0E0",
            borderRadius: "var(--radius-md)", padding: "0 12px", fontSize: 13,
            color: "#1A1A1A", cursor: "pointer",
          }}
        >
          <option value="all">All statuses</option>
          {SERVICE_STATUSES.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Services Table */}
      <div style={{ 
        background: "#FFFFFF", 
        borderRadius: "var(--radius-lg)", 
        overflow: "hidden",
        border: "1px solid #E8E8E8",
      }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 140px 120px 100px 100px 80px",
          gap: 10, 
          background: "#F8F8F8", 
          padding: "12px 18px", 
          fontSize: 11, 
          color: "#666",
          fontWeight: 600,
          borderBottom: "1px solid #E8E8E8",
        }}>
          <span>Service</span>
          <span>Category</span>
          <span>Price</span>
          <span>Duration</span>
          <span>Status</span>
          <span style={{ textAlign: "right" }}>Actions</span>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: 24, fontSize: 13, color: "#999", textAlign: "center" }}>
            No services found.
          </div>
        )}

        {filtered.map((service, i) => (
          <div key={service.id} style={{
            display: "grid", 
            gridTemplateColumns: "1fr 140px 120px 100px 100px 80px",
            gap: 10, 
            alignItems: "center", 
            padding: "12px 18px",
            borderBottom: i < filtered.length - 1 ? "1px solid #F0F0F0" : "none",
            background: i % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
          }}>
            {/* Service Name */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "var(--purple-fill)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 600, color: "var(--purple)", flexShrink: 0,
              }}>
                <i className="ti ti-package" style={{ fontSize: 16 }}></i>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#1A1A1A" }}>{service.name}</div>
                <div style={{ fontSize: 10, color: "#999" }}>
                  {service.features?.length || 0} features
                </div>
              </div>
            </div>

            {/* Category */}
            <div style={{ fontSize: 12, color: "#1A1A1A" }}>
              {service.category || "—"}
            </div>

            {/* Price */}
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--purple)" }}>
              {formatCurrency(service.price || 0)}
            </div>

            {/* Duration */}
            <div style={{ fontSize: 12, color: "#1A1A1A" }}>
              {service.duration || "—"}
            </div>

            {/* Status */}
            <div>
              <span style={{
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 20,
                background: getStatusBg(service.status),
                color: getStatusColor(service.status),
                display: "inline-block",
              }}>
                {service.status?.charAt(0).toUpperCase() + service.status?.slice(1) || "Active"}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setSelected(service); setModal("view"); }}
                style={{
                  width: 28, height: 28, borderRadius: 6,
                  border: "1px solid #E0E0E0",
                  background: "transparent", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#666",
                }}
              >
                <i className="ti ti-eye" style={{ fontSize: 13 }}></i>
              </button>
              <button
                onClick={() => openEdit(service)}
                style={{
                  width: 28, height: 28, borderRadius: 6,
                  border: "1px solid #E0E0E0",
                  background: "transparent", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--blue-light)",
                }}
              >
                <i className="ti ti-edit" style={{ fontSize: 13 }}></i>
              </button>
              <button
                onClick={() => { setSelected(service); setModal("delete"); }}
                style={{
                  width: 28, height: 28, borderRadius: 6,
                  border: "1px solid #E0E0E0",
                  background: "transparent", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--red-light)",
                }}
              >
                <i className="ti ti-trash" style={{ fontSize: 13 }}></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── VIEW SERVICE MODAL ── */}
      {modal === "view" && selected && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            background: "#FFFFFF", borderRadius: "var(--radius-lg)",
            width: 580, maxHeight: "90vh", display: "flex", flexDirection: "column",
            border: "1px solid #E8E8E8",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 20px", borderBottom: "1px solid #E8E8E8", flexShrink: 0,
            }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A" }}>Service Details</span>
              <button onClick={closeModal} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#666", fontSize: 22, lineHeight: 1,
              }}>×</button>
            </div>
            <div style={{ overflowY: "auto", padding: 20 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 14,
                marginBottom: 20, padding: 16,
                background: "#F8F8F8", borderRadius: "var(--radius-lg)",
              }}>
                <div style={{
                  width: 60, height: 60, borderRadius: "50%",
                  background: "var(--purple-fill)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, fontWeight: 700, color: "var(--purple)",
                  flexShrink: 0,
                }}>
                  <i className="ti ti-package" style={{ fontSize: 28 }}></i>
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: "#1A1A1A" }}>{selected.name}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>{selected.category || "No category"}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span style={{
                      fontSize: 11, padding: "2px 10px", borderRadius: 12,
                      background: getStatusBg(selected.status),
                      color: getStatusColor(selected.status),
                    }}>
                      {selected.status?.charAt(0).toUpperCase() + selected.status?.slice(1) || "Active"}
                    </span>
                    <span style={{
                      fontSize: 11, padding: "2px 10px", borderRadius: 12,
                      background: selected.is_available ? "var(--teal-fill)" : "var(--red-fill)",
                      color: selected.is_available ? "var(--teal-light)" : "var(--red-light)",
                    }}>
                      {selected.is_available ? "Available" : "Unavailable"}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: "#F8F8F8", borderRadius: "var(--radius-md)", padding: 12 }}>
                  <div style={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                    Pricing & Duration
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #E8E8E8" }}>
                    <span style={{ color: "#666" }}>Price</span>
                    <span style={{ color: "#1A1A1A", fontWeight: 600 }}>{formatCurrency(selected.price || 0)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #E8E8E8" }}>
                    <span style={{ color: "#666" }}>Tax Rate</span>
                    <span style={{ color: "#1A1A1A" }}>{selected.tax_rate || 16}%</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
                    <span style={{ color: "#666" }}>Duration</span>
                    <span style={{ color: "#1A1A1A" }}>{selected.duration || "—"}</span>
                  </div>
                </div>

                <div style={{ background: "#F8F8F8", borderRadius: "var(--radius-md)", padding: 12 }}>
                  <div style={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                    Delivery
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #E8E8E8" }}>
                    <span style={{ color: "#666" }}>Delivery Time</span>
                    <span style={{ color: "#1A1A1A" }}>{selected.delivery_time || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
                    <span style={{ color: "#666" }}>Requires Consultation</span>
                    <span style={{ color: selected.requires_consultation ? "var(--amber-light)" : "var(--teal-light)" }}>
                      {selected.requires_consultation ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selected.description && (
                <div style={{ marginTop: 12, background: "#F8F8F8", borderRadius: "var(--radius-md)", padding: 12 }}>
                  <div style={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                    Description
                  </div>
                  <div style={{ fontSize: 13, color: "#1A1A1A" }}>{selected.description}</div>
                </div>
              )}

              {/* Features */}
              {selected.features && selected.features.length > 0 && (
                <div style={{ marginTop: 12, background: "#F8F8F8", borderRadius: "var(--radius-md)", padding: 12 }}>
                  <div style={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                    Features ({selected.features.length})
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {selected.features.map((feature: string, index: number) => (
                      <span key={index} style={{
                        padding: "4px 12px",
                        borderRadius: 20,
                        background: "var(--purple-fill)",
                        color: "var(--purple-text)",
                        fontSize: 11,
                      }}>
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selected.notes && (
                <div style={{ marginTop: 12, background: "#F8F8F8", borderRadius: "var(--radius-md)", padding: 12 }}>
                  <div style={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                    Notes
                  </div>
                  <div style={{ fontSize: 13, color: "#1A1A1A" }}>{selected.notes}</div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <button className="btn" onClick={closeModal} style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid #E0E0E0",
                  background: "transparent",
                  color: "#666",
                  cursor: "pointer",
                  fontSize: 13,
                }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE SERVICE MODAL ── */}
      {modal === "create" && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            background: "#FFFFFF", borderRadius: "var(--radius-lg)",
            width: 640, maxHeight: "90vh", display: "flex", flexDirection: "column",
            border: "1px solid #E8E8E8",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 20px", borderBottom: "1px solid #E8E8E8", flexShrink: 0,
            }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A" }}>Add New Service</span>
              <button onClick={closeModal} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#666", fontSize: 22, lineHeight: 1,
              }}>×</button>
            </div>
            <div style={{ overflowY: "auto", padding: 20 }}>
              <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {formError && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: "var(--red-fill)", border: "1px solid var(--red)",
                      borderRadius: "var(--radius-md)", padding: "9px 12px",
                      fontSize: 12, color: "var(--red-light)",
                    }}>
                      <i className="ti ti-alert-circle"></i>{formError}
                    </div>
                  )}

                  {/* ── Basic Information ── */}
                  <div style={{ background: "#F8F8F8", borderRadius: "var(--radius-lg)", padding: 16, border: "1px solid #E8E8E8" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-info-circle" style={{ color: "var(--purple)", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>Basic Information</span>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 4 }}>
                        Service Name <span style={{ color: "var(--red-light)" }}>*</span>
                      </label>
                      <input
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Web Development"
                        style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "#1A1A1A" }}
                      />
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 4 }}>Description</label>
                      <textarea
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        placeholder="Describe the service..."
                        rows={2}
                        style={{ width: "100%", padding: "8px 10px", background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "var(--radius-md)", fontSize: 13, color: "#1A1A1A", resize: "vertical", fontFamily: "inherit", minHeight: 60 }}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 4 }}>Category</label>
                        <input
                          value={form.category}
                          onChange={e => setForm({ ...form, category: e.target.value })}
                          placeholder="e.g. Web Development"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "#1A1A1A" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 4 }}>Status</label>
                        <select
                          value={form.status}
                          onChange={e => setForm({ ...form, status: e.target.value })}
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "#1A1A1A" }}
                        >
                          {SERVICE_STATUSES.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* ── Pricing & Duration ── */}
                  <div style={{ background: "#F8F8F8", borderRadius: "var(--radius-lg)", padding: 16, border: "1px solid #E8E8E8" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-currency-dollar" style={{ color: "var(--teal-light)", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>Pricing & Duration</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 4 }}>
                          Price (KES) <span style={{ color: "var(--red-light)" }}>*</span>
                        </label>
                        <input
                          type="number"
                          value={form.price}
                          onChange={e => setForm({ ...form, price: e.target.value })}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "#1A1A1A" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 4 }}>Tax Rate (%)</label>
                        <input
                          type="number"
                          value={form.tax_rate}
                          onChange={e => setForm({ ...form, tax_rate: parseFloat(e.target.value) || 0 })}
                          placeholder="16"
                          min="0"
                          max="100"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "#1A1A1A" }}
                        />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 4 }}>Duration</label>
                        <input
                          value={form.duration}
                          onChange={e => setForm({ ...form, duration: e.target.value })}
                          placeholder="e.g. 2 weeks"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "#1A1A1A" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 4 }}>Delivery Time</label>
                        <input
                          value={form.delivery_time}
                          onChange={e => setForm({ ...form, delivery_time: e.target.value })}
                          placeholder="e.g. 5 business days"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "#1A1A1A" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── Features ── */}
                  <div style={{ background: "#F8F8F8", borderRadius: "var(--radius-lg)", padding: 16, border: "1px solid #E8E8E8" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-list-check" style={{ color: "var(--blue-light)", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>Features</span>
                      <span style={{ fontSize: 10, color: "#999", marginLeft: "auto" }}>
                        {form.features.length} features
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        value={newFeature}
                        onChange={e => setNewFeature(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addFeature();
                          }
                        }}
                        placeholder="Add a feature..."
                        style={{ flex: 1, height: 34, background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "#1A1A1A" }}
                      />
                      <button
                        type="button"
                        onClick={addFeature}
                        style={{
                          padding: "0 16px",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--purple)",
                          background: "var(--purple-fill)",
                          color: "var(--purple)",
                          fontSize: 13,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <i className="ti ti-plus" style={{ fontSize: 14 }}></i> Add
                      </button>
                    </div>
                    {form.features.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                        {form.features.map((feature, index) => (
                          <span key={index} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 10px",
                            borderRadius: 20,
                            background: "var(--purple-fill)",
                            color: "var(--purple-text)",
                            fontSize: 12,
                          }}>
                            {feature}
                            <button
                              type="button"
                              onClick={() => removeFeature(index)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--red-light)",
                                fontSize: 14,
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <i className="ti ti-x"></i>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── Additional Settings ── */}
                  <div style={{ background: "#F8F8F8", borderRadius: "var(--radius-lg)", padding: 16, border: "1px solid #E8E8E8" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-settings" style={{ color: "var(--amber-light)", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>Additional Settings</span>
                    </div>
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#1A1A1A", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={form.is_available}
                          onChange={e => setForm({ ...form, is_available: e.target.checked })}
                          style={{ width: 16, height: 16, cursor: "pointer" }}
                        />
                        Available for booking
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#1A1A1A", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={form.requires_consultation}
                          onChange={e => setForm({ ...form, requires_consultation: e.target.checked })}
                          style={{ width: 16, height: 16, cursor: "pointer" }}
                        />
                        Requires consultation
                      </label>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 4 }}>Notes</label>
                      <textarea
                        value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                        placeholder="Internal notes about this service..."
                        rows={2}
                        style={{ width: "100%", padding: "8px 10px", background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "var(--radius-md)", fontSize: 13, color: "#1A1A1A", resize: "vertical", fontFamily: "inherit", minHeight: 60 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={closeModal}
                      disabled={formLoading}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid #E0E0E0",
                        background: "transparent",
                        color: "#666",
                        cursor: formLoading ? "not-allowed" : "pointer",
                        opacity: formLoading ? 0.5 : 1,
                        fontSize: 13,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={formLoading}
                      style={{
                        padding: "8px 20px",
                        borderRadius: "var(--radius-md)",
                        border: "none",
                        background: "var(--gradient-purple)",
                        color: "#EEEDFE",
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
                        <><i className="ti ti-check"></i> Save Service</>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT SERVICE MODAL ── */}
      {modal === "edit" && selected && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            background: "#FFFFFF", borderRadius: "var(--radius-lg)",
            width: 640, maxHeight: "90vh", display: "flex", flexDirection: "column",
            border: "1px solid #E8E8E8",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 20px", borderBottom: "1px solid #E8E8E8", flexShrink: 0,
            }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A" }}>Edit Service</span>
              <button onClick={closeModal} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#666", fontSize: 22, lineHeight: 1,
              }}>×</button>
            </div>
            <div style={{ overflowY: "auto", padding: 20 }}>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {formError && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: "var(--red-fill)", border: "1px solid var(--red)",
                      borderRadius: "var(--radius-md)", padding: "9px 12px",
                      fontSize: 12, color: "var(--red-light)",
                    }}>
                      <i className="ti ti-alert-circle"></i>{formError}
                    </div>
                  )}

                  {/* Same form fields as create */}
                  <div style={{ background: "#F8F8F8", borderRadius: "var(--radius-lg)", padding: 16, border: "1px solid #E8E8E8" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-info-circle" style={{ color: "var(--purple)", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>Basic Information</span>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 4 }}>
                        Service Name <span style={{ color: "var(--red-light)" }}>*</span>
                      </label>
                      <input
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Web Development"
                        style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "#1A1A1A" }}
                      />
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 4 }}>Description</label>
                      <textarea
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        placeholder="Describe the service..."
                        rows={2}
                        style={{ width: "100%", padding: "8px 10px", background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "var(--radius-md)", fontSize: 13, color: "#1A1A1A", resize: "vertical", fontFamily: "inherit", minHeight: 60 }}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 4 }}>Category</label>
                        <input
                          value={form.category}
                          onChange={e => setForm({ ...form, category: e.target.value })}
                          placeholder="e.g. Web Development"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "#1A1A1A" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 4 }}>Status</label>
                        <select
                          value={form.status}
                          onChange={e => setForm({ ...form, status: e.target.value })}
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "#1A1A1A" }}
                        >
                          {SERVICE_STATUSES.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: "#F8F8F8", borderRadius: "var(--radius-lg)", padding: 16, border: "1px solid #E8E8E8" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-currency-dollar" style={{ color: "var(--teal-light)", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>Pricing & Duration</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 4 }}>
                          Price (KES) <span style={{ color: "var(--red-light)" }}>*</span>
                        </label>
                        <input
                          type="number"
                          value={form.price}
                          onChange={e => setForm({ ...form, price: e.target.value })}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "#1A1A1A" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 4 }}>Tax Rate (%)</label>
                        <input
                          type="number"
                          value={form.tax_rate}
                          onChange={e => setForm({ ...form, tax_rate: parseFloat(e.target.value) || 0 })}
                          placeholder="16"
                          min="0"
                          max="100"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "#1A1A1A" }}
                        />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 4 }}>Duration</label>
                        <input
                          value={form.duration}
                          onChange={e => setForm({ ...form, duration: e.target.value })}
                          placeholder="e.g. 2 weeks"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "#1A1A1A" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 4 }}>Delivery Time</label>
                        <input
                          value={form.delivery_time}
                          onChange={e => setForm({ ...form, delivery_time: e.target.value })}
                          placeholder="e.g. 5 business days"
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "#1A1A1A" }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ background: "#F8F8F8", borderRadius: "var(--radius-lg)", padding: 16, border: "1px solid #E8E8E8" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-list-check" style={{ color: "var(--blue-light)", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>Features</span>
                      <span style={{ fontSize: 10, color: "#999", marginLeft: "auto" }}>
                        {form.features.length} features
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        value={newFeature}
                        onChange={e => setNewFeature(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addFeature();
                          }
                        }}
                        placeholder="Add a feature..."
                        style={{ flex: 1, height: 34, background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "#1A1A1A" }}
                      />
                      <button
                        type="button"
                        onClick={addFeature}
                        style={{
                          padding: "0 16px",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--purple)",
                          background: "var(--purple-fill)",
                          color: "var(--purple)",
                          fontSize: 13,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <i className="ti ti-plus" style={{ fontSize: 14 }}></i> Add
                      </button>
                    </div>
                    {form.features.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                        {form.features.map((feature, index) => (
                          <span key={index} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 10px",
                            borderRadius: 20,
                            background: "var(--purple-fill)",
                            color: "var(--purple-text)",
                            fontSize: 12,
                          }}>
                            {feature}
                            <button
                              type="button"
                              onClick={() => removeFeature(index)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--red-light)",
                                fontSize: 14,
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <i className="ti ti-x"></i>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ background: "#F8F8F8", borderRadius: "var(--radius-lg)", padding: 16, border: "1px solid #E8E8E8" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-settings" style={{ color: "var(--amber-light)", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>Additional Settings</span>
                    </div>
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#1A1A1A", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={form.is_available}
                          onChange={e => setForm({ ...form, is_available: e.target.checked })}
                          style={{ width: 16, height: 16, cursor: "pointer" }}
                        />
                        Available for booking
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#1A1A1A", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={form.requires_consultation}
                          onChange={e => setForm({ ...form, requires_consultation: e.target.checked })}
                          style={{ width: 16, height: 16, cursor: "pointer" }}
                        />
                        Requires consultation
                      </label>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 4 }}>Notes</label>
                      <textarea
                        value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                        placeholder="Internal notes about this service..."
                        rows={2}
                        style={{ width: "100%", padding: "8px 10px", background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "var(--radius-md)", fontSize: 13, color: "#1A1A1A", resize: "vertical", fontFamily: "inherit", minHeight: 60 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={closeModal}
                      disabled={formLoading}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid #E0E0E0",
                        background: "transparent",
                        color: "#666",
                        cursor: formLoading ? "not-allowed" : "pointer",
                        opacity: formLoading ? 0.5 : 1,
                        fontSize: 13,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={formLoading}
                      style={{
                        padding: "8px 20px",
                        borderRadius: "var(--radius-md)",
                        border: "none",
                        background: "var(--gradient-purple)",
                        color: "#EEEDFE",
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
                        <><i className="ti ti-check"></i> Update Service</>
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
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001,
        }}>
          <div style={{ 
            background: "#FFFFFF", 
            borderRadius: "var(--radius-lg)", 
            padding: 24, 
            width: 400, 
            border: "1px solid #E8E8E8",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ 
                width: 36, height: 36, borderRadius: "50%", 
                background: "var(--red-fill)", 
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <i className="ti ti-trash" style={{ color: "var(--red-light)", fontSize: 18 }}></i>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>Delete Service</div>
                <div style={{ fontSize: 12, color: "#666" }}>This action cannot be undone</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#1A1A1A", marginBottom: 20 }}>
              Are you sure you want to delete <strong>{selected.name}</strong>? This will permanently remove this service.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button 
                className="btn" 
                onClick={closeModal}
                style={{
                  padding: "7px 16px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid #E0E0E0",
                  background: "transparent",
                  color: "#666",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await apiDelete(`/services/${selected.id}`);
                    closeModal();
                  } catch {
                    alert("Failed to delete service.");
                  }
                }}
                style={{
                  padding: "7px 16px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: "var(--red)",
                  color: "#fff",
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <i className="ti ti-trash"></i> Delete Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}