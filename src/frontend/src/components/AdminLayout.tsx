// Admin layout — dark charcoal sidebar (Dashboard, Categories, Menu Items,
// Users, Theme) + content area. Sidebar uses bg-sidebar tokens so it reads as
// a distinct structural zone from the bg-background content area. Includes a
// top bar with the admin's identity + a back-to-storefront link.

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Briefcase,
  ChefHat,
  LayoutDashboard,
  ListOrdered,
  Package,
  Palette,
  Store,
  Users,
} from "lucide-react";
import type * as React from "react";

const NAV = [
  {
    label: "Dashboard",
    to: "/admin",
    icon: LayoutDashboard,
    ocid: "admin.nav.dashboard",
    end: true,
  },
  {
    label: "Positions",
    to: "/admin/positions",
    icon: Briefcase,
    ocid: "admin.nav.positions",
    end: false,
  },
  {
    label: "Categories",
    to: "/admin/categories",
    icon: ListOrdered,
    ocid: "admin.nav.categories",
    end: false,
  },
  {
    label: "Menu Items",
    to: "/admin/items",
    icon: Package,
    ocid: "admin.nav.items",
    end: false,
  },
  {
    label: "Users",
    to: "/admin/users",
    icon: Users,
    ocid: "admin.nav.users",
    end: false,
  },
  {
    label: "Theme",
    to: "/admin/theme",
    icon: Palette,
    ocid: "admin.nav.theme",
    end: false,
  },
] as const;

export function AdminLayout() {
  const { profile, clear } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const initials = profile?.displayName
    ? profile.displayName
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "AD";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — distinct dark zone */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ChefHat className="size-4.5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-base font-semibold">
              MenuCraft
            </span>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Admin
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Admin">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                data-ocid={item.ocid}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => navigate({ to: "/" })}
            data-ocid="admin.nav.storefront"
          >
            <Store className="size-4" />
            Back to storefront
          </Button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-4 sm:px-6">
          <div className="flex items-center gap-3 md:hidden">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ChefHat className="size-4" />
            </span>
            <span className="font-display text-lg font-semibold">
              MenuCraft Admin
            </span>
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              data-ocid="admin.topbar.storefront"
            >
              <Link to="/" data-ocid="admin.topbar.storefront_link">
                <Store className="size-4" /> Storefront
              </Link>
            </Button>
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clear()}
              data-ocid="admin.topbar.signout"
            >
              Sign out
            </Button>
          </div>
        </header>

        {/* Mobile nav — horizontal scroll */}
        <nav
          className="flex gap-1 overflow-x-auto border-b border-border bg-card px-4 py-2 md:hidden"
          aria-label="Admin mobile"
        >
          {NAV.map((item) => {
            const active = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                )}
                data-ocid={`${item.ocid}.mobile`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Content */}
        <main className="flex-1 bg-background p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
