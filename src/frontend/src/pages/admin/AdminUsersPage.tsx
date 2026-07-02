// AdminUsersPage — registered users + role management.
// Header explains the role model (admin / staff / guest), a summary strip
// counts each role, and the UserList table holds the assign/revoke controls.

import { UserRole } from "@/backend";
import { UserList } from "@/components/admin/UserList";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useQueries";
import { ShieldCheck, UserCog, UserMinus, Users } from "lucide-react";

function StatCard({
  icon: Icon,
  label,
  count,
  tone,
  ocid,
}: {
  icon: typeof Users;
  label: string;
  count: number;
  tone: string;
  ocid: string;
}) {
  return (
    <Card className="border-border bg-card" data-ocid={ocid}>
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={`flex size-10 items-center justify-center rounded-lg ${tone}`}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-semibold leading-none text-foreground">
            {count}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminUsersPage() {
  const { data: users, isLoading } = useUsers();
  const { profile } = useAuth();

  const list = users ?? [];
  const adminCount = list.filter((u) => u.role === UserRole.admin).length;
  const staffCount = list.filter((u) => u.role === UserRole.user).length;
  const guestCount = list.filter((u) => u.role === UserRole.guest).length;

  return (
    <div className="space-y-6" data-ocid="admin.users.page">
      {/* Header */}
      <header className="space-y-2 border-b-2 border-primary/60 pb-4">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h1 className="font-display text-3xl font-semibold uppercase tracking-wide text-foreground">
            Users &amp; roles
          </h1>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          View every registered member and assign roles. Admins manage the
          storefront and other users; staff access training content; guests can
          browse but not train. You can't change your own role.
        </p>
      </header>

      {/* Summary strip */}
      <section
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        data-ocid="admin.users.summary"
      >
        <StatCard
          icon={ShieldCheck}
          label="Admins"
          count={adminCount}
          tone="bg-primary/10 text-primary"
          ocid="admin.users.summary.admin"
        />
        <StatCard
          icon={UserCog}
          label="Staff"
          count={staffCount}
          tone="bg-accent/15 text-accent"
          ocid="admin.users.summary.staff"
        />
        <StatCard
          icon={UserMinus}
          label="Guests"
          count={guestCount}
          tone="bg-muted text-muted-foreground"
          ocid="admin.users.summary.guest"
        />
      </section>

      {/* Table */}
      <section data-ocid="admin.users.table_section">
        <UserList
          users={list}
          currentPrincipal={profile?.principal ?? null}
          isLoading={isLoading}
        />
      </section>
    </div>
  );
}
