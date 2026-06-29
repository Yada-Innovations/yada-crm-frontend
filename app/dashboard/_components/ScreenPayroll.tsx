"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch } from "@/lib/api";

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

export function ScreenPayroll() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [showGenerate, setShowGenerate] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [payrollData, summaryData, employeesData] = await Promise.all([
        apiGet('/payroll'),
        apiGet('/payroll/summary'),
        apiGet('/employees')
      ]);
      setPayrolls(Array.isArray(payrollData) ? payrollData : []);
      setSummary(summaryData || {});
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCalculate = async () => {
    if (!selectedEmployee) {
      alert("Please select an employee.");
      return;
    }
    setCalculating(true);
    try {
      const data = await apiGet(`/payroll/calculate/${selectedEmployee}`);
      setCalculationResult(data);
    } catch (error) {
      console.error("Failed to calculate payroll:", error);
      alert("Failed to calculate payroll. Make sure employee has payment details.");
    }
    setCalculating(false);
  };

  const handleGenerate = async () => {
    if (!selectedEmployee) {
      alert("Please select an employee first.");
      return;
    }

    if (!calculationResult) {
      alert("Please calculate payroll first.");
      return;
    }

    setGenerating(true);
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const periodStart = firstDay.toISOString().split('T')[0];
      const periodEnd = lastDay.toISOString().split('T')[0];

      const data = await apiPost('/payroll/generate', {
        employee_id: selectedEmployee,
        period_start: periodStart,
        period_end: periodEnd,
      });

      if (data.id) {
        alert("Payroll generated successfully!");
        setShowGenerate(false);
        setCalculationResult(null);
        setSelectedEmployee("");
        load();
      } else {
        alert("Failed to generate payroll: " + (data.message || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Failed to generate payroll:", error);
      alert("Failed to generate payroll. Error: " + (error.message || "Please check console"));
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "var(--amber-light)",
      approved: "var(--blue-light)",
      paid: "var(--teal-light)",
    };
    return colors[status] || "var(--text-3)";
  };

  const getStatusBg = (status: string) => {
    const colors: Record<string, string> = {
      draft: "var(--amber-fill)",
      approved: "rgba(133,183,235,0.12)",
      paid: "var(--teal-fill)",
    };
    return colors[status] || "var(--bg-pill)";
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <Topbar title="Payroll">
        <button className="btn btn-primary" onClick={() => setShowGenerate(true)}>
          <i className="ti ti-plus"></i> Generate Payroll
        </button>
      </Topbar>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Period", value: summary.period || "N/A", color: "var(--purple)" },
          { label: "Employees", value: summary.total_employees || 0, color: "var(--blue-light)" },
          { label: "Gross Pay", value: `KES ${(summary.total_gross_pay || 0).toLocaleString()}`, color: "var(--text-1)" },
          { label: "Net Pay", value: `KES ${(summary.total_net_pay || 0).toLocaleString()}`, color: "var(--teal-light)" },
          { label: "Tax", value: `KES ${(summary.total_tax || 0).toLocaleString()}`, color: "var(--amber-light)" },
        ].map((s) => (
          <Card key={s.label} style={{ padding: 14 }}>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "150px 1fr 130px 120px 120px 100px",
          gap: 12,
          background: "#0F0F0F",
          padding: "11px 16px",
          fontSize: 11,
          color: "var(--text-3)",
        }}>
          <span>Employee</span>
          <span>Period</span>
          <span style={{ textAlign: "right" }}>Gross Pay</span>
          <span style={{ textAlign: "right" }}>Net Pay</span>
          <span>Tax</span>
          <span>Status</span>
        </div>

        {payrolls.length === 0 && (
          <div style={{ padding: 24, fontSize: 13, color: "var(--text-4)", textAlign: "center" }}>
            No payroll records found
          </div>
        )}

        {payrolls.map((p) => (
          <div key={p.id} style={{
            display: "grid",
            gridTemplateColumns: "150px 1fr 130px 120px 120px 100px",
            gap: 12,
            alignItems: "center",
            borderTop: "0.5px solid var(--border)",
            padding: "11px 16px",
            fontSize: 12,
          }}>
            <span style={{ fontWeight: 500 }}>{p.employee?.first_name} {p.employee?.last_name}</span>
            <span style={{ color: "var(--text-2)" }}>{p.period}</span>
            <span style={{ textAlign: "right", color: "var(--text-1)" }}>KES {Number(p.gross_pay).toLocaleString()}</span>
            <span style={{ textAlign: "right", color: "var(--teal-light)" }}>KES {Number(p.net_pay).toLocaleString()}</span>
            <span style={{ color: "var(--amber-light)" }}>KES {Number(p.tax_paye).toLocaleString()}</span>
            <span style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 12,
              background: getStatusBg(p.status),
              color: getStatusColor(p.status),
              width: "fit-content",
            }}>
              {p.status}
            </span>
          </div>
        ))}
      </Card>

      {/* Generate Payroll Modal */}
      {showGenerate && (
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
            width: 500,
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
              <span style={{ fontSize: 15, fontWeight: 600 }}>Generate Payroll</span>
              <button onClick={() => { setShowGenerate(false); setCalculationResult(null); setSelectedEmployee(""); }} style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-3)",
                fontSize: 22,
              }}>&times;</button>
            </div>

            <div style={{ overflowY: "auto", padding: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 6 }}>Select Employee</label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    style={{
                      width: "100%",
                      height: 38,
                      background: "var(--bg-card)",
                      border: "0.5px solid var(--border-2)",
                      borderRadius: "var(--radius-md)",
                      padding: "0 12px",
                      fontSize: 13,
                      color: "var(--text-1)",
                    }}
                  >
                    <option value="">Select employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                    ))}
                  </select>
                </div>

                {selectedEmployee && (
                  <button
                    className="btn btn-primary"
                    onClick={handleCalculate}
                    disabled={calculating}
                    style={{
                      height: 38,
                      border: "none",
                      background: "var(--purple-deep)",
                      color: "#EEEDFE",
                      cursor: calculating ? "not-allowed" : "pointer",
                      opacity: calculating ? 0.6 : 1,
                    }}
                  >
                    {calculating ? "Calculating..." : "Calculate Payroll"}
                  </button>
                )}

                {calculationResult && (
                  <div style={{
                    background: "var(--bg-card)",
                    borderRadius: "var(--radius-md)",
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}>
                    <h4 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Payroll Summary for {calculationResult.employee}</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { label: "Gross Pay", value: `KES ${calculationResult.gross_pay?.toLocaleString() || 0}` },
                        { label: "Tax (PAYE)", value: `KES ${calculationResult.tax_paye?.toLocaleString() || 0}` },
                        { label: "NSSF", value: `KES ${calculationResult.nssf_employee?.toLocaleString() || 0}` },
                        { label: "AHL", value: `KES ${calculationResult.ahl?.toLocaleString() || 0}` },
                        { label: "Net Pay", value: `KES ${calculationResult.net_pay?.toLocaleString() || 0}` },
                        { label: "Employer Cost", value: `KES ${calculationResult.employer_cost?.toLocaleString() || 0}` },
                      ].map((item) => (
                        <div key={item.label} style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "4px 8px",
                          background: "var(--bg-app)",
                          borderRadius: 4,
                          fontSize: 12,
                        }}>
                          <span style={{ color: "var(--text-3)" }}>{item.label}</span>
                          <span style={{ fontWeight: 500 }}>{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={handleGenerate}
                      disabled={generating}
                      style={{
                        height: 38,
                        border: "none",
                        background: generating ? "var(--text-4)" : "var(--teal)",
                        color: "#fff",
                        cursor: generating ? "not-allowed" : "pointer",
                        opacity: generating ? 0.6 : 1,
                        marginTop: 8,
                      }}
                    >
                      {generating ? (
                        <><i className="ti ti-loader" style={{ animation: "spin 1s linear infinite" }}></i> Generating...</>
                      ) : (
                        <><i className="ti ti-check"></i> Generate Payroll</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}