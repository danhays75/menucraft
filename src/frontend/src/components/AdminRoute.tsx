// Admin-only route guard. Renders children only when the authenticated user
// holds the admin role. Non-admins (staff or unauthenticated) are redirected
// to the storefront root with a brief toast explanation.

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldAlert } from "lucide-react";
import type * as React from "react";
import { useEffect } from "react";
import { toast } from "sonner";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const {
    isAuthenticated,
    isInitializing,
    isLoadingProfile,
    isLoadingRole,
    isAdmin,
    login,
    isLoggingIn,
  } = useAuth();

  // Resolving session.
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

  // Not signed in — prompt sign-in (admin portal is staff-gated at minimum).
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card
          className="max-w-md w-full text-center"
          data-ocid="admin.signin_required"
        >
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <ShieldAlert className="size-7" />
            </div>
            <CardTitle className="text-2xl">Admin access</CardTitle>
            <CardDescription>
              The admin portal is restricted to administrators. Sign in with an
              admin Internet Identity principal to continue.
            </CardDescription>
            <Button
              onClick={login}
              disabled={isLoggingIn}
              data-ocid="admin.signin_button"
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

  // Profile or role still loading — wait before deciding role. The role comes
  // from a separate getCallerUserRole() query, so we must wait for BOTH to
  // settle; otherwise the first auto-promoted admin briefly sees the denial
  // card while the role query is still in flight.
  if (isLoadingProfile || isLoadingRole) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-label="Loading profile"
        />
      </div>
    );
  }

  // Authenticated but not an admin — show a denial card. (The first registered
  // user becomes admin automatically per backend logic.)
  if (!isAdmin) {
    return <AdminDenied />;
  }

  return <>{children}</>;
}

function AdminDenied() {
  useEffect(() => {
    toast.error("You do not have admin access to this area.");
  }, []);
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card
        className="max-w-md w-full text-center"
        data-ocid="admin.access_denied"
      >
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <div className="rounded-full bg-destructive/10 p-4 text-destructive">
            <ShieldAlert className="size-7" />
          </div>
          <CardTitle className="text-2xl">Access denied</CardTitle>
          <CardDescription>
            Your account does not have administrator privileges. Contact an
            existing admin to be assigned the admin role.
          </CardDescription>
          <Button
            asChild
            variant="outline"
            data-ocid="admin.back_to_storefront"
          >
            <a href="/" data-ocid="admin.back_to_storefront_link">
              Back to storefront
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
