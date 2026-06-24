"use client";

export function usePermissions() {
  if (typeof window === "undefined") return { can: () => false, role: null };

  const stored = localStorage.getItem("user");
  if (!stored) return { can: () => false, role: null };

  const user = JSON.parse(stored);
  const permissions: string[] = user.permissions ?? [];
  const role: string = user.role ?? "";

  function can(permission: string): boolean {
    return permissions.includes(permission);
  }

  function canAny(perms: string[]): boolean {
    return perms.some(p => permissions.includes(p));
  }

  return { can, canAny, role, permissions };
}