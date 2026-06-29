"use client";

import { useEffect, useState, useCallback } from "react";
import { usePermissions } from "../_hooks/usePermissions";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

function Topbar({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
      <h1 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{title}</h1>
      <div style={{ display: "flex", gap: 8 }}>{children}</div>
    </div>
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 16, ...style }}>{children}</div>;
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 60 }}>
      <i className="ti ti-loader" style={{ fontSize: 24, color: "var(--text-3)", animation: "spin 1s linear infinite" }}></i>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function ScreenEmployees() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [view, setView] = useState<"list" | "detail">("list");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    employment_type: "full_time",
    hire_date: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    status: "active",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const { can } = usePermissions();

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([apiGet('/employees'), apiGet('/employees/stats')]).then(([empData, statsData]) => {
      setEmployees(Array.isArray(empData) ? empData : []);
      setStats(statsData || {});
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!formData.first_name || !formData.last_name || !formData.email) {
      setFormError("First name, last name and email are required.");
      return;
    }
    setFormLoading(true);
    setFormError("");
    try {
      const res = await apiPost("/employees", formData);
      if (res.id) {
        setShowForm(false);
        setFormData({ first_name: "", last_name: "", email: "", phone: "", position: "", department: "", employment_type: "full_time", hire_date: "", address: "", emergency_contact_name: "", emergency_contact_phone: "", status: "active" });
        load();
        alert("Employee created successfully!");
      } else {
        setFormError(res.message || "Failed to create employee.");
      }
    } catch {
      setFormError("Could not connect to server.");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleUpdate() {
    if (!formData.first_name || !formData.last_name || !formData.email) {
      setFormError("First name, last name and email are required.");
      return;
    }
    setFormLoading(true);
    setFormError("");
    try {
      const res = await apiPatch(`/employees/${selectedEmployee.id}`, formData);
      if (res.id || res.message) {
        setShowEditForm(false);
        setSelectedEmployee(null);
        setFormData({ first_name: "", last_name: "", email: "", phone: "", position: "", department: "", employment_type: "full_time", hire_date: "", address: "", emergency_contact_name: "", emergency_contact_phone: "", status: "active" });
        load();
        alert("Employee updated successfully!");
      } else {
        setFormError(res.message || "Failed to update employee.");
      }
    } catch {
      setFormError("Could not connect to server.");
    } finally {
      setFormLoading(false);
    }
  }

  async function selectEmployee(employee: any) {
    const data = await apiGet(`/employees/${employee.id}`);
    setSelectedEmployee(data);
    setView("detail");
  }

  function openEditForm(employee: any) {
    setSelectedEmployee(employee);
    setFormData({
      first_name: employee.first_name || "",
      last_name: employee.last_name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      position: employee.position || "",
      department: employee.department || "",
      employment_type: employee.employment_type || "full_time",
      hire_date: employee.hire_date || "",
      address: employee.address || "",
      emergency_contact_name: employee.emergency_contact_name || "",
      emergency_contact_phone: employee.emergency_contact_phone || "",
      status: employee.status || "active",
    });
    setShowEditForm(true);
    setFormError("");
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      active: "var(--teal-light)",
      on_leave: "var(--amber-light)",
      terminated: "var(--red-light)",
      suspended: "var(--coral-light)",
    };
    return colors[status] || "var(--text-3)";
  }

  function getStatusBg(status: string) {
    const colors: Record<string, string> = {
      active: "var(--teal-fill)",
      on_leave: "var(--amber-fill)",
      terminated: "var(--red-fill)",
      suspended: "rgba(240,153,123,0.12)",
    };
    return colors[status] || "var(--bg-pill)";
  }

  if (loading) return <Spinner />;

  if (view === "detail" && selectedEmployee) {
    return (
      <div>
        <Topbar title={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}>
          <button className="btn" onClick={() => { setView("list"); setSelectedEmployee(null); }}>
            <i className="ti ti-arrow-left"></i> Back
          </button>
          {can('users.edit') && (
            <button className="btn btn-primary" onClick={() => openEditForm(selectedEmployee)}>
              <i className="ti ti-edit"></i> Edit
            </button>
          )}
        </Topbar>

        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16 }}>
          {/* Left Panel - Employee Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "var(--purple-fill)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--purple-text)",
                }}>
                  {selectedEmployee.first_name?.[0]}{selectedEmployee.last_name?.[0]}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{selectedEmployee.first_name} {selectedEmployee.last_name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>{selectedEmployee.position || "No position"}</div>
                  <span style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 20,
                    background: getStatusBg(selectedEmployee.status),
                    color: getStatusColor(selectedEmployee.status),
                    display: "inline-block",
                    marginTop: 4,
                  }}>
                    {selectedEmployee.status?.replace("_", " ") || "Active"}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 2 }}>Email</div>
              <div style={{ fontSize: 12, marginBottom: 8 }}>{selectedEmployee.email}</div>

              {selectedEmployee.phone && (
                <>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 2 }}>Phone</div>
                  <div style={{ fontSize: 12, marginBottom: 8 }}>{selectedEmployee.phone}</div>
                </>
              )}

              <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 2 }}>Department</div>
              <div style={{ fontSize: 12, marginBottom: 8 }}>{selectedEmployee.department || "—"}</div>

              <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 2 }}>Employee Number</div>
              <div style={{ fontSize: 12, marginBottom: 8 }}>{selectedEmployee.employee_number}</div>

              <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 2 }}>Hire Date</div>
              <div style={{ fontSize: 12 }}>{selectedEmployee.hire_date ? new Date(selectedEmployee.hire_date).toLocaleDateString() : "—"}</div>
            </Card>

            {/* Payment Summary */}
            {selectedEmployee.payment_detail && (
              <Card>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Payment Summary</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "0.5px solid var(--border)" }}>
                  <span style={{ color: "var(--text-3)" }}>Base Salary</span>
                  <span>KES {Number(selectedEmployee.payment_detail.base_salary).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "0.5px solid var(--border)" }}>
                  <span style={{ color: "var(--text-3)" }}>Allowances</span>
                  <span>KES {Number(selectedEmployee.payment_detail.housing_allowance + selectedEmployee.payment_detail.transport_allowance + selectedEmployee.payment_detail.medical_allowance + selectedEmployee.payment_detail.other_allowances).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, padding: "8px 0", borderTop: "0.5px solid var(--border)", marginTop: 4 }}>
                  <span>Total</span>
                  <span style={{ color: "var(--teal-light)" }}>KES {Number(selectedEmployee.payment_detail.base_salary + selectedEmployee.payment_detail.housing_allowance + selectedEmployee.payment_detail.transport_allowance + selectedEmployee.payment_detail.medical_allowance + selectedEmployee.payment_detail.other_allowances + selectedEmployee.payment_detail.bonus).toLocaleString()}</span>
                </div>
              </Card>
            )}
          </div>

          {/* Right Panel - Attendance & Leave */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Attendance */}
            <Card>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Recent Attendance</div>
              {selectedEmployee.attendance?.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--text-4)" }}>No attendance records</div>
              )}
              {selectedEmployee.attendance?.slice(0, 10).map((a: any) => (
                <div key={a.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "0.5px solid var(--border)",
                  fontSize: 12,
                }}>
                  <span>{new Date(a.date).toLocaleDateString()}</span>
                  <span style={{ color: "var(--text-3)" }}>{a.check_in ? a.check_in.substring(0, 5) : "—"} - {a.check_out ? a.check_out.substring(0, 5) : "—"}</span>
                  <span style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 12,
                    background: a.status === "present" ? "var(--teal-fill)" : a.status === "absent" ? "var(--red-fill)" : "var(--amber-fill)",
                    color: a.status === "present" ? "var(--teal-light)" : a.status === "absent" ? "var(--red-light)" : "var(--amber-light)",
                  }}>
                    {a.status}
                  </span>
                </div>
              ))}
            </Card>

            {/* Leave Requests */}
            <Card>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Pending Leave Requests</div>
              {selectedEmployee.leave_requests?.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--text-4)" }}>No pending leave requests</div>
              )}
              {selectedEmployee.leave_requests?.map((l: any) => (
                <div key={l.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "0.5px solid var(--border)",
                  fontSize: 12,
                }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{l.type.replace("_", " ")}</div>
                    <div style={{ fontSize: 10, color: "var(--text-3)" }}>{new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}</div>
                  </div>
                  <span style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 12,
                    background: "var(--amber-fill)",
                    color: "var(--amber-light)",
                  }}>
                    {l.days} days
                  </span>
                </div>
              ))}
            </Card>

            {/* Agreements */}
            <Card>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Agreements</div>
              {selectedEmployee.agreements?.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--text-4)" }}>No agreements</div>
              )}
              {selectedEmployee.agreements?.map((a: any) => (
                <div key={a.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "0.5px solid var(--border)",
                  fontSize: 12,
                }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{a.title}</div>
                    <div style={{ fontSize: 10, color: "var(--text-3)" }}>{a.type.replace("_", " ")}</div>
                  </div>
                  <span style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 12,
                    background: a.status === "signed" ? "var(--teal-fill)" : "var(--amber-fill)",
                    color: a.status === "signed" ? "var(--teal-light)" : "var(--amber-light)",
                  }}>
                    {a.status}
                  </span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Employees">
        {can('users.create') && (
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setFormError(""); }}>
            <i className="ti ti-plus"></i> Add Employee
          </button>
        )}
      </Topbar>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Total Employees", value: stats.total || 0, color: "var(--purple)" },
          { label: "Active", value: stats.active || 0, color: "var(--teal-light)" },
          { label: "On Leave", value: stats.on_leave || 0, color: "var(--amber-light)" },
          { label: "Terminated", value: stats.terminated || 0, color: "var(--red-light)" },
        ].map((s) => (
          <Card key={s.label} style={{ padding: 14 }}>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Employee List */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 150px 130px 120px 100px",
          gap: 14,
          background: "#0F0F0F",
          padding: "11px 16px",
          fontSize: 11,
          color: "var(--text-3)",
        }}>
          <span>Name</span>
          <span>Position</span>
          <span>Department</span>
          <span>Status</span>
          <span style={{ textAlign: "right" }}>Actions</span>
        </div>

        {employees.length === 0 && (
          <div style={{ padding: 24, fontSize: 13, color: "var(--text-4)", textAlign: "center" }}>
            No employees found
          </div>
        )}

        {employees.map((emp) => (
          <div
            key={emp.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 150px 130px 120px 100px",
              gap: 14,
              alignItems: "center",
              borderTop: "0.5px solid var(--border)",
              padding: "11px 16px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }} onClick={() => selectEmployee(emp)}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--purple-fill)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--purple-text)",
              }}>
                {emp.first_name?.[0]}{emp.last_name?.[0]}
              </div>
              <div>
                <div>{emp.first_name} {emp.last_name}</div>
                <div style={{ fontSize: 10, color: "var(--text-3)" }}>{emp.employee_number}</div>
              </div>
            </div>
            <span style={{ color: "var(--text-2)" }} onClick={() => selectEmployee(emp)}>{emp.position || "—"}</span>
            <span style={{ color: "var(--text-2)" }} onClick={() => selectEmployee(emp)}>{emp.department || "—"}</span>
            <span
              style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 12,
                background: getStatusBg(emp.status),
                color: getStatusColor(emp.status),
                width: "fit-content",
              }}
              onClick={() => selectEmployee(emp)}
            >
              {emp.status?.replace("_", " ") || "Active"}
            </span>
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <button
                onClick={() => selectEmployee(emp)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: "0.5px solid var(--border-2)",
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-3)",
                }}
              >
                <i className="ti ti-eye" style={{ fontSize: 13 }}></i>
              </button>
              {can('users.edit') && (
                <button
                  onClick={() => openEditForm(emp)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: "0.5px solid var(--border-2)",
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--blue-light)",
                  }}
                >
                  <i className="ti ti-edit" style={{ fontSize: 13 }}></i>
                </button>
              )}
            </div>
          </div>
        ))}
      </Card>

      {/* Create Employee Modal */}
      {showForm && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
        }}>
          <div style={{
            background: "var(--bg-panel)",
            borderRadius: "var(--radius-lg)",
            width: 560,
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            border: "0.5px solid var(--border)",
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderBottom: "0.5px solid var(--border)",
            }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Add Employee</span>
              <button onClick={() => setShowForm(false)} style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-3)",
                fontSize: 22,
              }}>×</button>
            </div>

            <div style={{ overflowY: "auto", padding: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {formError && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "var(--red-fill)",
                    border: "0.5px solid var(--red)",
                    borderRadius: "var(--radius-md)",
                    padding: "9px 12px",
                    fontSize: 12,
                    color: "var(--red-light)",
                  }}>
                    <i className="ti ti-alert-circle"></i> {formError}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>First Name *</label>
                    <input
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      placeholder="John"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>Last Name *</label>
                    <input
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      placeholder="Doe"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="john.doe@company.com"
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>Phone</label>
                    <input
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+254 700 000000"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>Position</label>
                    <input
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      placeholder="e.g. Software Engineer"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>Department</label>
                    <input
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      placeholder="e.g. Engineering"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>Employment Type</label>
                    <select
                      value={formData.employment_type}
                      onChange={(e) => setFormData({...formData, employment_type: e.target.value})}
                      style={selectStyle}
                    >
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>Hire Date</label>
                  <input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Physical address"
                    rows={2}
                    style={{ ...inputStyle, height: "auto", padding: "8px 12px", resize: "vertical" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>Emergency Contact Name</label>
                    <input
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                      placeholder="e.g. Jane Doe"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>Emergency Contact Phone</label>
                    <input
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                      placeholder="+254 700 000000"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button className="btn" onClick={() => setShowForm(false)} disabled={formLoading}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={formLoading}>
                  {formLoading ? <><i className="ti ti-loader"></i> Creating...</> : <><i className="ti ti-plus"></i> Add Employee</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditForm && selectedEmployee && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
        }}>
          <div style={{
            background: "var(--bg-panel)",
            borderRadius: "var(--radius-lg)",
            width: 560,
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            border: "0.5px solid var(--border)",
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderBottom: "0.5px solid var(--border)",
            }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Edit Employee</span>
              <button onClick={() => { setShowEditForm(false); setSelectedEmployee(null); }} style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-3)",
                fontSize: 22,
              }}>×</button>
            </div>

            <div style={{ overflowY: "auto", padding: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {formError && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "var(--red-fill)",
                    border: "0.5px solid var(--red)",
                    borderRadius: "var(--radius-md)",
                    padding: "9px 12px",
                    fontSize: 12,
                    color: "var(--red-light)",
                  }}>
                    <i className="ti ti-alert-circle"></i> {formError}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>First Name *</label>
                    <input
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      placeholder="John"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>Last Name *</label>
                    <input
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      placeholder="Doe"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="john.doe@company.com"
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>Phone</label>
                    <input
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+254 700 000000"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>Position</label>
                    <input
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      placeholder="e.g. Software Engineer"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>Department</label>
                    <input
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      placeholder="e.g. Engineering"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>Employment Type</label>
                    <select
                      value={formData.employment_type}
                      onChange={(e) => setFormData({...formData, employment_type: e.target.value})}
                      style={selectStyle}
                    >
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>Hire Date</label>
                  <input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    style={selectStyle}
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="suspended">Suspended</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Physical address"
                    rows={2}
                    style={{ ...inputStyle, height: "auto", padding: "8px 12px", resize: "vertical" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>Emergency Contact Name</label>
                    <input
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                      placeholder="e.g. Jane Doe"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>Emergency Contact Phone</label>
                    <input
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                      placeholder="+254 700 000000"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button className="btn" onClick={() => { setShowEditForm(false); setSelectedEmployee(null); }} disabled={formLoading}>Cancel</button>
                <button className="btn btn-primary" onClick={handleUpdate} disabled={formLoading}>
                  {formLoading ? <><i className="ti ti-loader"></i> Updating...</> : <><i className="ti ti-check"></i> Update Employee</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 38,
  background: "var(--bg-card)",
  border: "0.5px solid var(--border-2)",
  borderRadius: "var(--radius-md)",
  padding: "0 12px",
  fontSize: 13,
  color: "var(--text-1)",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};