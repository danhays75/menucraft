// UserList — shadcn Table of registered users with role controls.
// Columns: principal (truncated, copyable), display name, role badge, and a
// per-row Select to assign/revoke roles. The current admin's row is highlighted.
// Mutations go through useAssignRole / useRevokeRole so the list refreshes.

import { UserRole } from "@/backend";
import type { UserProfilePublic } from "@/backend";
import { RoleBadge } from "@/components/admin/RoleBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAssignRole, useRevokeRole } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import type { Principal } from "@icp-sdk/core/principal";
import { Check, Copy, ShieldCheck, UserCog, UserMinus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: UserRole.admin, label: "Admin" },
  { value: UserRole.user, label: "Staff" },
  { value: UserRole.guest, label: "Guest" },
];

function truncatePrincipal(p: Principal): string {
  const s = p.toString();
  if (s.length <= 14) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

function CopyablePrincipal({ principal }: { principal: Principal }) {
  const [copied, setCopied] = useState(false);
  const full = principal.toString();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      toast.success("Principal copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy principal");
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={full}
      className="group inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
      data-ocid="user.principal.copy"
    >
      <span className="truncate">{truncatePrincipal(principal)}</span>
      {copied ? (
        <Check className="size-3.5 text-accent" />
      ) : (
        <Copy className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  );
}

function RoleSelect({
  user,
  isSelf,
  pending,
  onAssign,
  onRevoke,
  index,
}: {
  user: UserProfilePublic;
  isSelf: boolean;
  pending: boolean;
  onAssign: (role: UserRole) => void;
  onRevoke: () => void;
  index: number;
}) {
  const current = user.role;
  const disabled = isSelf || pending;

  return (
    <div className="flex items-center gap-2">
      <Select
        value={current}
        onValueChange={(v) => {
          if (v === current) return;
          if (v === UserRole.guest) {
            onRevoke();
          } else {
            onAssign(v as UserRole);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger
          size="sm"
          className="w-32"
          aria-label={`Change role for ${user.displayName}`}
          data-ocid={`user.role.select.${index}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent data-ocid={`user.role.dropdown.${index}`}>
          {ROLE_OPTIONS.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              data-ocid={`user.role.option.${index}.${opt.value}`}
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isSelf && (
        <span
          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
          title="You can't change your own role"
        >
          <ShieldCheck className="size-3.5" />
        </span>
      )}
    </div>
  );
}

export function UserList({
  users,
  currentPrincipal,
  isLoading,
}: {
  users: UserProfilePublic[];
  currentPrincipal: Principal | null;
  isLoading: boolean;
}) {
  const assignRole = useAssignRole();
  const revokeRole = useRevokeRole();

  const pendingFor = (p: Principal): boolean =>
    (assignRole.isPending &&
      assignRole.variables?.user?.toString() === p.toString()) ||
    (revokeRole.isPending && revokeRole.variables?.toString() === p.toString());

  const handleAssign = (user: UserProfilePublic, role: UserRole) => {
    assignRole.mutate(
      { user: user.principal, role },
      {
        onSuccess: () =>
          toast.success(
            `${user.displayName} is now ${role === UserRole.admin ? "an admin" : "staff"}`,
          ),
        onError: () => toast.error("Couldn't assign role"),
      },
    );
  };

  const handleRevoke = (user: UserProfilePublic) => {
    revokeRole.mutate(user.principal, {
      onSuccess: () => toast.success(`${user.displayName} is now a guest`),
      onError: () => toast.error("Couldn't revoke role"),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3" data-ocid="user.loading_state">
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton array
          <Skeleton key={`skeleton-${i}`} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 py-16 text-center"
        data-ocid="user.empty_state"
      >
        <UserCog className="size-8 text-muted-foreground" />
        <div>
          <p className="font-medium text-foreground">No registered users yet</p>
          <p className="text-sm text-muted-foreground">
            Once staff sign in, they'll appear here for role management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-[28%] font-medium text-muted-foreground">
              Principal
            </TableHead>
            <TableHead className="w-[26%] font-medium text-muted-foreground">
              Display name
            </TableHead>
            <TableHead className="w-[16%] font-medium text-muted-foreground">
              Role
            </TableHead>
            <TableHead className="w-[30%] text-right font-medium text-muted-foreground">
              Role controls
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => {
            const isSelf =
              !!currentPrincipal &&
              user.principal.toString() === currentPrincipal.toString();
            const pending = pendingFor(user.principal);
            return (
              <TableRow
                key={user.principal.toString()}
                className={cn(
                  "transition-colors",
                  isSelf
                    ? "bg-primary/5 hover:bg-primary/8"
                    : "hover:bg-muted/30",
                )}
                data-ocid={`user.row.${index + 1}`}
              >
                <TableCell className="align-middle">
                  <CopyablePrincipal principal={user.principal} />
                </TableCell>
                <TableCell className="align-middle">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-foreground">
                      {user.displayName || "Unnamed"}
                    </span>
                    {isSelf && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        You
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="align-middle">
                  <RoleBadge role={user.role} />
                </TableCell>
                <TableCell className="align-middle text-right">
                  <div className="flex items-center justify-end gap-2">
                    <RoleSelect
                      user={user}
                      isSelf={isSelf}
                      pending={pending}
                      index={index + 1}
                      onAssign={(role) => handleAssign(user, role)}
                      onRevoke={() => handleRevoke(user)}
                    />
                    {pending && (
                      <span
                        className="text-xs text-muted-foreground"
                        data-ocid={`user.loading_state.${index + 1}`}
                      >
                        <UserMinus className="size-3.5 animate-pulse" />
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
