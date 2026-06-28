"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Topbar } from "./Topbar";
import { Spinner } from "./Spinner";

const ROLES = ["admin", "sales_agent", "support_agent"];

const ROLE_META: Record<string, { icon: string; color: string; bg: string }> = {
  admin:         { icon: "ti-crown",    color: "var(--amber-light)", bg: "var(--amber-fill)" },
  sales_agent:   { icon: "ti-briefcase",color: "#AFA9EC",            bg: "var(--purple-fill)" },
  support_agent: { icon: "ti-headset", color: "var(--blue-light)",  bg: "rgba(133,183,235,0.12)" },
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["leads.view","leads.create","leads.edit","leads.delete","quotes.view","quotes.create","quotes.edit","quotes.delete","clients.view","clients.create","clients.edit","clients.delete","subscriptions.view","subscriptions.create","subscriptions.edit","subscriptions.delete","tickets.view","tickets.create","tickets.edit","tickets.delete","feature_requests.view","feature_requests.create","feature_requests.edit","feature_requests.delete","invoices.view","invoices.create","invoices.edit","invoices.delete","users.view","users.create","users.edit","users.delete","analytics.view"],
  sales_agent: ["leads.view","leads.create","leads.edit","quotes.view","quotes.create","clients.view","clients.create","clients.edit","subscriptions.view","analytics.view"],
  support_agent: ["tickets.view","tickets.create","tickets.edit","feature_requests.view","feature_requests.create","clients.view"],
};

type ModalMode = "view" | "edit" | "create" | "delete" | null;

export function ScreenUsers() {
  const [users, setUsers]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<ModalMode>(null);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch]     = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [form, setForm]         = useState({ name: "", email: "", password: "", role: "sales_agent" });
  const [formError, setFormError]   = useState("");
  const [formLoading, setFormLoading] = useState(false);

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
    load();
  }

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = filterRole === "all" || u.roles?.[0]?.name === filterRole;
    return matchSearch && matchRole;
  });

  const stats = [
    { label: "Total users",    value: users.length,                                                           color: "var(--purple)" },
    { label: "Admins",         value: users.filter(u => u.roles?.[0]?.name === "admin").length,               color: "var(--amber-light)" },
    { label: "Sales agents",   value: users.filter(u => u.roles?.[0]?.name === "sales_agent").length,         color: "#AFA9EC" },
    { label: "Support agents", value: users.filter(u => u.roles?.[0]?.name === "support_agent").length,       color: "var(--blue-light)" },
  ];

  async function handleCreate() {
    if (!form.name || !form.email || !form.password) {
      setFormError("All fields are required.");
      return;
    }
    setFormLoading(true);
    setFormError("");
    try {
      const { apiPost } = await import("@/lib/api");
      const res = await apiPost("/auth/register", {
        name:                  form.name,
        email:                 form.email,
        password:              form.password,
        password_confirmation: form.password,
        role:                  form.role,
      });
      if (res.token) {
        setForm({ name: "", email: "", password: "", role: "sales_agent" });
        closeModal();
      } else {
        setFormError(res.message ?? "Registration failed.");
      }
    } catch {
      setFormError("Could not connect to server.");
    } finally {
      setFormLoading(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <Topbar title="User Management">
        <button className="btn btn-primary" onClick={() => {
          setFormError("");
          setForm({ name: "", email: "", password: "", role: "sales_agent" });
          setModal("create");
        }}>
          <i className="ti ti-plus"></i>Add user
        </button>
      </Topbar>

      {/* Stats */}
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
            placeholder="Search by name or email..."
            style={{ width: "100%", height: 36, background: "var(--bg-card)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 12px 0 32px", fontSize: 13, color: "var(--text-1)" }}
          />
        </div>
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          style={{ height: 36, background: "var(--bg-card)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 12px", fontSize: 13, color: "var(--text-1)", cursor: "pointer" }}>
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="sales_agent">Sales Agent</option>
          <option value="support_agent">Support Agent</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px 160px 120px 100px", gap: 14, background: "#0F0F0F", padding: "12px 18px", fontSize: 11, color: "var(--text-3)" }}>
          <span>Name</span><span>Email</span><span>Role</span><span>Joined</span><span style={{ textAlign: "right" }}>Actions</span>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: 24, fontSize: 13, color: "var(--text-4)", textAlign: "center" }}>No users found</div>
        )}

        {filtered.map((u, i) => {
          const roleName = u.roles?.[0]?.name ?? "no role";
          const meta     = ROLE_META[roleName];
          const isAdmin  = roleName === "admin";
          return (
            <div key={u.id} style={{
              display: "grid", gridTemplateColumns: "1fr 200px 160px 120px 100px",
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
                  {u.name[0].toUpperCase()}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</span>
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

              {/* Joined */}
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                {new Date(u.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
              </span>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                {/* View */}
                <button
                  onClick={() => { setSelected(u); setModal("view"); }}
                  title="View user"
                  style={{ width: 28, height: 28, borderRadius: 6, border: "0.5px solid var(--border-2)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}>
                  <i className="ti ti-eye" style={{ fontSize: 13 }}></i>
                </button>

                {/* Edit */}
                <button
                  onClick={() => { setSelected(u); setModal("edit"); }}
                  title="Edit user"
                  style={{ width: 28, height: 28, borderRadius: 6, border: "0.5px solid var(--border-2)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue-light)" }}>
                  <i className="ti ti-edit" style={{ fontSize: 13 }}></i>
                </button>

                {/* Delete — disabled for admin */}
                {isAdmin ? (
                  <button
                    disabled
                    title="Cannot delete admin"
                    style={{ width: 28, height: 28, borderRadius: 6, border: "0.5px solid var(--border)", background: "transparent", cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-4)", opacity: 0.3 }}>
                    <i className="ti ti-trash" style={{ fontSize: 13 }}></i>
                  </button>
                ) : (
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

      {/* ── VIEW modal ── */}
      {modal === "view" && selected && (
        <Modal title="User Details" onClose={closeModal}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, padding: 16, background: "var(--bg-app)", borderRadius: "var(--radius-lg)" }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: ROLE_META[selected.roles?.[0]?.name]?.bg ?? "var(--bg-pill)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 700, color: ROLE_META[selected.roles?.[0]?.name]?.color ?? "var(--text-2)",
            }}>
              {selected.name[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>{selected.email}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
                <i className={`ti ${ROLE_META[selected.roles?.[0]?.name]?.icon ?? "ti-user"}`} style={{ color: ROLE_META[selected.roles?.[0]?.name]?.color, fontSize: 13 }}></i>
                <span style={{ fontSize: 11, color: ROLE_META[selected.roles?.[0]?.name]?.color }}>
                  {selected.roles?.[0]?.name?.replace(/_/g, " ") ?? "No role"}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-md)", padding: 12 }}>
              <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 4 }}>USER ID</div>
              <div style={{ fontSize: 12, color: "var(--text-2)" }}>{selected.id}</div>
            </div>
            <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-md)", padding: 12 }}>
              <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 4 }}>JOINED</div>
              <div style={{ fontSize: 12, color: "var(--text-2)" }}>
                {new Date(selected.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
            <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-md)", padding: 12 }}>
              <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 4 }}>EMAIL VERIFIED</div>
              <div style={{ fontSize: 12, color: selected.email_verified_at ? "var(--teal-light)" : "var(--amber-light)" }}>
                {selected.email_verified_at ? "Verified" : "Not verified"}
              </div>
            </div>
            <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-md)", padding: 12 }}>
              <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 4 }}>PERMISSIONS</div>
              <div style={{ fontSize: 12, color: "var(--purple)" }}>
                {ROLE_PERMISSIONS[selected.roles?.[0]?.name]?.length ?? 0} permissions
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <button className="btn" onClick={closeModal}>Close</button>
          </div>
        </Modal>
      )}

      {/* ── EDIT modal ── */}
      {modal === "edit" && selected && (
        <Modal title={`Edit User — ${selected.name}`} onClose={closeModal}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>FULL NAME</label>
              <input
                defaultValue={selected.name}
                style={{ width: "100%", height: 38, background: "var(--bg-card)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 12px", fontSize: 13, color: "var(--text-1)" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>EMAIL</label>
              <input
                defaultValue={selected.email}
                style={{ width: "100%", height: 38, background: "var(--bg-card)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 12px", fontSize: 13, color: "var(--text-1)" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>ROLE</label>
              <select
                defaultValue={selected.roles?.[0]?.name}
                style={{ width: "100%", height: 38, background: "var(--bg-card)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 12px", fontSize: 13, color: "var(--text-1)", cursor: "pointer" }}>
                {ROLES.map(r => (
                  <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>NEW PASSWORD (leave blank to keep current)</label>
              <input
                type="password"
                placeholder="••••••••"
                style={{ width: "100%", height: 38, background: "var(--bg-card)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 12px", fontSize: 13, color: "var(--text-1)" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <button className="btn" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={closeModal}>
              <i className="ti ti-check"></i>Save changes
            </button>
          </div>
        </Modal>
      )}

      {/* ── CREATE modal ── */}
      {modal === "create" && (
        <Modal title="Add New User" onClose={closeModal}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {formError && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--red-fill)", border: "0.5px solid var(--red)", borderRadius: "var(--radius-md)", padding: "9px 12px", fontSize: 12, color: "var(--red-light)" }}>
                <i className="ti ti-alert-circle"></i>{formError}
              </div>
            )}
            <div>
              <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>FULL NAME</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. John Kamau"
                style={{ width: "100%", height: 38, background: "var(--bg-card)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 12px", fontSize: 13, color: "var(--text-1)" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>EMAIL</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="john@yadacrm.com"
                style={{ width: "100%", height: 38, background: "var(--bg-card)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 12px", fontSize: 13, color: "var(--text-1)" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>PASSWORD</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Min 8 characters"
                style={{ width: "100%", height: 38, background: "var(--bg-card)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 12px", fontSize: 13, color: "var(--text-1)" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>ROLE</label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                style={{ width: "100%", height: 38, background: "var(--bg-card)", border: "0.5px solid var(--border-2)", borderRadius: "var(--radius-md)", padding: "0 12px", fontSize: 13, color: "var(--text-1)", cursor: "pointer" }}>
                {ROLES.map(r => (
                  <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <button className="btn" onClick={closeModal} disabled={formLoading}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={formLoading}>
              {formLoading
                ? <><i className="ti ti-loader"></i>Creating...</>
                : <><i className="ti ti-plus"></i>Create user</>
              }
            </button>
          </div>
        </Modal>
      )}

      {/* ── DELETE confirm ── */}
      {modal === "delete" && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
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
                onClick={() => {
                  // TODO: wire to DELETE /api/admin/users/:id
                  closeModal();
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

/* ── Modal wrapper ── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "var(--bg-panel)", borderRadius: "var(--radius-lg)", width: 560, maxHeight: "88vh", display: "flex", flexDirection: "column", border: "0.5px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "0.5px solid var(--border)", flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ overflowY: "auto", padding: 20 }}>
          {children}
        </div>
      </div>
    </div>
  );
}