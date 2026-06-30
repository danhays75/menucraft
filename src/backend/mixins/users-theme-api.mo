import Map "mo:core/Map";
import PrincipalLib "mo:core/Principal";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Storage "mo:caffeineai-object-storage/Storage";
import Types "../types/users-theme";
import Common "../types/common";
import Lib "../lib/users-theme";

// Exposes the users and theme management API. Authorization (Internet
// Identity sign-in, role assignment, first-user-becomes-admin) is owned
// by the caffeineai-authorization extension's MixinAuthorization, which
// must be included in main.mo alongside this mixin. This mixin only adds
// the user profile metadata, user listing, and theme management surface.
mixin (
  accessControlState : AccessControl.AccessControlState,
  users : Map.Map<PrincipalLib.Principal, Types.UserProfile>,
  theme : Types.Theme,
) {
  // ---- Theme (publicly readable) ----

  // Public: read the current theme. No authentication required so the
  // storefront can apply it before login.
  public query func getTheme() : async Types.ThemePublic {
    theme.toPublicTheme();
  };

  // Admin-only: update theme colors and font. Pass null for any field to
  // keep the existing value.
  public shared ({ caller }) func updateTheme(
    primaryColor : ?Text,
    accentColor : ?Text,
    font : ?Types.FontChoice
  ) : async Types.ThemePublic {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return theme.toPublicTheme();
    };
    switch (primaryColor) {
      case (?c) if (Lib.validateColor(c)) { theme.primaryColor := c };
      case null {};
    };
    switch (accentColor) {
      case (?c) if (Lib.validateColor(c)) { theme.accentColor := c };
      case null {};
    };
    switch (font) {
      case (?f) { theme.font := f };
      case null {};
    };
    theme.updatedAt := Int.abs(Time.now());
    theme.toPublicTheme();
  };

  // Admin-only: upload or replace the logo. Pass null to remove the logo.
  public shared ({ caller }) func updateLogo(logo : ?Storage.ExternalBlob) : async Types.ThemePublic {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return theme.toPublicTheme();
    };
    theme.logo := logo;
    theme.updatedAt := Int.abs(Time.now());
    theme.toPublicTheme();
  };

  // Admin-only: reset the theme to platform defaults.
  public shared ({ caller }) func resetTheme() : async Types.ThemePublic {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return theme.toPublicTheme();
    };
    theme.resetTheme(Lib.defaultTheme(), Int.abs(Time.now()));
    theme.toPublicTheme();
  };

  // ---- User profiles ----

  // Authenticated (user or admin): read the caller's own profile.
  // Returns null if the caller has signed in but not yet saved a display name.
  public query ({ caller }) func getCallerUserProfile() : async ?Types.UserProfilePublic {
    switch (users.get(caller)) {
      case (?p) ?p.toPublicUserProfile();
      case null null;
    };
  };

  // Authenticated (user or admin): save the caller's own display name.
  // Creates the profile record on first save.
  public shared ({ caller }) func saveCallerUserProfile(displayName : Text) : async Types.UserProfilePublic {
    let now : Common.Timestamp = Int.abs(Time.now());
    switch (users.get(caller)) {
      case (?p) {
        p.displayName := displayName;
        p.toPublicUserProfile();
      };
      case null {
        let role = AccessControl.getUserRole(accessControlState, caller);
        let p = Lib.newUserProfile(caller, role, now);
        p.displayName := displayName;
        users.add(caller, p);
        p.toPublicUserProfile();
      };
    };
  };

  // Admin-only: list all registered users with their roles for the admin
  // portal's user management screen.
  public query ({ caller }) func listUsers() : async [Types.UserProfilePublic] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return [];
    };
    Lib.listUserProfiles(users);
  };

  // Admin-only: assign a role (admin or staff) to a user. Delegates the
  // actual role change to the authorization extension.
  public shared ({ caller }) func assignRole(user : PrincipalLib.Principal, role : Types.UserRole) : async Types.UserProfilePublic {
    AccessControl.assignRole(accessControlState, caller, user, role);
    switch (users.get(user)) {
      case (?p) {
        p.role := role;
        p.toPublicUserProfile();
      };
      case null {
        let now : Common.Timestamp = Int.abs(Time.now());
        let p = Lib.newUserProfile(user, role, now);
        users.add(user, p);
        p.toPublicUserProfile();
      };
    };
  };

  // Admin-only: revoke staff/admin role from a user, demoting them to a
  // plain user. Delegates to the authorization extension.
  public shared ({ caller }) func revokeRole(user : PrincipalLib.Principal) : async Types.UserProfilePublic {
    AccessControl.assignRole(accessControlState, caller, user, #guest);
    switch (users.get(user)) {
      case (?p) {
        p.role := #guest;
        p.toPublicUserProfile();
      };
      case null {
        let now : Common.Timestamp = Int.abs(Time.now());
        let p = Lib.newUserProfile(user, #guest, now);
        users.add(user, p);
        p.toPublicUserProfile();
      };
    };
  };
};
