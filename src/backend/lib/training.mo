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

  // Return a given item's steps as a mutable array sorted ascending by `order`.
  // The elements are the same records held in `steps`, so mutating their
  // `order` field in place updates the stored steps.
  func sortedItemSteps(steps : List.List<TrainingStep>, itemId : ItemId) : [TrainingStep] {
    let arr = steps.filter(func(s : TrainingStep) : Bool { s.itemId == itemId }).toArray();
    arr.sort(func(a : TrainingStep, b : TrainingStep) : { #less; #equal; #greater } {
      Nat.compare(a.order, b.order);
    });
  };

  // Renumber the `order` field of a single item's steps to a contiguous 1-based
  // sequence, preserving their current relative order. Steps belonging to other
  // items are left untouched. Used after a deletion or reorder.
  public func renumber(steps : List.List<TrainingStep>, itemId : ItemId) : () {
    let sorted = sortedItemSteps(steps, itemId);
    var n : Nat = 0;
    for (s in sorted.values()) {
      n += 1;
      s.order := n;
    };
  };

  // Move a step to a new position within its own item's sequence. `newOrder` is
  // 1-based within that item. Other steps in the same item shift to make room;
  // steps for other items are untouched. Returns true if the step was found and
  // moved (or was already in place).
  public func moveTo(steps : List.List<TrainingStep>, stepId : Nat, newOrder : Nat) : Bool {
    switch (steps.find(func(s : TrainingStep) : Bool { s.id == stepId })) {
      case null { false };
      case (?target) {
        let sorted = sortedItemSteps(steps, target.itemId);
        let size = sorted.size();
        if (newOrder < 1 or newOrder > size) { return false };
        let foundIdx = sorted.findIndex(func(s : TrainingStep) : Bool { s.id == stepId });
        switch (foundIdx) {
          case null { false };
          case (?fromIdx) {
            let toIdx = newOrder - 1;
            if (fromIdx == toIdx) { return true };
            let step = sorted[fromIdx];
            // Remove the step from `fromIdx`, then insert it at `toIdx`. For a
            // result slot i, map back into the removed sequence: slot i draws
            // from removed index (i < toIdx ? i : i - 1), and the removed
            // sequence skips `fromIdx` (index j maps to sorted[j < fromIdx ? j : j + 1]).
            let reordered = Array.tabulate(
              size,
              func(i : Nat) : TrainingStep {
                if (i == toIdx) {
                  step;
                } else {
                  let j = if (i < toIdx) { i } else { i - 1 };
                  if (j < fromIdx) { sorted[j] } else { sorted[j + 1] };
                };
              },
            );
            var n : Nat = 0;
            for (s in reordered.values()) {
              n += 1;
              s.order := n;
            };
            true;
          };
        };
      };
    };
  };
};
