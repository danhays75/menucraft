// Public storefront layout — header (logo, nav, sign-in/sign-out) + main
// content area + branded footer. Header uses bg-card with a subtle border +
// shadow so it reads as elevated above the bg-background content zone. Footer
// uses bg-muted/40 to close the page with a distinct band.

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ChefHat,
  LogIn,
  LogOut,
  Settings,
  UtensilsCrossed,
} from "lucide-react";
import type * as React from "react";

const NAV_LINKS = [{ label: "Menu", to: "/", ocid: "nav.menu" }] as const;

export function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, profile, login, clear, isLoggingIn } =
    useAuth();
  const navigate = useNavigate();

  const logoUrl =
    document.documentElement.getAttribute("data-logo-url") || null;
  const initials = profile?.displayName
    ? profile.displayName
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "MC";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header — elevated card surface */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-subtle">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-smooth hover:opacity-80"
            data-ocid="nav.home"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="MenuCraft"
                className="h-9 w-auto max-w-[10rem] object-contain"
              />
            ) : (
              <span className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
                  <ChefHat className="size-5" />
                </span>
                <span className="font-display text-xl font-semibold tracking-tight">
                  MenuCraft
                </span>
              </span>
            )}
          </Link>

          <nav
            className="hidden items-center gap-1 sm:flex"
            aria-label="Primary"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
                data-ocid={link.ocid}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    data-ocid="nav.account_menu"
                    aria-label="Account menu"
                  >
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56"
                  data-ocid="nav.account_dropdown"
                >
                  <DropdownMenuLabel className="truncate">
                    {profile?.displayName || "Signed in"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem
                      onClick={() => navigate({ to: "/admin" })}
                      data-ocid="nav.admin_portal"
                    >
                      <Settings className="size-4" /> Admin portal
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => clear()}
                    data-ocid="nav.signout"
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="size-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={login}
                disabled={isLoggingIn}
                data-ocid="nav.signin"
                size="sm"
              >
                <LogIn className="size-4" />
                {isLoggingIn ? "Connecting…" : "Staff sign in"}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main content — bg-background zone */}
      <main className="flex-1 bg-background">{children}</main>

      {/* Footer — distinct muted band */}
      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UtensilsCrossed className="size-4 text-primary" />
            <span className="font-display font-medium text-foreground">
              MenuCraft
            </span>
            <span className="hidden sm:inline">
              · Kitchen Training & Recipe Studio
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== "undefined"
                  ? window.location.hostname
                  : "menucraft",
              )}`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

/** Section wrapper that alternates background bands for visual rhythm. */
export function Section({
  children,
  className,
  variant = "default",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "muted";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "py-16 sm:py-20",
        variant === "muted" ? "bg-muted/30" : "bg-background",
        className,
      )}
      {...rest}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  );
}
