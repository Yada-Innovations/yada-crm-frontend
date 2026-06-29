"use client";
import { useState, useEffect } from "react";
import { apiPost, apiGet } from "@/lib/api";

interface QuoteFormProps {
  onClose: () => void;
  onSuccess: () => void;
  clientId?: string;
}

interface LineItem {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  total: number;
}

export function QuoteForm({ onClose, onSuccess, clientId }: QuoteFormProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      description: "",
      category: "Software license",
      quantity: 1,
      unit_price: 0,
      discount_pct: 0,
      total: 0,
    },
  ]);

  const [formData, setFormData] = useState({
    // Quote Details
    quote_number: "",
    issue_date: new Date().toISOString().split("T")[0],
    expiry_date: "",
    validity_days: 30,
    title: "",
    currency: "KES",
    po_number: "",
    
    // Pricing & Discount
    discount_type: "percentage",
    overall_discount: 0,
    pricing_tier: "Standard pricing",
    payment_terms: "50% upfront",
    
    // Terms
    scope: "",
    exclusions: "",
    sla: "Premium (24/7, 4hr response)",
    delivery_timeline_start: "2 weeks after PO",
    delivery_timeline_go_live: "6 weeks from start",
    terms_template: "YADA standard T&Cs",
    additional_notes: "",
    
    // Approval
    apply_vat: false,
    apply_withholding: false,
    require_approval: true,
    send_to_finance: false,
    require_signature: true,
    auto_generate_invoice: true,
    approved_by: "",
    approver_note: "",
    
    // Delivery
    delivery_method: "Email",
    send_to: "",
    email_message: "",
    
    // Client
    client_id: clientId || "",
  });

  const [selectedPaymentTerms, setSelectedPaymentTerms] = useState("50% upfront");
  const [selectedTemplate, setSelectedTemplate] = useState("YADA standard T&Cs");
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState("Email");

  const paymentTermsOptions = ["50% upfront", "30 days net", "60 days net", "On delivery", "Milestone-based", "Annual subscription"];
  const templateOptions = ["YADA standard T&Cs", "Client's own T&Cs", "NDA required", "MSA in place"];
  const deliveryMethods = ["Email", "WhatsApp", "Shareable link", "Download PDF"];

  useEffect(() => {
    loadClients();
    if (clientId) {
      loadClient(clientId);
    }
  }, [clientId]);

  async function loadClients() {
    setLoading(true);
    try {
      const data = await apiGet("/clients");
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load clients:", error);
    }
    setLoading(false);
  }

  async function loadClient(id: string) {
    try {
      const data = await apiGet(`/clients/${id}`);
      setSelectedClient(data);
      if (data.email) {
        setFormData(prev => ({ ...prev, send_to: data.email }));
      }
    } catch (error) {
      console.error("Failed to load client:", error);
    }
  }

  // ── Recalculate all line item totals ──
  function recalcLineItems() {
    setLineItems(prev => 
      prev.map(item => ({
        ...item,
        total: item.quantity * item.unit_price * (1 - item.discount_pct / 100),
      }))
    );
  }

  // ── Add a new line item ──
  function addLineItem() {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        description: "",
        category: "Software license",
        quantity: 1,
        unit_price: 0,
        discount_pct: 0,
        total: 0,
      },
    ]);
  }

  // ── Remove a line item ──
  function removeLineItem(index: number) {
    if (lineItems.length <= 1) return;
    const updated = lineItems.filter((_, i) => i !== index);
    setLineItems(updated);
  }

  // ── Update a line item field ──
  function updateLineItem(index: number, field: keyof LineItem, value: any) {
    const updated = [...lineItems];
    const parsedValue = field === "quantity" || field === "unit_price" || field === "discount_pct" 
      ? parseFloat(value) || 0 
      : value;
    
    updated[index] = { ...updated[index], [field]: parsedValue };
    
    // Recalculate total for this item
    const item = updated[index];
    item.total = item.quantity * item.unit_price * (1 - item.discount_pct / 100);
    
    setLineItems(updated);
  }

  function getSubtotal() {
    return lineItems.reduce((sum, item) => sum + item.total, 0);
  }

  function getDiscountAmount() {
    const subtotal = getSubtotal();
    if (formData.discount_type === "percentage") {
      return subtotal * (formData.overall_discount / 100);
    } else {
      return formData.overall_discount;
    }
  }

  function getAfterDiscount() {
    return getSubtotal() - getDiscountAmount();
  }

  function getVAT() {
    return formData.apply_vat ? getAfterDiscount() * 0.16 : 0;
  }

  function getWithholdingTax() {
    return formData.apply_withholding ? getAfterDiscount() * 0.05 : 0;
  }

  function getGrandTotal() {
    return getAfterDiscount() + getVAT() - getWithholdingTax();
  }

  function getMargin() {
    const subtotal = getSubtotal();
    const grandTotal = getGrandTotal();
    if (grandTotal <= 0) return 100;
    const cost = subtotal * 0.5;
    return ((grandTotal - cost) / grandTotal) * 100;
  }

  function getCompleteness() {
    const fields = [
      formData.client_id,
      lineItems.some(i => i.description && i.unit_price > 0),
      getMargin() >= 50,
      formData.expiry_date,
      formData.payment_terms,
      formData.scope,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }

  function setValidity(days: number) {
    const issueDate = new Date(formData.issue_date || new Date());
    const expiryDate = new Date(issueDate);
    expiryDate.setDate(expiryDate.getDate() + days);
    setFormData(prev => ({
      ...prev,
      validity_days: days,
      expiry_date: expiryDate.toISOString().split("T")[0],
    }));
  }

  async function handleSubmit() {
    if (!formData.client_id) {
      alert("Please select a client.");
      return;
    }

    if (lineItems.some(item => !item.description || item.unit_price <= 0)) {
      alert("All line items need a description and price.");
      return;
    }

    if (getMargin() < 50) {
      alert("Profit margin is below 50%. Please adjust pricing or discount.");
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        client_id: formData.client_id,
        quote_number: formData.quote_number || `QT-${Date.now().toString().slice(-6)}`,
        issue_date: formData.issue_date,
        expiry_date: formData.expiry_date,
        title: formData.title || "Quote",
        currency: formData.currency,
        po_number: formData.po_number,
        items: lineItems.map(item => ({
          description: item.description,
          category: item.category,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_pct: item.discount_pct,
          total: item.total,
        })),
        subtotal: getSubtotal(),
        discount_type: formData.discount_type,
        overall_discount: formData.overall_discount,
        discount_amount: getDiscountAmount(),
        after_discount: getAfterDiscount(),
        vat: getVAT(),
        withholding_tax: getWithholdingTax(),
        grand_total: getGrandTotal(),
        margin_pct: getMargin(),
        payment_terms: formData.payment_terms,
        scope: formData.scope,
        exclusions: formData.exclusions,
        sla: formData.sla,
        delivery_timeline: `${formData.delivery_timeline_start} / ${formData.delivery_timeline_go_live}`,
        terms_template: formData.terms_template,
        additional_notes: formData.additional_notes,
        require_approval: formData.require_approval,
        require_signature: formData.require_signature,
        auto_generate_invoice: formData.auto_generate_invoice,
        approved_by: formData.approved_by,
        approver_note: formData.approver_note,
        delivery_method: formData.delivery_method,
        send_to: formData.send_to,
        email_message: formData.email_message,
        status: "draft",
      };

      const res = await apiPost("/quotes", data);
      if (res.id) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Failed to create quote:", error);
      alert("Failed to create quote. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const margin = getMargin();
  const marginColor = margin >= 60 ? "var(--teal-light)" : margin >= 50 ? "var(--amber-light)" : "var(--red-light)";
  const marginText = margin >= 50 ? `${margin.toFixed(1)}%` : `${margin.toFixed(1)}% - Below minimum`;

  if (loading) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
        <div style={{ color: "var(--text-3)" }}>
          <i className="ti ti-loader" style={{ fontSize: 24, animation: "spin 1s linear infinite" }}></i>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.85)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px",
      overflowY: "auto",
    }}>
      <div style={{
        background: "var(--bg-app)",
        borderRadius: "var(--radius-lg)",
        width: "100%",
        maxWidth: 1200,
        maxHeight: "90vh",
        overflowY: "auto",
        padding: "24px",
        border: "0.5px solid var(--border)",
        position: "relative",
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            color: "var(--text-3)",
            fontSize: 24,
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          &times;
        </button>

        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 6 }}>
              <span style={{ cursor: "pointer" }} onClick={onClose}>Quotes</span>
              <span style={{ color: "var(--text-4)", margin: "0 5px" }}>/</span>
              <span style={{ color: "var(--text-2)" }}>New Quote</span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Create Quote</h1>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
              Generate a new quote for your client
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 500,
              background: "var(--bg-pill)",
              color: "var(--text-3)",
            }}>
              <span style={{ fontSize: 8 }}>●</span> Draft
            </span>
            <button
              className="btn btn-ghost"
              onClick={onClose}
              style={{
                height: 36,
                padding: "0 16px",
                borderRadius: "var(--radius-md)",
                fontSize: 13,
                border: "0.5px solid var(--border-2)",
                background: "transparent",
                color: "var(--text-2)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <i className="ti ti-x"></i> Discard
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                height: 36,
                padding: "0 20px",
                borderRadius: "var(--radius-md)",
                fontSize: 13,
                border: "none",
                background: submitting ? "var(--text-4)" : "var(--purple-deep)",
                color: "#EEEDFE",
                cursor: submitting ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? (
                <><i className="ti ti-loader" style={{ animation: "spin 1s linear infinite" }}></i> Creating...</>
              ) : (
                <><i className="ti ti-send"></i> Create Quote</>
              )}
            </button>
          </div>
        </div>

        {/* Client Banner */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "var(--bg-card)",
          border: "0.5px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "14px 18px",
          marginBottom: 20,
        }}>
          {selectedClient ? (
            <>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: "var(--purple-fill)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
                color: "var(--purple-text)",
                flexShrink: 0,
              }}>
                {selectedClient.name?.[0] || "C"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedClient.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3, display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <i className="ti ti-user" style={{ fontSize: 11 }}></i> {selectedClient.contact_name || "No contact"}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <i className="ti ti-mail" style={{ fontSize: 11 }}></i> {selectedClient.email || "No email"}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <i className="ti ti-building" style={{ fontSize: 11 }}></i> {selectedClient.industry || "N/A"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: "var(--bg-pill)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text-4)",
                flexShrink: 0,
              }}>
                ?
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>No client selected</div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>
                  Select a client from the dropdown below
                </div>
              </div>
            </>
          )}
          <select
            value={formData.client_id}
            onChange={(e) => {
              const id = e.target.value;
              setFormData(prev => ({ ...prev, client_id: id }));
              if (id) loadClient(id);
            }}
            style={{
              height: 36,
              padding: "0 12px",
              background: "var(--bg-app)",
              border: "0.5px solid var(--border-2)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-1)",
              fontSize: 13,
              cursor: "pointer",
              minWidth: 180,
            }}
          >
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>

        {/* Main Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 16,
          alignItems: "start",
        }}>
          {/* Left - Form */}
          <div>
            {/* 1. Quote Details */}
            <div style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              padding: 20,
              marginBottom: 14,
              border: "0.5px solid var(--border)",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 18,
                paddingBottom: 12,
                borderBottom: "0.5px solid var(--border)",
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-md)",
                  background: "var(--purple-fill)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <i className="ti ti-file-text" style={{ color: "var(--purple)", fontSize: 15 }}></i>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Quote Details</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>Reference, dates and delivery information</div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: 10,
                    fontWeight: 500,
                    background: "var(--amber-fill)",
                    color: "var(--amber-light)",
                    border: "0.5px solid var(--amber)",
                  }}>
                    <i className="ti ti-shield-lock" style={{ fontSize: 10 }}></i> 50% margin lock
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Quote Number</label>
                  <div style={{ position: "relative" }}>
                    <i className="ti ti-hash" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", fontSize: 14 }}></i>
                    <input
                      type="text"
                      value={formData.quote_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, quote_number: e.target.value }))}
                      placeholder="Auto-generated"
                      style={{
                        width: "100%",
                        height: 38,
                        padding: "0 12px 0 34px",
                        background: "var(--bg-app)",
                        border: "0.5px solid var(--border-2)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-1)",
                        fontSize: 13,
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-4)", marginTop: 3 }}>Leave blank for auto-generation</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Issue Date</label>
                  <div style={{ position: "relative" }}>
                    <i className="ti ti-calendar" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", fontSize: 14 }}></i>
                    <input
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                      style={{
                        width: "100%",
                        height: 38,
                        padding: "0 12px 0 34px",
                        background: "var(--bg-app)",
                        border: "0.5px solid var(--border-2)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-1)",
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Expiry Date</label>
                  <div style={{ position: "relative" }}>
                    <i className="ti ti-calendar-event" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", fontSize: 14 }}></i>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                      style={{
                        width: "100%",
                        height: 38,
                        padding: "0 12px 0 34px",
                        background: "var(--bg-app)",
                        border: "0.5px solid var(--border-2)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-1)",
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Validity Period</label>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[7, 14, 30, 60].map((days) => (
                      <button
                        key={days}
                        onClick={() => setValidity(days)}
                        style={{
                          flex: 1,
                          padding: "7px 0",
                          borderRadius: "var(--radius-md)",
                          border: `0.5px solid ${formData.validity_days === days ? "var(--teal)" : "var(--border-2)"}`,
                          background: formData.validity_days === days ? "var(--teal-fill)" : "transparent",
                          color: formData.validity_days === days ? "var(--teal-light)" : "var(--text-3)",
                          cursor: "pointer",
                          fontSize: 11,
                          fontFamily: "inherit",
                        }}
                      >
                        {days}d
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Quote Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Enterprise License"
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 12px",
                      background: "var(--bg-app)",
                      border: "0.5px solid var(--border-2)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-1)",
                      fontSize: 13,
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 12px",
                      background: "var(--bg-app)",
                      border: "0.5px solid var(--border-2)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-1)",
                      fontSize: 13,
                      cursor: "pointer",
                      appearance: "none",
                    }}
                  >
                    <option>KES - Kenyan Shilling</option>
                    <option>USD - US Dollar</option>
                    <option>EUR - Euro</option>
                    <option>GBP - British Pound</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: "span 3" }}>
                  <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>PO / Reference Number</label>
                  <input
                    type="text"
                    value={formData.po_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, po_number: e.target.value }))}
                    placeholder="Purchase order or internal reference (optional)"
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 12px",
                      background: "var(--bg-app)",
                      border: "0.5px solid var(--border-2)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-1)",
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 2. Line Items */}
            <div style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              padding: 20,
              marginBottom: 14,
              border: "0.5px solid var(--border)",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 18,
                paddingBottom: 12,
                borderBottom: "0.5px solid var(--border)",
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-md)",
                  background: "var(--teal-fill)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <i className="ti ti-list-details" style={{ color: "var(--teal-light)", fontSize: 15 }}></i>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Products & Services</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>Add what you're quoting for</div>
                </div>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", padding: "0 8px 10px", textAlign: "left", fontWeight: 500, width: 28 }}>#</th>
                    <th style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", padding: "0 8px 10px", textAlign: "left", fontWeight: 500 }}>Description</th>
                    <th style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", padding: "0 8px 10px", textAlign: "left", fontWeight: 500, width: 110 }}>Category</th>
                    <th style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", padding: "0 8px 10px", textAlign: "left", fontWeight: 500, width: 70 }}>Qty</th>
                    <th style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", padding: "0 8px 10px", textAlign: "left", fontWeight: 500, width: 130 }}>Unit Price</th>
                    <th style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", padding: "0 8px 10px", textAlign: "left", fontWeight: 500, width: 80 }}>Disc %</th>
                    <th style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", padding: "0 8px 10px", textAlign: "right", fontWeight: 500, width: 120 }}>Total</th>
                    <th style={{ width: 36, padding: "0 8px 10px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={item.id || index} style={{ borderTop: "0.5px solid var(--border)" }}>
                      <td style={{ padding: "8px 6px", textAlign: "center", fontSize: 11, color: "var(--text-4)", width: 28 }}>{index + 1}</td>
                      <td style={{ padding: "8px 6px" }}>
                        <input
                          type="text"
                          value={item.description || ""}
                          onChange={(e) => updateLineItem(index, "description", e.target.value)}
                          placeholder="Product or service description"
                          style={{
                            width: "100%",
                            height: 32,
                            padding: "0 8px",
                            background: "var(--bg-app)",
                            border: "0.5px solid transparent",
                            borderRadius: "var(--radius-md)",
                            color: "var(--text-1)",
                            fontSize: 12,
                            outline: "none",
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = "var(--purple)"}
                          onBlur={(e) => e.currentTarget.style.borderColor = "transparent"}
                        />
                      </td>
                      <td style={{ padding: "8px 6px" }}>
                        <select
                          value={item.category || "Software license"}
                          onChange={(e) => updateLineItem(index, "category", e.target.value)}
                          style={{
                            width: "100%",
                            height: 32,
                            padding: "0 8px",
                            background: "var(--bg-app)",
                            border: "0.5px solid transparent",
                            borderRadius: "var(--radius-md)",
                            color: "var(--text-1)",
                            fontSize: 11,
                            cursor: "pointer",
                            outline: "none",
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = "var(--purple)"}
                          onBlur={(e) => e.currentTarget.style.borderColor = "transparent"}
                        >
                          <option value="Software license">Software license</option>
                          <option value="Implementation">Implementation</option>
                          <option value="Training">Training</option>
                          <option value="Support">Support</option>
                          <option value="Hardware">Hardware</option>
                          <option value="Consulting">Consulting</option>
                        </select>
                      </td>
                      <td style={{ padding: "8px 6px" }}>
                        <input
                          type="number"
                          value={item.quantity || 1}
                          onChange={(e) => updateLineItem(index, "quantity", parseInt(e.target.value) || 0)}
                          min="1"
                          style={{
                            width: "100%",
                            height: 32,
                            padding: "0 4px",
                            background: "var(--bg-app)",
                            border: "0.5px solid transparent",
                            borderRadius: "var(--radius-md)",
                            color: "var(--text-1)",
                            fontSize: 12,
                            textAlign: "center",
                            outline: "none",
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = "var(--purple)"}
                          onBlur={(e) => e.currentTarget.style.borderColor = "transparent"}
                        />
                      </td>
                      <td style={{ padding: "8px 6px" }}>
                        <input
                          type="number"
                          value={item.unit_price || 0}
                          onChange={(e) => updateLineItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                          min="0"
                          style={{
                            width: "100%",
                            height: 32,
                            padding: "0 8px",
                            background: "var(--bg-app)",
                            border: "0.5px solid transparent",
                            borderRadius: "var(--radius-md)",
                            color: "var(--text-1)",
                            fontSize: 12,
                            outline: "none",
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = "var(--purple)"}
                          onBlur={(e) => e.currentTarget.style.borderColor = "transparent"}
                        />
                      </td>
                      <td style={{ padding: "8px 6px" }}>
                        <input
                          type="number"
                          value={item.discount_pct || 0}
                          onChange={(e) => updateLineItem(index, "discount_pct", parseFloat(e.target.value) || 0)}
                          min="0"
                          max="50"
                          style={{
                            width: "100%",
                            height: 32,
                            padding: "0 4px",
                            background: "var(--bg-app)",
                            border: "0.5px solid transparent",
                            borderRadius: "var(--radius-md)",
                            color: "var(--text-1)",
                            fontSize: 12,
                            textAlign: "center",
                            outline: "none",
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = "var(--purple)"}
                          onBlur={(e) => e.currentTarget.style.borderColor = "transparent"}
                        />
                      </td>
                      <td style={{ padding: "8px 6px", textAlign: "right", fontSize: 12, color: "var(--teal-light)", fontWeight: 500 }}>
                        KES {item.total.toLocaleString()}
                      </td>
                      <td style={{ padding: "8px 6px", textAlign: "center" }}>
                        <button
                          onClick={() => removeLineItem(index)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            border: "0.5px solid transparent",
                            background: "transparent",
                            color: "var(--text-4)",
                            cursor: "pointer",
                            fontSize: 14,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--red)";
                            e.currentTarget.style.color = "var(--red-light)";
                            e.currentTarget.style.background = "var(--red-fill)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "transparent";
                            e.currentTarget.style.color = "var(--text-4)";
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <i className="ti ti-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                onClick={addLineItem}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "var(--purple)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 0",
                  marginTop: 4,
                }}
              >
                <i className="ti ti-plus" style={{ fontSize: 14 }}></i> Add line item
              </button>

              {/* Tax Toggles */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderTop: "0.5px solid var(--border)",
                marginTop: 4,
              }}>
                <label style={{ fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.apply_vat}
                    onChange={(e) => setFormData(prev => ({ ...prev, apply_vat: e.target.checked }))}
                    style={{ width: 14, height: 14, accentColor: "var(--purple)", cursor: "pointer" }}
                  />
                  Apply VAT (16%)
                </label>
                <label style={{ fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginLeft: 20 }}>
                  <input
                    type="checkbox"
                    checked={formData.apply_withholding}
                    onChange={(e) => setFormData(prev => ({ ...prev, apply_withholding: e.target.checked }))}
                    style={{ width: 14, height: 14, accentColor: "var(--purple)", cursor: "pointer" }}
                  />
                  Withholding tax (5%)
                </label>
              </div>

              {/* Totals */}
              <div style={{
                background: "var(--bg-app)",
                borderRadius: "var(--radius-md)",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginTop: 12,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-2)" }}>
                  <span style={{ color: "var(--text-3)" }}>Subtotal</span>
                  <span>KES {getSubtotal().toLocaleString()}</span>
                </div>
                {formData.apply_vat && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-2)" }}>
                    <span style={{ color: "var(--text-3)" }}>VAT (16%)</span>
                    <span>KES {getVAT().toLocaleString()}</span>
                  </div>
                )}
                {formData.apply_withholding && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-2)" }}>
                    <span style={{ color: "var(--text-3)" }}>Withholding tax (5%)</span>
                    <span style={{ color: "var(--coral-light)" }}>- KES {getWithholdingTax().toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-2)" }}>
                  <span style={{ color: "var(--text-3)" }}>Discount</span>
                  <span style={{ color: "var(--coral-light)" }}>- KES {getDiscountAmount().toLocaleString()}</span>
                </div>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--text-1)",
                  borderTop: "0.5px solid var(--border)",
                  paddingTop: 10,
                  marginTop: 4,
                }}>
                  <span>Total</span>
                  <span>KES {getGrandTotal().toLocaleString()}</span>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5 }}>
                    <span style={{ color: "var(--text-3)" }}>Profit margin</span>
                    <span style={{ color: marginColor, fontWeight: 600 }}>{marginText}</span>
                  </div>
                  <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      borderRadius: 3,
                      width: `${Math.min(Math.max(margin, 0), 100)}%`,
                      background: margin >= 60 ? "var(--teal-light)" : margin >= 50 ? "var(--amber-light)" : "var(--red-light)",
                    }}></div>
                  </div>
                  <div style={{ fontSize: 9, color: "var(--text-4)", marginTop: 3 }}>Minimum required: 50%</div>
                </div>
              </div>
            </div>

            {/* 3. Discount & Pricing */}
            <div style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              padding: 20,
              marginBottom: 14,
              border: "0.5px solid var(--border)",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 18,
                paddingBottom: 12,
                borderBottom: "0.5px solid var(--border)",
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-md)",
                  background: "var(--amber-fill)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <i className="ti ti-percentage" style={{ color: "var(--amber-light)", fontSize: 15 }}></i>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Discount & Pricing</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>Apply overall discount - cannot reduce margin below 50%</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Discount Type</label>
                  <div style={{ display: "flex", gap: 4 }}>
                    {["percentage", "fixed"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setFormData(prev => ({ ...prev, discount_type: type }))}
                        style={{
                          flex: 1,
                          padding: "7px 0",
                          borderRadius: "var(--radius-md)",
                          border: `0.5px solid ${formData.discount_type === type ? "var(--purple)" : "var(--border-2)"}`,
                          background: formData.discount_type === type ? "var(--purple-fill)" : "transparent",
                          color: formData.discount_type === type ? "var(--purple-text)" : "var(--text-3)",
                          cursor: "pointer",
                          fontSize: 11,
                          fontFamily: "inherit",
                          textAlign: "center",
                        }}
                      >
                        {type === "percentage" ? "% Percentage" : "KES Fixed"}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Overall Discount</label>
                  <div style={{ position: "relative" }}>
                    <i className="ti ti-tag" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", fontSize: 14 }}></i>
                    <input
                      type="number"
                      value={formData.overall_discount}
                      onChange={(e) => setFormData(prev => ({ ...prev, overall_discount: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      max={formData.discount_type === "percentage" ? 50 : undefined}
                      style={{
                        width: "100%",
                        height: 38,
                        padding: "0 12px 0 34px",
                        background: "var(--bg-app)",
                        border: `0.5px solid ${margin < 50 ? "var(--red)" : "var(--border-2)"}`,
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-1)",
                        fontSize: 13,
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 10, color: margin < 50 ? "var(--red-light)" : "var(--text-4)", marginTop: 3 }}>
                    {margin < 50 ? "Discount too high - margin below 50%" : "Max 50% - margin floor enforced"}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Pricing Tier</label>
                  <select
                    value={formData.pricing_tier}
                    onChange={(e) => setFormData(prev => ({ ...prev, pricing_tier: e.target.value }))}
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 12px",
                      background: "var(--bg-app)",
                      border: "0.5px solid var(--border-2)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-1)",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    <option>Standard pricing</option>
                    <option>Enterprise pricing</option>
                    <option>Government pricing</option>
                    <option>NGO pricing</option>
                    <option>Custom negotiated</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Payment Terms</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
                    {paymentTermsOptions.map((term) => (
                      <span
                        key={term}
                        onClick={() => {
                          setSelectedPaymentTerms(term);
                          setFormData(prev => ({ ...prev, payment_terms: term }));
                        }}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 20,
                          fontSize: 11,
                          border: `0.5px solid ${selectedPaymentTerms === term ? "var(--purple)" : "var(--border-2)"}`,
                          background: selectedPaymentTerms === term ? "var(--purple-fill)" : "transparent",
                          color: selectedPaymentTerms === term ? "var(--purple-text)" : "var(--text-3)",
                          cursor: "pointer",
                        }}
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Terms & Conditions */}
            <div style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              padding: 20,
              marginBottom: 14,
              border: "0.5px solid var(--border)",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 18,
                paddingBottom: 12,
                borderBottom: "0.5px solid var(--border)",
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-md)",
                  background: "rgba(133,183,235,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <i className="ti ti-file-certificate" style={{ color: "var(--blue-light)", fontSize: 15 }}></i>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Terms & Conditions</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>Delivery scope, SLAs and legal terms</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Scope of Delivery</label>
                  <textarea
                    value={formData.scope}
                    onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value }))}
                    placeholder="What is included in this quote?"
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "var(--bg-app)",
                      border: "0.5px solid var(--border-2)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-1)",
                      fontSize: 13,
                      resize: "vertical",
                      minHeight: 80,
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Exclusions</label>
                  <textarea
                    value={formData.exclusions}
                    onChange={(e) => setFormData(prev => ({ ...prev, exclusions: e.target.value }))}
                    placeholder="What is NOT included?"
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "var(--bg-app)",
                      border: "0.5px solid var(--border-2)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-1)",
                      fontSize: 13,
                      resize: "vertical",
                      minHeight: 60,
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>SLA / Service Level</label>
                    <select
                      value={formData.sla}
                      onChange={(e) => setFormData(prev => ({ ...prev, sla: e.target.value }))}
                      style={{
                        width: "100%",
                        height: 38,
                        padding: "0 12px",
                        background: "var(--bg-app)",
                        border: "0.5px solid var(--border-2)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-1)",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      <option>Standard (business hours, 48hr response)</option>
                      <option>Premium (24/7, 4hr response)</option>
                      <option>Enterprise (24/7, 1hr response, dedicated CSM)</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Delivery Timeline</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <input
                        type="text"
                        value={formData.delivery_timeline_start}
                        onChange={(e) => setFormData(prev => ({ ...prev, delivery_timeline_start: e.target.value }))}
                        placeholder="Start"
                        style={{
                          height: 38,
                          padding: "0 12px",
                          background: "var(--bg-app)",
                          border: "0.5px solid var(--border-2)",
                          borderRadius: "var(--radius-md)",
                          color: "var(--text-1)",
                          fontSize: 12,
                        }}
                      />
                      <input
                        type="text"
                        value={formData.delivery_timeline_go_live}
                        onChange={(e) => setFormData(prev => ({ ...prev, delivery_timeline_go_live: e.target.value }))}
                        placeholder="Go-live"
                        style={{
                          height: 38,
                          padding: "0 12px",
                          background: "var(--bg-app)",
                          border: "0.5px solid var(--border-2)",
                          borderRadius: "var(--radius-md)",
                          color: "var(--text-1)",
                          fontSize: 12,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Terms Template</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {templateOptions.map((template) => (
                      <span
                        key={template}
                        onClick={() => {
                          setSelectedTemplate(template);
                          setFormData(prev => ({ ...prev, terms_template: template }));
                        }}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 20,
                          fontSize: 11,
                          border: `0.5px solid ${selectedTemplate === template ? "var(--purple)" : "var(--border-2)"}`,
                          background: selectedTemplate === template ? "var(--purple-fill)" : "transparent",
                          color: selectedTemplate === template ? "var(--purple-text)" : "var(--text-3)",
                          cursor: "pointer",
                        }}
                      >
                        {template}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Additional Notes</label>
                  <textarea
                    value={formData.additional_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
                    placeholder="Any special conditions, assumptions, or dependencies..."
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "var(--bg-app)",
                      border: "0.5px solid var(--border-2)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-1)",
                      fontSize: 13,
                      resize: "vertical",
                      minHeight: 60,
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 5. Delivery Method */}
            <div style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              padding: 20,
              marginBottom: 14,
              border: "0.5px solid var(--border)",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 18,
                paddingBottom: 12,
                borderBottom: "0.5px solid var(--border)",
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-md)",
                  background: "var(--purple-fill)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <i className="ti ti-send" style={{ color: "var(--purple)", fontSize: 15 }}></i>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>How to Send</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>Choose how the client will receive this quote</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Delivery Method</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {deliveryMethods.map((method) => (
                      <span
                        key={method}
                        onClick={() => {
                          setSelectedDeliveryMethod(method);
                          setFormData(prev => ({ ...prev, delivery_method: method }));
                        }}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 20,
                          fontSize: 11,
                          border: `0.5px solid ${selectedDeliveryMethod === method ? "var(--purple)" : "var(--border-2)"}`,
                          background: selectedDeliveryMethod === method ? "var(--purple-fill)" : "transparent",
                          color: selectedDeliveryMethod === method ? "var(--purple-text)" : "var(--text-3)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <i className={`ti ${method === "Email" ? "ti-mail" : method === "WhatsApp" ? "ti-brand-whatsapp" : method === "Shareable link" ? "ti-link" : "ti-file-download"}`} style={{ fontSize: 11 }}></i>
                        {method}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Send To</label>
                  <div style={{ position: "relative" }}>
                    <i className="ti ti-mail" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", fontSize: 14 }}></i>
                    <input
                      type="email"
                      value={formData.send_to}
                      onChange={(e) => setFormData(prev => ({ ...prev, send_to: e.target.value }))}
                      placeholder="client@email.com"
                      style={{
                        width: "100%",
                        height: 38,
                        padding: "0 12px 0 34px",
                        background: "var(--bg-app)",
                        border: "0.5px solid var(--border-2)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-1)",
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: "span 2" }}>
                  <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Email Message</label>
                  <textarea
                    value={formData.email_message}
                    onChange={(e) => setFormData(prev => ({ ...prev, email_message: e.target.value }))}
                    placeholder="Personalised message to include in the email..."
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "var(--bg-app)",
                      border: "0.5px solid var(--border-2)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-1)",
                      fontSize: 13,
                      resize: "vertical",
                      minHeight: 80,
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "0.5px solid var(--border)",
              marginTop: 4,
            }}>
              <div style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 6 }}>
                <i className="ti ti-lock" style={{ color: "var(--text-4)" }}></i>
                Quote data is saved securely
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={onClose}
                  style={{
                    height: 36,
                    padding: "0 16px",
                    borderRadius: "var(--radius-md)",
                    fontSize: 13,
                    border: "0.5px solid var(--border-2)",
                    background: "transparent",
                    color: "var(--text-2)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <i className="ti ti-arrow-left"></i> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    height: 36,
                    padding: "0 20px",
                    borderRadius: "var(--radius-md)",
                    fontSize: 13,
                    border: "none",
                    background: submitting ? "var(--text-4)" : "var(--purple-deep)",
                    color: "#EEEDFE",
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {submitting ? (
                    <><i className="ti ti-loader" style={{ animation: "spin 1s linear infinite" }}></i> Creating...</>
                  ) : (
                    <><i className="ti ti-send"></i> Create Quote</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Quote Summary */}
            <div style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              padding: 16,
              border: "0.5px solid var(--border)",
            }}>
              <h3 style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 12, fontWeight: 600 }}>
                <i className="ti ti-file-text" style={{ marginRight: 6, color: "var(--text-3)" }}></i> Quote Summary
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "7px 0", borderBottom: "0.5px solid var(--border)", color: "var(--text-2)" }}>
                <span>Client</span>
                <span style={{ color: "var(--text-1)", fontWeight: 500 }}>{selectedClient?.name || "Not selected"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "7px 0", borderBottom: "0.5px solid var(--border)", color: "var(--text-2)" }}>
                <span>Items</span>
                <span style={{ color: "var(--text-1)", fontWeight: 500 }}>{lineItems.length}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "7px 0", borderBottom: "0.5px solid var(--border)", color: "var(--text-2)" }}>
                <span>Subtotal</span>
                <span style={{ color: "var(--text-1)", fontWeight: 500 }}>KES {getSubtotal().toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "7px 0", borderBottom: "0.5px solid var(--border)", color: "var(--text-2)" }}>
                <span>Discount</span>
                <span style={{ color: "var(--coral-light)", fontWeight: 500 }}>- KES {getDiscountAmount().toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "7px 0", color: "var(--text-2)" }}>
                <span>Total</span>
                <span style={{ color: "var(--teal-light)", fontWeight: 700, fontSize: 14 }}>KES {getGrandTotal().toLocaleString()}</span>
              </div>
            </div>

            {/* Profit Margin Gauge */}
            <div style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              padding: 16,
              border: "0.5px solid var(--border)",
            }}>
              <h3 style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 12, fontWeight: 600 }}>
                <i className="ti ti-chart-bar" style={{ marginRight: 6, color: "var(--text-3)" }}></i> Profit Margin
              </h3>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ color: "var(--text-3)" }}>Current margin</span>
                  <span style={{ color: marginColor, fontWeight: 700, fontSize: 14 }}>{margin.toFixed(1)}%</span>
                </div>
                <div style={{ height: 10, background: "var(--border)", borderRadius: 5, overflow: "hidden", position: "relative", marginTop: 8 }}>
                  <div style={{
                    height: "100%",
                    borderRadius: 5,
                    width: `${Math.min(Math.max(margin, 0), 100)}%`,
                    background: margin >= 60 ? "var(--teal-light)" : margin >= 50 ? "var(--amber-light)" : "var(--red-light)",
                    transition: "width 0.3s",
                  }}></div>
                  <div style={{
                    position: "absolute",
                    left: "50%",
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: "var(--text-4)",
                  }}></div>
                </div>
                <div style={{ fontSize: 9, color: "var(--text-4)", textAlign: "center", marginTop: 3 }}>50% minimum required</div>
              </div>
            </div>

            {/* Quote Stage */}
            <div style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              padding: 16,
              border: "0.5px solid var(--border)",
            }}>
              <h3 style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 12, fontWeight: 600 }}>
                <i className="ti ti-git-branch" style={{ marginRight: 6, color: "var(--text-3)" }}></i> Quote Stage
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {["Draft", "Sent", "Viewed", "Negotiating", "Accepted", "Rejected", "Expired"].map((stage, index) => (
                  <div key={stage} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 10px",
                    borderRadius: "var(--radius-md)",
                    background: index === 0 ? "var(--purple-fill)" : "transparent",
                    fontSize: 12,
                    color: index === 0 ? "var(--purple-text)" : "var(--text-4)",
                  }}>
                    <div style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: index === 0 ? "var(--purple)" : "var(--text-4)",
                      flexShrink: 0,
                    }}></div>
                    {stage}
                    {index === 0 && <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.6 }}>Current</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Readiness */}
            <div style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              padding: 16,
              border: "0.5px solid var(--border)",
            }}>
              <h3 style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 12, fontWeight: 600 }}>
                <i className="ti ti-checklist" style={{ marginRight: 6, color: "var(--text-3)" }}></i> Readiness
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Client selected", done: !!formData.client_id },
                  { label: "Line items added", done: lineItems.some(i => i.description && i.unit_price > 0) },
                  { label: "Margin above 50%", done: getMargin() >= 50 },
                  { label: "Expiry date set", done: !!formData.expiry_date },
                  { label: "Payment terms selected", done: !!formData.payment_terms },
                  { label: "Scope written", done: !!formData.scope },
                ].map((item) => (
                  <div key={item.label} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 11,
                    color: item.done ? "var(--text-2)" : "var(--text-3)",
                  }}>
                    <i className={`ti ${item.done ? "ti-square-rounded-check" : "ti-square-rounded"}`}
                      style={{ fontSize: 14, color: item.done ? "var(--teal-light)" : "var(--border-2)" }}></i>
                    {item.label}
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: "0.5px solid var(--border)",
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: "var(--text-3)",
                  marginBottom: 6,
                }}>
                  <span>Completeness</span>
                  <span style={{ color: getCompleteness() >= 70 ? "var(--teal-light)" : "var(--amber-light)" }}>{getCompleteness()}%</span>
                </div>
                <div style={{
                  height: 5,
                  background: "var(--border)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${getCompleteness()}%`,
                    background: getCompleteness() >= 70 ? "var(--teal)" : "var(--amber-light)",
                    borderRadius: 3,
                    transition: "width 0.3s",
                  }}></div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{
              background: "var(--purple-fill)",
              borderRadius: "var(--radius-lg)",
              padding: 16,
              border: "0.5px solid var(--purple-deep)",
            }}>
              <h3 style={{ fontSize: 12, color: "var(--purple-text)", marginBottom: 12, fontWeight: 600 }}>
                <i className="ti ti-send" style={{ color: "var(--purple)", marginRight: 6 }}></i> Quick Actions
              </h3>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: "var(--purple-deep)",
                  color: "#EEEDFE",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontSize: 13,
                  marginBottom: 8,
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                <i className="ti ti-send"></i> Create Quote
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}