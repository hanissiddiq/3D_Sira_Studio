export type Role = "admin" | "operator" | "customer";

export const STAFF_ROLES: Role[] = ["admin", "operator"];

const PERMISSIONS = {
  "orders:read": ["admin", "operator"],
  "orders:update": ["admin", "operator"],
  "orders:delete": ["admin"],
  "products:write": ["admin", "operator"],
  "products:delete": ["admin"],
  "gallery:write": ["admin", "operator"],
  "reviews:moderate": ["admin", "operator"],
  "discounts:manage": ["admin"],
  "users:manage": ["admin"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | null | undefined, permission: Permission) {
  return !!role && (PERMISSIONS[permission] as readonly Role[]).includes(role);
}
