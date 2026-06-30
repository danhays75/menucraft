import PrincipalLib "mo:core/Principal";
import Storage "mo:caffeineai-object-storage/Storage";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "common";

module {
  public type Principal = PrincipalLib.Principal;
  public type Timestamp = Common.Timestamp;

  // Roles mirror the authorization extension's UserRole so the frontend
  // can use a single enum. We re-export the type alias here for convenience.
  public type UserRole = AccessControl.UserRole;

  // Internal user profile record. The authorization extension owns
  // authentication and role assignment; this record holds the display
  // metadata that the admin portal renders in the user list.
  public type UserProfile = {
    principal : Principal;
    var displayName : Text;
    var role : UserRole;
    var createdAt : Timestamp;
  };

  // Shared (serializable) variant for the API boundary.
  public type UserProfilePublic = {
    principal : Principal;
    displayName : Text;
    role : UserRole;
    createdAt : Timestamp;
  };

  // Font choices offered in the admin theme editor.
  public type FontChoice = {
    #systemFont;
    #serif;
    #sansSerif;
    #monospace;
  };

  // Internal theme record. A single canister-wide instance lives in stable
  // state. All fields are mutable so the admin can update them in place.
  public type Theme = {
    var primaryColor : Text;
    var accentColor : Text;
    var font : FontChoice;
    var logo : ?Storage.ExternalBlob;
    var updatedAt : Timestamp;
  };

  // Shared (serializable) variant of the theme. Publicly readable so the
  // storefront can apply it without authentication.
  public type ThemePublic = {
    primaryColor : Text;
    accentColor : Text;
    font : FontChoice;
    logo : ?Storage.ExternalBlob;
    updatedAt : Timestamp;
  };

  // Platform default theme values, used on first install and on admin reset.
  public type ThemeDefaults = {
    primaryColor : Text;
    accentColor : Text;
    font : FontChoice;
  };
};
