"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState, useEffect } from "react";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: "ti-dashboard" },
  { name: "Leads", href: "/dashboard/leads", icon: "ti-users" },
  { name: "Employees", href: "/dashboard/employees", icon: "ti-user-circle" },
  { name: "Clients", href: "/dashboard/clients", icon: "ti-building" },
  { name: "Services", href: "/dashboard/services", icon: "ti-settings" },
  { name: "Quotes", href: "/dashboard/quotes", icon: "ti-file-text" },
  { name: "Work Orders", href: "/dashboard/work-orders", icon: "ti-clipboard" },
  { name: "Roles & Permissions", href: "/dashboard/rbac", icon: "ti-shield" },
];

export function Sidebar({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 100,
          background: "#FFFFFF",
          border: "1px solid #D1D5DB",
          borderRadius: "6px",
          padding: "6px 10px",
          cursor: "pointer",
          display: isMobile ? "block" : "none",
          color: "#1F2937",
        }}
      >
        <i className="ti ti-menu-2" style={{ fontSize: 18 }}></i>
      </button>

      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 49,
          }}
        />
      )}

      {/* ── SIDEBAR - WHITE BACKGROUND ── */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: 220,
        background: "#FFFFFF",        // ← WHITE background
        borderRight: "1px solid #E5E7EB",
        display: "flex",
        flexDirection: "column",
        transform: isMobile ? (isOpen ? "translateX(0)" : "translateX(-100%)") : "translateX(0)",
        transition: "transform 0.2s ease",
        zIndex: 50,
        overflow: "hidden",
      }}>
        {/* Brand */}
        <div style={{
          padding: "16px 18px",
          borderBottom: "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
          background: "#FFFFFF",
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: "6px",
            background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 12,
          }}>
            Y
          </div>
          <span style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#1F2937",
          }}>YADA CRM</span>
        </div>

        {/* Navigation */}
        <nav style={{
          flex: 1,
          padding: "12px 10px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          background: "#FFFFFF",
        }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: "6px",
                  color: isActive ? "#1F2937" : "#6B7280",
                  background: isActive ? "#EDE9FE" : "transparent",
                  border: isActive ? "1px solid #C4B5FD" : "1px solid transparent",
                  fontWeight: isActive ? 500 : 400,
                  fontSize: 13,
                  transition: "all 0.15s",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "#F3F4F6";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <i className={`ti ${item.icon}`} style={{ fontSize: 16, width: 20 }}></i>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer - White background */}
        <div style={{
          padding: "12px 18px",
          borderTop: "1px solid #E5E7EB",
          flexShrink: 0,
          background: "#FFFFFF",
        }}>
          <Link
            href="/signin"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 8px",
              borderRadius: "6px",
              textDecoration: "none",
              transition: "all 0.15s",
            }}
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.clear();
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F3F4F6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#EDE9FE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 600,
              color: "#6D28D9",
            }}>
              A
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#1F2937" }}>Admin User</div>
              <div style={{ fontSize: 10, color: "#6B7280" }}>admin@yadacrm.com</div>
            </div>
            <i className="ti ti-logout" style={{ color: "#6B7280", fontSize: 16 }}></i>
          </Link>
        </div>
      </div>

      {/* Main content wrapper - Light grey background */}
      <div style={{ 
        marginLeft: isMobile ? 0 : 220, 
        minHeight: "100vh", 
        background: "#F9FAFB"  // ← Light grey background
      }}>
        {children}
      </div>
    </>
  );
}