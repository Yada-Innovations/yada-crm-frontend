"use client";
import { useState, useEffect } from "react";
import { apiPost, apiGet } from "@/lib/api";

interface LeadFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function LeadForm({ onClose, onSuccess }: LeadFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Company Information
    company_name: "",
    industry: "",
    company_size: "",
    website: "",
    address: "",
    country: "Kenya",
    company_description: "",
    
    // Primary Contact
    first_name: "",
    last_name: "",
    job_title: "",
    department: "",
    work_email: "",
    personal_email: "",
    phone: "",
    phone_code: "+254",
    alt_phone: "",
    alt_phone_code: "+254",
    linkedin: "",
    preferred_contact: "Phone call",
    
    // Deal Information
    estimated_value: "",
    expected_close_date: "",
    products: [] as string[],
    decision_maker: "Influencer - recommends to board",
    budget_confirmed: "Not yet confirmed",
    lead_source: "Referral",
    priority: "medium",
    pain_points: "",
    notes: "",
    
    // Assignment & Follow-up
    assigned_to: "",
    follow_up_date: "",
    follow_up_action: "Schedule demo",
    initial_stage: "lead",
  });

  const [productInput, setProductInput] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const leadSources = ["Referral", "LinkedIn", "Cold call", "Email campaign", "Website", "Event / expo", "Partner", "Other"];
  const followUpActions = ["Schedule demo", "Send proposal", "Follow-up call", "Send quote", "Technical review", "Introduction meeting"];
  
  const stages = [
    { key: "lead", label: "Lead", color: "var(--purple)" },
    { key: "qualified", label: "Qualified", color: "var(--blue-light)" },
    { key: "quote_sent", label: "Quote Sent", color: "var(--purple)" },
    { key: "demo_scheduled", label: "Demo Scheduled", color: "var(--amber-light)" },
    { key: "demo_completed", label: "Demo Completed", color: "var(--teal-light)" },
    { key: "technical_review", label: "Tech Review", color: "var(--coral-light)" },
    { key: "proposal_sent", label: "Proposal Sent", color: "var(--purple)" },
    { key: "negotiation", label: "Negotiation", color: "var(--amber-light)" },
  ];

  useEffect(() => {
    apiGet('/admin/users').then(data => {
      if (Array.isArray(data)) {
        setClients(data);
      }
    });
  }, []);

  const totalSteps = 5;
  const stepLabels = ["Company info", "Contact details", "Deal info", "Assign & stage", "Review"];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addProduct = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && productInput.trim()) {
      e.preventDefault();
      if (!formData.products.includes(productInput.trim())) {
        handleInputChange("products", [...formData.products, productInput.trim()]);
      }
      setProductInput("");
    }
  };

  const removeProduct = (product: string) => {
    handleInputChange("products", formData.products.filter(p => p !== product));
  };

  const toggleTag = (field: string, value: string) => {
    if (field === "lead_source") {
      handleInputChange(field, value);
    } else if (field === "follow_up_action") {
      handleInputChange(field, value);
    }
  };

  const setPriority = (priority: string) => {
    handleInputChange("priority", priority);
  };

  const selectStage = (stage: string) => {
    handleInputChange("initial_stage", stage);
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.company_name.trim()) errors.company_name = "Company name is required";
      if (!formData.industry) errors.industry = "Industry is required";
    } else if (step === 2) {
      if (!formData.first_name.trim()) errors.first_name = "First name is required";
      if (!formData.last_name.trim()) errors.last_name = "Last name is required";
      if (!formData.job_title.trim()) errors.job_title = "Job title is required";
      if (!formData.work_email.trim()) errors.work_email = "Work email is required";
      if (!formData.phone.trim()) errors.phone = "Phone number is required";
    } else if (step === 3) {
      if (!formData.estimated_value) errors.estimated_value = "Estimated value is required";
      if (!formData.lead_source) errors.lead_source = "Lead source is required";
    } else if (step === 4) {
      if (!formData.assigned_to) errors.assigned_to = "Please assign this lead";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    try {
      const data = {
        company_name: formData.company_name,
        contact_name: `${formData.first_name} ${formData.last_name}`.trim(),
        email: formData.work_email,
        phone: `${formData.phone_code}${formData.phone}`,
        estimated_value: parseFloat(formData.estimated_value) || 0,
        assigned_to: parseInt(formData.assigned_to) || null,
        notes: formData.notes || formData.pain_points || "",
        stage: formData.initial_stage || "lead",
      };

      const res = await apiPost("/leads", data);
      if (res.id) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Failed to create lead:", error);
      alert("Failed to create lead. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCompleteness = () => {
    const fields = [
      formData.company_name,
      formData.industry,
      formData.first_name,
      formData.last_name,
      formData.work_email,
      formData.phone,
      formData.estimated_value,
      formData.lead_source,
      formData.follow_up_date,
    ];
    const filled = fields.filter(f => f && f.toString().trim()).length;
    return Math.round((filled / fields.length) * 100);
  };

  const completeness = getCompleteness();

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
        maxWidth: 1100,
        maxHeight: "90vh",
        overflowY: "auto",
        padding: "24px",
        border: "0.5px solid var(--border)",
        position: "relative",
      }}>
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

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>New Lead</h1>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
              Fill in the details below to add a new lead to the pipeline
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
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
              <i className="ti ti-x"></i>Discard
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                height: 36,
                padding: "0 16px",
                borderRadius: "var(--radius-md)",
                fontSize: 13,
                border: "none",
                background: isSubmitting ? "var(--text-4)" : "var(--purple-deep)",
                color: "#EEEDFE",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              {isSubmitting ? (
                <><i className="ti ti-loader" style={{ animation: "spin 1s linear infinite" }}></i> Creating...</>
              ) : (
                <><i className="ti ti-plus"></i> Add lead</>
              )}
            </button>
          </div>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          marginBottom: 24,
          background: "var(--bg-card)",
          borderRadius: "var(--radius-lg)",
          padding: "16px 20px",
          overflowX: "auto",
        }}>
          {stepLabels.map((label, index) => {
            const stepNum = index + 1;
            const isActive = currentStep === stepNum;
            const isDone = currentStep > stepNum;
            return (
              <div key={index} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    border: `1.5px solid ${isDone ? "var(--teal)" : isActive ? "var(--purple)" : "var(--border-2)"}`,
                    color: isDone ? "var(--teal-light)" : isActive ? "#fff" : "var(--text-4)",
                    background: isDone ? "var(--teal-fill)" : isActive ? "var(--purple-deep)" : "transparent",
                  }}>
                    {isDone ? <i className="ti ti-check" style={{ fontSize: 11 }}></i> : stepNum}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: isDone ? "var(--teal-light)" : isActive ? "var(--purple-text)" : "var(--text-3)",
                    fontWeight: isActive ? 500 : 400,
                  }}>
                    {label}
                  </div>
                </div>
                {index < stepLabels.length - 1 && (
                  <div style={{
                    width: 32,
                    height: 1,
                    background: isDone ? "var(--teal)" : "var(--border-2)",
                    margin: "0 6px",
                    flexShrink: 0,
                  }} />
                )}
              </div>
            );
          })}
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 16,
          alignItems: "start",
        }}>
          <div>
            {currentStep === 1 && (
              <div className="section" style={{
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
                    <i className="ti ti-building" style={{ color: "var(--purple)", fontSize: 15 }}></i>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Company Information</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>Details about the prospect's organisation</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                      Company name <span style={{ color: "var(--coral-light)" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <i className="ti ti-building" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", fontSize: 14 }}></i>
                      <input
                        type="text"
                        value={formData.company_name}
                        onChange={(e) => handleInputChange("company_name", e.target.value)}
                        placeholder="e.g. ABC Bank Ltd"
                        style={{
                          width: "100%",
                          height: 38,
                          padding: "0 12px 0 34px",
                          background: "var(--bg-app)",
                          border: `0.5px solid ${formErrors.company_name ? "var(--red)" : "var(--border-2)"}`,
                          borderRadius: "var(--radius-md)",
                          color: "var(--text-1)",
                          fontSize: 13,
                        }}
                      />
                    </div>
                    {formErrors.company_name && (
                      <div style={{ fontSize: 10, color: "var(--red-light)", marginTop: 2 }}>{formErrors.company_name}</div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                      Industry <span style={{ color: "var(--coral-light)" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <select
                        value={formData.industry}
                        onChange={(e) => handleInputChange("industry", e.target.value)}
                        style={{
                          width: "100%",
                          height: 38,
                          padding: "0 12px",
                          background: "var(--bg-app)",
                          border: `0.5px solid ${formErrors.industry ? "var(--red)" : "var(--border-2)"}`,
                          borderRadius: "var(--radius-md)",
                          color: "var(--text-1)",
                          fontSize: 13,
                          appearance: "none",
                          cursor: "pointer",
                        }}
                      >
                        <option value="">Select industry</option>
                        <option>Banking & Finance</option>
                        <option>Telecommunications</option>
                        <option>Insurance</option>
                        <option>Technology</option>
                        <option>Healthcare</option>
                        <option>Retail</option>
                        <option>Manufacturing</option>
                        <option>Government</option>
                        <option>Education</option>
                        <option>Other</option>
                      </select>
                      <i className="ti ti-chevron-down" style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", fontSize: 14, pointerEvents: "none" }}></i>
                    </div>
                    {formErrors.industry && (
                      <div style={{ fontSize: 10, color: "var(--red-light)", marginTop: 2 }}>{formErrors.industry}</div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Company size</label>
                    <select
                      value={formData.company_size}
                      onChange={(e) => handleInputChange("company_size", e.target.value)}
                      style={{
                        width: "100%",
                        height: 38,
                        padding: "0 12px",
                        background: "var(--bg-app)",
                        border: "0.5px solid var(--border-2)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-1)",
                        fontSize: 13,
                        appearance: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="">Select size</option>
                      <option>1-10 employees</option>
                      <option>11-50 employees</option>
                      <option>51-200 employees</option>
                      <option>201-500 employees</option>
                      <option>500+ employees</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Company website</label>
                    <div style={{ position: "relative" }}>
                      <i className="ti ti-world" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", fontSize: 14 }}></i>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange("website", e.target.value)}
                        placeholder="https://abcbank.co.ke"
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
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Physical address</label>
                    <div style={{ position: "relative" }}>
                      <i className="ti ti-map-pin" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", fontSize: 14 }}></i>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        placeholder="e.g. Westlands, Nairobi"
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
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Country</label>
                    <select
                      value={formData.country}
                      onChange={(e) => handleInputChange("country", e.target.value)}
                      style={{
                        width: "100%",
                        height: 38,
                        padding: "0 12px",
                        background: "var(--bg-app)",
                        border: "0.5px solid var(--border-2)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-1)",
                        fontSize: 13,
                        appearance: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option>Kenya</option>
                      <option>Uganda</option>
                      <option>Tanzania</option>
                      <option>Rwanda</option>
                      <option>Ethiopia</option>
                      <option>South Africa</option>
                      <option>Nigeria</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: "span 2" }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Company description</label>
                    <textarea
                      value={formData.company_description}
                      onChange={(e) => handleInputChange("company_description", e.target.value)}
                      placeholder="Brief overview of what the company does and why they're a fit..."
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
            )}

            {currentStep === 2 && (
              <div className="section" style={{
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
                    <i className="ti ti-user" style={{ color: "var(--teal-light)", fontSize: 15 }}></i>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Primary Contact</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>The main person you'll be dealing with</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                      First name <span style={{ color: "var(--coral-light)" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <i className="ti ti-user" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", fontSize: 14 }}></i>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => handleInputChange("first_name", e.target.value)}
                        placeholder="John"
                        style={{
                          width: "100%",
                          height: 38,
                          padding: "0 12px 0 34px",
                          background: "var(--bg-app)",
                          border: `0.5px solid ${formErrors.first_name ? "var(--red)" : "var(--border-2)"}`,
                          borderRadius: "var(--radius-md)",
                          color: "var(--text-1)",
                          fontSize: 13,
                        }}
                      />
                    </div>
                    {formErrors.first_name && (
                      <div style={{ fontSize: 10, color: "var(--red-light)", marginTop: 2 }}>{formErrors.first_name}</div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                      Last name <span style={{ color: "var(--coral-light)" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange("last_name", e.target.value)}
                      placeholder="Kamau"
                      style={{
                        width: "100%",
                        height: 38,
                        padding: "0 12px",
                        background: "var(--bg-app)",
                        border: `0.5px solid ${formErrors.last_name ? "var(--red)" : "var(--border-2)"}`,
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-1)",
                        fontSize: 13,
                      }}
                    />
                    {formErrors.last_name && (
                      <div style={{ fontSize: 10, color: "var(--red-light)", marginTop: 2 }}>{formErrors.last_name}</div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                      Job title <span style={{ color: "var(--coral-light)" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <i className="ti ti-briefcase" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", fontSize: 14 }}></i>
                      <input
                        type="text"
                        value={formData.job_title}
                        onChange={(e) => handleInputChange("job_title", e.target.value)}
                        placeholder="e.g. Head of Technology"
                        style={{
                          width: "100%",
                          height: 38,
                          padding: "0 12px 0 34px",
                          background: "var(--bg-app)",
                          border: `0.5px solid ${formErrors.job_title ? "var(--red)" : "var(--border-2)"}`,
                          borderRadius: "var(--radius-md)",
                          color: "var(--text-1)",
                          fontSize: 13,
                        }}
                      />
                    </div>
                    {formErrors.job_title && (
                      <div style={{ fontSize: 10, color: "var(--red-light)", marginTop: 2 }}>{formErrors.job_title}</div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Department</label>
                    <select
                      value={formData.department}
                      onChange={(e) => handleInputChange("department", e.target.value)}
                      style={{
                        width: "100%",
                        height: 38,
                        padding: "0 12px",
                        background: "var(--bg-app)",
                        border: "0.5px solid var(--border-2)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-1)",
                        fontSize: 13,
                        appearance: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="">Select department</option>
                      <option>IT / Technology</option>
                      <option>Finance</option>
                      <option>Operations</option>
                      <option>Sales & Marketing</option>
                      <option>HR</option>
                      <option>Executive / C-Suite</option>
                      <option>Procurement</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                      Work email <span style={{ color: "var(--coral-light)" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <i className="ti ti-mail" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", fontSize: 14 }}></i>
                      <input
                        type="email"
                        value={formData.work_email}
                        onChange={(e) => handleInputChange("work_email", e.target.value)}
                        placeholder="jkamau@abcbank.co.ke"
                        style={{
                          width: "100%",
                          height: 38,
                          padding: "0 12px 0 34px",
                          background: "var(--bg-app)",
                          border: `0.5px solid ${formErrors.work_email ? "var(--red)" : "var(--border-2)"}`,
                          borderRadius: "var(--radius-md)",
                          color: "var(--text-1)",
                          fontSize: 13,
                        }}
                      />
                    </div>
                    {formErrors.work_email && (
                      <div style={{ fontSize: 10, color: "var(--red-light)", marginTop: 2 }}>{formErrors.work_email}</div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Personal email</label>
                    <div style={{ position: "relative" }}>
                      <i className="ti ti-mail" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", fontSize: 14 }}></i>
                      <input
                        type="email"
                        value={formData.personal_email}
                        onChange={(e) => handleInputChange("personal_email", e.target.value)}
                        placeholder="john.kamau@gmail.com"
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
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                      Phone number <span style={{ color: "var(--coral-light)" }}>*</span>
                    </label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <select
                        value={formData.phone_code}
                        onChange={(e) => handleInputChange("phone_code", e.target.value)}
                        style={{
                          width: 80,
                          height: 38,
                          padding: "0 8px",
                          background: "var(--bg-app)",
                          border: "0.5px solid var(--border-2)",
                          borderRadius: "var(--radius-md)",
                          color: "var(--text-2)",
                          fontSize: 13,
                          flexShrink: 0,
                          appearance: "none",
                          cursor: "pointer",
                        }}
                      >
                        <option>+254</option>
                        <option>+256</option>
                        <option>+255</option>
                        <option>+234</option>
                        <option>+27</option>
                      </select>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="700 000 000"
                        style={{
                          flex: 1,
                          height: 38,
                          padding: "0 12px",
                          background: "var(--bg-app)",
                          border: `0.5px solid ${formErrors.phone ? "var(--red)" : "var(--border-2)"}`,
                          borderRadius: "var(--radius-md)",
                          color: "var(--text-1)",
                          fontSize: 13,
                        }}
                      />
                    </div>
                    {formErrors.phone && (
                      <div style={{ fontSize: 10, color: "var(--red-light)", marginTop: 2 }}>{formErrors.phone}</div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Alternative phone</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <select
                        value={formData.alt_phone_code}
                        onChange={(e) => handleInputChange("alt_phone_code", e.target.value)}
                        style={{
                          width: 80,
                          height: 38,
                          padding: "0 8px",
                          background: "var(--bg-app)",
                          border: "0.5px solid var(--border-2)",
                          borderRadius: "var(--radius-md)",
                          color: "var(--text-2)",
                          fontSize: 13,
                          flexShrink: 0,
                          appearance: "none",
                          cursor: "pointer",
                        }}
                      >
                        <option>+254</option>
                        <option>+256</option>
                      </select>
                      <input
                        type="tel"
                        value={formData.alt_phone}
                        onChange={(e) => handleInputChange("alt_phone", e.target.value)}
                        placeholder="700 000 000"
                        style={{
                          flex: 1,
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

                  <div style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: "span 2" }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>LinkedIn profile</label>
                    <div style={{ position: "relative" }}>
                      <i className="ti ti-brand-linkedin" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", fontSize: 14 }}></i>
                      <input
                        type="url"
                        value={formData.linkedin}
                        onChange={(e) => handleInputChange("linkedin", e.target.value)}
                        placeholder="linkedin.com/in/johnkamau"
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
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Preferred contact method</label>
                    <select
                      value={formData.preferred_contact}
                      onChange={(e) => handleInputChange("preferred_contact", e.target.value)}
                      style={{
                        width: "100%",
                        height: 38,
                        padding: "0 12px",
                        background: "var(--bg-app)",
                        border: "0.5px solid var(--border-2)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-1)",
                        fontSize: 13,
                        appearance: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option>Email</option>
                      <option>Phone call</option>
                      <option>WhatsApp</option>
                      <option>In-person meeting</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="section" style={{
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
                    <i className="ti ti-coin" style={{ color: "var(--amber-light)", fontSize: 15 }}></i>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Deal Information</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>What are you selling and how much is it worth</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                      Estimated value (KES) <span style={{ color: "var(--coral-light)" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--text-3)", fontWeight: 600, pointerEvents: "none" }}>KES</span>
                      <input
                        type="number"
                        value={formData.estimated_value}
                        onChange={(e) => handleInputChange("estimated_value", e.target.value)}
                        placeholder="0.00"
                        style={{
                          width: "100%",
                          height: 38,
                          padding: "0 12px 0 44px",
                          background: "var(--bg-app)",
                          border: `0.5px solid ${formErrors.estimated_value ? "var(--red)" : "var(--border-2)"}`,
                          borderRadius: "var(--radius-md)",
                          color: "var(--text-1)",
                          fontSize: 13,
                        }}
                      />
                    </div>
                    {formErrors.estimated_value && (
                      <div style={{ fontSize: 10, color: "var(--red-light)", marginTop: 2 }}>{formErrors.estimated_value}</div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Expected close date</label>
                    <div style={{ position: "relative" }}>
                      <i className="ti ti-calendar" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", fontSize: 14 }}></i>
                      <input
                        type="date"
                        value={formData.expected_close_date}
                        onChange={(e) => handleInputChange("expected_close_date", e.target.value)}
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
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Products / services of interest</label>
                    <div style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      background: "var(--bg-app)",
                      border: "0.5px solid var(--border-2)",
                      borderRadius: "var(--radius-md)",
                      padding: "6px 10px",
                      minHeight: 38,
                      alignItems: "center",
                    }}>
                      {formData.products.map((product) => (
                        <span key={product} style={{
                          background: "var(--purple-fill)",
                          color: "var(--purple-text)",
                          borderRadius: 20,
                          padding: "2px 8px",
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}>
                          {product}
                          <button
                            onClick={() => removeProduct(product)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "inherit",
                              cursor: "pointer",
                              fontSize: 12,
                              padding: 0,
                              lineHeight: 1,
                            }}
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        value={productInput}
                        onChange={(e) => setProductInput(e.target.value)}
                        onKeyDown={addProduct}
                        placeholder="Type and press Enter to add..."
                        style={{
                          border: "none",
                          background: "transparent",
                          flex: 1,
                          minWidth: 80,
                          height: "auto",
                          padding: 0,
                          fontSize: 12,
                          color: "var(--text-1)",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Decision maker?</label>
                    <select
                      value={formData.decision_maker}
                      onChange={(e) => handleInputChange("decision_maker", e.target.value)}
                      style={{
                        width: "100%",
                        height: 38,
                        padding: "0 12px",
                        background: "var(--bg-app)",
                        border: "0.5px solid var(--border-2)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-1)",
                        fontSize: 13,
                        appearance: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option>Yes - final decision maker</option>
                      <option>Influencer - recommends to board</option>
                      <option>User - end user only</option>
                      <option>Unknown</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Budget confirmed?</label>
                    <select
                      value={formData.budget_confirmed}
                      onChange={(e) => handleInputChange("budget_confirmed", e.target.value)}
                      style={{
                        width: "100%",
                        height: 38,
                        padding: "0 12px",
                        background: "var(--bg-app)",
                        border: "0.5px solid var(--border-2)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-1)",
                        fontSize: 13,
                        appearance: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option>Not yet confirmed</option>
                      <option>Budget approved</option>
                      <option>Budget pending approval</option>
                      <option>No budget allocated</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                      Lead source <span style={{ color: "var(--coral-light)" }}>*</span>
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
                      {leadSources.map((source) => (
                        <span
                          key={source}
                          onClick={() => toggleTag("lead_source", source)}
                          style={{
                            padding: "5px 12px",
                            borderRadius: 20,
                            fontSize: 11,
                            border: `0.5px solid ${formData.lead_source === source ? "var(--purple)" : "var(--border-2)"}`,
                            background: formData.lead_source === source ? "var(--purple-fill)" : "transparent",
                            color: formData.lead_source === source ? "var(--purple-text)" : "var(--text-3)",
                            cursor: "pointer",
                            transition: "all 0.12s",
                          }}
                          onMouseEnter={(e) => {
                            if (formData.lead_source !== source) e.currentTarget.style.borderColor = "var(--purple)";
                          }}
                          onMouseLeave={(e) => {
                            if (formData.lead_source !== source) e.currentTarget.style.borderColor = "var(--border-2)";
                          }}
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                    {formErrors.lead_source && (
                      <div style={{ fontSize: 10, color: "var(--red-light)", marginTop: 2 }}>{formErrors.lead_source}</div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Priority</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {["low", "medium", "high"].map((priority) => (
                        <button
                          key={priority}
                          onClick={() => setPriority(priority)}
                          style={{
                            flex: 1,
                            padding: "8px 0",
                            borderRadius: "var(--radius-md)",
                            border: `0.5px solid ${formData.priority === priority ? "var(--teal)" : "var(--border-2)"}`,
                            background: formData.priority === priority
                              ? priority === "low" ? "var(--teal-fill)" : priority === "medium" ? "var(--amber-fill)" : "var(--red-fill)"
                              : "transparent",
                            color: formData.priority === priority
                              ? priority === "low" ? "var(--teal-light)" : priority === "medium" ? "var(--amber-light)" : "var(--red-light)"
                              : "var(--text-3)",
                            cursor: "pointer",
                            fontSize: 11,
                            textAlign: "center",
                            transition: "all 0.12s",
                          }}
                        >
                          <i className={`ti ${priority === "low" ? "ti-arrow-down" : priority === "medium" ? "ti-minus" : "ti-arrow-up"}`} style={{ fontSize: 12, display: "block", marginBottom: 2 }}></i>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: "span 2" }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Pain points / challenges</label>
                    <textarea
                      value={formData.pain_points}
                      onChange={(e) => handleInputChange("pain_points", e.target.value)}
                      placeholder="What problems is this company trying to solve? What's their current pain?..."
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

                  <div style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: "span 2" }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      placeholder="Any additional context, call notes, or background information..."
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
            )}

            {currentStep === 4 && (
              <div className="section" style={{
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
                    <i className="ti ti-users" style={{ color: "var(--blue-light)", fontSize: 15 }}></i>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Assignment & Follow-up</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>Who owns this lead and what's the next action</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                      Assigned to <span style={{ color: "var(--coral-light)" }}>*</span>
                    </label>
                    <select
                      value={formData.assigned_to}
                      onChange={(e) => handleInputChange("assigned_to", e.target.value)}
                      style={{
                        width: "100%",
                        height: 38,
                        padding: "0 12px",
                        background: "var(--bg-app)",
                        border: `0.5px solid ${formErrors.assigned_to ? "var(--red)" : "var(--border-2)"}`,
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-1)",
                        fontSize: 13,
                        appearance: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="">Select assignee</option>
                      {clients.map((user) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                    {formErrors.assigned_to && (
                      <div style={{ fontSize: 10, color: "var(--red-light)", marginTop: 2 }}>{formErrors.assigned_to}</div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Follow-up date</label>
                    <div style={{ position: "relative" }}>
                      <i className="ti ti-calendar" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", fontSize: 14 }}></i>
                      <input
                        type="date"
                        value={formData.follow_up_date}
                        onChange={(e) => handleInputChange("follow_up_date", e.target.value)}
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
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Follow-up action</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
                      {followUpActions.map((action) => (
                        <span
                          key={action}
                          onClick={() => toggleTag("follow_up_action", action)}
                          style={{
                            padding: "5px 12px",
                            borderRadius: 20,
                            fontSize: 11,
                            border: `0.5px solid ${formData.follow_up_action === action ? "var(--purple)" : "var(--border-2)"}`,
                            background: formData.follow_up_action === action ? "var(--purple-fill)" : "transparent",
                            color: formData.follow_up_action === action ? "var(--purple-text)" : "var(--text-3)",
                            cursor: "pointer",
                            transition: "all 0.12s",
                          }}
                          onMouseEnter={(e) => {
                            if (formData.follow_up_action !== action) e.currentTarget.style.borderColor = "var(--purple)";
                          }}
                          onMouseLeave={(e) => {
                            if (formData.follow_up_action !== action) e.currentTarget.style.borderColor = "var(--border-2)";
                          }}
                        >
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: "span 2" }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Initial Stage</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4 }}>
                      {stages.map((stage) => (
                        <div
                          key={stage.key}
                          onClick={() => selectStage(stage.key)}
                          style={{
                            padding: "8px 10px",
                            borderRadius: "var(--radius-md)",
                            cursor: "pointer",
                            fontSize: 11,
                            textAlign: "center",
                            border: `0.5px solid ${formData.initial_stage === stage.key ? "var(--purple)" : "var(--border-2)"}`,
                            background: formData.initial_stage === stage.key ? "var(--purple-fill)" : "transparent",
                            color: formData.initial_stage === stage.key ? "var(--purple-text)" : "var(--text-3)",
                            transition: "all 0.12s",
                          }}
                          onMouseEnter={(e) => {
                            if (formData.initial_stage !== stage.key) e.currentTarget.style.borderColor = "var(--purple)";
                          }}
                          onMouseLeave={(e) => {
                            if (formData.initial_stage !== stage.key) e.currentTarget.style.borderColor = "var(--border-2)";
                          }}
                        >
                          <div style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: stage.color,
                            margin: "0 auto 4px auto",
                          }}></div>
                          {stage.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="section" style={{
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
                    <i className="ti ti-eye" style={{ color: "var(--teal-light)", fontSize: 15 }}></i>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Review Lead</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>Please review all details before creating the lead</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Company", value: formData.company_name || "-" },
                    { label: "Industry", value: formData.industry || "-" },
                    { label: "Contact", value: `${formData.first_name} ${formData.last_name}`.trim() || "-" },
                    { label: "Email", value: formData.work_email || "-" },
                    { label: "Phone", value: `${formData.phone_code}${formData.phone}` || "-" },
                    { label: "Job Title", value: formData.job_title || "-" },
                    { label: "Estimated Value", value: formData.estimated_value ? `KES ${parseFloat(formData.estimated_value).toLocaleString()}` : "-" },
                    { label: "Lead Source", value: formData.lead_source || "-" },
                    { label: "Priority", value: formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1) || "-" },
                    { label: "Initial Stage", value: stages.find(s => s.key === formData.initial_stage)?.label || "Lead" },
                    { label: "Assigned To", value: clients.find(c => c.id === parseInt(formData.assigned_to))?.name || "-" },
                    { label: "Follow-up Action", value: formData.follow_up_action || "-" },
                  ].map((item) => (
                    <div key={item.label} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "var(--bg-app)",
                      borderRadius: "var(--radius-md)",
                      fontSize: 12,
                    }}>
                      <span style={{ color: "var(--text-3)" }}>{item.label}</span>
                      <span style={{ color: "var(--text-1)", fontWeight: 500 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                <i className="ti ti-lock" style={{ fontSize: 13, color: "var(--text-4)" }}></i>
                All lead data is saved securely and only accessible to your team
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
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
                    <i className="ti ti-arrow-left"></i>Back
                  </button>
                )}
                {currentStep < totalSteps ? (
                  <button
                    onClick={nextStep}
                    style={{
                      height: 36,
                      padding: "0 20px",
                      borderRadius: "var(--radius-md)",
                      fontSize: 13,
                      border: "none",
                      background: "var(--purple-deep)",
                      color: "#EEEDFE",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    Next <i className="ti ti-arrow-right"></i>
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{
                      height: 36,
                      padding: "0 20px",
                      borderRadius: "var(--radius-md)",
                      fontSize: 13,
                      border: "none",
                      background: isSubmitting ? "var(--text-4)" : "var(--teal)",
                      color: "#fff",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      opacity: isSubmitting ? 0.6 : 1,
                    }}
                  >
                    {isSubmitting ? (
                      <><i className="ti ti-loader" style={{ animation: "spin 1s linear infinite" }}></i> Creating...</>
                    ) : (
                      <><i className="ti ti-plus"></i> Add lead to pipeline</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              padding: 16,
              border: "0.5px solid var(--border)",
            }}>
              <h3 style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 12, fontWeight: 600 }}>
                <i className="ti ti-eye" style={{ marginRight: 6, color: "var(--text-3)" }}></i>Lead summary
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "7px 0", borderBottom: "0.5px solid var(--border)", color: "var(--text-2)" }}>
                <span>Company</span>
                <span style={{ color: "var(--text-1)", fontWeight: 500 }}>{formData.company_name || "-"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "7px 0", borderBottom: "0.5px solid var(--border)", color: "var(--text-2)" }}>
                <span>Contact</span>
                <span style={{ color: "var(--text-1)", fontWeight: 500 }}>{`${formData.first_name} ${formData.last_name}`.trim() || "-"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "7px 0", borderBottom: "0.5px solid var(--border)", color: "var(--text-2)" }}>
                <span>Industry</span>
                <span style={{ color: "var(--text-1)", fontWeight: 500 }}>{formData.industry || "-"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "7px 0", borderBottom: "0.5px solid var(--border)", color: "var(--text-2)" }}>
                <span>Value</span>
                <span style={{ color: "var(--teal-light)", fontWeight: 500 }}>{formData.estimated_value ? `KES ${parseFloat(formData.estimated_value).toLocaleString()}` : "-"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "7px 0", borderBottom: "0.5px solid var(--border)", color: "var(--text-2)" }}>
                <span>Source</span>
                <span style={{ color: "var(--text-1)", fontWeight: 500 }}>{formData.lead_source || "-"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "7px 0", borderBottom: "0.5px solid var(--border)", color: "var(--text-2)" }}>
                <span>Priority</span>
                <span style={{
                  color: formData.priority === "low" ? "var(--teal-light)" : formData.priority === "medium" ? "var(--amber-light)" : "var(--red-light)",
                  fontWeight: 500,
                }}>
                  <i className={`ti ${formData.priority === "low" ? "ti-arrow-down" : formData.priority === "medium" ? "ti-minus" : "ti-arrow-up"}`} style={{ fontSize: 11 }}></i>
                  {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "7px 0", color: "var(--text-2)" }}>
                <span>Assigned to</span>
                <span style={{ color: "var(--text-1)", fontWeight: 500 }}>
                  {clients.find(c => c.id === parseInt(formData.assigned_to))?.name || "-"}
                </span>
              </div>
            </div>

            <div style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              padding: 16,
              border: "0.5px solid var(--border)",
            }}>
              <h3 style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 12, fontWeight: 600 }}>
                <i className="ti ti-checklist" style={{ marginRight: 6, color: "var(--text-3)" }}></i>Completion checklist
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Company name added", done: !!formData.company_name },
                  { label: "Industry selected", done: !!formData.industry },
                  { label: "Contact name added", done: !!(formData.first_name && formData.last_name) },
                  { label: "Email address added", done: !!formData.work_email },
                  { label: "Phone number added", done: !!formData.phone },
                  { label: "Estimated value set", done: !!formData.estimated_value },
                  { label: "Lead source selected", done: !!formData.lead_source },
                  { label: "Follow-up date set", done: !!formData.follow_up_date },
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
                  <span>Profile completeness</span>
                  <span style={{ color: completeness >= 70 ? "var(--teal-light)" : "var(--amber-light)" }}>{completeness}%</span>
                </div>
                <div style={{
                  height: 5,
                  background: "var(--border)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${completeness}%`,
                    background: completeness >= 70 ? "var(--teal)" : "var(--amber-light)",
                    borderRadius: 3,
                    transition: "width 0.3s",
                  }}></div>
                </div>
              </div>
            </div>

            <div style={{
              background: "var(--purple-fill)",
              borderRadius: "var(--radius-lg)",
              padding: 16,
              border: "0.5px solid var(--purple-deep)",
            }}>
              <div style={{ fontSize: 12, color: "var(--purple-text)", fontWeight: 600, marginBottom: 8 }}>
                <i className="ti ti-bulb" style={{ marginRight: 6 }}></i>Tips for a strong lead
              </div>
              <div style={{ fontSize: 11, color: "rgba(206,203,246,0.7)", lineHeight: 1.6 }}>
                • Add a follow-up date to stay on top of this lead<br />
                • Note the decision maker's budget authority<br />
                • Record their specific pain points to personalise your pitch<br />
                • Set a realistic estimated value - this affects pipeline reports
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}