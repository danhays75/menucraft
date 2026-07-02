// RoleBadge — colored badge showing a user's role.
// Roadhouse palette: admin = red + gold edge, staff (UserRole.user) = muted
// roadhouse steel, guest = neutral ash. Uses semantic tokens so it re-themes
// with admin customization.

import { UserRole } from "@/backend";
import type { UserRole as UserRoleType } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ROLE_META: Record<UserRoleType, { label: string; className: string }> = {
  [UserRole.admin]: {
    label: "Admin",
    className:
      "border-primary/50 bg-primary/15 text-primary [a&]:hover:bg-primary/20",
  },
  [UserRole.user]: {
    label: "Staff",
    className:
      "border-border bg-muted text-muted-foreground [a&]:hover:bg-muted/80",
  },
  [UserRole.guest]: {
    label: "Guest",
    className:
      "border-border/60 bg-muted/40 text-muted-foreground/80 [a&]:hover:bg-muted/60",
  },
};

export function RoleBadge({
  role,
  className,
}: {
  role: UserRoleType;
  className?: string;
}) {
  const meta = ROLE_META[role] ?? ROLE_META[UserRole.guest];
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-heading text-xs font-semibold uppercase tracking-wide",
        meta.className,
        className,
      )}
      data-ocid="role.badge"
    >
      {meta.label}
    </Badge>
  );
}
