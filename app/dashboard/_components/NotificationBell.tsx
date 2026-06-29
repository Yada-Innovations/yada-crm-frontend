"use client";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { apiGet, apiPatch, apiDelete, apiPost } from "@/lib/api";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen]);

  async function loadNotifications() {
    try {
      const data = await apiGet('/notifications');
      if (data && data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
    setLoading(false);
  }

  async function markAsRead(id: string) {
    try {
      await apiPatch(`/notifications/${id}/read`, {});
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  async function markAllRead() {
    try {
      await apiPost('/notifications/read-all', {});
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }

  async function deleteNotification(id: string) {
    try {
      await apiDelete(`/notifications/${id}`);
      loadNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function getIcon(type: string) {
    const icons: Record<string, string> = {
      info: "ti-info-circle",
      success: "ti-check-circle",
      warning: "ti-alert-triangle",
      error: "ti-alert-circle",
    };
    return icons[type] || "ti-bell";
  }

  function getColor(type: string) {
    const colors: Record<string, string> = {
      info: "var(--blue-light)",
      success: "var(--teal-light)",
      warning: "var(--amber-light)",
      error: "var(--red-light)",
    };
    return colors[type] || "var(--text-3)";
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "6px 8px",
          borderRadius: "var(--radius-md)",
          color: "var(--text-2)",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-1)"}
        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-2)"}
      >
        <i className="ti ti-bell" style={{ fontSize: 20 }}></i>
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: -2,
            right: -2,
            background: "var(--red)",
            color: "#fff",
            fontSize: 9,
            fontWeight: 600,
            padding: "1px 5px",
            borderRadius: 10,
            minWidth: 16,
            textAlign: "center",
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: dropdownPosition.top,
            right: dropdownPosition.right,
            width: 380,
            maxHeight: 500,
            background: "var(--bg-panel)",
            borderRadius: "var(--radius-lg)",
            border: "0.5px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            overflow: "hidden",
            zIndex: 99999,
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "0.5px solid var(--border)",
            background: "var(--bg-card)",
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: 8,
                  fontSize: 11,
                  color: "var(--text-3)",
                  fontWeight: 400,
                }}>
                  ({unreadCount} unread)
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  fontSize: 11,
                  color: "var(--purple)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "var(--radius-md)",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", maxHeight: 400 }}>
            {loading ? (
              <div style={{ padding: 30, textAlign: "center", color: "var(--text-3)" }}>
                <i className="ti ti-loader" style={{ fontSize: 24, animation: "spin 1s linear infinite" }}></i>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)" }}>
                <i className="ti ti-bell-off" style={{ fontSize: 32, display: "block", marginBottom: 8 }}></i>
                <span style={{ fontSize: 13 }}>No notifications</span>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "0.5px solid var(--border)",
                    background: n.read ? "transparent" : "var(--bg-app)",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onClick={() => !n.read && markAsRead(n.id)}
                  onMouseEnter={(e) => {
                    if (!n.read) e.currentTarget.style.background = "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!n.read) e.currentTarget.style.background = "var(--bg-app)";
                  }}
                >
                  <div style={{ display: "flex", gap: 10 }}>
                    <i className={`ti ${getIcon(n.type)}`} style={{ 
                      color: getColor(n.type), 
                      fontSize: 18, 
                      flexShrink: 0, 
                      marginTop: 2 
                    }}></i>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: 13, 
                        fontWeight: n.read ? 400 : 600,
                        color: "var(--text-1)"
                      }}>
                        {n.title}
                      </div>
                      <div style={{ 
                        fontSize: 12, 
                        color: "var(--text-3)", 
                        marginTop: 4,
                        wordBreak: "break-word"
                      }}>
                        {n.message}
                      </div>
                      {n.link && (
                        <a 
                          href={n.link}
                          style={{
                            fontSize: 11,
                            color: "var(--purple)",
                            marginTop: 4,
                            display: "inline-block",
                            textDecoration: "none",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          View details →
                        </a>
                      )}
                      <div style={{ 
                        fontSize: 10, 
                        color: "var(--text-4)", 
                        marginTop: 6 
                      }}>
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n.id);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-4)",
                        padding: "2px 4px",
                        borderRadius: 4,
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "var(--red-light)"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-4)"}
                    >
                      <i className="ti ti-x" style={{ fontSize: 16 }}></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}