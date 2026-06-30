import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  // Second migration: introduce sub-categories and the optional subCategoryId
  // field on MenuItem. Existing items keep subCategoryId = null (they remain
  // direct-under-category). All existing categories, items, and other state
  // are preserved unchanged.
  //
  // OldActor mirrors the NewActor of 20260630_000000.mo (the previous migration
  // in the chain). NewActor adds subCategories + nextSubCategoryId and widens
  // AnyMenuItem with var subCategoryId : ?Nat.
  type OldActor = {
    var categories : List.List<AnyCategory>;
    var items : Map.Map<Nat, AnyOldMenuItem>;
    var state : { var nextCategoryId : Nat; var nextItemId : Nat };
    var accessControlState : AnyAccessControlState;
    var users : Map.Map<Principal.Principal, AnyUserProfile>;
    var theme : AnyTheme;
    var steps : List.List<AnyTrainingStep>;
    var trainingState : { var nextStepId : Nat };
  };

  type NewActor = {
    var categories : List.List<AnyCategory>;
    var subCategories : List.List<AnySubCategory>;
    var items : Map.Map<Nat, AnyMenuItem>;
    var state : { var nextCategoryId : Nat; var nextSubCategoryId : Nat; var nextItemId : Nat };
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

  type AnySubCategory = {
    id : Nat;
    name : Text;
    coverPhoto : AnyExternalBlob;
    parentCategoryId : Nat;
    var sortOrder : Nat;
    var createdAt : Nat;
    var updatedAt : Nat;
  };

  // Old menu item shape (pre-sub-categories): no subCategoryId field.
  type AnyOldMenuItem = {
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

  // New menu item shape: adds var subCategoryId : ?Nat (null = direct under category).
  type AnyMenuItem = {
    id : Nat;
    categoryId : Nat;
    var subCategoryId : ?Nat;
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

  public func migration(old : OldActor) : NewActor {
    // Reassign every existing item to direct-under-category (subCategoryId = null)
    // while preserving all other fields. Map.map rebuilds the map with the new
    // value type.
    let migratedItems = old.items.map<Nat, AnyOldMenuItem, AnyMenuItem>(
      func(_id : Nat, item : AnyOldMenuItem) : AnyMenuItem {
        {
          id = item.id;
          categoryId = item.categoryId;
          var subCategoryId = null;
          name = item.name;
          description = item.description;
          itemPhoto = item.itemPhoto;
          var ingredients = item.ingredients;
          var instructions = item.instructions;
          var createdAt = item.createdAt;
          var updatedAt = item.updatedAt;
        };
      },
    );
    {
      var categories = old.categories;
      var subCategories = List.empty();
      var items = migratedItems;
      var state = {
        var nextCategoryId = old.state.nextCategoryId;
        var nextSubCategoryId = 1;
        var nextItemId = old.state.nextItemId;
      };
      var accessControlState = old.accessControlState;
      var users = old.users;
      var theme = old.theme;
      var steps = old.steps;
      var trainingState = old.trainingState;
    };
  };
};
