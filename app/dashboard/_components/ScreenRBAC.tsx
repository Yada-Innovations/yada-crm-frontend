"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Topbar } from "./Topbar";
import { Spinner } from "./Spinner";

const MODULES = [
  "leads", "quotes", "clients", "subscriptions",
  "tickets", "feature_requests", "invoices", "users", "analytics",
];

const MODULE_PERMISSIONS: Record<string, string[]> = {
  leads:            ["view","create","edit","delete"],
  quotes:           ["view","create","edit","delete"],
  clients:          ["view","create","edit","delete"],
  subscriptions:    ["view","create","edit","delete"],
  tickets:          ["view","create","edit","delete"],
  feature_requests: ["view","create","edit","delete"],
  invoices:         ["view","create","edit","delete"],
  users:            ["view","create","edit","delete"],
  analytics:        ["view"],
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: MODULES.flatMap(m => MODULE_PERMISSIONS[m].map(a => `${m}.${a}`)),
  sales_agent: [
    "leads.view","leads.create","leads.edit",
    "quotes.view","quotes.create",
    "clients.view","clients.create","clients.edit",
    "subscriptions.view","analytics.view",
  ],
  support_agent: [
    "tickets.view","tickets.create","tickets.edit",
    "feature_requests.view","feature_requests.create",
    "clients.view",
  ],
};

const ROLE_META: Record<string, { icon: string; color: string; canDelete: boolean }> = {
  admin:         { icon: "ti-crown",    color: "var(--amber-light)", canDelete: false },
  sales_agent:   { icon: "ti-briefcase",color: "#AFA9EC",            canDelete: true  },
  support_agent: { icon: "ti-headset", color: "var(--blue-light)",  canDelete: true  },
};

type ModalMode = "view" | "edit" | "create" | null;

export function ScreenRBAC() {
  const [users, setUsers]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState<ModalMode>(null);
  const [selected, setSelected]   = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [confirmOpen, setConfirmOpen]   = useState(false);

  useEffect(() => {
    apiGet('/admin/users').then(data => {
      setUsers(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const roles = [
    { key: "admin",         label: "Admin" },
    { key: "sales_agent",   label: "Sales Agent" },
    { key: "support_agent", label: "Support Agent" },
  ].map(r => ({
    ...r,
    ...ROLE_META[r.key],
    userCount: users.filter(u => u.roles?.[0]?.name === r.key).length,
  }));

  function openView(role: any) { setSelected(role); setModal("view"); }
  function openEdit(role: any) { setSelected(role); setModal("edit"); }
  function openCreate()        { setSelected(null); setModal("create"); }
  function closeModal()        { setModal(null); setSelected(null); }

  function confirmDelete(role: any) {
    if (!role.canDelete) return;
    setDeleteTarget(role);
    setConfirmOpen(true);
  }

  function handleDelete() {
    // TODO: wire to DELETE /api/roles/:id when backend supports it
    setConfirmOpen(false);
    setDeleteTarget(null);
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <Topbar title="Roles & Permissions">
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="ti ti-plus"></i>Create Role
        </button>
      </Topbar>

      <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 20 }}>
        Manage what users can see and do in the system.
      </p>

      {/* ── Roles table ── */}
      <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>

        {/* Table header */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 160px 120px",
          background: "#0F0F0F", padding: "12px 18px",
          fontSize: 11, color: "var(--text-3)", fontWeight: 500,
        }}>
          <span>Role Name</span>
          <span>Users Assigned</span>
          <span style={{ textAlign: "right" }}>Actions</span>
        </div>

        {/* Rows */}
        {roles.map((r, i) => (
          <div key={r.key} style={{
            display: "grid", gridTemplateColumns: "1fr 160px 120px",
            alignItems: "center", padding: "14px 18px",
            borderTop: "0.5px solid var(--border)",
            background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg-app)",
          }}>
            {/* Role name */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <i className={`ti ${r.icon}`} style={{ color: r.color, fontSize: 16 }}></i>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{r.label}</span>
            </div>

            {/* Users assigned */}
            <div>
              <span style={{
                background: "var(--bg-pill)", padding: "3px 12px",
                borderRadius: 20, fontSize: 11, color: "var(--text-2)",
              }}>
                {r.userCount} {r.userCount === 1 ? "User" : "Users"}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              {/* View */}
              <button
                onClick={() => openView(r)}
                title="View permissions"
                style={{
                  width: 30, height: 30, borderRadius: 6,
                  border: "0.5px solid var(--border-2)",
                  background: "transparent", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-3)",
                }}>
                <i className="ti ti-eye" style={{ fontSize: 14 }}></i>
              </button>

              {/* Edit */}
              <button
                onClick={() => openEdit(r)}
                title="Edit role"
                style={{
                  width: 30, height: 30, borderRadius: 6,
                  border: "0.5px solid var(--border-2)",
                  background: "transparent", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--blue-light)",
                }}>
                <i className="ti ti-edit" style={{ fontSize: 14 }}></i>
              </button>

              {/* Delete — disabled for admin */}
              <button
                onClick={() => confirmDelete(r)}
                title={r.canDelete ? "Delete role" : "Cannot delete admin role"}
                style={{
                  width: 30, height: 30, borderRadius: 6,
                  border: `0.5px solid ${r.canDelete ? "var(--red)" : "var(--border)"}`,
                  background: "transparent",
                  cursor: r.canDelete ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: r.canDelete ? "var(--red-light)" : "var(--text-4)",
                  opacity: r.canDelete ? 1 : 0.4,
                }}>
                <i className="ti ti-trash" style={{ fontSize: 14 }}></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── VIEW modal ── */}
      {modal === "view" && selected && (
        <Modal title="View Role Details" onClose={closeModal}>
          {/* Role name display */}
          <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 8, letterSpacing: 1 }}>ROLE NAME</div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--bg-app)", borderRadius: "var(--radius-md)",
              padding: "10px 14px", fontSize: 13, border: "0.5px solid var(--border-2)",
            }}>
              <i className={`ti ${selected.icon}`} style={{ color: selected.color }}></i>
              {selected.label}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8 }}>
              This name is used across the system to assign users to these specific permissions.
            </div>
          </div>

          {/* Permissions grid */}
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Resource Permissions</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16 }}>
            Actions this role is allowed to perform across modules.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {MODULES.map(mod => {
              const actions   = MODULE_PERMISSIONS[mod];
              const rolePerms = ROLE_PERMISSIONS[selected.key] ?? [];
              return (
                <div key={mod} style={{ background: "var(--bg-app)", borderRadius: "var(--radius-lg)", padding: 12, border: "0.5px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--purple)" }}></div>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      {mod.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {actions.map(action => {
                      const has = rolePerms.includes(`${mod}.${action}`);
                      return (
                        <div key={action} style={{
                          display: "flex", alignItems: "center", gap: 4,
                          padding: "3px 9px", borderRadius: 5, fontSize: 11,
                          background: has ? "var(--teal-fill)" : "transparent",
                          border: `0.5px solid ${has ? "var(--teal)" : "var(--border-2)"}`,
                          color: has ? "var(--teal-light)" : "var(--text-4)",
                        }}>
                          <i className={`ti ${has ? "ti-square-rounded-check" : "ti-square-rounded"}`} style={{ fontSize: 12 }}></i>
                          {action.charAt(0).toUpperCase() + action.slice(1)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <button className="btn" onClick={closeModal}>Close</button>
          </div>
        </Modal>
      )}

      {/* ── EDIT modal ── */}
      {modal === "edit" && selected && (
        <Modal title={`Edit Role — ${selected.label}`} onClose={closeModal}>
          <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 8, letterSpacing: 1 }}>ROLE NAME</div>
            <input
              defaultValue={selected.label}
              style={{
                width: "100%", background: "var(--bg-app)", border: "0.5px solid var(--border-2)",
                borderRadius: "var(--radius-md)", padding: "10px 14px",
                fontSize: 13, color: "var(--text-1)",
              }}
            />
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Resource Permissions</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {MODULES.map(mod => {
              const actions   = MODULE_PERMISSIONS[mod];
              const rolePerms = ROLE_PERMISSIONS[selected.key] ?? [];
              return (
                <div key={mod} style={{ background: "var(--bg-app)", borderRadius: "var(--radius-lg)", padding: 12, border: "0.5px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--purple)" }}></div>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      {mod.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {actions.map(action => {
                      const has = rolePerms.includes(`${mod}.${action}`);
                      return (
                        <label key={action} style={{
                          display: "flex", alignItems: "center", gap: 4,
                          padding: "3px 9px", borderRadius: 5, fontSize: 11, cursor: "pointer",
                          background: has ? "var(--teal-fill)" : "transparent",
                          border: `0.5px solid ${has ? "var(--teal)" : "var(--border-2)"}`,
                          color: has ? "var(--teal-light)" : "var(--text-3)",
                        }}>
                          <input type="checkbox" defaultChecked={has} style={{ width: 12, height: 12, accentColor: "var(--teal-light)" }} />
                          {action.charAt(0).toUpperCase() + action.slice(1)}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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
        <Modal title="Create New Role" onClose={closeModal}>
          <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 8, letterSpacing: 1 }}>ROLE NAME</div>
            <input
              placeholder="e.g. Finance Manager"
              style={{
                width: "100%", background: "var(--bg-app)", border: "0.5px solid var(--border-2)",
                borderRadius: "var(--radius-md)", padding: "10px 14px",
                fontSize: 13, color: "var(--text-1)",
              }}
            />
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8 }}>
              This name will be used across the system to assign users to these specific permissions.
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Resource Permissions</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {MODULES.map(mod => {
              const actions = MODULE_PERMISSIONS[mod];
              return (
                <div key={mod} style={{ background: "var(--bg-app)", borderRadius: "var(--radius-lg)", padding: 12, border: "0.5px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--purple)" }}></div>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      {mod.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {actions.map(action => (
                      <label key={action} style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "3px 9px", borderRadius: 5, fontSize: 11, cursor: "pointer",
                        background: "transparent", border: "0.5px solid var(--border-2)", color: "var(--text-3)",
                      }}>
                        <input type="checkbox" style={{ width: 12, height: 12, accentColor: "var(--teal-light)" }} />
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <button className="btn" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={closeModal}>
              <i className="ti ti-plus"></i>Create Role
            </button>
          </div>
        </Modal>
      )}

      {/* ── DELETE confirm dialog ── */}
      {confirmOpen && deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "var(--bg-panel)", borderRadius: "var(--radius-lg)", padding: 24, width: 400, border: "0.5px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--red-fill)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="ti ti-trash" style={{ color: "var(--red-light)", fontSize: 18 }}></i>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Delete role</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>This action cannot be undone</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20 }}>
              Are you sure you want to delete the <strong>{deleteTarget.label}</strong> role?
              Users assigned to this role will lose their permissions immediately.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button
                onClick={handleDelete}
                style={{ padding: "7px 16px", borderRadius: "var(--radius-md)", border: "none", background: "var(--red)", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <i className="ti ti-trash"></i>Delete role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Reusable modal wrapper ── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{
        background: "var(--bg-panel)", borderRadius: "var(--radius-lg)",
        width: 720, maxHeight: "88vh", display: "flex", flexDirection: "column",
        border: "0.5px solid var(--border)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "0.5px solid var(--border)", flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        {/* Body */}
        <div style={{ overflowY: "auto", padding: 20 }}>
          {children}
        </div>
      </div>
    </div>
  );
}