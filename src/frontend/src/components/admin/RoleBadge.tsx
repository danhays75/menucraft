// RoleBadge — colored badge showing a user's role.
// admin = terracotta (primary), staff (UserRole.user) = sage (accent),
// guest = muted. Uses semantic tokens so it re-themes with admin customization.

import { UserRole } from "@/backend";
import type { UserRole as UserRoleType } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ROLE_META: Record<UserRoleType, { label: string; className: string }> = {
  [UserRole.admin]: {
    label: "Admin",
    className:
      "border-primary/30 bg-primary/10 text-primary [a&]:hover:bg-primary/15",
  },
  [UserRole.user]: {
    label: "Staff",
    className:
      "border-accent/30 bg-accent/15 text-accent [a&]:hover:bg-accent/20",
  },
  [UserRole.guest]: {
    label: "Guest",
    className:
      "border-border bg-muted text-muted-foreground [a&]:hover:bg-muted/80",
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
      className={cn(meta.className, className)}
      data-ocid="role.badge"
    >
      {meta.label}
    </Badge>
  );
}
