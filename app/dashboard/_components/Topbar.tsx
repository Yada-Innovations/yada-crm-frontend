"use client";
import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";

interface TopbarProps {
  title: string;
  children?: ReactNode;
  style?: React.CSSProperties;
}

export function Topbar({ title, children, style }: TopbarProps) {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Get user from localStorage or API
    const token = localStorage.getItem('token');
    if (token) {
      // You can fetch user data here
      setUser({
        name: "Rose Wanjiku",
        email: "admin@yadacrm.com",
        role: "Admin"
      });
    }
  }, []);

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 0 12px 0",
      background: "#FFFFFF",
      borderBottom: "1px solid #E8E8E8",
      ...style,
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <h1 style={{
          fontSize: 18,
          fontWeight: 600,
          color: "#1A1A1A",
          margin: 0,
        }}>{title}</h1>
        <p style={{
          fontSize: 12,
          color: "#666",
          margin: 0,
          fontWeight: 400,
        }}>
          Manage your prospective clients.
        </p>
      </div>

      {/* Right side - User profile and notifications */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 16,
      }}>
        {/* Action buttons (Add Lead, etc.) */}
        {children && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {children}
          </div>
        )}

        {/* Notification Bell */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "1px solid #E0E0E0",
              background: "#F8F8F8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#EEEEEE";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#F8F8F8";
            }}
          >
            <i className="ti ti-bell" style={{ fontSize: 18, color: "#4A4A4A" }}></i>
            {/* Notification badge */}
            <span style={{
              position: "absolute",
              top: -2,
              right: -2,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "var(--red)",
              color: "#fff",
              fontSize: 9,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              3
            </span>
          </button>

          {/* Notification dropdown */}
          {showNotifications && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: 320,
              maxHeight: 400,
              overflowY: "auto",
              background: "#FFFFFF",
              border: "1px solid #E0E0E0",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              zIndex: 100,
              padding: "8px 0",
            }}>
              <div style={{
                padding: "10px 16px",
                borderBottom: "1px solid #F0F0F0",
                fontSize: 12,
                fontWeight: 600,
                color: "#1A1A1A",
              }}>
                Notifications
              </div>
              <div style={{ padding: "8px 16px", fontSize: 12, color: "#666" }}>
                <div style={{
                  padding: "8px 0",
                  borderBottom: "1px solid #F5F5F5",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--purple)",
                    marginTop: 4,
                    flexShrink: 0,
                  }}></div>
                  <div>
                    <div style={{ fontWeight: 500, color: "#1A1A1A" }}>New lead assigned</div>
                    <div style={{ fontSize: 11, color: "#999" }}>John Doe was assigned to you</div>
                    <div style={{ fontSize: 10, color: "#BBB", marginTop: 4 }}>2 hours ago</div>
                  </div>
                </div>
                <div style={{
                  padding: "8px 0",
                  borderBottom: "1px solid #F5F5F5",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--teal)",
                    marginTop: 4,
                    flexShrink: 0,
                  }}></div>
                  <div>
                    <div style={{ fontWeight: 500, color: "#1A1A1A" }}>Lead converted to client</div>
                    <div style={{ fontSize: 11, color: "#999" }}>Jane Smith converted successfully</div>
                    <div style={{ fontSize: 10, color: "#BBB", marginTop: 4 }}>5 hours ago</div>
                  </div>
                </div>
                <div style={{
                  padding: "8px 0",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--amber)",
                    marginTop: 4,
                    flexShrink: 0,
                  }}></div>
                  <div>
                    <div style={{ fontWeight: 500, color: "#1A1A1A" }}>Meeting reminder</div>
                    <div style={{ fontSize: 11, color: "#999" }}>Team sync in 30 minutes</div>
                    <div style={{ fontSize: 10, color: "#BBB", marginTop: 4 }}>1 day ago</div>
                  </div>
                </div>
              </div>
              <div style={{
                padding: "8px 16px",
                borderTop: "1px solid #F0F0F0",
                textAlign: "center",
              }}>
                <Link 
                  href="/dashboard/notifications"
                  style={{
                    fontSize: 12,
                    color: "var(--purple)",
                    textDecoration: "none",
                  }}
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "4px 12px 4px 4px",
          borderRadius: "8px",
          background: "#F8F8F8",
          border: "1px solid #E0E0E0",
          cursor: "pointer",
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--purple-fill)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--purple)",
          }}>
            {user?.name?.charAt(0) || "R"}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#1A1A1A" }}>
              {user?.name || "Rose Wanjiku"}
            </div>
            <div style={{ fontSize: 10, color: "#999" }}>
              {user?.role || "Admin"} • {user?.email || "admin@yadacrm.com"}
            </div>
          </div>
          <i className="ti ti-chevron-down" style={{ fontSize: 14, color: "#999" }}></i>
        </div>
      </div>
    </div>
  );
}