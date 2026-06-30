import List "mo:core/List";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Types "../types/training";

module {
  public type TrainingStep = Types.TrainingStep;
  public type TrainingStepPublic = Types.TrainingStepPublic;
  public type TrainingStepInput = Types.TrainingStepInput;
  public type TrainingStepEdit = Types.TrainingStepEdit;
  public type ItemId = Types.ItemId;

  // Convert an internal TrainingStep to its shared public form.
  public func toPublic(self : TrainingStep) : TrainingStepPublic {
    {
      id = self.id;
      itemId = self.itemId;
      order = self.order;
      text = self.text;
      photo = self.photo;
      video = self.video;
    };
  };

  // Create a new TrainingStep record. `order` is assigned by the caller
  // (typically the next position in the item's step sequence).
  public func new(id : Nat, itemId : ItemId, order : Nat, input : TrainingStepInput, now : Types.Timestamp) : TrainingStep {
    {
      id;
      itemId;
      var order;
      var text = input.text;
      var photo = input.photo;
      var video = input.video;
      var createdAt = now;
      var updatedAt = now;
    };
  };

  // Apply an edit to an existing step in place.
  public func applyEdit(self : TrainingStep, edit : TrainingStepEdit, now : Types.Timestamp) : () {
    self.text := edit.text;
    self.photo := edit.photo;
    self.video := edit.video;
    self.updatedAt := now;
  };

  // Return the steps for a given item, sorted ascending by `order`.
  public func listForItem(steps : List.List<TrainingStep>, itemId : ItemId) : [TrainingStepPublic] {
    let filtered = steps.filter(func(s : TrainingStep) : Bool { s.itemId == itemId });
    let mapped = filtered.map<TrainingStep, TrainingStepPublic>(func(s : TrainingStep) : TrainingStepPublic { toPublic(s) });
    let arr = mapped.toArray();
    arr.sort(func(a : TrainingStepPublic, b : TrainingStepPublic) : { #less; #equal; #greater } {
      Nat.compare(a.order, b.order);
    });
  };

  // Find a step by id across all steps.
  public func find(steps : List.List<TrainingStep>, stepId : Nat) : ?TrainingStep {
    steps.find(func(s : TrainingStep) : Bool { s.id == stepId });
  };

  // Remove a step from the list by id. Returns the removed step (if any).
  public func remove(steps : List.List<TrainingStep>, stepId : Nat) : ?TrainingStep {
    let found = steps.find(func(s : TrainingStep) : Bool { s.id == stepId });
    switch (found) {
      case (?step) {
        let kept = steps.filter(func(s : TrainingStep) : Bool { s.id != stepId });
        steps.clear();
        steps.addAll(kept.values());
        ?step;
      };
      case null null;
    };
  };

  // Renumber the `order` field of each step in the list to match its index+1,
  // preserving the current list order. Used after a deletion or reorder.
  public func renumber(steps : List.List<TrainingStep>) : () {
    steps.forEachEntry(func(idx : Nat, s : TrainingStep) : () {
      s.order := idx + 1;
    });
  };

  // Move a step to a new position. `newOrder` is 1-based. Other steps shift to
  // make room. Returns true if the step was found and moved.
  public func moveTo(steps : List.List<TrainingStep>, stepId : Nat, newOrder : Nat) : Bool {
    let arr = steps.toArray();
    let size = arr.size();
    if (size == 0) { return false };
    let foundIdx = arr.findIndex(func(s : TrainingStep) : Bool { s.id == stepId });
    switch (foundIdx) {
      case null { return false };
      case (?fromIdx) {
        if (newOrder < 1 or newOrder > size) { return false };
        let toIdx = newOrder - 1;
        if (fromIdx == toIdx) { return true };
        let step = arr[fromIdx];
        // Build a new ordered array with the step moved using a mutable array.
        let newArr = Array.tabulate(
          size,
          func(i : Nat) : TrainingStep {
            if (i == fromIdx) {
              // Slot occupied by the moved step; pick the next non-skipped element.
              if (toIdx < fromIdx) { arr[toIdx] } else { arr[toIdx - 1] };
            } else if (i == toIdx) {
              step;
            } else if (toIdx < fromIdx and i >= toIdx and i < fromIdx) {
              arr[i + 1];
            } else if (toIdx > fromIdx and i > fromIdx and i <= toIdx) {
              arr[i - 1];
            } else {
              arr[i];
            };
          },
        );
        // Replace list contents and renumber.
        steps.clear();
        steps.addAll(newArr.values());
        renumber(steps);
        true;
      };
    };
  };
};
