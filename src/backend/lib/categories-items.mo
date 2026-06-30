import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Storage "mo:caffeineai-object-storage/Storage";
import Types "../types/categories-items";
import Common "../types/common";

module {
  public type PositionId = Common.PositionId;
  public type CategoryId = Common.CategoryId;
  public type ItemId = Common.ItemId;
  public type SubCategoryId = Common.SubCategoryId;
  public type Category = Types.Category;
  public type SubCategory = Types.SubCategory;
  public type MenuItem = Types.MenuItem;

  // Create a new category record under a Position. sortOrder defaults to the
  // next position within that Position.
  public func newCategory(
    id : CategoryId,
    positionId : PositionId,
    name : Text,
    coverPhoto : Storage.ExternalBlob,
    sortOrder : Nat,
    now : Common.Timestamp
  ) : Category {
    {
      id;
      positionId;
      name;
      coverPhoto;
      var sortOrder;
      var createdAt = now;
      var updatedAt = now;
    };
  };

  // Create a new sub-category record under a parent category.
  public func newSubCategory(
    id : SubCategoryId,
    parentCategoryId : CategoryId,
    name : Text,
    coverPhoto : Storage.ExternalBlob,
    sortOrder : Nat,
    now : Common.Timestamp
  ) : SubCategory {
    {
      id;
      name;
      coverPhoto;
      parentCategoryId;
      var sortOrder;
      var createdAt = now;
      var updatedAt = now;
    };
  };

  // Create a new menu item record. subCategoryId is optional (null = direct
  // under category).
  public func newMenuItem(
    id : ItemId,
    categoryId : CategoryId,
    subCategoryId : ?SubCategoryId,
    name : Text,
    description : Text,
    itemPhoto : Storage.ExternalBlob,
    now : Common.Timestamp
  ) : MenuItem {
    {
      id;
      categoryId;
      var subCategoryId;
      name;
      description;
      itemPhoto;
      var ingredients = [];
      var instructions = [];
      var createdAt = now;
      var updatedAt = now;
    };
  };

  // Convert internal Category to public shared form, with item count.
  public func toPublicCategory(self : Category, itemCount : Nat) : Types.CategoryPublic {
    {
      id = self.id;
      positionId = self.positionId;
      name = self.name;
      coverPhoto = self.coverPhoto;
      sortOrder = self.sortOrder;
      itemCount;
    };
  };

  // Convert internal SubCategory to public shared form, with item count.
  public func toPublicSubCategory(self : SubCategory, itemCount : Nat) : Types.SubCategoryPublic {
    {
      id = self.id;
      name = self.name;
      coverPhoto = self.coverPhoto;
      parentCategoryId = self.parentCategoryId;
      sortOrder = self.sortOrder;
      itemCount;
    };
  };

  // Convert internal MenuItem to public shared form.
  public func toPublicItem(self : MenuItem) : Types.MenuItemPublic {
    {
      id = self.id;
      categoryId = self.categoryId;
      subCategoryId = self.subCategoryId;
      name = self.name;
      description = self.description;
      itemPhoto = self.itemPhoto;
      ingredients = self.ingredients;
      instructions = self.instructions;
    };
  };

  // Count items assigned to a category (direct + sub-category items).
  public func countItemsInCategory(items : Map.Map<ItemId, MenuItem>, categoryId : CategoryId) : Nat {
    items.foldLeft(
      0,
      func(acc : Nat, _id : ItemId, item : MenuItem) : Nat {
        if (item.categoryId == categoryId) { acc + 1 } else { acc };
      },
    );
  };

  // Count items assigned to a sub-category.
  public func countItemsInSubCategory(items : Map.Map<ItemId, MenuItem>, subCategoryId : SubCategoryId) : Nat {
    items.foldLeft(
      0,
      func(acc : Nat, _id : ItemId, item : MenuItem) : Nat {
        switch (item.subCategoryId) {
          case (?sid) if (sid == subCategoryId) { acc + 1 } else { acc };
          case null acc;
        };
      },
    );
  };

  // Filter items by category returning ONLY direct items (subCategoryId == null),
  // in public form sorted by name. Preserves existing listItemsByCategory behavior.
  public func itemsByCategory(items : Map.Map<ItemId, MenuItem>, categoryId : CategoryId) : [Types.MenuItemPublic] {
    let filtered = items.filter(
      func(_id : ItemId, item : MenuItem) : Bool {
        item.categoryId == categoryId and item.subCategoryId == null;
      },
    );
    let pairs = filtered.toArray();
    let arr = pairs.map<(ItemId, MenuItem), Types.MenuItemPublic>(
      func(_id : ItemId, item : MenuItem) : Types.MenuItemPublic { toPublicItem(item) },
    );
    arr.sort(func(a : Types.MenuItemPublic, b : Types.MenuItemPublic) : { #less; #equal; #greater } {
      Text.compare(a.name, b.name);
    });
  };

  // Filter items by sub-category, returning public form sorted by name.
  public func listItemsBySubCategory(items : Map.Map<ItemId, MenuItem>, subCategoryId : SubCategoryId) : [Types.MenuItemPublic] {
    let filtered = items.filter(
      func(_id : ItemId, item : MenuItem) : Bool {
        switch (item.subCategoryId) {
          case (?sid) sid == subCategoryId;
          case null false;
        };
      },
    );
    let pairs = filtered.toArray();
    let arr = pairs.map<(ItemId, MenuItem), Types.MenuItemPublic>(
      func(_id : ItemId, item : MenuItem) : Types.MenuItemPublic { toPublicItem(item) },
    );
    arr.sort(func(a : Types.MenuItemPublic, b : Types.MenuItemPublic) : { #less; #equal; #greater } {
      Text.compare(a.name, b.name);
    });
  };

  // Return all items under a category: direct items PLUS items across every
  // sub-category of that category. Used by searchItemsInCategory.
  public func allItemsInCategory(
    items : Map.Map<ItemId, MenuItem>,
    subCategories : List.List<SubCategory>,
    categoryId : CategoryId
  ) : [Types.MenuItemPublic] {
    // Collect the set of sub-category ids that belong to this parent category.
    let subs = subCategoriesByParent(subCategories, categoryId);
    let subIds = subs.map(
      func(sub : SubCategory) : SubCategoryId { sub.id },
    );
    let filtered = items.filter(
      func(_id : ItemId, item : MenuItem) : Bool {
        if (item.categoryId != categoryId) { false } else {
          switch (item.subCategoryId) {
            case null true; // direct item
            case (?sid) subIds.contains(sid);
          };
        };
      },
    );
    let pairs = filtered.toArray();
    let arr = pairs.map<(ItemId, MenuItem), Types.MenuItemPublic>(
      func(_id : ItemId, item : MenuItem) : Types.MenuItemPublic { toPublicItem(item) },
    );
    arr.sort(func(a : Types.MenuItemPublic, b : Types.MenuItemPublic) : { #less; #equal; #greater } {
      Text.compare(a.name, b.name);
    });
  };

  // Search items by name (case-insensitive substring), returning public form.
  public func searchItems(items : Map.Map<ItemId, MenuItem>, searchTerm : Text) : [Types.MenuItemPublic] {
    let q = searchTerm.toLower();
    let pat = #text q;
    let filtered = items.filter(
      func(_id : ItemId, item : MenuItem) : Bool {
        item.name.toLower().contains(pat) or item.description.toLower().contains(pat);
      },
    );
    let pairs = filtered.toArray();
    let arr = pairs.map<(ItemId, MenuItem), Types.MenuItemPublic>(
      func(_id : ItemId, item : MenuItem) : Types.MenuItemPublic { toPublicItem(item) },
    );
    arr.sort(func(a : Types.MenuItemPublic, b : Types.MenuItemPublic) : { #less; #equal; #greater } {
      Text.compare(a.name, b.name);
    });
  };

  // Search items within a category by name (case-insensitive substring).
  // Searches BOTH direct items AND all sub-category items under that category.
  public func searchItemsInCategory(
    items : Map.Map<ItemId, MenuItem>,
    subCategories : List.List<SubCategory>,
    categoryId : CategoryId,
    searchTerm : Text
  ) : [Types.MenuItemPublic] {
    let all = allItemsInCategory(items, subCategories, categoryId);
    let q = searchTerm.toLower();
    let pat = #text q;
    all.filter(func(item : Types.MenuItemPublic) : Bool {
      item.name.toLower().contains(pat) or item.description.toLower().contains(pat);
    });
  };

  // List all categories sorted by sortOrder, with item counts.
  public func listCategories(
    categories : List.List<Category>,
    items : Map.Map<ItemId, MenuItem>
  ) : [Types.CategoryPublic] {
    let arr = categories.toArray();
    let publics = arr.map(
      func(cat : Category) : Types.CategoryPublic {
        toPublicCategory(cat, countItemsInCategory(items, cat.id));
      },
    );
    publics.sort(func(a : Types.CategoryPublic, b : Types.CategoryPublic) : { #less; #equal; #greater } {
      Nat.compare(a.sortOrder, b.sortOrder);
    });
  };

  // List categories belonging to a Position, sorted by sortOrder, with item
  // counts. Position-aware listing for the storefront home → Position →
  // categories navigation.
  public func listCategoriesByPosition(
    categories : List.List<Category>,
    items : Map.Map<ItemId, MenuItem>,
    positionId : PositionId
  ) : [Types.CategoryPublic] {
    let arr = categories.toArray();
    let filtered = arr.filter(
      func(cat : Category) : Bool { cat.positionId == positionId },
    );
    let publics = filtered.map(
      func(cat : Category) : Types.CategoryPublic {
        toPublicCategory(cat, countItemsInCategory(items, cat.id));
      },
    );
    publics.sort(func(a : Types.CategoryPublic, b : Types.CategoryPublic) : { #less; #equal; #greater } {
      Nat.compare(a.sortOrder, b.sortOrder);
    });
  };

  // List sub-categories under a parent category, sorted by sortOrder, with
  // item counts.
  public func listSubCategories(
    subCategories : List.List<SubCategory>,
    items : Map.Map<ItemId, MenuItem>,
    parentCategoryId : CategoryId
  ) : [Types.SubCategoryPublic] {
    let subs = subCategoriesByParent(subCategories, parentCategoryId);
    subs.map(
      func(sub : SubCategory) : Types.SubCategoryPublic {
        toPublicSubCategory(sub, countItemsInSubCategory(items, sub.id));
      },
    );
  };

  // Filter sub-categories by parent category, sorted by sortOrder (internal form).
  public func subCategoriesByParent(
    subCategories : List.List<SubCategory>,
    parentCategoryId : CategoryId
  ) : [SubCategory] {
    let arr = subCategories.toArray();
    let filtered = arr.filter(
      func(sub : SubCategory) : Bool { sub.parentCategoryId == parentCategoryId },
    );
    filtered.sort(func(a : SubCategory, b : SubCategory) : { #less; #equal; #greater } {
      Nat.compare(a.sortOrder, b.sortOrder);
    });
  };

  // Find a category by id in the list.
  public func findCategory(categories : List.List<Category>, id : CategoryId) : ?Category {
    categories.find(func(cat : Category) : Bool { cat.id == id });
  };

  // Find a sub-category by id in the list.
  public func findSubCategory(subCategories : List.List<SubCategory>, id : SubCategoryId) : ?SubCategory {
    subCategories.find(func(sub : SubCategory) : Bool { sub.id == id });
  };

  // Find a menu item by id.
  public func findItem(items : Map.Map<ItemId, MenuItem>, id : ItemId) : ?MenuItem {
    items.get(id);
  };

  // Validate that a name is non-empty (after trimming whitespace).
  public func validateName(name : Text) : Bool {
    name.trim(#char ' ').size() > 0;
  };
};
