import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Storage "mo:caffeineai-object-storage/Storage";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/categories-items";
import Common "../types/common";
import Lib "../lib/categories-items";
import CategoriesPositionsLib "../lib/positions";

mixin (
  positions : List.List<Types.Position>,
  categories : List.List<Types.Category>,
  subCategories : List.List<Types.SubCategory>,
  items : Map.Map<Common.ItemId, Types.MenuItem>,
  state : {
    var nextCategoryId : Common.CategoryId;
    var nextSubCategoryId : Common.SubCategoryId;
    var nextItemId : Common.ItemId;
  },
  accessControlState : AccessControl.AccessControlState,
) {

  // ---------- Public browsing (no login) ----------

  // List all categories as photo cards, sorted by sortOrder, with item counts.
  public query func listCategories() : async [Types.CategoryPublic] {
    Lib.listCategories(categories, items);
  };

  // List all menu items DIRECTLY in a category (subCategoryId == null).
  // Empty array if none. Preserves existing behavior.
  public query func listItemsByCategory(categoryId : Common.CategoryId) : async [Types.MenuItemPublic] {
    Lib.itemsByCategory(items, categoryId);
  };

  // List sub-categories under a parent category, sorted by sortOrder, with
  // item counts.
  public query func listSubCategories(categoryId : Common.CategoryId) : async [Types.SubCategoryPublic] {
    Lib.listSubCategories(subCategories, items, categoryId);
  };

  // List items belonging to a sub-category, sorted by name.
  public query func listItemsBySubCategory(subCategoryId : Common.SubCategoryId) : async [Types.MenuItemPublic] {
    switch (Lib.findSubCategory(subCategories, subCategoryId)) {
      case (?_sub) Lib.listItemsBySubCategory(items, subCategoryId);
      case null Runtime.trap("Sub-category not found");
    };
  };

  // Get a single menu item's recipe card (smaller photo, name, description, ingredients, instructions).
  public query func getMenuItem(itemId : Common.ItemId) : async ?Types.MenuItemPublic {
    switch (Lib.findItem(items, itemId)) {
      case (?item) { ?item.toPublicItem() };
      case null null;
    };
  };

  // Search items by name (case-insensitive substring).
  public query func searchItems(searchTerm : Text) : async [Types.MenuItemPublic] {
    Lib.searchItems(items, searchTerm);
  };

  // Filter items by category AND search by name. Searches BOTH direct items
  // AND all sub-category items under that category.
  public query func searchItemsInCategory(categoryId : Common.CategoryId, searchTerm : Text) : async [Types.MenuItemPublic] {
    Lib.searchItemsInCategory(items, subCategories, categoryId, searchTerm);
  };

  // ---------- Admin: categories ----------

  // Create a category with a name and cover photo under a Position. Admin-only.
  public shared ({ caller }) func createCategory(
    positionId : Common.PositionId,
    name : Text,
    coverPhoto : Storage.ExternalBlob
  ) : async Common.CategoryId {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin role required");
    };
    if (not Lib.validateName(name)) {
      Runtime.trap("Category name must not be empty");
    };
    // The referenced Position must exist.
    switch (CategoriesPositionsLib.findPosition(positions, positionId)) {
      case null Runtime.trap("Position not found");
      case (?_) {};
    };
    let id = state.nextCategoryId;
    let now = Int.abs(Time.now());
    let sortOrder = Lib.listCategoriesByPosition(categories, items, positionId).size();
    let cat = Lib.newCategory(id, positionId, name, coverPhoto, sortOrder, now);
    categories.add(cat);
    state.nextCategoryId := id + 1;
    id;
  };

  // Edit a category's name, cover photo, and/or Position. Admin-only.
  public shared ({ caller }) func updateCategory(
    id : Common.CategoryId,
    positionId : Common.PositionId,
    name : Text,
    coverPhoto : Storage.ExternalBlob
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin role required");
    };
    if (not Lib.validateName(name)) {
      Runtime.trap("Category name must not be empty");
    };
    // The referenced Position must exist.
    switch (CategoriesPositionsLib.findPosition(positions, positionId)) {
      case null Runtime.trap("Position not found");
      case (?_) {};
    };
    switch (Lib.findCategory(categories, id)) {
      case (?cat) {
        // name, coverPhoto, positionId are immutable; replace the record in
        // the list while preserving sortOrder and timestamps.
        let updated : Types.Category = {
          id = cat.id;
          positionId;
          name;
          coverPhoto;
          var sortOrder = cat.sortOrder;
          var createdAt = cat.createdAt;
          var updatedAt = Int.abs(Time.now());
        };
        let kept = categories.filter(func(c : Types.Category) : Bool { c.id != id });
        categories.clear();
        categories.add(updated);
        categories.addAll(kept.values());
      };
      case null Runtime.trap("Category not found");
    };
  };

  // Delete a category. Returns the count of items assigned to it (for warning UI).
  // Items are NOT deleted — they remain assigned to the now-removed category id;
  // the admin should reassign or delete them separately. Admin-only.
  public shared ({ caller }) func deleteCategory(id : Common.CategoryId) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin role required");
    };
    let count = Lib.countItemsInCategory(items, id);
    // Remove the category from the list in place.
    let kept = categories.filter(func(cat : Types.Category) : Bool { cat.id != id });
    categories.clear();
    categories.addAll(kept.values());
    count;
  };

  // Reorder categories by providing the new sort order for one category.
  // Manual ordering control (no drag-and-drop). Admin-only.
  public shared ({ caller }) func setCategorySortOrder(id : Common.CategoryId, sortOrder : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin role required");
    };
    switch (Lib.findCategory(categories, id)) {
      case (?cat) {
        cat.sortOrder := sortOrder;
        cat.updatedAt := Int.abs(Time.now());
      };
      case null Runtime.trap("Category not found");
    };
  };

  // ---------- Admin: sub-categories ----------

  // Create a sub-category under a parent category. Admin-only.
  // Returns the new sub-category in public form.
  public shared ({ caller }) func createSubCategory(
    parentCategoryId : Common.CategoryId,
    name : Text,
    coverPhoto : Storage.ExternalBlob
  ) : async Types.SubCategoryPublic {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin role required");
    };
    if (not Lib.validateName(name)) {
      Runtime.trap("Sub-category name must not be empty");
    };
    switch (Lib.findCategory(categories, parentCategoryId)) {
      case null Runtime.trap("Parent category not found");
      case (?_) {};
    };
    let id = state.nextSubCategoryId;
    let now = Int.abs(Time.now());
    let sortOrder = Lib.subCategoriesByParent(subCategories, parentCategoryId).size();
    let sub = Lib.newSubCategory(id, parentCategoryId, name, coverPhoto, sortOrder, now);
    subCategories.add(sub);
    state.nextSubCategoryId := id + 1;
    sub.toPublicSubCategory(0);
  };

  // Edit a sub-category's name and/or cover photo. Admin-only.
  public shared ({ caller }) func updateSubCategory(
    id : Common.SubCategoryId,
    name : Text,
    coverPhoto : Storage.ExternalBlob
  ) : async Types.SubCategoryPublic {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin role required");
    };
    if (not Lib.validateName(name)) {
      Runtime.trap("Sub-category name must not be empty");
    };
    switch (Lib.findSubCategory(subCategories, id)) {
      case (?sub) {
        // name and coverPhoto are immutable, so replace the record in the list.
        let updated : Types.SubCategory = {
          id = sub.id;
          name;
          coverPhoto;
          parentCategoryId = sub.parentCategoryId;
          var sortOrder = sub.sortOrder;
          var createdAt = sub.createdAt;
          var updatedAt = Int.abs(Time.now());
        };
        let kept = subCategories.filter(func(s : Types.SubCategory) : Bool { s.id != id });
        subCategories.clear();
        subCategories.add(updated);
        subCategories.addAll(kept.values());
        updated.toPublicSubCategory(Lib.countItemsInSubCategory(items, id));
      };
      case null Runtime.trap("Sub-category not found");
    };
  };

  // Delete a sub-category. Returns the count of items that were assigned to it
  // (for warning UI); those items are reassigned back to direct-under-category
  // (subCategoryId := null). Admin-only.
  public shared ({ caller }) func deleteSubCategory(id : Common.SubCategoryId) : async { itemCount : Nat } {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin role required");
    };
    switch (Lib.findSubCategory(subCategories, id)) {
      case (?_sub) {};
      case null Runtime.trap("Sub-category not found");
    };
    let count = Lib.countItemsInSubCategory(items, id);
    // Reassign items: set subCategoryId = null so they become direct-under-category.
    items.forEach(
      func(_id : Common.ItemId, item : Types.MenuItem) : () {
        switch (item.subCategoryId) {
          case (?sid) {
            if (sid == id) { item.subCategoryId := null };
          };
          case null {};
        };
      },
    );
    // Remove the sub-category from the list.
    let kept = subCategories.filter(func(sub : Types.SubCategory) : Bool { sub.id != id });
    subCategories.clear();
    subCategories.addAll(kept.values());
    { itemCount = count };
  };

  // Reorder sub-categories by providing the new sort order for one sub-category.
  // Manual ordering control (no drag-and-drop). Admin-only.
  public shared ({ caller }) func setSubCategorySortOrder(id : Common.SubCategoryId, sortOrder : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin role required");
    };
    switch (Lib.findSubCategory(subCategories, id)) {
      case (?sub) {
        sub.sortOrder := sortOrder;
        sub.updatedAt := Int.abs(Time.now());
      };
      case null Runtime.trap("Sub-category not found");
    };
  };

  // ---------- Admin: menu items ----------

  // Create a menu item with name, description, item photo, category assignment,
  // and optional sub-category assignment. Admin-only. subCategoryId = null keeps
  // the item directly under the category.
  public shared ({ caller }) func createMenuItem(
    categoryId : Common.CategoryId,
    subCategoryId : ?Common.SubCategoryId,
    name : Text,
    description : Text,
    itemPhoto : Storage.ExternalBlob
  ) : async Common.ItemId {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin role required");
    };
    if (not Lib.validateName(name)) {
      Runtime.trap("Menu item name must not be empty");
    };
    switch (Lib.findCategory(categories, categoryId)) {
      case null Runtime.trap("Category not found");
      case (?_) {};
    };
    // If a sub-category is specified, it must exist AND belong to this category.
    switch (subCategoryId) {
      case (?sid) {
        switch (Lib.findSubCategory(subCategories, sid)) {
          case (?sub) {
            if (sub.parentCategoryId != categoryId) {
              Runtime.trap("Sub-category does not belong to this category");
            };
          };
          case null Runtime.trap("Sub-category not found");
        };
      };
      case null {};
    };
    let id = state.nextItemId;
    let now = Int.abs(Time.now());
    let item = Lib.newMenuItem(id, categoryId, subCategoryId, name, description, itemPhoto, now);
    items.add(id, item);
    state.nextItemId := id + 1;
    id;
  };

  // Edit a menu item's core fields (name, description, photo, category, and
  // optional sub-category). Admin-only. subCategoryId = null moves the item
  // back to direct-under-category.
  public shared ({ caller }) func updateMenuItem(
    id : Common.ItemId,
    categoryId : Common.CategoryId,
    subCategoryId : ?Common.SubCategoryId,
    name : Text,
    description : Text,
    itemPhoto : Storage.ExternalBlob
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin role required");
    };
    if (not Lib.validateName(name)) {
      Runtime.trap("Menu item name must not be empty");
    };
    switch (Lib.findCategory(categories, categoryId)) {
      case null Runtime.trap("Category not found");
      case (?_) {};
    };
    switch (subCategoryId) {
      case (?sid) {
        switch (Lib.findSubCategory(subCategories, sid)) {
          case (?sub) {
            if (sub.parentCategoryId != categoryId) {
              Runtime.trap("Sub-category does not belong to this category");
            };
          };
          case null Runtime.trap("Sub-category not found");
        };
      };
      case null {};
    };
    switch (Lib.findItem(items, id)) {
      case (?item) {
        // name, description, itemPhoto, categoryId are immutable; reconstruct.
        let updated : Types.MenuItem = {
          id = item.id;
          categoryId = categoryId;
          var subCategoryId = subCategoryId;
          name = name;
          description = description;
          itemPhoto = itemPhoto;
          var ingredients = item.ingredients;
          var instructions = item.instructions;
          var createdAt = item.createdAt;
          var updatedAt = Int.abs(Time.now());
        };
        items.add(id, updated);
      };
      case null Runtime.trap("Menu item not found");
    };
  };

  // Edit a menu item's recipe (ingredients list + instructions list). Admin-only.
  public shared ({ caller }) func updateMenuItemRecipe(
    id : Common.ItemId,
    ingredients : [Text],
    instructions : [Text]
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin role required");
    };
    switch (Lib.findItem(items, id)) {
      case (?item) {
        item.ingredients := ingredients;
        item.instructions := instructions;
        item.updatedAt := Int.abs(Time.now());
      };
      case null Runtime.trap("Menu item not found");
    };
  };

  // Delete a menu item. Admin-only.
  public shared ({ caller }) func deleteMenuItem(id : Common.ItemId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin role required");
    };
    // Map.remove returns (); check existence first.
    switch (items.get(id)) {
      case (?_item) items.remove(id);
      case null Runtime.trap("Menu item not found");
    };
  };
};
