"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { Topbar } from "./Topbar";
import { Spinner } from "./Spinner";

type ModalMode = "view" | "edit" | "create" | "delete" | null;

interface Feature {
  id?: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export function ScreenQuotes() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<any>(null);
  const [features, setFeatures] = useState<Feature[]>([
    { name: "", description: "", quantity: 1, unit_price: 0, total: 0 }
  ]);
  const [form, setForm] = useState({
    client_id: "",
    service_id: "",
    subtotal: 0,
    tax: 0,
    tax_rate: 16,
    total: 0,
    valid_until: "",
    status: "draft",
    notes: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [file, setFile] = useState<File | null>(null);

  function load() {
    setLoading(true);
    Promise.all([
      apiGet('/quotes'),
      apiGet('/clients'),
      apiGet('/services')
    ]).then(([quotesData, clientsData, servicesData]) => {
      setQuotes(Array.isArray(quotesData) ? quotesData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setServices(Array.isArray(servicesData) ? servicesData : []);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, []);

  const stats = [
    { label: "Total Quotes", value: quotes.length, color: "#6B7280" },
    { label: "Draft", value: quotes.filter(q => q.status === "draft").length, color: "#F59E0B" },
    { label: "Sent", value: quotes.filter(q => q.status === "sent").length, color: "#3B82F6" },
    { label: "Approved", value: quotes.filter(q => q.status === "approved").length, color: "#10B981" },
  ];

  const filtered = quotes.filter(q => {
    const matchSearch = q.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
                        q.id?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || q.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0;
    features.forEach(f => {
      f.total = f.quantity * f.unit_price;
      subtotal += f.total;
    });
    const tax = (subtotal * form.tax_rate) / 100;
    const total = subtotal + tax;
    setForm(prev => ({ ...prev, subtotal, tax, total }));
  };

  useEffect(() => {
    calculateTotals();
  }, [features, form.tax_rate]);

  // Add feature row
  const addFeature = () => {
    setFeatures([...features, { name: "", description: "", quantity: 1, unit_price: 0, total: 0 }]);
  };

  // Remove feature row
  const removeFeature = (index: number) => {
    if (features.length > 1) {
      const newFeatures = features.filter((_, i) => i !== index);
      setFeatures(newFeatures);
    }
  };

  // Update feature
  const updateFeature = (index: number, field: keyof Feature, value: any) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      newFeatures[index].total = newFeatures[index].quantity * newFeatures[index].unit_price;
    }
    setFeatures(newFeatures);
  };

  async function handleCreate() {
    if (!form.client_id) {
      setFormError("Please select a client.");
      return;
    }
    if (!form.valid_until) {
      setFormError("Please select a valid until date.");
      return;
    }
    if (features.length === 0 || !features[0].name) {
      setFormError("Please add at least one feature.");
      return;
    }

    setFormLoading(true);
    setFormError("");
    try {
      const payload = {
        client_id: form.client_id,
        service_id: form.service_id || null,
        features: features,
        subtotal: form.subtotal,
        tax: form.tax,
        tax_rate: form.tax_rate,
        total: form.total,
        valid_until: form.valid_until,
        status: form.status || "draft",
        notes: form.notes || "",
      };

      console.log('📤 Creating quote:', payload);

      const res = await apiPost("/quotes", payload);
      if (res.id) {
        resetForm();
        closeModal();
      } else {
        setFormError(res.message || "Failed to create quote.");
      }
    } catch {
      setFormError("Could not connect to server.");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleUpdate() {
    if (!form.client_id) {
      setFormError("Please select a client.");
      return;
    }
    if (!form.valid_until) {
      setFormError("Please select a valid until date.");
      return;
    }

    setFormLoading(true);
    setFormError("");
    try {
      const payload = {
        client_id: form.client_id,
        service_id: form.service_id || null,
        features: features,
        subtotal: form.subtotal,
        tax: form.tax,
        tax_rate: form.tax_rate,
        total: form.total,
        valid_until: form.valid_until,
        status: form.status || "draft",
        notes: form.notes || "",
      };

      const res = await apiPatch(`/quotes/${selected.id}`, payload);
      if (res.id) {
        closeModal();
      } else {
        setFormError(res.message || "Failed to update quote.");
      }
    } catch {
      setFormError("Could not connect to server.");
    } finally {
      setFormLoading(false);
    }
  }

  function resetForm() {
    setForm({
      client_id: "",
      service_id: "",
      subtotal: 0,
      tax: 0,
      tax_rate: 16,
      total: 0,
      valid_until: "",
      status: "draft",
      notes: "",
    });
    setFeatures([{ name: "", description: "", quantity: 1, unit_price: 0, total: 0 }]);
    setFile(null);
  }

  function openEdit(quote: any) {
    setSelected(quote);
    const quoteFeatures = quote.features || [{ name: "", description: "", quantity: 1, unit_price: 0, total: 0 }];
    setFeatures(quoteFeatures);
    setForm({
      client_id: quote.client_id || "",
      service_id: quote.service_id || "",
      subtotal: quote.subtotal || 0,
      tax: quote.tax || 0,
      tax_rate: quote.tax_rate || 16,
      total: quote.total || 0,
      valid_until: quote.valid_until || "",
      status: quote.status || "draft",
      notes: quote.notes || "",
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
    const colors: Record<string, string> = {
      draft: "#F59E0B",
      sent: "#3B82F6",
      approved: "#10B981",
      rejected: "#EF4444",
    };
    return colors[status] || "#6B7280";
  }

  function getStatusBg(status: string) {
    const colors: Record<string, string> = {
      draft: "#FEF3C7",
      sent: "#DBEAFE",
      approved: "#D1FAE5",
      rejected: "#FEE2E2",
    };
    return colors[status] || "#F3F4F6";
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(amount);
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
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "#1F2937", margin: 0 }}>Quotes</h1>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>Manage your quotes.</p>
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
          <i className="ti ti-plus" style={{ fontSize: 14 }}></i> Create Quote
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
            placeholder="Search quotes..."
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
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Quotes Table */}
      <div style={{ padding: "16px 28px" }}>
        <div style={{ 
          background: "#FFFFFF", 
          borderRadius: "8px", 
          overflow: "hidden",
          border: "1px solid #E5E7EB",
        }}>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "120px 1fr 140px 100px 120px 80px",
            gap: 10, 
            background: "#F9FAFB", 
            padding: "12px 18px", 
            fontSize: 11, 
            color: "#6B7280",
            fontWeight: 600,
            borderBottom: "1px solid #E5E7EB",
          }}>
            <span>Quote #</span>
            <span>Client</span>
            <span>Total</span>
            <span>Status</span>
            <span>Valid Until</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: 40, fontSize: 13, color: "#9CA3AF", textAlign: "center" }}>
              No quotes found.
            </div>
          )}

          {filtered.map((quote, i) => (
            <div key={quote.id} style={{
              display: "grid", 
              gridTemplateColumns: "120px 1fr 140px 100px 120px 80px",
              gap: 10, 
              alignItems: "center", 
              padding: "12px 18px",
              borderBottom: i < filtered.length - 1 ? "1px solid #F3F4F6" : "none",
              background: i % 2 === 0 ? "#FFFFFF" : "#FAFBFC",
            }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#1F2937" }}>
                #{String(quote.id).slice(0, 8)}
              </div>
              <div style={{ fontSize: 12, color: "#1F2937" }}>{quote.client?.name || "—"}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0E8C73" }}>
                {formatCurrency(quote.total || 0)}
              </div>
              <div>
                <span style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: getStatusBg(quote.status),
                  color: getStatusColor(quote.status),
                  display: "inline-block",
                }}>
                  {quote.status?.charAt(0).toUpperCase() + quote.status?.slice(1) || "Draft"}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#6B7280" }}>
                {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : "—"}
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button
                  onClick={() => { setSelected(quote); setModal("view"); }}
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
                  onClick={() => openEdit(quote)}
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
                  onClick={() => { setSelected(quote); setModal("delete"); }}
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

      {/* ── CREATE QUOTE MODAL ── */}
      {modal === "create" && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            background: "#FFFFFF", borderRadius: "12px",
            width: 780, maxHeight: "90vh", display: "flex", flexDirection: "column",
            border: "1px solid #E5E7EB",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 20px", borderBottom: "1px solid #E5E7EB", flexShrink: 0,
            }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#1F2937" }}>Create Quote</span>
              <button onClick={closeModal} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#6B7280", fontSize: 22, lineHeight: 1,
              }}>×</button>
            </div>
            <div style={{ overflowY: "auto", padding: 20 }}>
              <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

                  {/* ── Client & Service Section ── */}
                  <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 16, border: "1px solid #E5E7EB" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-building" style={{ color: "#0E8C73", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1F2937" }}>Client & Service Details</span>
                    </div>

                    <div>
                      <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>
                        Select Client <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <select
                        value={form.client_id}
                        onChange={e => setForm({ ...form, client_id: e.target.value })}
                        style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                      >
                        <option value="">Select a Client --</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>
                        Select Service <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <select
                        value={form.service_id}
                        onChange={e => setForm({ ...form, service_id: e.target.value })}
                        style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                      >
                        <option value="">Select a Service --</option>
                        {services.map(service => (
                          <option key={service.id} value={service.id}>{service.name}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>
                          Valid Until <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <input
                          type="date"
                          value={form.valid_until}
                          onChange={e => setForm({ ...form, valid_until: e.target.value })}
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Status</label>
                        <select
                          value={form.status}
                          onChange={e => setForm({ ...form, status: e.target.value })}
                          style={{ width: "100%", height: 34, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "0 10px", fontSize: 13, color: "#1F2937" }}
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* ── Features Section ── */}
                  <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 16, border: "1px solid #E5E7EB" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-list" style={{ color: "#3B82F6", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1F2937" }}>Features</span>
                      <button
                        type="button"
                        onClick={addFeature}
                        style={{
                          marginLeft: "auto",
                          padding: "4px 12px",
                          borderRadius: "6px",
                          border: "1px solid #0E8C73",
                          background: "rgba(14, 140, 115, 0.1)",
                          color: "#0E8C73",
                          fontSize: 11,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <i className="ti ti-plus" style={{ fontSize: 12 }}></i> Add Feature
                      </button>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: "#EEEEEE" }}>
                            <th style={{ padding: "6px 8px", textAlign: "left", color: "#6B7280", fontWeight: 600 }}>Feature</th>
                            <th style={{ padding: "6px 8px", textAlign: "left", color: "#6B7280", fontWeight: 600 }}>Description</th>
                            <th style={{ padding: "6px 8px", textAlign: "center", color: "#6B7280", fontWeight: 600, width: 80 }}>Qty</th>
                            <th style={{ padding: "6px 8px", textAlign: "right", color: "#6B7280", fontWeight: 600, width: 100 }}>Unit Price</th>
                            <th style={{ padding: "6px 8px", textAlign: "right", color: "#6B7280", fontWeight: 600, width: 100 }}>Total</th>
                            <th style={{ padding: "6px 8px", textAlign: "center", width: 40 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {features.map((feature, index) => (
                            <tr key={index} style={{ borderBottom: "1px solid #E5E7EB" }}>
                              <td style={{ padding: "6px 8px" }}>
                                <input
                                  type="text"
                                  value={feature.name}
                                  onChange={e => updateFeature(index, 'name', e.target.value)}
                                  placeholder="Feature name"
                                  style={{ width: "100%", height: 30, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "4px", padding: "0 8px", fontSize: 12, color: "#1F2937" }}
                                />
                              </td>
                              <td style={{ padding: "6px 8px" }}>
                                <input
                                  type="text"
                                  value={feature.description}
                                  onChange={e => updateFeature(index, 'description', e.target.value)}
                                  placeholder="Description"
                                  style={{ width: "100%", height: 30, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "4px", padding: "0 8px", fontSize: 12, color: "#1F2937" }}
                                />
                              </td>
                              <td style={{ padding: "6px 8px", textAlign: "center" }}>
                                <input
                                  type="number"
                                  value={feature.quantity}
                                  onChange={e => updateFeature(index, 'quantity', parseInt(e.target.value) || 0)}
                                  min="1"
                                  style={{ width: 60, height: 30, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "4px", padding: "0 8px", fontSize: 12, color: "#1F2937", textAlign: "center" }}
                                />
                              </td>
                              <td style={{ padding: "6px 8px", textAlign: "right" }}>
                                <input
                                  type="number"
                                  value={feature.unit_price}
                                  onChange={e => updateFeature(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                  min="0"
                                  step="0.01"
                                  style={{ width: 100, height: 30, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "4px", padding: "0 8px", fontSize: 12, color: "#1F2937", textAlign: "right" }}
                                />
                              </td>
                              <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 600, color: "#0E8C73" }}>
                                {formatCurrency(feature.total || 0)}
                              </td>
                              <td style={{ padding: "6px 8px", textAlign: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => removeFeature(index)}
                                  disabled={features.length <= 1}
                                  style={{
                                    width: 24, height: 24, borderRadius: "50%",
                                    border: "1px solid #EF4444",
                                    background: "transparent", cursor: features.length <= 1 ? "not-allowed" : "pointer",
                                    color: "#EF4444", opacity: features.length <= 1 ? 0.3 : 1,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}
                                >
                                  <i className="ti ti-x" style={{ fontSize: 12 }}></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals */}
                    <div style={{ 
                      marginTop: 12, 
                      padding: "12px 16px", 
                      background: "#FFFFFF", 
                      borderRadius: "6px",
                      border: "1px solid #E5E7EB",
                    }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 30 }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, color: "#6B7280" }}>Subtotal (Quoted Amount KES)</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#1F2937" }}>
                            {formatCurrency(form.subtotal)}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, color: "#6B7280" }}>Tax ({form.tax_rate}%)</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#1F2937" }}>
                            {formatCurrency(form.tax)}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", borderLeft: "1px solid #E5E7EB", paddingLeft: 20 }}>
                          <div style={{ fontSize: 11, color: "#6B7280" }}>Total Amount</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#0E8C73" }}>
                            {formatCurrency(form.total)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Additional Info Section ── */}
                  <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 16, border: "1px solid #E5E7EB" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-file" style={{ color: "#F59E0B", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1F2937" }}>Supporting Documents & Notes</span>
                    </div>

                    <div>
                      <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Supporting Documents (PDF only)</label>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        background: "#FFFFFF",
                        border: "1px solid #E5E7EB",
                        borderRadius: "6px",
                      }}>
                        <button
                          type="button"
                          onClick={() => document.getElementById('file-upload')?.click()}
                          style={{
                            padding: "4px 12px",
                            borderRadius: "4px",
                            border: "1px solid #E5E7EB",
                            background: "#F9FAFB",
                            fontSize: 11,
                            cursor: "pointer",
                            color: "#1F2937",
                          }}
                        >
                          Choose Files
                        </button>
                        <input
                          id="file-upload"
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setFile(e.target.files[0]);
                            }
                          }}
                          style={{ display: "none" }}
                        />
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                          {file ? file.name : "No file chosen"}
                        </span>
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 4 }}>Additional Notes</label>
                      <textarea
                        value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                        placeholder="Optional notes..."
                        rows={3}
                        style={{ width: "100%", padding: "8px 10px", background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px", fontSize: 13, color: "#1F2937", resize: "vertical", fontFamily: "inherit", minHeight: 80 }}
                      />
                    </div>
                  </div>

                  {/* ── Action Buttons ── */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      className="btn"
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
                      className="btn btn-primary"
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
                        <><i className="ti ti-check"></i> Save Quote</>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW QUOTE MODAL ── */}
      {modal === "view" && selected && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            background: "#FFFFFF", borderRadius: "12px",
            width: 700, maxHeight: "90vh", display: "flex", flexDirection: "column",
            border: "1px solid #E5E7EB",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 20px", borderBottom: "1px solid #E5E7EB", flexShrink: 0,
            }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#1F2937" }}>Quote Details</span>
              <button onClick={closeModal} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#6B7280", fontSize: 22, lineHeight: 1,
              }}>×</button>
            </div>
            <div style={{ overflowY: "auto", padding: 20 }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 20,
              }}>
                <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 14 }}>
                  <div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase", marginBottom: 4 }}>Client</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1F2937" }}>{selected.client?.name || "—"}</div>
                </div>
                <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 14 }}>
                  <div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase", marginBottom: 4 }}>Status</div>
                  <span style={{
                    fontSize: 12,
                    padding: "3px 12px",
                    borderRadius: 20,
                    background: getStatusBg(selected.status),
                    color: getStatusColor(selected.status),
                    display: "inline-block",
                  }}>
                    {selected.status?.charAt(0).toUpperCase() + selected.status?.slice(1) || "Draft"}
                  </span>
                </div>
                <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 14 }}>
                  <div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase", marginBottom: 4 }}>Valid Until</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1F2937" }}>
                    {selected.valid_until ? new Date(selected.valid_until).toLocaleDateString() : "—"}
                  </div>
                </div>
                <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 14 }}>
                  <div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase", marginBottom: 4 }}>Total Amount</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#0E8C73" }}>
                    {formatCurrency(selected.total || 0)}
                  </div>
                </div>
              </div>

              {selected.features && selected.features.length > 0 && (
                <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 14, marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase", marginBottom: 8 }}>Features</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                        <th style={{ padding: "6px 8px", textAlign: "left", color: "#6B7280" }}>Feature</th>
                        <th style={{ padding: "6px 8px", textAlign: "left", color: "#6B7280" }}>Description</th>
                        <th style={{ padding: "6px 8px", textAlign: "center", color: "#6B7280" }}>Qty</th>
                        <th style={{ padding: "6px 8px", textAlign: "right", color: "#6B7280" }}>Unit Price</th>
                        <th style={{ padding: "6px 8px", textAlign: "right", color: "#6B7280" }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.features.map((feature: any, index: number) => (
                        <tr key={index} style={{ borderBottom: "1px solid #F3F4F6" }}>
                          <td style={{ padding: "6px 8px", color: "#1F2937" }}>{feature.name}</td>
                          <td style={{ padding: "6px 8px", color: "#6B7280" }}>{feature.description || "—"}</td>
                          <td style={{ padding: "6px 8px", textAlign: "center", color: "#1F2937" }}>{feature.quantity}</td>
                          <td style={{ padding: "6px 8px", textAlign: "right", color: "#1F2937" }}>{formatCurrency(feature.unit_price)}</td>
                          <td style={{ padding: "6px 8px", textAlign: "right", color: "#0E8C73", fontWeight: 600 }}>{formatCurrency(feature.total)}</td>
                        </tr>
                      ))}
                      <tr style={{ borderTop: "2px solid #E5E7EB" }}>
                        <td colSpan={3}></td>
                        <td style={{ padding: "8px", textAlign: "right", color: "#6B7280" }}>Subtotal:</td>
                        <td style={{ padding: "8px", textAlign: "right", fontWeight: 600, color: "#1F2937" }}>{formatCurrency(selected.subtotal || 0)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3}></td>
                        <td style={{ padding: "8px", textAlign: "right", color: "#6B7280" }}>Tax ({selected.tax_rate || 16}%):</td>
                        <td style={{ padding: "8px", textAlign: "right", fontWeight: 600, color: "#1F2937" }}>{formatCurrency(selected.tax || 0)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3}></td>
                        <td style={{ padding: "8px", textAlign: "right", color: "#1F2937", fontWeight: 700 }}>Total:</td>
                        <td style={{ padding: "8px", textAlign: "right", fontWeight: 700, color: "#0E8C73", fontSize: 16 }}>{formatCurrency(selected.total || 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {selected.notes && (
                <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: 14 }}>
                  <div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase", marginBottom: 4 }}>Notes</div>
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
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1F2937" }}>Delete Quote</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>This action cannot be undone</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#1F2937", marginBottom: 20 }}>
              Are you sure you want to delete this quote?
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
                    await apiDelete(`/quotes/${selected.id}`);
                    closeModal();
                  } catch {
                    alert("Failed to delete quote.");
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
                <i className="ti ti-trash"></i> Delete Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}