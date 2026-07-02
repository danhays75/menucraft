import PrincipalLib "mo:core/Principal";
import Common "common";

module {
  public type PositionId = Common.PositionId;
  public type Timestamp = Common.Timestamp;
  public type QuizId = Common.QuizId;
  public type QuestionId = Common.QuestionId;
  public type AttemptId = Common.AttemptId;
  public type Principal = PrincipalLib.Principal;

  // Whether a question accepts a single answer (radio) or multiple answers
  // (checkbox). Each question is worth exactly 1 point regardless of type.
  public type QuestionType = {
    #single;
    #multiple;
  };

  // A single answer option for a question. `correct` marks which options are
  // the right answer(s). For #single questions exactly one option should be
  // marked correct; for #multiple one or more.
  public type AnswerOption = {
    id : Nat;
    text : Text;
    correct : Bool;
  };

  // Internal Question record. Questions are ordered per quiz by `order`
  // (1-based). Each question is worth 1 point. The `options` array holds the
  // answer choices with their correctness flags.
  public type Question = {
    id : QuestionId;
    quizId : QuizId;
    var order : Nat;
    var text : Text;
    var questionType : QuestionType;
    var options : [AnswerOption];
    var createdAt : Timestamp;
    var updatedAt : Timestamp;
  };

  // Shared (serializable) Question for the API boundary.
  public type QuestionPublic = {
    id : QuestionId;
    quizId : QuizId;
    order : Nat;
    text : Text;
    questionType : QuestionType;
    options : [AnswerOption];
  };

  // Input payload for creating a new question. `order` is assigned by the
  // backend (append to end of the quiz's question sequence).
  public type QuestionInput = {
    text : Text;
    questionType : QuestionType;
    options : [AnswerOptionInput];
  };

  // Input payload for editing an existing question.
  public type QuestionEdit = {
    text : Text;
    questionType : QuestionType;
    options : [AnswerOptionInput];
  };

  // Input payload for a single answer option on create/edit. The `id` is
  // assigned by the backend when the option is first created; on edit, the
  // backend rebuilds the options array from the input (ids are reassigned
  // sequentially starting at 1).
  public type AnswerOptionInput = {
    text : Text;
    correct : Bool;
  };

  // Internal Quiz record. A quiz belongs to a Position (positionId). The
  // admin sets `passingPercentage` (0-100): an attempt passes when its score
  // percentage is >= passingPercentage. `description` is optional.
  public type Quiz = {
    id : QuizId;
    positionId : PositionId;
    var title : Text;
    var description : ?Text;
    var passingPercentage : Nat;
    var createdAt : Timestamp;
    var updatedAt : Timestamp;
  };

  // Shared (serializable) Quiz for the API boundary. `questionCount` is
  // computed at read time.
  public type QuizPublic = {
    id : QuizId;
    positionId : PositionId;
    title : Text;
    description : ?Text;
    passingPercentage : Nat;
    questionCount : Nat;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  // Input payload for creating a new quiz.
  public type QuizInput = {
    title : Text;
    description : ?Text;
    passingPercentage : Nat;
  };

  // Input payload for editing an existing quiz.
  public type QuizEdit = {
    title : Text;
    description : ?Text;
    passingPercentage : Nat;
  };

  // A single answer in an attempt: the question id and the option ids the
  // trainee selected.
  public type AttemptAnswer = {
    questionId : QuestionId;
    selectedOptionIds : [Nat];
  };

  // Internal Attempt record. Attempts are keyed per Principal and are
  // append-only — a retake creates a new Attempt, never overwriting an
  // existing one. `score` is the number of points earned (each question is
  // 1 point); `maxScore` is the total number of questions in the quiz at
  // attempt time; `passed` is derived from score/maxScore vs the quiz's
  // passingPercentage.
  public type Attempt = {
    id : AttemptId;
    quizId : QuizId;
    principal : Principal;
    var answers : [AttemptAnswer];
    var score : Nat;
    var maxScore : Nat;
    var passed : Bool;
    var createdAt : Timestamp;
  };

  // Shared (serializable) Attempt for the API boundary.
  public type AttemptPublic = {
    id : AttemptId;
    quizId : QuizId;
    answers : [AttemptAnswer];
    score : Nat;
    maxScore : Nat;
    passed : Bool;
    createdAt : Timestamp;
  };

  // Input payload for submitting a quiz attempt. The caller's Principal is
  // taken from the message context, not from this payload.
  public type AttemptInput = {
    quizId : QuizId;
    answers : [AttemptAnswer];
  };
};
