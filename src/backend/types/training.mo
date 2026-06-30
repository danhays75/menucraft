import Storage "mo:caffeineai-object-storage/Storage";
import Common "common";

module {
  public type ItemId = Common.ItemId;
  public type Timestamp = Common.Timestamp;

  // A single training step for a menu item. Steps are ordered by `order`
  // (1-based). Each step has text instructions and optional photo/video media
  // stored via object-storage as ExternalBlob references.
  public type TrainingStep = {
    id : Nat;
    itemId : ItemId;
    var order : Nat;
    var text : Text;
    var photo : ?Storage.ExternalBlob;
    var video : ?Storage.ExternalBlob;
    var createdAt : Timestamp;
    var updatedAt : Timestamp;
  };

  // Shared (serializable) variant for the API boundary.
  public type TrainingStepPublic = {
    id : Nat;
    itemId : ItemId;
    order : Nat;
    text : Text;
    photo : ?Storage.ExternalBlob;
    video : ?Storage.ExternalBlob;
  };

  // Input payload for creating a new training step. `order` is assigned by the
  // backend (append to end of the item's step list).
  public type TrainingStepInput = {
    text : Text;
    photo : ?Storage.ExternalBlob;
    video : ?Storage.ExternalBlob;
  };

  // Input payload for editing an existing training step.
  public type TrainingStepEdit = {
    text : Text;
    photo : ?Storage.ExternalBlob;
    video : ?Storage.ExternalBlob;
  };
};
