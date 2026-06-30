// Auth hook — wraps Internet Identity and exposes the current user profile +
// role fetched from the backend. Re-fetches whenever the identity changes
// (login / logout / session restore).
//
// The ROLE is sourced from `actor.getCallerUserRole()` (the authoritative
// lookup that works even when no profile has been saved yet — e.g. the first
// user the backend auto-promotes to admin). The PROFILE is fetched
// separately via `actor.getCallerUserProfile()` for display fields only
// (displayName, createdAt, principal). Deriving the role from the profile
// was a bug: profile is null for users who never saved one, which denied
// admin access to the very first admin.

import { createActor } from "@/backend";
import { UserRole } from "@/backend";
import type { UserProfilePublic } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export interface UseAuthResult {
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoggingIn: boolean;
  login: () => void;
  clear: () => void;
  profile: UserProfilePublic | null;
  role: UserRole | null;
  isAdmin: boolean;
  isStaff: boolean;
  isLoadingProfile: boolean;
  isLoadingRole: boolean;
}

export function useAuth(): UseAuthResult {
  const ii = useInternetIdentity();
  const { actor, isFetching } = useActor(createActor);

  // Profile fetch — display fields only (name, createdAt, principal).
  const profileQuery = useQuery<UserProfilePublic | null>({
    queryKey: ["auth", "profile", ii.isAuthenticated],
    queryFn: async () => {
      if (!actor || !ii.isAuthenticated) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching && ii.isAuthenticated,
  });

  // Role fetch — authoritative source of truth for role / isAdmin / isStaff.
  // Works regardless of whether a profile has been saved.
  const roleQuery = useQuery<UserRole | null>({
    queryKey: ["auth", "role", ii.isAuthenticated],
    queryFn: async () => {
      if (!actor || !ii.isAuthenticated) return null;
      try {
        return await actor.getCallerUserRole();
      } catch {
        // On error, fall back to null so the user sees the denial card
        // rather than a crash or redirect loop.
        return null;
      }
    },
    enabled: !!actor && !isFetching && ii.isAuthenticated,
  });

  const role = roleQuery.data ?? null;

  return {
    isAuthenticated: ii.isAuthenticated,
    isInitializing: ii.isInitializing,
    isLoggingIn: ii.isLoggingIn,
    login: ii.login,
    clear: ii.clear,
    profile: profileQuery.data ?? null,
    role,
    isAdmin: role === UserRole.admin,
    isStaff: role === UserRole.admin || role === UserRole.user,
    isLoadingProfile: profileQuery.isLoading && ii.isAuthenticated,
    isLoadingRole: roleQuery.isLoading && ii.isAuthenticated,
  };
}
