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

const labelStyle: React.CSSProperties = { fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 };
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
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "var(--bg-panel)", borderRadius: "var(--radius-lg)", width: 540, maxHeight: "88vh", display: "flex", flexDirection: "column", border: "0.5px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "0.5px solid var(--border)", flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 22, lineHeight: 1 }}>&times;</button>
        </div>
        <div style={{ overflowY: "auto", padding: 20 }}>{children}</div>
      </div>
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
  
  // Employee form states
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

  // Attendance form
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    check_in: "08:00",
    check_out: "17:00",
    status: "present",
  });

  // Leave form
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: "annual",
    start_date: "",
    end_date: "",
    reason: "",
  });

  // Agreement form
  const [showAgreementForm, setShowAgreementForm] = useState(false);
  const [agreementForm, setAgreementForm] = useState({
    type: "employment_contract",
    title: "",
    description: "",
    signed_date: new Date().toISOString().split('T')[0],
    status: "draft",
  });

  // Payment Details form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    base_salary: "",
    housing_allowance: "",
    transport_allowance: "",
    medical_allowance: "",
    other_allowances: "",
    bonus: "",
    bank_name: "",
    bank_account: "",
    bank_branch: "",
    payment_frequency: "monthly",
  });

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

  function openPaymentForm(employee: any) {
    setSelectedEmployee(employee);
    if (employee.payment_detail) {
      setPaymentForm({
        base_salary: employee.payment_detail.base_salary || "",
        housing_allowance: employee.payment_detail.housing_allowance || "",
        transport_allowance: employee.payment_detail.transport_allowance || "",
        medical_allowance: employee.payment_detail.medical_allowance || "",
        other_allowances: employee.payment_detail.other_allowances || "",
        bonus: employee.payment_detail.bonus || "",
        bank_name: employee.payment_detail.bank_name || "",
        bank_account: employee.payment_detail.bank_account || "",
        bank_branch: employee.payment_detail.bank_branch || "",
        payment_frequency: employee.payment_detail.payment_frequency || "monthly",
      });
    } else {
      setPaymentForm({
        base_salary: "",
        housing_allowance: "",
        transport_allowance: "",
        medical_allowance: "",
        other_allowances: "",
        bonus: "",
        bank_name: "",
        bank_account: "",
        bank_branch: "",
        payment_frequency: "monthly",
      });
    }
    setShowPaymentForm(true);
  }

  async function handleSavePayment() {
    if (!paymentForm.base_salary) {
      alert("Base salary is required.");
      return;
    }
    try {
      const res = await apiPost("/employee-payment-details", {
        employee_id: selectedEmployee.id,
        base_salary: parseFloat(paymentForm.base_salary) || 0,
        housing_allowance: parseFloat(paymentForm.housing_allowance) || 0,
        transport_allowance: parseFloat(paymentForm.transport_allowance) || 0,
        medical_allowance: parseFloat(paymentForm.medical_allowance) || 0,
        other_allowances: parseFloat(paymentForm.other_allowances) || 0,
        bonus: parseFloat(paymentForm.bonus) || 0,
        bank_name: paymentForm.bank_name,
        bank_account: paymentForm.bank_account,
        bank_branch: paymentForm.bank_branch,
        payment_frequency: paymentForm.payment_frequency,
      });
      if (res.id || res.message) {
        alert("Payment details saved successfully!");
        setShowPaymentForm(false);
        selectEmployee(selectedEmployee);
      }
    } catch {
      alert("Failed to save payment details.");
    }
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

              {/* Payment Summary Button */}
              <button
                className="btn btn-primary"
                style={{ width: "100%", marginTop: 12, justifyContent: "center" }}
                onClick={() => openPaymentForm(selectedEmployee)}
              >
                <i className="ti ti-credit-card"></i> Manage Payment Details
              </button>
            </Card>

            {/* Payment Summary Display */}
            {selectedEmployee.payment_detail && (
              <Card>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Payment Summary</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "0.5px solid var(--border)" }}>
                  <span style={{ color: "var(--text-3)" }}>Base Salary</span>
                  <span>KES {Number(selectedEmployee.payment_detail.base_salary || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "0.5px solid var(--border)" }}>
                  <span style={{ color: "var(--text-3)" }}>Housing Allowance</span>
                  <span>KES {Number(selectedEmployee.payment_detail.housing_allowance || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "0.5px solid var(--border)" }}>
                  <span style={{ color: "var(--text-3)" }}>Transport Allowance</span>
                  <span>KES {Number(selectedEmployee.payment_detail.transport_allowance || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "0.5px solid var(--border)" }}>
                  <span style={{ color: "var(--text-3)" }}>Medical Allowance</span>
                  <span>KES {Number(selectedEmployee.payment_detail.medical_allowance || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "0.5px solid var(--border)" }}>
                  <span style={{ color: "var(--text-3)" }}>Other Allowances</span>
                  <span>KES {Number(selectedEmployee.payment_detail.other_allowances || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "0.5px solid var(--border)" }}>
                  <span style={{ color: "var(--text-3)" }}>Bonus</span>
                  <span>KES {Number(selectedEmployee.payment_detail.bonus || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, padding: "8px 0", borderTop: "0.5px solid var(--border)", marginTop: 4 }}>
                  <span>Total Compensation</span>
                  <span style={{ color: "var(--teal-light)" }}>
                    KES {(
                      Number(selectedEmployee.payment_detail.base_salary || 0) +
                      Number(selectedEmployee.payment_detail.housing_allowance || 0) +
                      Number(selectedEmployee.payment_detail.transport_allowance || 0) +
                      Number(selectedEmployee.payment_detail.medical_allowance || 0) +
                      Number(selectedEmployee.payment_detail.other_allowances || 0) +
                      Number(selectedEmployee.payment_detail.bonus || 0)
                    ).toLocaleString()}
                  </span>
                </div>
              </Card>
            )}
          </div>

          {/* Right Panel - Attendance, Leave, Agreements */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Attendance */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Recent Attendance</div>
                <button 
                  className="btn btn-primary" 
                  style={{ fontSize: 11, padding: "4px 12px", height: 30 }}
                  onClick={() => setShowAttendanceForm(true)}
                >
                  <i className="ti ti-plus"></i> Add
                </button>
              </div>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Leave Requests</div>
                <button 
                  className="btn btn-primary" 
                  style={{ fontSize: 11, padding: "4px 12px", height: 30 }}
                  onClick={() => setShowLeaveForm(true)}
                >
                  <i className="ti ti-plus"></i> Request
                </button>
              </div>
              {selectedEmployee.leave_requests?.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--text-4)" }}>No leave requests</div>
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
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, color: "var(--text-3)" }}>{l.days} days</span>
                    <span style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: 12,
                      background: l.status === "approved" ? "var(--teal-fill)" : l.status === "pending" ? "var(--amber-fill)" : "var(--red-fill)",
                      color: l.status === "approved" ? "var(--teal-light)" : l.status === "pending" ? "var(--amber-light)" : "var(--red-light)",
                    }}>
                      {l.status}
                    </span>
                  </div>
                </div>
              ))}
            </Card>

            {/* Agreements */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Agreements</div>
                <button 
                  className="btn btn-primary" 
                  style={{ fontSize: 11, padding: "4px 12px", height: 30 }}
                  onClick={() => setShowAgreementForm(true)}
                >
                  <i className="ti ti-plus"></i> Add
                </button>
              </div>
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

        {/* Attendance Form Modal */}
        {showAttendanceForm && (
          <Modal title="Add Attendance" onClose={() => setShowAttendanceForm(false)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Date</label>
                <input
                  type="date"
                  value={attendanceForm.date}
                  onChange={(e) => setAttendanceForm({...attendanceForm, date: e.target.value})}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Check In</label>
                  <input
                    type="time"
                    value={attendanceForm.check_in}
                    onChange={(e) => setAttendanceForm({...attendanceForm, check_in: e.target.value})}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Check Out</label>
                  <input
                    type="time"
                    value={attendanceForm.check_out}
                    onChange={(e) => setAttendanceForm({...attendanceForm, check_out: e.target.value})}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm({...attendanceForm, status: e.target.value})}
                  style={selectStyle}
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="half_day">Half Day</option>
                  <option value="holiday">Holiday</option>
                  <option value="sick">Sick</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button className="btn" onClick={() => setShowAttendanceForm(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={async () => {
                  try {
                    const res = await apiPost("/attendance", {
                      employee_id: selectedEmployee.id,
                      date: attendanceForm.date,
                      check_in: attendanceForm.check_in,
                      check_out: attendanceForm.check_out,
                      status: attendanceForm.status,
                    });
                    if (res.id) {
                      alert("Attendance recorded successfully!");
                      setShowAttendanceForm(false);
                      selectEmployee(selectedEmployee);
                    }
                  } catch {
                    alert("Failed to record attendance.");
                  }
                }}
              >
                <i className="ti ti-check"></i> Save
              </button>
            </div>
          </Modal>
        )}

        {/* Leave Request Form Modal */}
        {showLeaveForm && (
          <Modal title="Request Leave" onClose={() => setShowLeaveForm(false)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Leave Type</label>
                <select
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value})}
                  style={selectStyle}
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                  <option value="bereavement">Bereavement</option>
                  <option value="study">Study Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Start Date</label>
                  <input
                    type="date"
                    value={leaveForm.start_date}
                    onChange={(e) => setLeaveForm({...leaveForm, start_date: e.target.value})}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>End Date</label>
                  <input
                    type="date"
                    value={leaveForm.end_date}
                    onChange={(e) => setLeaveForm({...leaveForm, end_date: e.target.value})}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Reason</label>
                <textarea
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                  placeholder="Reason for leave..."
                  rows={3}
                  style={{ ...inputStyle, height: "auto", padding: "8px 12px", resize: "vertical" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button className="btn" onClick={() => setShowLeaveForm(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={async () => {
                  if (!leaveForm.start_date || !leaveForm.end_date) {
                    alert("Please select start and end dates.");
                    return;
                  }
                  try {
                    const res = await apiPost("/leave-requests", {
                      employee_id: selectedEmployee.id,
                      type: leaveForm.type,
                      start_date: leaveForm.start_date,
                      end_date: leaveForm.end_date,
                      reason: leaveForm.reason,
                    });
                    if (res.id) {
                      alert("Leave request submitted successfully!");
                      setShowLeaveForm(false);
                      selectEmployee(selectedEmployee);
                    }
                  } catch {
                    alert("Failed to submit leave request.");
                  }
                }}
              >
                <i className="ti ti-check"></i> Submit Request
              </button>
            </div>
          </Modal>
        )}

        {/* Agreement Form Modal */}
        {showAgreementForm && (
          <Modal title="Add Agreement" onClose={() => setShowAgreementForm(false)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Agreement Type</label>
                <select
                  value={agreementForm.type}
                  onChange={(e) => setAgreementForm({...agreementForm, type: e.target.value})}
                  style={selectStyle}
                >
                  <option value="employment_contract">Employment Contract</option>
                  <option value="nda">NDA</option>
                  <option value="non_compete">Non-Compete</option>
                  <option value="salary_agreement">Salary Agreement</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Title</label>
                <input
                  type="text"
                  value={agreementForm.title}
                  onChange={(e) => setAgreementForm({...agreementForm, title: e.target.value})}
                  placeholder="Agreement title"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={agreementForm.description}
                  onChange={(e) => setAgreementForm({...agreementForm, description: e.target.value})}
                  placeholder="Agreement description..."
                  rows={3}
                  style={{ ...inputStyle, height: "auto", padding: "8px 12px", resize: "vertical" }}
                />
              </div>
              <div>
                <label style={labelStyle}>Signed Date</label>
                <input
                  type="date"
                  value={agreementForm.signed_date}
                  onChange={(e) => setAgreementForm({...agreementForm, signed_date: e.target.value})}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select
                  value={agreementForm.status}
                  onChange={(e) => setAgreementForm({...agreementForm, status: e.target.value})}
                  style={selectStyle}
                >
                  <option value="draft">Draft</option>
                  <option value="signed">Signed</option>
                  <option value="expired">Expired</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button className="btn" onClick={() => setShowAgreementForm(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={async () => {
                  if (!agreementForm.title) {
                    alert("Please enter a title.");
                    return;
                  }
                  try {
                    const res = await apiPost("/employee-agreements", {
                      employee_id: selectedEmployee.id,
                      type: agreementForm.type,
                      title: agreementForm.title,
                      description: agreementForm.description,
                      signed_date: agreementForm.signed_date,
                      status: agreementForm.status,
                    });
                    if (res.id) {
                      alert("Agreement added successfully!");
                      setShowAgreementForm(false);
                      selectEmployee(selectedEmployee);
                    }
                  } catch {
                    alert("Failed to add agreement.");
                  }
                }}
              >
                <i className="ti ti-check"></i> Save
              </button>
            </div>
          </Modal>
        )}

        {/* Payment Details Form Modal */}
        {showPaymentForm && selectedEmployee && (
          <Modal title={`Payment Details - ${selectedEmployee.first_name} ${selectedEmployee.last_name}`} onClose={() => setShowPaymentForm(false)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Base Salary *</label>
                  <input
                    type="number"
                    value={paymentForm.base_salary}
                    onChange={(e) => setPaymentForm({...paymentForm, base_salary: e.target.value})}
                    placeholder="0"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Housing Allowance</label>
                  <input
                    type="number"
                    value={paymentForm.housing_allowance}
                    onChange={(e) => setPaymentForm({...paymentForm, housing_allowance: e.target.value})}
                    placeholder="0"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Transport Allowance</label>
                  <input
                    type="number"
                    value={paymentForm.transport_allowance}
                    onChange={(e) => setPaymentForm({...paymentForm, transport_allowance: e.target.value})}
                    placeholder="0"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Medical Allowance</label>
                  <input
                    type="number"
                    value={paymentForm.medical_allowance}
                    onChange={(e) => setPaymentForm({...paymentForm, medical_allowance: e.target.value})}
                    placeholder="0"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Other Allowances</label>
                  <input
                    type="number"
                    value={paymentForm.other_allowances}
                    onChange={(e) => setPaymentForm({...paymentForm, other_allowances: e.target.value})}
                    placeholder="0"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Bonus</label>
                  <input
                    type="number"
                    value={paymentForm.bonus}
                    onChange={(e) => setPaymentForm({...paymentForm, bonus: e.target.value})}
                    placeholder="0"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Bank Name</label>
                  <input
                    type="text"
                    value={paymentForm.bank_name}
                    onChange={(e) => setPaymentForm({...paymentForm, bank_name: e.target.value})}
                    placeholder="e.g. KCB Bank"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Bank Account</label>
                  <input
                    type="text"
                    value={paymentForm.bank_account}
                    onChange={(e) => setPaymentForm({...paymentForm, bank_account: e.target.value})}
                    placeholder="Account number"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Bank Branch</label>
                  <input
                    type="text"
                    value={paymentForm.bank_branch}
                    onChange={(e) => setPaymentForm({...paymentForm, bank_branch: e.target.value})}
                    placeholder="e.g. Nairobi"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Payment Frequency</label>
                  <select
                    value={paymentForm.payment_frequency}
                    onChange={(e) => setPaymentForm({...paymentForm, payment_frequency: e.target.value})}
                    style={selectStyle}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="biweekly">Bi-Weekly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              {/* Total Preview */}
              <div style={{
                background: "var(--bg-app)",
                borderRadius: "var(--radius-md)",
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                fontWeight: 600,
                borderTop: "0.5px solid var(--border)",
                marginTop: 8,
              }}>
                <span>Total Monthly Compensation</span>
                <span style={{ color: "var(--teal-light)" }}>
                  KES {(
                    (parseFloat(paymentForm.base_salary) || 0) +
                    (parseFloat(paymentForm.housing_allowance) || 0) +
                    (parseFloat(paymentForm.transport_allowance) || 0) +
                    (parseFloat(paymentForm.medical_allowance) || 0) +
                    (parseFloat(paymentForm.other_allowances) || 0) +
                    (parseFloat(paymentForm.bonus) || 0)
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button className="btn" onClick={() => setShowPaymentForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSavePayment}>
                <i className="ti ti-check"></i> Save Payment Details
              </button>
            </div>
          </Modal>
        )}
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
        <Modal title="Add Employee" onClose={() => setShowForm(false)}>
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
                <label style={labelStyle}>First Name *</label>
                <input
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  placeholder="John"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Last Name *</label>
                <input
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  placeholder="Doe"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Email *</label>
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
                <label style={labelStyle}>Phone</label>
                <input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+254 700 000000"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Position</label>
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
                <label style={labelStyle}>Department</label>
                <input
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  placeholder="e.g. Engineering"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Employment Type</label>
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
              <label style={labelStyle}>Hire Date</label>
              <input
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Address</label>
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
                <label style={labelStyle}>Emergency Contact Name</label>
                <input
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                  placeholder="e.g. Jane Doe"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Emergency Contact Phone</label>
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
        </Modal>
      )}

      {/* Edit Employee Modal */}
      {showEditForm && selectedEmployee && (
        <Modal title="Edit Employee" onClose={() => { setShowEditForm(false); setSelectedEmployee(null); }}>
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
                <label style={labelStyle}>First Name *</label>
                <input
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Last Name *</label>
                <input
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Position</label>
                <input
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Department</label>
                <input
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Employment Type</label>
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
              <label style={labelStyle}>Hire Date</label>
              <input
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Status</label>
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
              <label style={labelStyle}>Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                rows={2}
                style={{ ...inputStyle, height: "auto", padding: "8px 12px", resize: "vertical" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Emergency Contact Name</label>
                <input
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Emergency Contact Phone</label>
                <input
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
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
        </Modal>
      )}
    </div>
  );
}