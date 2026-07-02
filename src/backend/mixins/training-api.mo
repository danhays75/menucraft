import List "mo:core/List";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/training";
import TrainingLib "../lib/training";

// Training domain API. Steps are scoped to a menu item. Progress tracking is
// in-session only on the frontend; the backend stores no per-user progress.
mixin (
  steps : List.List<Types.TrainingStep>,
  trainingState : { var nextStepId : Nat },
  accessControlState : AccessControl.AccessControlState,
) {
  // List all training steps for a menu item, ordered by step order.
  // Public (no staff login required) so the frontend can render the recipe
  // card's training link target.
  public query func listTrainingSteps(itemId : Types.ItemId) : async [Types.TrainingStepPublic] {
    TrainingLib.listForItem(steps, itemId);
  };

  // Get a single training step by id.
  public query func getTrainingStep(stepId : Nat) : async ?Types.TrainingStepPublic {
    switch (TrainingLib.find(steps, stepId)) {
      case (?step) ?step.toPublic();
      case null null;
    };
  };

  // Create a new training step for a menu item. The step is appended to the
  // end of the item's step sequence (order = current count + 1). Staff-only.
  public shared ({ caller }) func createTrainingStep(itemId : Types.ItemId, input : Types.TrainingStepInput) : async Types.TrainingStepPublic {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: staff login required");
    };
    let id = trainingState.nextStepId;
    trainingState.nextStepId := id + 1;
    let order = TrainingLib.listForItem(steps, itemId).size() + 1;
    let step = TrainingLib.new(id, itemId, order, input, Int.abs(Time.now()));
    steps.add(step);
    step.toPublic();
  };

  // Edit an existing training step's text and media. Staff-only.
  public shared ({ caller }) func editTrainingStep(stepId : Nat, edit : Types.TrainingStepEdit) : async Types.TrainingStepPublic {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: staff login required");
    };
    switch (TrainingLib.find(steps, stepId)) {
      case (?step) {
        step.applyEdit(edit, Int.abs(Time.now()));
        step.toPublic();
      };
      case null Runtime.trap("Training step not found");
    };
  };

  // Delete a training step. Remaining steps for the item are renumbered to
  // keep the order sequence contiguous. Staff-only.
  public shared ({ caller }) func deleteTrainingStep(stepId : Nat) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: staff login required");
    };
    switch (TrainingLib.remove(steps, stepId)) {
      case (?step) {
        TrainingLib.renumber(steps, step.itemId);
        true;
      };
      case null false;
    };
  };

  // Move a training step to a new position (1-based). Other steps shift to
  // make room. Manual ordering control (no drag-and-drop). Staff-only.
  public shared ({ caller }) func moveTrainingStep(stepId : Nat, newOrder : Nat) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: staff login required");
    };
    TrainingLib.moveTo(steps, stepId, newOrder);
  };
};
