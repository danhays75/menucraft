import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  // Fourth migration: introduce quizzes, quiz questions, and quiz attempts as
  // new top-level entities. A Quiz belongs to a Position (quiz.positionId).
  // Questions are ordered per quiz and are single- or multiple-answer, 1
  // point each, with marked correct answers. Attempts are keyed per
  // Principal and are append-only (retakes create new attempts, never
  // overwriting). There is no existing quiz/question/attempt data to migrate
  // — all three lists start empty and the three id counters start at 1.
  //
  // OldActor mirrors the NewActor of 20260630_000200.mo (the previous
  // migration in the chain). NewActor adds quizzes, quizQuestions,
  // quizAttempts, and the nextQuizId/nextQuestionId/nextAttemptId counters.
  type OldActor = {
    var positions : List.List<AnyPosition>;
    var categories : List.List<AnyCategory>;
    var subCategories : List.List<AnySubCategory>;
    var items : Map.Map<Nat, AnyMenuItem>;
    var state : { var nextPositionId : Nat; var nextCategoryId : Nat; var nextSubCategoryId : Nat; var nextItemId : Nat };
    var accessControlState : AnyAccessControlState;
    var users : Map.Map<Principal.Principal, AnyUserProfile>;
    var theme : AnyTheme;
    var steps : List.List<AnyTrainingStep>;
    var trainingState : { var nextStepId : Nat };
  };

  type NewActor = {
    var positions : List.List<AnyPosition>;
    var categories : List.List<AnyCategory>;
    var subCategories : List.List<AnySubCategory>;
    var items : Map.Map<Nat, AnyMenuItem>;
    var state : { var nextPositionId : Nat; var nextCategoryId : Nat; var nextSubCategoryId : Nat; var nextItemId : Nat };
    var accessControlState : AnyAccessControlState;
    var users : Map.Map<Principal.Principal, AnyUserProfile>;
    var theme : AnyTheme;
    var steps : List.List<AnyTrainingStep>;
    var trainingState : { var nextStepId : Nat };
    var quizzes : List.List<AnyQuiz>;
    var quizQuestions : List.List<AnyQuestion>;
    var quizAttempts : List.List<AnyAttempt>;
    var quizState : { var nextQuizId : Nat; var nextQuestionId : Nat; var nextAttemptId : Nat };
  };

  // Placeholder types that EXACTLY match the real stable field shapes so the
  // M0170 stable-compatibility check passes. ExternalBlob is a Blob alias in
  // the object-storage extension, so we use Blob directly here.
  type AnyExternalBlob = Blob;

  type AnyPosition = {
    id : Nat;
    name : Text;
    description : ?Text;
    coverPhoto : ?AnyExternalBlob;
    var sortOrder : Nat;
    var createdAt : Nat;
    var updatedAt : Nat;
  };

  type AnyCategory = {
    id : Nat;
    positionId : Nat;
    name : Text;
    coverPhoto : AnyExternalBlob;
    var sortOrder : Nat;
    var createdAt : Nat;
    var updatedAt : Nat;
  };

  type AnySubCategory = {
    id : Nat;
    name : Text;
    coverPhoto : AnyExternalBlob;
    parentCategoryId : Nat;
    var sortOrder : Nat;
    var createdAt : Nat;
    var updatedAt : Nat;
  };

  type AnyMenuItem = {
    id : Nat;
    categoryId : Nat;
    var subCategoryId : ?Nat;
    name : Text;
    description : Text;
    itemPhoto : AnyExternalBlob;
    var ingredients : [Text];
    var instructions : [Text];
    var createdAt : Nat;
    var updatedAt : Nat;
  };

  type AnyRole = { #admin; #user; #guest };

  // AccessControlState shape from the authorization extension:
  //   { var adminAssigned : Bool; userRoles : Map<Principal, UserRole> }
  // Note: userRoles is a stable Map reference (not var); adminAssigned is var.
  type AnyAccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal.Principal, AnyRole>;
  };

  type AnyUserProfile = {
    principal : Principal.Principal;
    var displayName : Text;
    var role : AnyRole;
    var createdAt : Nat;
  };

  type AnyFontChoice = { #systemFont; #serif; #sansSerif; #monospace };

  type AnyTheme = {
    var primaryColor : Text;
    var accentColor : Text;
    var font : AnyFontChoice;
    var logo : ?AnyExternalBlob;
    var updatedAt : Nat;
  };

  type AnyTrainingStep = {
    id : Nat;
    itemId : Nat;
    var order : Nat;
    var text : Text;
    var photo : ?AnyExternalBlob;
    var video : ?AnyExternalBlob;
    var createdAt : Nat;
    var updatedAt : Nat;
  };

  // Quiz stable shape: belongs to a Position (positionId), title (required),
  // description (optional), admin-set passingPercentage (0-100), timestamps.
  type AnyQuiz = {
    id : Nat;
    positionId : Nat;
    var title : Text;
    var description : ?Text;
    var passingPercentage : Nat;
    var createdAt : Nat;
    var updatedAt : Nat;
  };

  // QuestionType: single-answer (radio) or multiple-answer (checkbox).
  type AnyQuestionType = { #single; #multiple };

  // AnswerOption: id, text, correct flag. Fields are immutable (the Question
  // record holds a `var options` array; option records themselves are stable
  // values).
  type AnyAnswerOption = {
    id : Nat;
    text : Text;
    correct : Bool;
  };

  // Question stable shape: belongs to a Quiz (quizId), ordered per quiz by
  // `order` (1-based), text, type, options (with correctness flags),
  // timestamps. Each question is worth 1 point.
  type AnyQuestion = {
    id : Nat;
    quizId : Nat;
    var order : Nat;
    var text : Text;
    var questionType : AnyQuestionType;
    var options : [AnyAnswerOption];
    var createdAt : Nat;
    var updatedAt : Nat;
  };

  // AttemptAnswer: the question id and the option ids the trainee selected.
  type AnyAttemptAnswer = {
    questionId : Nat;
    selectedOptionIds : [Nat];
  };

  // Attempt stable shape: keyed per Principal, append-only. Records the
  // submitted answers, score, maxScore, pass/fail, and timestamp.
  type AnyAttempt = {
    id : Nat;
    quizId : Nat;
    principal : Principal.Principal;
    var answers : [AnyAttemptAnswer];
    var score : Nat;
    var maxScore : Nat;
    var passed : Bool;
    var createdAt : Nat;
  };

  public func migration(old : OldActor) : NewActor {
    {
      var positions = old.positions;
      var categories = old.categories;
      var subCategories = old.subCategories;
      var items = old.items;
      var state = old.state;
      var accessControlState = old.accessControlState;
      var users = old.users;
      var theme = old.theme;
      var steps = old.steps;
      var trainingState = old.trainingState;
      // New quiz/question/attempt state — all empty on first introduction.
      var quizzes = List.empty();
      var quizQuestions = List.empty();
      var quizAttempts = List.empty();
      var quizState = {
        var nextQuizId = 1;
        var nextQuestionId = 1;
        var nextAttemptId = 1;
      };
    };
  };
};
