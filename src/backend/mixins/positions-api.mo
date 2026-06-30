import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Storage "mo:caffeineai-object-storage/Storage";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/categories-items";
import Common "../types/common";
import Lib "../lib/positions";
import CategoriesLib "../lib/categories-items";

mixin (
  positions : List.List<Types.Position>,
  categories : List.List<Types.Category>,
  positionState : { var nextPositionId : Common.PositionId },
  accessControlState : AccessControl.AccessControlState,
) {

  // ---------- Public browsing (no login) ----------

  // List all positions as cards, sorted by sortOrder, with category counts.
  public query func listPositions() : async [Types.PositionPublic] {
    Lib.listPositions(positions, categories);
  };

  // Get a single position by id.
  public query func getPosition(id : Common.PositionId) : async ?Types.PositionPublic {
    switch (Lib.findPosition(positions, id)) {
      case (?pos) {
        ?pos.toPublicPosition(Lib.countCategoriesInPosition(categories, id));
      };
      case null null;
    };
  };

  // ---------- Admin: positions ----------

  // Create a position with a name (required), optional description, and
  // optional cover photo. Admin-only.
  public shared ({ caller }) func createPosition(
    name : Text,
    description : ?Text,
    coverPhoto : ?Storage.ExternalBlob
  ) : async Common.PositionId {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin role required");
    };
    if (not Lib.validateName(name)) {
      Runtime.trap("Position name must not be empty");
    };
    let id = positionState.nextPositionId;
    let now = Int.abs(Time.now());
    let sortOrder = positions.size();
    let pos = Lib.newPosition(id, name, description, coverPhoto, sortOrder, now);
    positions.add(pos);
    positionState.nextPositionId := id + 1;
    id;
  };

  // Edit a position's name, description, and/or cover photo. Admin-only.
  public shared ({ caller }) func updatePosition(
    id : Common.PositionId,
    name : Text,
    description : ?Text,
    coverPhoto : ?Storage.ExternalBlob
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin role required");
    };
    if (not Lib.validateName(name)) {
      Runtime.trap("Position name must not be empty");
    };
    switch (Lib.findPosition(positions, id)) {
      case (?pos) {
        // name, description, coverPhoto are immutable; replace the record in
        // the list while preserving sortOrder and timestamps.
        let updated : Types.Position = {
          id = pos.id;
          name;
          description;
          coverPhoto;
          var sortOrder = pos.sortOrder;
          var createdAt = pos.createdAt;
          var updatedAt = Int.abs(Time.now());
        };
        let kept = positions.filter(func(p : Types.Position) : Bool { p.id != id });
        positions.clear();
        positions.add(updated);
        positions.addAll(kept.values());
      };
      case null Runtime.trap("Position not found");
    };
  };

  // Delete a position. Returns the count of categories still assigned to it
  // (for warning UI). Categories are NOT deleted — the admin should reassign
  // or delete them separately. Admin-only.
  public shared ({ caller }) func deletePosition(id : Common.PositionId) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin role required");
    };
    switch (Lib.findPosition(positions, id)) {
      case (?_pos) {};
      case null Runtime.trap("Position not found");
    };
    let count = Lib.countCategoriesInPosition(categories, id);
    // Prevent deletion if categories still belong to the position — mirror
    // how deleteCategory returns the blocking count.
    if (count > 0) {
      count;
    } else {
      let kept = positions.filter(func(p : Types.Position) : Bool { p.id != id });
      positions.clear();
      positions.addAll(kept.values());
      0;
    };
  };

  // Reorder positions by providing the new sort order for one position.
  // Manual ordering control (no drag-and-drop). Admin-only.
  public shared ({ caller }) func setPositionSortOrder(id : Common.PositionId, sortOrder : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin role required");
    };
    switch (Lib.findPosition(positions, id)) {
      case (?pos) {
        pos.sortOrder := sortOrder;
        pos.updatedAt := Int.abs(Time.now());
      };
      case null Runtime.trap("Position not found");
    };
  };
};
