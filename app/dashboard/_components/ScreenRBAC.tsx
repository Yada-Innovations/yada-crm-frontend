"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/api";
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

type ModalMode = "view" | "edit" | null;

export function ScreenRBAC() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // ── Load data ──
  function loadData() {
    setLoading(true);
    Promise.all([
      apiGet('/admin/users'),
      apiGet('/admin/roles')
    ]).then(([usersData, rolesData]) => {
      console.log('Roles data loaded:', rolesData); // Debug log
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
    // Try different possible ID fields
    return role.id || role.role_id || role._id || null;
  }

  // ── Open edit modal ──
  function openEdit(role: any) {
    console.log('Opening edit for role:', role); // Debug log
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

  // ── Close modal ──
  function closeModal() {
    setModal(null);
    setSelectedRole(null);
    setEditPermissions([]);
    setSaveMessage(null);
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

  // ── Check if a permission is selected ──
  function isPermissionSelected(permission: string): boolean {
    return editPermissions.includes(permission);
  }

  // ── Save permissions to database ──
  async function savePermissions() {
    if (!selectedRole) {
      setSaveMessage({ type: 'error', text: 'No role selected' });
      return;
    }
    
    const roleId = getRoleId(selectedRole);
    console.log('Role ID:', roleId, 'Selected role:', selectedRole); // Debug log
    
    if (!roleId) {
      setSaveMessage({ type: 'error', text: '❌ Role ID not found. Please refresh and try again.' });
      return;
    }
    
    setSaving(true);
    setSaveMessage(null);
    
    console.log('Saving permissions for role:', selectedRole.name, 'ID:', roleId);
    console.log('Permissions to save:', editPermissions);
    
    try {
      const res = await apiPatch(`/admin/roles/${roleId}/permissions`, {
        permissions: editPermissions,
      });
      
      console.log('Save response:', res);
      
      if (res.message) {
        setSaveMessage({ type: 'success', text: '✅ ' + res.message });
        // Reload data after a moment
        setTimeout(() => {
          loadData();
        }, 1000);
      } else if (res.error || res.message?.includes('error')) {
        setSaveMessage({ type: 'error', text: '❌ ' + (res.message || 'Failed to save') });
      } else {
        setSaveMessage({ type: 'success', text: '✅ Permissions saved successfully!' });
        setTimeout(() => {
          loadData();
        }, 1000);
      }
    } catch (error: any) {
      console.error('Save error:', error);
      setSaveMessage({ 
        type: 'error', 
        text: '❌ Error: ' + (error.message || 'Failed to save permissions') 
      });
    } finally {
      setSaving(false);
    }
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
        <button className="btn btn-primary" onClick={() => alert('Create role functionality coming soon')}>
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

              {/* Delete */}
              {r.canDelete && (
                <button
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
        <Modal title={`View Role - ${selectedRole.label}`} onClose={closeModal}>
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
        </Modal>
      )}

      {/* ── EDIT MODAL ── */}
      {modal === "edit" && selectedRole && (
        <Modal title={`Edit Permissions - ${selectedRole.label}`} onClose={closeModal}>
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

          {/* Save Message */}
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
                color: "#fff",
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
        </Modal>
      )}
    </div>
  );
}

// ── Modal Component ──
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{
        background: "var(--bg-panel)", borderRadius: "var(--radius-lg)",
        width: 720, maxHeight: "88vh", display: "flex", flexDirection: "column",
        border: "0.5px solid var(--border)",
      }}>
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