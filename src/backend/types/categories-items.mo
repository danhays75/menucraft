import Storage "mo:caffeineai-object-storage/Storage";
import Common "common";

module {
  public type PositionId = Common.PositionId;
  public type CategoryId = Common.CategoryId;
  public type ItemId = Common.ItemId;
  public type SubCategoryId = Common.SubCategoryId;
  public type Timestamp = Common.Timestamp;

  // Position: a top-level job staff train for (Bartender, Server, Host, ...).
  // Sits above Category. description and coverPhoto are BOTH optional — do NOT
  // require either.
  public type Position = {
    id : PositionId;
    name : Text;
    description : ?Text;
    coverPhoto : ?Storage.ExternalBlob;
    var sortOrder : Nat;
    var createdAt : Timestamp;
    var updatedAt : Timestamp;
  };

  // Shared (serializable) variant of Position for the API boundary.
  // categoryCount is computed at read time.
  public type PositionPublic = {
    id : PositionId;
    name : Text;
    description : ?Text;
    coverPhoto : ?Storage.ExternalBlob;
    sortOrder : Nat;
    categoryCount : Nat;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  public type Category = {
    id : CategoryId;
    positionId : PositionId;
    name : Text;
    coverPhoto : Storage.ExternalBlob;
    var sortOrder : Nat;
    var createdAt : Timestamp;
    var updatedAt : Timestamp;
  };

  // Sub-category: a 2-level grouping under a parent Category.
  // parentCategoryId links it back to its parent; items may optionally reference
  // a SubCategoryId via MenuItem.subCategoryId (null = direct-under-category).
  public type SubCategory = {
    id : SubCategoryId;
    name : Text;
    coverPhoto : Storage.ExternalBlob;
    parentCategoryId : CategoryId;
    var sortOrder : Nat;
    var createdAt : Timestamp;
    var updatedAt : Timestamp;
  };

  public type MenuItem = {
    id : ItemId;
    categoryId : CategoryId;
    // null means the item lives directly under its category; otherwise it
    // belongs to the referenced sub-category (which must be under categoryId).
    var subCategoryId : ?SubCategoryId;
    name : Text;
    description : Text;
    itemPhoto : Storage.ExternalBlob;
    var ingredients : [Text];
    var instructions : [Text];
    var createdAt : Timestamp;
    var updatedAt : Timestamp;
  };

  // Shared (serializable) variants for the API boundary.
  public type CategoryPublic = {
    id : CategoryId;
    positionId : PositionId;
    name : Text;
    coverPhoto : Storage.ExternalBlob;
    sortOrder : Nat;
    itemCount : Nat;
  };

  public type SubCategoryPublic = {
    id : SubCategoryId;
    name : Text;
    coverPhoto : Storage.ExternalBlob;
    parentCategoryId : CategoryId;
    sortOrder : Nat;
    itemCount : Nat;
  };

  public type MenuItemPublic = {
    id : ItemId;
    categoryId : CategoryId;
    subCategoryId : ?SubCategoryId;
    name : Text;
    description : Text;
    itemPhoto : Storage.ExternalBlob;
    ingredients : [Text];
    instructions : [Text];
  };
};
