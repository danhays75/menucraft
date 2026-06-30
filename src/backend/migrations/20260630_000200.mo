import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  // Third migration: introduce the Position concept above Category. Each
  // existing Category is assigned to a single new Position named "Bartender"
  // (id 1). All existing categories, sub-categories, items, and training
  // steps are preserved unchanged — only the positionId field is added to
  // each category and a new positions List + nextPositionId counter are
  // introduced.
  //
  // OldActor mirrors the NewActor of 20260630_000100.mo (the previous migration
  // in the chain). NewActor adds positions + nextPositionId to state and
  // widens AnyCategory with positionId : Nat.
  type OldActor = {
    var categories : List.List<AnyOldCategory>;
    var subCategories : List.List<AnySubCategory>;
    var items : Map.Map<Nat, AnyMenuItem>;
    var state : { var nextCategoryId : Nat; var nextSubCategoryId : Nat; var nextItemId : Nat };
    var accessControlState : AnyAccessControlState;
    var users : Map.Map<Principal.Principal, AnyUserProfile>;
    var theme : AnyTheme;
    var steps : List.List<AnyTrainingStep>;
    var trainingState : { var nextStepId : Nat };
  };

  type NewActor = {
    var positions : List.List<AnyPosition>;
    var categories : List.List<AnyCategory>;
    var subCategories : List.List<AnySubCategory>;
    var items : Map.Map<Nat, AnyMenuItem>;
    var state : { var nextPositionId : Nat; var nextCategoryId : Nat; var nextSubCategoryId : Nat; var nextItemId : Nat };
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

  // Old category shape (pre-positions): no positionId field.
  type AnyOldCategory = {
    id : Nat;
    name : Text;
    coverPhoto : AnyExternalBlob;
    var sortOrder : Nat;
    var createdAt : Nat;
    var updatedAt : Nat;
  };

  // New category shape: adds positionId : Nat linking each category to a
  // Position. Every existing category is assigned positionId = 1 (Bartender).
  type AnyCategory = {
    id : Nat;
    positionId : Nat;
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

  // Position stable shape: id, name (required), description (optional),
  // coverPhoto (optional — do NOT require one), sortOrder, createdAt,
  // updatedAt. Modeled on the existing Category stable shape plus a
  // description field.
  type AnyPosition = {
    id : Nat;
    name : Text;
    description : ?Text;
    coverPhoto : ?AnyExternalBlob;
    var sortOrder : Nat;
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
    // Create the single "Bartender" Position (id 1) that all existing
    // categories will be assigned to. sortOrder defaults to 0 (first and
    // only position); coverPhoto is null (optional — not required);
    // description is null (optional).
    let now : Nat = 0;
    let bartenderPosition : AnyPosition = {
      id = 1;
      name = "Bartender";
      description = null;
      coverPhoto = null;
      var sortOrder = 0;
      var createdAt = now;
      var updatedAt = now;
    };
    let positions = List.empty<AnyPosition>();
    positions.add(bartenderPosition);

    // Assign every existing category positionId = 1 (Bartender) while
    // preserving all other fields. List.map rebuilds the list with the new
    // value type.
    let migratedCategories = old.categories.map<AnyOldCategory, AnyCategory>(
      func(cat : AnyOldCategory) : AnyCategory {
        {
          id = cat.id;
          positionId = 1;
          name = cat.name;
          coverPhoto = cat.coverPhoto;
          var sortOrder = cat.sortOrder;
          var createdAt = cat.createdAt;
          var updatedAt = cat.updatedAt;
        };
      },
    );

    {
      var positions = positions;
      var categories = migratedCategories;
      var subCategories = old.subCategories;
      var items = old.items;
      var state = {
        var nextPositionId = 2;
        var nextCategoryId = old.state.nextCategoryId;
        var nextSubCategoryId = old.state.nextSubCategoryId;
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
