import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import MixinViews "mo:caffeineai-data-viewer/MixinViews";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "types/categories-items";
import Common "types/common";
import UsersTheme "types/users-theme";
import Training "types/training";
import CategoriesItemsApi "mixins/categories-items-api";
import TrainingApi "mixins/training-api";
import UsersThemeApi "mixins/users-theme-api";

actor {
  // Stable state — initial values come from the migration chain.
  let categories : List.List<Types.Category>;
  let subCategories : List.List<Types.SubCategory>;
  let items : Map.Map<Common.ItemId, Types.MenuItem>;
  let state : {
    var nextCategoryId : Common.CategoryId;
    var nextSubCategoryId : Common.SubCategoryId;
    var nextItemId : Common.ItemId;
  };

  // Authorization + users + theme stable state.
  let accessControlState : AccessControl.AccessControlState;
  let users : Map.Map<Principal.Principal, UsersTheme.UserProfile>;
  let theme : UsersTheme.Theme;

  // Training steps stable state.
  let steps : List.List<Training.TrainingStep>;
  let trainingState : { var nextStepId : Nat };

  // Platform mixins.
  include MixinViews();
  include MixinObjectStorage();
  include MixinAuthorization(accessControlState, null);

  // Domain mixins.
  include CategoriesItemsApi(categories, subCategories, items, state, accessControlState);
  include TrainingApi(steps, trainingState, accessControlState);
  include UsersThemeApi(accessControlState, users, theme);
};
