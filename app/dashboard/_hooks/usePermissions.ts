"use client";

export function usePermissions() {
  if (typeof window === "undefined") return {
    can: () => false,
    canAny: () => false,
    role: null,
    permissions: [],
    isAdmin: false,
    isSalesAgent: false,
    isSupportAgent: false,
  };

  const stored = localStorage.getItem("user");
  if (!stored) return {
    can: () => false,
    canAny: () => false,
    role: null,
    permissions: [],
    isAdmin: false,
    isSalesAgent: false,
    isSupportAgent: false,
  };

  const user = JSON.parse(stored);
  const permissions: string[] = user.permissions ?? [];
  const role: string = user.role ?? "";

  function can(permission: string): boolean {
    return permissions.includes(permission);
  }

  function canAny(perms: string[]): boolean {
    return perms.some(p => permissions.includes(p));
  }

  // Helper to check if user has ANY permission for a module
  function canAccessModule(module: string): boolean {
    const modulePermissions = [
      `${module}.view`,
      `${module}.create`,
      `${module}.edit`,
      `${module}.delete`
    ];
    return modulePermissions.some(p => permissions.includes(p));
  }

  return {
    can,
    canAny,
    canAccessModule,
    role,
    permissions,
    isAdmin: role === "admin",
    isSalesAgent: role === "sales_agent",
    isSupportAgent: role === "support_agent",
  };
}