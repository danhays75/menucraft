import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  // First migration: introduce stable state for the first time.
  type OldActor = {};
  type NewActor = {
    var categories : List.List<AnyCategory>;
    var items : Map.Map<Nat, AnyMenuItem>;
    var state : { var nextCategoryId : Nat; var nextItemId : Nat };
    var accessControlState : AnyAccessControlState;
    var users : Map.Map<Principal.Principal, AnyUserProfile>;
    var theme : AnyTheme;
    var steps : List.List<AnyTrainingStep>;
    var trainingState : { var nextStepId : Nat };
  };

  // Placeholder types that EXACTLY match the real stable field shapes so the
  // M0170 stable-compatibility check passes. ExternalBlob is a Blob alias in
  // the object-storage extension, so we use Blob directly here.
  type AnyExternalBlob = Blob;

  type AnyCategory = {
    id : Nat;
    name : Text;
    coverPhoto : AnyExternalBlob;
    var sortOrder : Nat;
    var createdAt : Nat;
    var updatedAt : Nat;
  };

  type AnyMenuItem = {
    id : Nat;
    categoryId : Nat;
    name : Text;
    description : Text;
    itemPhoto : AnyExternalBlob;
    var ingredients : [Text];
    var instructions : [Text];
    var createdAt : Nat;
    var updatedAt : Nat;
  };

  type AnyRole = { #admin; #user; #guest };

  // AccessControlState shape from the authorization extension:
  //   { var adminAssigned : Bool; userRoles : Map<Principal, UserRole> }
  // Note: userRoles is a stable Map reference (not var); adminAssigned is var.
  type AnyAccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal.Principal, AnyRole>;
  };

  type AnyUserProfile = {
    principal : Principal.Principal;
    var displayName : Text;
    var role : AnyRole;
    var createdAt : Nat;
  };

  type AnyFontChoice = { #systemFont; #serif; #sansSerif; #monospace };

  type AnyTheme = {
    var primaryColor : Text;
    var accentColor : Text;
    var font : AnyFontChoice;
    var logo : ?AnyExternalBlob;
    var updatedAt : Nat;
  };

  type AnyTrainingStep = {
    id : Nat;
    itemId : Nat;
    var order : Nat;
    var text : Text;
    var photo : ?AnyExternalBlob;
    var video : ?AnyExternalBlob;
    var createdAt : Nat;
    var updatedAt : Nat;
  };

  public func migration(_old : OldActor) : NewActor {
    {
      var categories = List.empty<AnyCategory>();
      var items = Map.empty<Nat, AnyMenuItem>();
      var state = { var nextCategoryId = 1; var nextItemId = 1 };
      var accessControlState = {
        var adminAssigned = false;
        userRoles = Map.empty<Principal.Principal, AnyRole>();
      };
      var users = Map.empty<Principal.Principal, AnyUserProfile>();
      var theme = {
        var primaryColor = "#1a1a1a";
        var accentColor = "#c9a227";
        var font = #sansSerif;
        var logo = null;
        var updatedAt = 0;
      };
      var steps = List.empty<AnyTrainingStep>();
      var trainingState = { var nextStepId = 1 };
    };
  };
};
