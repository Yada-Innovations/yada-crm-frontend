"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { Topbar } from "./Topbar";
import { Spinner } from "./Spinner";

const ROLES = ["admin", "sales_agent", "support_agent"];

const ROLE_META: Record<string, { icon: string; color: string; bg: string }> = {
  admin: { icon: "ti-crown", color: "var(--amber-light)", bg: "var(--amber-fill)" },
  sales_agent: { icon: "ti-briefcase", color: "#AFA9EC", bg: "var(--purple-fill)" },
  support_agent: { icon: "ti-headset", color: "var(--blue-light)", bg: "rgba(133,183,235,0.12)" },
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    "leads.view", "leads.create", "leads.edit", "leads.delete",
    "quotes.view", "quotes.create", "quotes.edit", "quotes.delete",
    "clients.view", "clients.create", "clients.edit", "clients.delete",
    "subscriptions.view", "subscriptions.create", "subscriptions.edit", "subscriptions.delete",
    "tickets.view", "tickets.create", "tickets.edit", "tickets.delete",
    "feature_requests.view", "feature_requests.create", "feature_requests.edit", "feature_requests.delete",
    "invoices.view", "invoices.create", "invoices.edit", "invoices.delete",
    "users.view", "users.create", "users.edit", "users.delete",
    "analytics.view"
  ],
  sales_agent: [
    "leads.view", "leads.create", "leads.edit",
    "quotes.view", "quotes.create",
    "clients.view", "clients.create", "clients.edit",
    "subscriptions.view", "analytics.view"
  ],
  support_agent: [
    "tickets.view", "tickets.create", "tickets.edit",
    "feature_requests.view", "feature_requests.create",
    "clients.view"
  ],
};

type ModalMode = "view" | "edit" | "create" | "delete" | null;

export function ScreenUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [form, setForm] = useState({
    // Personal Information
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "sales_agent",
    // Profile Details
    phone: "",
    department: "",
    position: "",
    employee_id: "",
    hire_date: "",
    // Address
    address: "",
    city: "",
    state: "",
    country: "Kenya",
    // Emergency Contact
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relation: "",
    // Account Settings
    status: "active",
    email_verified: false,
    timezone: "Africa/Nairobi",
    language: "en",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(0);

  function load() {
    setLoading(true);
    apiGet('/admin/users').then(data => {
      setUsers(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, []);

  function closeModal() {
    setModal(null);
    setSelected(null);
    setSearch("");
    setFilterRole("all");
    setFormError("");
    load();
  }

  // Calculate profile completion
  const calculateCompletion = () => {
    const fields = [
      form.name,
      form.email,
      form.phone,
      form.department,
      form.position,
      form.address,
      form.city,
      form.country,
      form.emergency_contact_name,
      form.emergency_contact_phone,
    ];
    const filled = fields.filter(f => f && f.toString().trim()).length;
    return Math.round((filled / fields.length) * 100);
  };

  useEffect(() => {
    setProfileCompletion(calculateCompletion());
  }, [form]);

  const filtered = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
                        u.email?.toLowerCase().includes(search.toLowerCase()) ||
                        u.employee_id?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.roles?.[0]?.name === filterRole;
    return matchSearch && matchRole;
  });

  const stats = [
    { label: "Total users", value: users.length, color: "var(--purple)" },
    { label: "Admins", value: users.filter(u => u.roles?.[0]?.name === "admin").length, color: "var(--amber-light)" },
    { label: "Sales agents", value: users.filter(u => u.roles?.[0]?.name === "sales_agent").length, color: "#AFA9EC" },
    { label: "Support agents", value: users.filter(u => u.roles?.[0]?.name === "support_agent").length, color: "var(--blue-light)" },
  ];

  async function handleCreate() {
    if (!form.name || !form.email || !form.password) {
      setFormError("Name, email and password are required.");
      return;
    }
    if (form.password !== form.password_confirmation) {
      setFormError("Passwords do not match.");
      return;
    }
    setFormLoading(true);
    setFormError("");
    try {
      const res = await apiPost("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
        role: form.role,
        phone: form.phone,
        department: form.department,
        position: form.position,
        employee_id: form.employee_id,
        hire_date: form.hire_date,
        address: form.address,
        city: form.city,
        state: form.state,
        country: form.country,
        emergency_contact_name: form.emergency_contact_name,
        emergency_contact_phone: form.emergency_contact_phone,
        emergency_contact_relation: form.emergency_contact_relation,
        status: form.status,
        timezone: form.timezone,
        language: form.language,
      });

      if (res.token) {
        setForm({
          name: "",
          email: "",
          password: "",
          password_confirmation: "",
          role: "sales_agent",
          phone: "",
          department: "",
          position: "",
          employee_id: "",
          hire_date: "",
          address: "",
          city: "",
          state: "",
          country: "Kenya",
          emergency_contact_name: "",
          emergency_contact_phone: "",
          emergency_contact_relation: "",
          status: "active",
          email_verified: false,
          timezone: "Africa/Nairobi",
          language: "en",
        });
        closeModal();
      } else {
        setFormError(res.message || "Registration failed.");
      }
    } catch {
      setFormError("Could not connect to server.");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleUpdate() {
    if (!form.name || !form.email) {
      setFormError("Name and email are required.");
      return;
    }
    setFormLoading(true);
    setFormError("");
    try {
      const data: any = {
        name: form.name,
        email: form.email,
        role: form.role,
        phone: form.phone,
        department: form.department,
        position: form.position,
        employee_id: form.employee_id,
        hire_date: form.hire_date,
        address: form.address,
        city: form.city,
        state: form.state,
        country: form.country,
        emergency_contact_name: form.emergency_contact_name,
        emergency_contact_phone: form.emergency_contact_phone,
        emergency_contact_relation: form.emergency_contact_relation,
        status: form.status,
        timezone: form.timezone,
        language: form.language,
      };

      if (form.password) {
        if (form.password !== form.password_confirmation) {
          setFormError("Passwords do not match.");
          setFormLoading(false);
          return;
        }
        data.password = form.password;
        data.password_confirmation = form.password_confirmation;
      }

      const res = await apiPatch(`/admin/users/${selected.id}`, data);
      if (res.id || res.message) {
        closeModal();
      } else {
        setFormError(res.message || "Failed to update user.");
      }
    } catch {
      setFormError("Could not connect to server.");
    } finally {
      setFormLoading(false);
    }
  }

  function openEdit(user: any) {
    const roleName = user.roles?.[0]?.name || "sales_agent";
    setSelected(user);
    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      password_confirmation: "",
      role: roleName,
      phone: user.phone || "",
      department: user.department || "",
      position: user.position || "",
      employee_id: user.employee_id || "",
      hire_date: user.hire_date || "",
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      country: user.country || "Kenya",
      emergency_contact_name: user.emergency_contact_name || "",
      emergency_contact_phone: user.emergency_contact_phone || "",
      emergency_contact_relation: user.emergency_contact_relation || "",
      status: user.status || "active",
      email_verified: user.email_verified_at ? true : false,
      timezone: user.timezone || "Africa/Nairobi",
      language: user.language || "en",
    });
    setModal("edit");
    setFormError("");
  }

  function openCreate() {
    setForm({
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
      role: "sales_agent",
      phone: "",
      department: "",
      position: "",
      employee_id: "",
      hire_date: "",
      address: "",
      city: "",
      state: "",
      country: "Kenya",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      emergency_contact_relation: "",
      status: "active",
      email_verified: false,
      timezone: "Africa/Nairobi",
      language: "en",
    });
    setModal("create");
    setFormError("");
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      active: "var(--teal-light)",
      inactive: "var(--text-3)",
      suspended: "var(--amber-light)",
      terminated: "var(--red-light)",
    };
    return colors[status] || "var(--text-3)";
  }

  function getStatusBg(status: string) {
    const colors: Record<string, string> = {
      active: "var(--teal-fill)",
      inactive: "var(--bg-pill)",
      suspended: "var(--amber-fill)",
      terminated: "var(--red-fill)",
    };
    return colors[status] || "var(--bg-pill)";
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <Topbar title="User Management">
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="ti ti-plus"></i>Add user
        </button>
      </Topbar>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 14 }}>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 600, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <i className="ti ti-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", fontSize: 14 }}></i>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or employee ID..."
            style={{
              width: "100%", height: 36, background: "var(--bg-card)",
              border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)",
              padding: "0 12px 0 32px", fontSize: 13, color: "var(--text-1)",
            }}
          />
        </div>
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          style={{
            height: 36, background: "var(--bg-card)", border: "0.5px solid var(--border-2)",
            borderRadius: "var(--radius-md)", padding: "0 12px", fontSize: 13,
            color: "var(--text-1)", cursor: "pointer",
          }}>
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="sales_agent">Sales Agent</option>
          <option value="support_agent">Support Agent</option>
        </select>
      </div>

      {/* Users table */}
      <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 140px 120px 100px", gap: 14, background: "#0F0F0F", padding: "12px 18px", fontSize: 11, color: "var(--text-3)" }}>
          <span>Name</span><span>Email</span><span>Role</span><span>Joined</span><span style={{ textAlign: "right" }}>Actions</span>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: 24, fontSize: 13, color: "var(--text-4)", textAlign: "center" }}>
            No users found
          </div>
        )}

        {filtered.map((u, i) => {
          const roleName = u.roles?.[0]?.name ?? "no role";
          const meta = ROLE_META[roleName];
          const isAdmin = roleName === "admin";
          return (
            <div key={u.id} style={{
              display: "grid", gridTemplateColumns: "1fr 180px 140px 120px 100px",
              gap: 14, alignItems: "center", padding: "13px 18px",
              borderTop: "0.5px solid var(--border)",
              background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg-app)",
            }}>
              {/* Avatar + name */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: meta?.bg ?? "var(--bg-pill)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 600, color: meta?.color ?? "var(--text-2)", flexShrink: 0,
                }}>
                  {u.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</span>
                  {u.employee_id && (
                    <div style={{ fontSize: 9, color: "var(--text-4)" }}>ID: {u.employee_id}</div>
                  )}
                </div>
              </div>

              {/* Email */}
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>{u.email}</span>

              {/* Role badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {meta && <i className={`ti ${meta.icon}`} style={{ color: meta.color, fontSize: 13 }}></i>}
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: meta?.bg ?? "var(--bg-pill)", color: meta?.color ?? "var(--text-2)" }}>
                  {roleName.replace(/_/g, " ")}
                </span>
              </div>

              {/* Joined date */}
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                {new Date(u.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
              </span>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button
                  onClick={() => { setSelected(u); setModal("view"); }}
                  title="View user"
                  style={{ width: 28, height: 28, borderRadius: 6, border: "0.5px solid var(--border-2)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}>
                  <i className="ti ti-eye" style={{ fontSize: 13 }}></i>
                </button>
                <button
                  onClick={() => openEdit(u)}
                  title="Edit user"
                  style={{ width: 28, height: 28, borderRadius: 6, border: "0.5px solid var(--border-2)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue-light)" }}>
                  <i className="ti ti-edit" style={{ fontSize: 13 }}></i>
                </button>
                {!isAdmin && (
                  <button
                    onClick={() => { setSelected(u); setModal("delete"); }}
                    title="Delete user"
                    style={{ width: 28, height: 28, borderRadius: 6, border: "0.5px solid var(--red)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red-light)" }}>
                    <i className="ti ti-trash" style={{ fontSize: 13 }}></i>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── VIEW USER MODAL ── */}
      {modal === "view" && selected && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100
        }}>
          <div style={{
            background: "var(--bg-panel)", borderRadius: "var(--radius-lg)",
            width: 580, maxHeight: "90vh", display: "flex", flexDirection: "column",
            border: "0.5px solid var(--border)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "0.5px solid var(--border)", flexShrink: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>User Details</span>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 22, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ overflowY: "auto", padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, padding: 16, background: "var(--bg-app)", borderRadius: "var(--radius-lg)" }}>
                <div style={{
                  width: 60, height: 60, borderRadius: "50%",
                  background: ROLE_META[selected.roles?.[0]?.name]?.bg ?? "var(--bg-pill)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, fontWeight: 700, color: ROLE_META[selected.roles?.[0]?.name]?.color ?? "var(--text-2)",
                  flexShrink: 0,
                }}>
                  {selected.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600 }}>{selected.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>{selected.email}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                    <i className={`ti ${ROLE_META[selected.roles?.[0]?.name]?.icon ?? "ti-user"}`} style={{ color: ROLE_META[selected.roles?.[0]?.name]?.color, fontSize: 13 }}></i>
                    <span style={{ fontSize: 12, color: ROLE_META[selected.roles?.[0]?.name]?.color }}>
                      {selected.roles?.[0]?.name?.replace(/_/g, " ") ?? "No role"}
                    </span>
                    <span style={{
                      fontSize: 10,
                      padding: "2px 10px",
                      borderRadius: 12,
                      background: getStatusBg(selected.status || "active"),
                      color: getStatusColor(selected.status || "active"),
                      marginLeft: 6,
                    }}>
                      {selected.status || "Active"}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {/* Personal Info */}
                <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-md)", padding: 12 }}>
                  <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Personal Information</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "0.5px solid var(--border)" }}>
                    <span style={{ color: "var(--text-3)" }}>Employee ID</span>
                    <span>{selected.employee_id || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "0.5px solid var(--border)" }}>
                    <span style={{ color: "var(--text-3)" }}>Department</span>
                    <span>{selected.department || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
                    <span style={{ color: "var(--text-3)" }}>Position</span>
                    <span>{selected.position || "—"}</span>
                  </div>
                </div>

                {/* Contact Info */}
                <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-md)", padding: 12 }}>
                  <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Contact Information</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "0.5px solid var(--border)" }}>
                    <span style={{ color: "var(--text-3)" }}>Phone</span>
                    <span>{selected.phone || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "0.5px solid var(--border)" }}>
                    <span style={{ color: "var(--text-3)" }}>Email Verified</span>
                    <span style={{ color: selected.email_verified_at ? "var(--teal-light)" : "var(--amber-light)" }}>
                      {selected.email_verified_at ? "Yes" : "No"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
                    <span style={{ color: "var(--text-3)" }}>Timezone</span>
                    <span>{selected.timezone || "Africa/Nairobi"}</span>
                  </div>
                </div>

                {/* Location */}
                <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-md)", padding: 12 }}>
                  <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Location</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "0.5px solid var(--border)" }}>
                    <span style={{ color: "var(--text-3)" }}>Address</span>
                    <span style={{ textAlign: "right" }}>{selected.address || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "0.5px solid var(--border)" }}>
                    <span style={{ color: "var(--text-3)" }}>City</span>
                    <span>{selected.city || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
                    <span style={{ color: "var(--text-3)" }}>Country</span>
                    <span>{selected.country || "Kenya"}</span>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-md)", padding: 12 }}>
                  <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Emergency Contact</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "0.5px solid var(--border)" }}>
                    <span style={{ color: "var(--text-3)" }}>Name</span>
                    <span>{selected.emergency_contact_name || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "0.5px solid var(--border)" }}>
                    <span style={{ color: "var(--text-3)" }}>Phone</span>
                    <span>{selected.emergency_contact_phone || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
                    <span style={{ color: "var(--text-3)" }}>Relation</span>
                    <span>{selected.emergency_contact_relation || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div style={{ marginTop: 12, background: "var(--bg-card)", borderRadius: "var(--radius-md)", padding: 12 }}>
                <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Account Information</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "0.5px solid var(--border)" }}>
                    <span style={{ color: "var(--text-3)" }}>User ID</span>
                    <span style={{ fontSize: 11, color: "var(--text-4)" }}>{selected.id}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "0.5px solid var(--border)" }}>
                    <span style={{ color: "var(--text-3)" }}>Joined</span>
                    <span>{new Date(selected.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
                    <span style={{ color: "var(--text-3)" }}>Permissions</span>
                    <span style={{ color: "var(--purple)" }}>
                      {(ROLE_PERMISSIONS as any)[selected.roles?.[0]?.name]?.length || 0} permissions
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <button className="btn" onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE USER MODAL ── */}
      {modal === "create" && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100
        }}>
          <div style={{
            background: "var(--bg-panel)", borderRadius: "var(--radius-lg)",
            width: 620, maxHeight: "90vh", display: "flex", flexDirection: "column",
            border: "0.5px solid var(--border)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "0.5px solid var(--border)", flexShrink: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Add New User</span>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 22, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ overflowY: "auto", padding: 20 }}>
              <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {formError && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--red-fill)", border: "0.5px solid var(--red)", borderRadius: "var(--radius-md)", padding: "9px 12px", fontSize: 12, color: "var(--red-light)" }}>
                      <i className="ti ti-alert-circle"></i>{formError}
                    </div>
                  )}

                  {/* Profile Completion */}
                  <div style={{ background: "var(--bg-app)", borderRadius: "var(--radius-md)", padding: "10px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>
                      <span>Profile completeness</span>
                      <span style={{ color: profileCompletion >= 70 ? "var(--teal-light)" : "var(--amber-light)" }}>{profileCompletion}%</span>
                    </div>
                    <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${profileCompletion}%`, background: profileCompletion >= 70 ? "var(--teal)" : "var(--amber-light)", borderRadius: 2, transition: "width 0.3s" }}></div>
                    </div>
                  </div>

                  {/* ── Section: Personal Information ── */}
                  <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 16, border: "0.5px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-user" style={{ color: "var(--purple)", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>Personal Information</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Full Name *</label>
                        <input
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          placeholder="John Doe"
                          style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Email *</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          placeholder="john@company.com"
                          style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                        />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Phone</label>
                        <input
                          value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                          placeholder="+254 700 000000"
                          style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Employee ID</label>
                        <input
                          value={form.employee_id}
                          onChange={e => setForm({ ...form, employee_id: e.target.value })}
                          placeholder="EMP-001"
                          style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                        />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Department</label>
                        <input
                          value={form.department}
                          onChange={e => setForm({ ...form, department: e.target.value })}
                          placeholder="Engineering"
                          style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Position</label>
                        <input
                          value={form.position}
                          onChange={e => setForm({ ...form, position: e.target.value })}
                          placeholder="Software Engineer"
                          style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Hire Date</label>
                      <input
                        type="date"
                        value={form.hire_date}
                        onChange={e => setForm({ ...form, hire_date: e.target.value })}
                        style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                      />
                    </div>
                  </div>

                  {/* ── Section: Address ── */}
                  <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 16, border: "0.5px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-map-pin" style={{ color: "var(--blue-light)", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>Address</span>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Address</label>
                      <input
                        value={form.address}
                        onChange={e => setForm({ ...form, address: e.target.value })}
                        placeholder="123 Main Street"
                        style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>City</label>
                        <input
                          value={form.city}
                          onChange={e => setForm({ ...form, city: e.target.value })}
                          placeholder="Nairobi"
                          style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>State/Province</label>
                        <input
                          value={form.state}
                          onChange={e => setForm({ ...form, state: e.target.value })}
                          placeholder="Nairobi County"
                          style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Country</label>
                      <select
                        value={form.country}
                        onChange={e => setForm({ ...form, country: e.target.value })}
                        style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                      >
                        <option value="Kenya">Kenya</option>
                        <option value="Uganda">Uganda</option>
                        <option value="Tanzania">Tanzania</option>
                        <option value="Rwanda">Rwanda</option>
                        <option value="Ethiopia">Ethiopia</option>
                        <option value="South Africa">South Africa</option>
                        <option value="Nigeria">Nigeria</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* ── Section: Emergency Contact ── */}
                  <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 16, border: "0.5px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-phone" style={{ color: "var(--coral-light)", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>Emergency Contact</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Contact Name</label>
                        <input
                          value={form.emergency_contact_name}
                          onChange={e => setForm({ ...form, emergency_contact_name: e.target.value })}
                          placeholder="Jane Doe"
                          style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Contact Phone</label>
                        <input
                          value={form.emergency_contact_phone}
                          onChange={e => setForm({ ...form, emergency_contact_phone: e.target.value })}
                          placeholder="+254 700 000000"
                          style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Relationship</label>
                      <input
                        value={form.emergency_contact_relation}
                        onChange={e => setForm({ ...form, emergency_contact_relation: e.target.value })}
                        placeholder="Spouse, Parent, Sibling, etc."
                        style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                      />
                    </div>
                  </div>

                  {/* ── Section: Account Settings ── */}
                  <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 16, border: "0.5px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-settings" style={{ color: "var(--amber-light)", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>Account Settings</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Role *</label>
                        <select
                          value={form.role}
                          onChange={e => setForm({ ...form, role: e.target.value })}
                          style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                        >
                          {ROLES.map(r => (
                            <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Status</label>
                        <select
                          value={form.status}
                          onChange={e => setForm({ ...form, status: e.target.value })}
                          style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                          <option value="terminated">Terminated</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Timezone</label>
                        <select
                          value={form.timezone}
                          onChange={e => setForm({ ...form, timezone: e.target.value })}
                          style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                        >
                          <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                          <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                          <option value="Africa/Cairo">Africa/Cairo (EET)</option>
                          <option value="America/New_York">America/New_York (EST)</option>
                          <option value="Europe/London">Europe/London (GMT)</option>
                          <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Language</label>
                        <select
                          value={form.language}
                          onChange={e => setForm({ ...form, language: e.target.value })}
                          style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                        >
                          <option value="en">English</option>
                          <option value="sw">Swahili</option>
                          <option value="fr">French</option>
                          <option value="ar">Arabic</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* ── Section: Password ── */}
                  <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 16, border: "0.5px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <i className="ti ti-lock" style={{ color: "var(--red-light)", fontSize: 16 }}></i>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>Password</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Password *</label>
                        <input
                          type="password"
                          value={form.password}
                          onChange={e => setForm({ ...form, password: e.target.value })}
                          placeholder="Min 8 characters"
                          style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Confirm Password *</label>
                        <input
                          type="password"
                          value={form.password_confirmation}
                          onChange={e => setForm({ ...form, password_confirmation: e.target.value })}
                          placeholder="Confirm password"
                          style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                  <button className="btn" onClick={closeModal} disabled={formLoading}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleCreate} disabled={formLoading}>
                    {formLoading ? <><i className="ti ti-loader" style={{ animation: "spin 1s linear infinite" }}></i> Creating...</> : <><i className="ti ti-plus"></i> Create user</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT USER MODAL ── */}
      {modal === "edit" && selected && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100
        }}>
          <div style={{
            background: "var(--bg-panel)", borderRadius: "var(--radius-lg)",
            width: 620, maxHeight: "90vh", display: "flex", flexDirection: "column",
            border: "0.5px solid var(--border)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "0.5px solid var(--border)", flexShrink: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Edit User - {selected.name}</span>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 22, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ overflowY: "auto", padding: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {formError && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--red-fill)", border: "0.5px solid var(--red)", borderRadius: "var(--radius-md)", padding: "9px 12px", fontSize: 12, color: "var(--red-light)" }}>
                    <i className="ti ti-alert-circle"></i>{formError}
                  </div>
                )}

                {/* Personal Information */}
                <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 16, border: "0.5px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <i className="ti ti-user" style={{ color: "var(--purple)", fontSize: 16 }}></i>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>Personal Information</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Full Name *</label>
                      <input
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Email *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                    <div>
                      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Phone</label>
                      <input
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Employee ID</label>
                      <input
                        value={form.employee_id}
                        onChange={e => setForm({ ...form, employee_id: e.target.value })}
                        style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                    <div>
                      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Department</label>
                      <input
                        value={form.department}
                        onChange={e => setForm({ ...form, department: e.target.value })}
                        style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Position</label>
                      <input
                        value={form.position}
                        onChange={e => setForm({ ...form, position: e.target.value })}
                        style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Hire Date</label>
                    <input
                      type="date"
                      value={form.hire_date}
                      onChange={e => setForm({ ...form, hire_date: e.target.value })}
                      style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                    />
                  </div>
                </div>

                {/* Address */}
                <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 16, border: "0.5px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <i className="ti ti-map-pin" style={{ color: "var(--blue-light)", fontSize: 16 }}></i>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>Address</span>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Address</label>
                    <input
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                    <div>
                      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>City</label>
                      <input
                        value={form.city}
                        onChange={e => setForm({ ...form, city: e.target.value })}
                        style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>State/Province</label>
                      <input
                        value={form.state}
                        onChange={e => setForm({ ...form, state: e.target.value })}
                        style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Country</label>
                    <select
                      value={form.country}
                      onChange={e => setForm({ ...form, country: e.target.value })}
                      style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                    >
                      <option value="Kenya">Kenya</option>
                      <option value="Uganda">Uganda</option>
                      <option value="Tanzania">Tanzania</option>
                      <option value="Rwanda">Rwanda</option>
                      <option value="Ethiopia">Ethiopia</option>
                      <option value="South Africa">South Africa</option>
                      <option value="Nigeria">Nigeria</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 16, border: "0.5px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <i className="ti ti-phone" style={{ color: "var(--coral-light)", fontSize: 16 }}></i>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>Emergency Contact</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Contact Name</label>
                      <input
                        value={form.emergency_contact_name}
                        onChange={e => setForm({ ...form, emergency_contact_name: e.target.value })}
                        style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Contact Phone</label>
                      <input
                        value={form.emergency_contact_phone}
                        onChange={e => setForm({ ...form, emergency_contact_phone: e.target.value })}
                        style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Relationship</label>
                    <input
                      value={form.emergency_contact_relation}
                      onChange={e => setForm({ ...form, emergency_contact_relation: e.target.value })}
                      style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                    />
                  </div>
                </div>

                {/* Account Settings */}
                <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 16, border: "0.5px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <i className="ti ti-settings" style={{ color: "var(--amber-light)", fontSize: 16 }}></i>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>Account Settings</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Role *</label>
                      <select
                        value={form.role}
                        onChange={e => setForm({ ...form, role: e.target.value })}
                        style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Status</label>
                      <select
                        value={form.status}
                        onChange={e => setForm({ ...form, status: e.target.value })}
                        style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                        <option value="terminated">Terminated</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                    <div>
                      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Timezone</label>
                      <select
                        value={form.timezone}
                        onChange={e => setForm({ ...form, timezone: e.target.value })}
                        style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                      >
                        <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                        <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                        <option value="Africa/Cairo">Africa/Cairo (EET)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Language</label>
                      <select
                        value={form.language}
                        onChange={e => setForm({ ...form, language: e.target.value })}
                        style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                      >
                        <option value="en">English</option>
                        <option value="sw">Swahili</option>
                        <option value="fr">French</option>
                        <option value="ar">Arabic</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Password (optional) */}
                <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 16, border: "0.5px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <i className="ti ti-lock" style={{ color: "var(--red-light)", fontSize: 16 }}></i>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>Change Password (optional)</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>New Password</label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        placeholder="Leave blank to keep current"
                        style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Confirm Password</label>
                      <input
                        type="password"
                        value={form.password_confirmation}
                        onChange={e => setForm({ ...form, password_confirmation: e.target.value })}
                        placeholder="Confirm new password"
                        style={{ width: "100%", height: 34, background: "var(--bg-app)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 10px", fontSize: 13, color: "var(--text-1)" }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                  <button className="btn" onClick={closeModal} disabled={formLoading}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleUpdate} disabled={formLoading}>
                    {formLoading ? <><i className="ti ti-loader" style={{ animation: "spin 1s linear infinite" }}></i> Updating...</> : <><i className="ti ti-check"></i> Update user</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {modal === "delete" && selected && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200
        }}>
          <div style={{ background: "var(--bg-panel)", borderRadius: "var(--radius-lg)", padding: 24, width: 400, border: "0.5px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--red-fill)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="ti ti-trash" style={{ color: "var(--red-light)", fontSize: 18 }}></i>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Delete user</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>This action cannot be undone</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20 }}>
              Are you sure you want to delete <strong>{selected.name}</strong>? They will immediately lose access to YADA CRM.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn" onClick={closeModal}>Cancel</button>
              <button
                onClick={async () => {
                  try {
                    await apiDelete(`/admin/users/${selected.id}`);
                    closeModal();
                  } catch {
                    alert("Failed to delete user.");
                  }
                }}
                style={{ padding: "7px 16px", borderRadius: "var(--radius-md)", border: "none", background: "var(--red)", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <i className="ti ti-trash"></i>Delete user
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}