import List "mo:core/List";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Storage "mo:caffeineai-object-storage/Storage";
import Types "../types/categories-items";
import Common "../types/common";

module {
  public type PositionId = Common.PositionId;
  public type CategoryId = Common.CategoryId;
  public type Position = Types.Position;
  public type PositionPublic = Types.PositionPublic;
  public type Category = Types.Category;

  // Create a new Position record. description and coverPhoto are optional.
  // sortOrder defaults to the next position.
  public func newPosition(
    id : PositionId,
    name : Text,
    description : ?Text,
    coverPhoto : ?Storage.ExternalBlob,
    sortOrder : Nat,
    now : Common.Timestamp
  ) : Position {
    {
      id;
      name;
      description;
      coverPhoto;
      var sortOrder;
      var createdAt = now;
      var updatedAt = now;
    };
  };

  // Convert internal Position to public shared form, with category count.
  public func toPublicPosition(self : Position, categoryCount : Nat) : PositionPublic {
    {
      id = self.id;
      name = self.name;
      description = self.description;
      coverPhoto = self.coverPhoto;
      sortOrder = self.sortOrder;
      categoryCount;
      createdAt = self.createdAt;
      updatedAt = self.updatedAt;
    };
  };

  // List all positions sorted by sortOrder, with category counts.
  public func listPositions(
    positions : List.List<Position>,
    categories : List.List<Category>
  ) : [PositionPublic] {
    let arr = positions.toArray();
    let publics = arr.map(
      func(pos : Position) : PositionPublic {
        toPublicPosition(pos, countCategoriesInPosition(categories, pos.id));
      },
    );
    publics.sort(func(a : PositionPublic, b : PositionPublic) : { #less; #equal; #greater } {
      Nat.compare(a.sortOrder, b.sortOrder);
    });
  };

  // Find a position by id in the list.
  public func findPosition(positions : List.List<Position>, id : PositionId) : ?Position {
    positions.find(func(pos : Position) : Bool { pos.id == id });
  };

  // Count categories assigned to a position.
  public func countCategoriesInPosition(categories : List.List<Category>, positionId : PositionId) : Nat {
    let arr = categories.toArray();
    arr.foldLeft(
      0,
      func(acc : Nat, cat : Category) : Nat {
        if (cat.positionId == positionId) { acc + 1 } else { acc };
      },
    );
  };

  // Validate that a name is non-empty (after trimming whitespace).
  public func validateName(name : Text) : Bool {
    name.trim(#char ' ').size() > 0;
  };
};
