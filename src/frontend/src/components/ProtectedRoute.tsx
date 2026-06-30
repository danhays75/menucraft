// Wraps any route that requires an authenticated staff/admin user. Redirects
// unauthenticated users to the storefront root (where they can sign in via the
// header). Renders children only when authenticated.

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "@tanstack/react-router";
import { Loader2, LockKeyhole } from "lucide-react";
import type * as React from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const {
    isAuthenticated,
    isInitializing,
    isLoadingProfile,
    login,
    isLoggingIn,
  } = useAuth();

  // Still resolving the II session — show a quiet loader.
  if (isInitializing) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-label="Loading session"
        />
      </div>
    );
  }

  // Not signed in — bounce to the storefront. Preserve the attempted path so
  // the Layout's sign-in CTA can be paired with a return hint if desired.
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card
          className="max-w-md w-full text-center"
          data-ocid="auth.signin_required"
        >
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <LockKeyhole className="size-7" />
            </div>
            <CardTitle className="text-2xl">Staff sign-in required</CardTitle>
            <CardDescription>
              Training content is only available to authenticated staff. Sign in
              with Internet Identity to continue.
            </CardDescription>
            <Button
              onClick={login}
              disabled={isLoggingIn}
              data-ocid="auth.signin_button"
              className="mt-2"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Connecting…
                </>
              ) : (
                "Sign in with Internet Identity"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated but profile still loading — keep the user on a quiet loader
  // rather than flashing content then re-rendering.
  if (isLoadingProfile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-label="Loading profile"
        />
      </div>
    );
  }

  return <>{children}</>;
}

/** Convenience guard for TanStack Router — returns the attempted path. */
export function useRequireAuth(): { ok: boolean; from: string } {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();
  return { ok: isAuthenticated && !isInitializing, from: location.pathname };
}

/** Navigate-to-root helper used by route loaders. */
export function redirectToRoot(): { to: string } {
  return { to: "/" };
}

export function NotAuthenticatedRedirect() {
  return <Navigate to="/" />;
}
