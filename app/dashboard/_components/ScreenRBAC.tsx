"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { Topbar } from "./Topbar";
import { Spinner } from "./Spinner";

// ── Module definitions ──
const MODULES = [
  "leads", "quotes", "clients", "subscriptions",
  "tickets", "feature_requests", "invoices", "users", "analytics",
];

const MODULE_PERMISSIONS: Record<string, string[]> = {
  leads: ["view", "create", "edit", "delete"],
  quotes: ["view", "create", "edit", "delete"],
  clients: ["view", "create", "edit", "delete"],
  subscriptions: ["view", "create", "edit", "delete"],
  tickets: ["view", "create", "edit", "delete"],
  feature_requests: ["view", "create", "edit", "delete"],
  invoices: ["view", "create", "edit", "delete"],
  users: ["view", "create", "edit", "delete"],
  analytics: ["view"],
};

// ── Role metadata ──
const ROLE_META: Record<string, { icon: string; color: string; bg: string; canDelete: boolean }> = {
  admin: { icon: "ti-crown", color: "var(--amber-light)", bg: "var(--amber-fill)", canDelete: false },
  sales_agent: { icon: "ti-briefcase", color: "#AFA9EC", bg: "var(--purple-fill)", canDelete: true },
  support_agent: { icon: "ti-headset", color: "var(--blue-light)", bg: "rgba(133,183,235,0.12)", canDelete: true },
};

type ModalMode = "view" | "edit" | "create" | "delete" | null;

export function ScreenRBAC() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  
  // ── Create Role State ──
  const [createForm, setCreateForm] = useState({
    name: "",
    display_name: "",
    description: "",
    guard_name: "web",
    permissions: [] as string[],
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);

  // ── Load data ──
  function loadData() {
    setLoading(true);
    Promise.all([
      apiGet('/admin/users'),
      apiGet('/admin/roles')
    ]).then(([usersData, rolesData]) => {
      setUsers(Array.isArray(usersData) ? usersData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setLoading(false);
    }).catch((error) => {
      console.error('Failed to load data:', error);
      setLoading(false);
    });
  }

  useEffect(() => { loadData(); }, []);

  // ── Get permissions for a role ──
  function getRolePermissions(roleName: string): string[] {
    const role = roles.find(r => r.name === roleName);
    return role?.permissions?.map((p: any) => p.name) || [];
  }

  // ── Get user count for a role ──
  function getUserCount(roleName: string): number {
    return users.filter(u => u.roles?.some((r: any) => r.name === roleName)).length;
  }

  // ── Format module name for display ──
  function formatModuleName(name: string): string {
    return name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }

  // ── Get role ID safely ──
  function getRoleId(role: any): number | string | null {
    if (!role) return null;
    return role.id || role.role_id || role._id || null;
  }

  // ── Open edit modal ──
  function openEdit(role: any) {
    const perms = getRolePermissions(role.name);
    setSelectedRole(role);
    setEditPermissions([...perms]);
    setModal("edit");
    setSaveMessage(null);
  }

  // ── Open view modal ──
  function openView(role: any) {
    setSelectedRole(role);
    setModal("view");
  }

  // ── Open create modal ──
  function openCreate() {
    setCreateForm({
      name: "",
      display_name: "",
      description: "",
      guard_name: "web",
      permissions: [],
    });
    setCreateError("");
    setCreateSuccess(false);
    setModal("create");
  }

  // ── Close modal ──
  function closeModal() {
    setModal(null);
    setSelectedRole(null);
    setEditPermissions([]);
    setSaveMessage(null);
    setCreateError("");
    setCreateSuccess(false);
  }

  // ── Toggle a permission in edit mode ──
  function togglePermission(permission: string) {
    setEditPermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      } else {
        return [...prev, permission];
      }
    });
  }

  // ── Toggle a permission in create mode ──
  function toggleCreatePermission(permission: string) {
    setCreateForm(prev => {
      if (prev.permissions.includes(permission)) {
        return { ...prev, permissions: prev.permissions.filter(p => p !== permission) };
      } else {
        return { ...prev, permissions: [...prev.permissions, permission] };
      }
    });
  }

  // ── Check if a permission is selected ──
  function isPermissionSelected(permission: string): boolean {
    return editPermissions.includes(permission);
  }

  // ── Check if a permission is selected in create mode ──
  function isCreatePermissionSelected(permission: string): boolean {
    return createForm.permissions.includes(permission);
  }

  // ── Save permissions to database ──
  async function savePermissions() {
    if (!selectedRole) {
      setSaveMessage({ type: 'error', text: 'No role selected' });
      return;
    }
    
    const roleId = getRoleId(selectedRole);
    if (!roleId) {
      setSaveMessage({ type: 'error', text: 'Role ID not found. Please refresh and try again.' });
      return;
    }
    
    setSaving(true);
    setSaveMessage(null);
    
    try {
      const res = await apiPatch(`/admin/roles/${roleId}/permissions`, {
        permissions: editPermissions,
      });
      
      if (res.message) {
        setSaveMessage({ type: 'success', text: res.message });
        setTimeout(() => {
          loadData();
        }, 1000);
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to save permissions' });
      }
    } catch (error: any) {
      console.error('Save error:', error);
      setSaveMessage({ 
        type: 'error', 
        text: 'Error: ' + (error.message || 'Failed to save permissions') 
      });
    } finally {
      setSaving(false);
    }
  }

  // ── Create new role ──
  async function handleCreateRole() {
    if (!createForm.name.trim()) {
      setCreateError('Role name is required');
      return;
    }

    setCreateLoading(true);
    setCreateError('');
    setCreateSuccess(false);

    try {
      const res = await apiPost('/admin/roles', {
        name: createForm.name.trim().toLowerCase().replace(/\s+/g, '_'),
        display_name: createForm.display_name || createForm.name,
        description: createForm.description || '',
        guard_name: createForm.guard_name || 'web',
        permissions: createForm.permissions,
      });

      if (res.message || res.id) {
        setCreateSuccess(true);
        setSaveMessage({ type: 'success', text: 'Role created successfully!' });
        setTimeout(() => {
          loadData();
          closeModal();
        }, 1200);
      } else {
        setCreateError(res.message || res.error || 'Failed to create role');
      }
    } catch (error: any) {
      console.error('Create role error:', error);
      setCreateError('Error: ' + (error.message || 'Failed to create role'));
    } finally {
      setCreateLoading(false);
    }
  }

  // ── Delete role ──
  async function handleDeleteRole() {
    if (!deleteTarget) return;
    
    try {
      const res = await apiDelete(`/admin/roles/${deleteTarget.id}`);
      if (res.message) {
        setConfirmOpen(false);
        setDeleteTarget(null);
        loadData();
        alert('Role deleted successfully!');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete role. Please try again.');
    }
  }

  // ── Open delete confirmation ──
  function confirmDelete(role: any) {
    if (!role.canDelete) return;
    setDeleteTarget(role);
    setConfirmOpen(true);
  }

  if (loading) return <Spinner />;

  // ── Build role list with metadata ──
  const roleList = ["admin", "sales_agent", "support_agent"].map(name => {
    const role = roles.find(r => r.name === name);
    return {
      name,
      id: role?.id || null,
      label: name === "admin" ? "Admin" : name === "sales_agent" ? "Sales Agent" : "Support Agent",
      ...ROLE_META[name],
      userCount: getUserCount(name),
      permissions: getRolePermissions(name),
    };
  });

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

      {/* ── Roles Table ── */}
      <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 160px 140px",
          background: "#0F0F0F", padding: "12px 18px",
          fontSize: 11, color: "var(--text-3)", fontWeight: 500,
        }}>
          <span>Role Name</span>
          <span>Users Assigned</span>
          <span style={{ textAlign: "right" }}>Actions</span>
        </div>

        {roleList.map((r, i) => (
          <div key={r.name} style={{
            display: "grid", gridTemplateColumns: "1fr 160px 140px",
            alignItems: "center", padding: "14px 18px",
            borderTop: "0.5px solid var(--border)",
            background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg-app)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <i className={`ti ${r.icon}`} style={{ color: r.color, fontSize: 16 }}></i>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{r.label}</span>
            </div>

            <div>
              <span style={{
                background: "var(--bg-pill)", padding: "3px 12px",
                borderRadius: 20, fontSize: 11, color: "var(--text-2)",
              }}>
                {r.userCount} {r.userCount === 1 ? "User" : "Users"}
              </span>
            </div>

            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
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

              <button
                onClick={() => openEdit(r)}
                title="Edit permissions"
                style={{
                  width: 30, height: 30, borderRadius: 6,
                  border: "0.5px solid var(--border-2)",
                  background: "transparent", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--blue-light)",
                }}>
                <i className="ti ti-edit" style={{ fontSize: 14 }}></i>
              </button>

              {r.canDelete && (
                <button
                  onClick={() => confirmDelete(r)}
                  title="Delete role"
                  style={{
                    width: 30, height: 30, borderRadius: 6,
                    border: "0.5px solid var(--red)",
                    background: "transparent", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--red-light)",
                  }}>
                  <i className="ti ti-trash" style={{ fontSize: 14 }}></i>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── VIEW MODAL ── */}
      {modal === "view" && selectedRole && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100
        }}>
          <div style={{
            background: "var(--bg-panel)", borderRadius: "var(--radius-lg)",
            width: 700, maxHeight: "88vh", display: "flex", flexDirection: "column",
            border: "0.5px solid var(--border)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "0.5px solid var(--border)", flexShrink: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>View Role - {selectedRole.label}</span>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 22, lineHeight: 1 }}>×</button>
            </div>

            <div style={{ overflowY: "auto", padding: 20 }}>
              <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 14, marginBottom: 20 }}>
                <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 8, letterSpacing: 1 }}>ROLE NAME</div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "var(--bg-app)", borderRadius: "var(--radius-md)",
                  padding: "10px 14px", fontSize: 13, border: "0.5px solid var(--border-2)",
                }}>
                  <i className={`ti ${selectedRole.icon}`} style={{ color: selectedRole.color }}></i>
                  {selectedRole.label}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8 }}>
                  {selectedRole.userCount} users assigned to this role.
                </div>
              </div>

              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Resource Permissions</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16 }}>
                Actions this role is allowed to perform across modules.
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {MODULES.map(mod => {
                  const perms = selectedRole.permissions || [];
                  return (
                    <div key={mod} style={{ background: "var(--bg-app)", borderRadius: "var(--radius-lg)", padding: 12, border: "0.5px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--purple)" }}></div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{formatModuleName(mod)}</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {MODULE_PERMISSIONS[mod]?.map(action => {
                          const has = perms.includes(`${mod}.${action}`);
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
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {modal === "edit" && selectedRole && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100
        }}>
          <div style={{
            background: "var(--bg-panel)", borderRadius: "var(--radius-lg)",
            width: 720, maxHeight: "88vh", display: "flex", flexDirection: "column",
            border: "0.5px solid var(--border)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "0.5px solid var(--border)", flexShrink: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Edit Permissions - {selectedRole.label}</span>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 22, lineHeight: 1 }}>×</button>
            </div>

            <div style={{ overflowY: "auto", padding: 20 }}>
              <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 14, marginBottom: 20 }}>
                <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 8, letterSpacing: 1 }}>ROLE NAME</div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "var(--bg-app)", borderRadius: "var(--radius-md)",
                  padding: "10px 14px", fontSize: 13, border: "0.5px solid var(--border-2)",
                }}>
                  <i className={`ti ${selectedRole.icon}`} style={{ color: selectedRole.color }}></i>
                  {selectedRole.label}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8 }}>
                  Toggle permissions below. Changes will be saved to the database.
                </div>
              </div>

              {saveMessage && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: saveMessage.type === 'success' ? "var(--teal-fill)" : "var(--red-fill)",
                  border: `0.5px solid ${saveMessage.type === 'success' ? "var(--teal)" : "var(--red)"}`,
                  borderRadius: "var(--radius-md)", padding: "10px 14px",
                  fontSize: 12, 
                  color: saveMessage.type === 'success' ? "var(--teal-light)" : "var(--red-light)",
                  marginBottom: 16,
                }}>
                  <i className={`ti ${saveMessage.type === 'success' ? "ti-check-circle" : "ti-alert-circle"}`}></i>
                  {saveMessage.text}
                </div>
              )}

              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Resource Permissions</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16 }}>
                Click on any permission to toggle it on/off.
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {MODULES.map(mod => {
                  const actions = MODULE_PERMISSIONS[mod] || [];
                  return (
                    <div key={mod} style={{ background: "var(--bg-app)", borderRadius: "var(--radius-lg)", padding: 12, border: "0.5px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--purple)" }}></div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{formatModuleName(mod)}</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {actions.map(action => {
                          const permission = `${mod}.${action}`;
                          const has = isPermissionSelected(permission);
                          return (
                            <button
                              key={action}
                              onClick={() => togglePermission(permission)}
                              style={{
                                display: "flex", alignItems: "center", gap: 4,
                                padding: "4px 10px", borderRadius: 5, fontSize: 11,
                                cursor: "pointer",
                                background: has ? "var(--teal-fill)" : "transparent",
                                border: `1px solid ${has ? "var(--teal)" : "var(--border-2)"}`,
                                color: has ? "var(--teal-light)" : "var(--text-3)",
                                userSelect: "none",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                if (!has) e.currentTarget.style.background = "var(--bg-hover)";
                              }}
                              onMouseLeave={(e) => {
                                if (!has) e.currentTarget.style.background = "transparent";
                              }}
                            >
                              <i 
                                className={`ti ${has ? "ti-square-rounded-check" : "ti-square-rounded"}`} 
                                style={{ fontSize: 12 }}
                              />
                              {action.charAt(0).toUpperCase() + action.slice(1)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ 
                marginTop: 16, 
                padding: 12, 
                background: "var(--bg-app)", 
                borderRadius: "var(--radius-md)",
                fontSize: 12,
                color: "var(--text-3)"
              }}>
                <strong>Selected permissions:</strong> {editPermissions.length > 0 ? editPermissions.join(', ') : 'None selected'}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                <button 
                  className="btn" 
                  onClick={closeModal} 
                  disabled={saving}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "var(--radius-md)",
                    border: "0.5px solid var(--border)",
                    background: "transparent",
                    color: "var(--text-3)",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={savePermissions} 
                  disabled={saving}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    background: "var(--purple-deep)",
                    color: "#EEEDFE",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.5 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {saving ? (
                    <><i className="ti ti-loader" style={{ animation: "spin 1s linear infinite" }}></i> Saving...</>
                  ) : (
                    <><i className="ti ti-check"></i> Save Changes</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE ROLE MODAL ── */}
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
              <span style={{ fontSize: 15, fontWeight: 600 }}>Create New Role</span>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 22, lineHeight: 1 }}>×</button>
            </div>

            <div style={{ overflowY: "auto", padding: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Success Message */}
                {createSuccess && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "var(--teal-fill)",
                    border: "0.5px solid var(--teal)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 14px",
                    fontSize: 12,
                    color: "var(--teal-light)",
                  }}>
                    <i className="ti ti-check-circle"></i>
                    Role created successfully! Closing modal...
                  </div>
                )}

                {createError && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "var(--red-fill)",
                    border: "0.5px solid var(--red)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 14px",
                    fontSize: 12,
                    color: "var(--red-light)",
                  }}>
                    <i className="ti ti-alert-circle"></i>
                    {createError}
                  </div>
                )}

                {/* Role Name */}
                <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 16, border: "0.5px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <i className="ti ti-tag" style={{ color: "var(--purple)", fontSize: 16 }}></i>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>Role Details</span>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Role Name *</label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="e.g. Finance Manager"
                      style={{
                        width: "100%",
                        height: 34,
                        background: "var(--bg-app)",
                        border: "0.5px solid var(--border-2)",
                        borderRadius: "var(--radius-md)",
                        padding: "0 10px",
                        fontSize: 13,
                        color: "var(--text-1)",
                      }}
                    />
                    <div style={{ fontSize: 9, color: "var(--text-4)", marginTop: 4 }}>
                      This will be used as the system name (lowercase, underscores for spaces)
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Display Name</label>
                    <input
                      type="text"
                      value={createForm.display_name}
                      onChange={(e) => setCreateForm({ ...createForm, display_name: e.target.value })}
                      placeholder="e.g. Finance Manager"
                      style={{
                        width: "100%",
                        height: 34,
                        background: "var(--bg-app)",
                        border: "0.5px solid var(--border-2)",
                        borderRadius: "var(--radius-md)",
                        padding: "0 10px",
                        fontSize: 13,
                        color: "var(--text-1)",
                      }}
                    />
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Description</label>
                    <textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      placeholder="What does this role do?"
                      rows={2}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        background: "var(--bg-app)",
                        border: "0.5px solid var(--border-2)",
                        borderRadius: "var(--radius-md)",
                        fontSize: 13,
                        color: "var(--text-1)",
                        resize: "vertical",
                        fontFamily: "inherit",
                        minHeight: 50,
                      }}
                    />
                  </div>
                </div>

                {/* Permissions */}
                <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 16, border: "0.5px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <i className="ti ti-shield" style={{ color: "var(--amber-light)", fontSize: 16 }}></i>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>Resource Permissions</span>
                    <span style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: 12,
                      background: "var(--bg-pill)",
                      color: "var(--text-3)",
                      marginLeft: "auto",
                    }}>
                      {createForm.permissions.length} selected
                    </span>
                  </div>

                  <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 12 }}>
                    Select the permissions this role should have.
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {MODULES.map(mod => {
                      const actions = MODULE_PERMISSIONS[mod] || [];
                      return (
                        <div key={mod} style={{ background: "var(--bg-app)", borderRadius: "var(--radius-lg)", padding: 12, border: "0.5px solid var(--border)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--purple)" }}></div>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{formatModuleName(mod)}</span>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {actions.map(action => {
                              const permission = `${mod}.${action}`;
                              const has = isCreatePermissionSelected(permission);
                              return (
                                <button
                                  key={action}
                                  onClick={() => toggleCreatePermission(permission)}
                                  style={{
                                    display: "flex", alignItems: "center", gap: 4,
                                    padding: "4px 10px", borderRadius: 5, fontSize: 11,
                                    cursor: "pointer",
                                    background: has ? "var(--teal-fill)" : "transparent",
                                    border: `1px solid ${has ? "var(--teal)" : "var(--border-2)"}`,
                                    color: has ? "var(--teal-light)" : "var(--text-3)",
                                    userSelect: "none",
                                    transition: "all 0.2s",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!has) e.currentTarget.style.background = "var(--bg-hover)";
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!has) e.currentTarget.style.background = "transparent";
                                  }}
                                >
                                  <i 
                                    className={`ti ${has ? "ti-square-rounded-check" : "ti-square-rounded"}`} 
                                    style={{ fontSize: 12 }}
                                  />
                                  {action.charAt(0).toUpperCase() + action.slice(1)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ 
                    marginTop: 12, 
                    padding: 10, 
                    background: "var(--bg-app)", 
                    borderRadius: "var(--radius-md)",
                    fontSize: 11,
                    color: "var(--text-3)"
                  }}>
                    <strong>Selected permissions:</strong> {createForm.permissions.length > 0 ? createForm.permissions.join(', ') : 'None selected'}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                  <button 
                    className="btn" 
                    onClick={closeModal} 
                    disabled={createLoading}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "var(--radius-md)",
                      border: "0.5px solid var(--border)",
                      background: "transparent",
                      color: "var(--text-3)",
                      cursor: createLoading ? "not-allowed" : "pointer",
                      opacity: createLoading ? 0.5 : 1,
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleCreateRole} 
                    disabled={createLoading || !createForm.name.trim() || createSuccess}
                    style={{
                      padding: "8px 20px",
                      borderRadius: "var(--radius-md)",
                      border: "none",
                      background: (createLoading || !createForm.name.trim() || createSuccess) ? "var(--text-4)" : "var(--purple-deep)",
                      color: "#EEEDFE",
                      cursor: (createLoading || !createForm.name.trim() || createSuccess) ? "not-allowed" : "pointer",
                      opacity: (createLoading || !createForm.name.trim() || createSuccess) ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {createLoading ? (
                      <><i className="ti ti-loader" style={{ animation: "spin 1s linear infinite" }}></i> Creating...</>
                    ) : (
                      <><i className="ti ti-plus"></i> Create Role</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM DIALOG ── */}
      {confirmOpen && deleteTarget && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200
        }}>
          <div style={{ background: "var(--bg-panel)", borderRadius: "var(--radius-lg)", padding: 24, width: 420, border: "0.5px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--red-fill)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="ti ti-trash" style={{ color: "var(--red-light)", fontSize: 18 }}></i>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Delete Role</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>This action cannot be undone</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20 }}>
              Are you sure you want to delete the <strong>{deleteTarget.label}</strong> role?
              Users assigned to this role will lose their permissions immediately.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn" onClick={() => { setConfirmOpen(false); setDeleteTarget(null); }}>Cancel</button>
              <button
                onClick={handleDeleteRole}
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
                }}>
                <i className="ti ti-trash"></i> Delete Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}