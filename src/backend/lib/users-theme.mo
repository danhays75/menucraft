import Array "mo:core/Array";
import Char "mo:core/Char";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import PrincipalLib "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/users-theme";
import Common "../types/common";

module {
  public type Principal = PrincipalLib.Principal;
  public type UserProfile = Types.UserProfile;
  public type UserProfilePublic = Types.UserProfilePublic;
  public type Theme = Types.Theme;
  public type ThemePublic = Types.ThemePublic;
  public type ThemeDefaults = Types.ThemeDefaults;
  public type FontChoice = Types.FontChoice;
  public type UserRole = Types.UserRole;

  // Platform default theme. Used on first install and when the admin resets.
  public func defaultTheme() : ThemeDefaults {
    {
      primaryColor = "#B35A3C";
      accentColor = "#7C8B6A";
      font = #serif;
    };
  };

  // Build a fresh Theme record from defaults at install time.
  public func newTheme(defaults : ThemeDefaults, now : Common.Timestamp) : Theme {
    {
      var primaryColor = defaults.primaryColor;
      var accentColor = defaults.accentColor;
      var font = defaults.font;
      var logo = null;
      var updatedAt = now;
    };
  };

  // Reset an existing Theme record in place to platform defaults.
  public func resetTheme(self : Theme, defaults : ThemeDefaults, now : Common.Timestamp) : () {
    self.primaryColor := defaults.primaryColor;
    self.accentColor := defaults.accentColor;
    self.font := defaults.font;
    self.logo := null;
    self.updatedAt := now;
  };

  // Convert internal Theme to public shared form.
  public func toPublicTheme(self : Theme) : ThemePublic {
    {
      primaryColor = self.primaryColor;
      accentColor = self.accentColor;
      font = self.font;
      logo = self.logo;
      updatedAt = self.updatedAt;
    };
  };

  // Validate a hex color string (e.g. "#RRGGBB"). Returns true when valid.
  public func validateColor(color : Text) : Bool {
    if (Text.size(color) != 7) return false;
    let chars = Text.toIter(color);
    switch (chars.next()) {
      case null return false;
      case (?first) {
        if (first != '#') return false;
      };
    };
    for (c in chars) {
      if (not (c.isDigit() or
        c == 'a' or c == 'b' or c == 'c' or c == 'd' or c == 'e' or c == 'f' or
        c == 'A' or c == 'B' or c == 'C' or c == 'D' or c == 'E' or c == 'F')) {
        return false;
      };
    };
    true;
  };

  // Create a new user profile record. Called the first time a principal
  // signs in via Internet Identity.
  public func newUserProfile(principal : Principal, role : UserRole, now : Common.Timestamp) : UserProfile {
    {
      principal = principal;
      var displayName = "";
      var role = role;
      var createdAt = now;
    };
  };

  // Convert internal UserProfile to public shared form.
  public func toPublicUserProfile(self : UserProfile) : UserProfilePublic {
    {
      principal = self.principal;
      displayName = self.displayName;
      role = self.role;
      createdAt = self.createdAt;
    };
  };

  // Convert the entire user map to a sorted list of public profiles for
  // the admin portal's user management screen.
  public func listUserProfiles(users : Map.Map<Principal, UserProfile>) : [UserProfilePublic] {
    let mapped = users.values().map(
      func(p : UserProfile) : UserProfilePublic { toPublicUserProfile(p) },
    );
    let arr = mapped.toArray();
    arr.sort(
      func(a : UserProfilePublic, b : UserProfilePublic) : {
        #less; #equal; #greater;
      } {
        if (a.createdAt < b.createdAt) #less
        else if (a.createdAt > b.createdAt) #greater
        else #equal;
      },
    );
  };

  // Resolve a principal's display name, falling back to the principal text
  // when no profile exists yet.
  public func displayName(users : Map.Map<Principal, UserProfile>, principal : Principal) : Text {
    switch (users.get(principal)) {
      case (?p) p.displayName;
      case null principal.toText();
    };
  };
};
