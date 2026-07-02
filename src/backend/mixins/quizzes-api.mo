import List "mo:core/List";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/quizzes";
import Common "../types/common";
import Lib "../lib/quizzes";

// Quizzes domain API. A Quiz belongs to a Position and contains ordered
// Questions (single- or multiple-answer, 1 point each, marked correct
// answers). Attempts are stored per signed-in user keyed by Principal and are
// append-only (retakes create new attempts, never overwriting).
//
// Public queries (no login): list quizzes by position, fetch a quiz with its
// questions. User-gated: submit an attempt, list own attempt history.
// Admin-gated: quiz/question CRUD and reordering.
mixin (
  quizzes : List.List<Types.Quiz>,
  questions : List.List<Types.Question>,
  attempts : List.List<Types.Attempt>,
  quizState : {
    var nextQuizId : Common.QuizId;
    var nextQuestionId : Common.QuestionId;
    var nextAttemptId : Common.AttemptId;
  },
  accessControlState : AccessControl.AccessControlState,
) {
  // ---------- Public browsing (no login) ----------

  // List all quizzes for a position, sorted by id, with question counts.
  public query func listQuizzesByPosition(positionId : Common.PositionId) : async [Types.QuizPublic] {
    Lib.listQuizzesForPosition(quizzes, questions, positionId);
  };

  // Fetch a single quiz by id, including its ordered questions. Returns null
  // if the quiz does not exist.
  public query func getQuizWithQuestions(quizId : Common.QuizId) : async ?({
    quiz : Types.QuizPublic;
    questions : [Types.QuestionPublic];
  }) {
    switch (Lib.findQuiz(quizzes, quizId)) {
      case (?quiz) {
        let quizPublic = quiz.toPublicQuiz(Lib.countQuestionsInQuiz(questions, quizId));
        let questionList = Lib.listQuestionsForQuiz(questions, quizId);
        ?{ quiz = quizPublic; questions = questionList };
      };
      case null null;
    };
  };

  // ---------- User-gated (trainee) ----------

  // Submit a quiz attempt. The caller's Principal keys the attempt.
  // Attempts are append-only — a retake creates a new attempt. The score,
  // maxScore, and pass/fail are computed by the backend from the submitted
  // answers and the quiz's questions/passingPercentage. Requires #user
  // permission.
  public shared ({ caller }) func submitQuizAttempt(input : Types.AttemptInput) : async Types.AttemptPublic {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: user login required");
    };
    switch (Lib.findQuiz(quizzes, input.quizId)) {
      case (?quiz) {
        let (score, maxScore, passed) = Lib.gradeAttempt(questions, quiz, input.answers);
        let id = quizState.nextAttemptId;
        quizState.nextAttemptId := id + 1;
        let attempt = Lib.newAttempt(id, input.quizId, caller, input.answers, score, maxScore, passed, Int.abs(Time.now()));
        attempts.add(attempt);
        attempt.toPublicAttempt();
      };
      case null Runtime.trap("Quiz not found");
    };
  };

  // List the caller's own attempt history for a quiz (append-only, oldest
  // first). Requires #user permission.
  public query ({ caller }) func listMyQuizAttempts(quizId : Common.QuizId) : async [Types.AttemptPublic] {
    Lib.listAttemptsForUserAndQuiz(attempts, caller, quizId);
  };

  // ---------- Admin: quizzes ----------

  // Create a quiz scoped to a position. Admin-only.
  public shared ({ caller }) func createQuiz(positionId : Common.PositionId, input : Types.QuizInput) : async Common.QuizId {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin login required");
    };
    if (not Lib.validateTitle(input.title)) {
      Runtime.trap("Invalid quiz title");
    };
    if (not Lib.validatePassingPercentage(input.passingPercentage)) {
      Runtime.trap("Invalid passing percentage");
    };
    let id = quizState.nextQuizId;
    quizState.nextQuizId := id + 1;
    let quiz = Lib.newQuiz(id, positionId, input, Int.abs(Time.now()));
    quizzes.add(quiz);
    id;
  };

  // Edit a quiz's title, description, and/or passing percentage. Admin-only.
  public shared ({ caller }) func updateQuiz(quizId : Common.QuizId, edit : Types.QuizEdit) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin login required");
    };
    if (not Lib.validateTitle(edit.title)) {
      Runtime.trap("Invalid quiz title");
    };
    if (not Lib.validatePassingPercentage(edit.passingPercentage)) {
      Runtime.trap("Invalid passing percentage");
    };
    switch (Lib.findQuiz(quizzes, quizId)) {
      case (?quiz) {
        quiz.applyQuizEdit(edit, Int.abs(Time.now()));
      };
      case null Runtime.trap("Quiz not found");
    };
  };

  // Delete a quiz. Also deletes its questions. Attempts for the quiz are
  // preserved (append-only history). Admin-only. Returns true if deleted.
  public shared ({ caller }) func deleteQuiz(quizId : Common.QuizId) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin login required");
    };
    switch (Lib.findQuiz(quizzes, quizId)) {
      case (?quiz) {
        // Remove the quiz.
        let keptQuizzes = quizzes.filter(func(q : Types.Quiz) : Bool { q.id != quizId });
        quizzes.clear();
        quizzes.addAll(keptQuizzes.values());
        // Remove all questions belonging to this quiz.
        let keptQuestions = questions.filter(func(q : Types.Question) : Bool { q.quizId != quizId });
        questions.clear();
        questions.addAll(keptQuestions.values());
        true;
      };
      case null false;
    };
  };

  // ---------- Admin: questions ----------

  // Create a question for a quiz. The question is appended to the end of the
  // quiz's question sequence (order = current count + 1). Admin-only.
  public shared ({ caller }) func createQuestion(quizId : Common.QuizId, input : Types.QuestionInput) : async Types.QuestionPublic {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin login required");
    };
    switch (Lib.findQuiz(quizzes, quizId)) {
      case (?_quiz) {
        let id = quizState.nextQuestionId;
        quizState.nextQuestionId := id + 1;
        let order = Lib.countQuestionsInQuiz(questions, quizId) + 1;
        let question = Lib.newQuestion(id, quizId, order, input, Int.abs(Time.now()));
        questions.add(question);
        question.toPublicQuestion();
      };
      case null Runtime.trap("Quiz not found");
    };
  };

  // Edit an existing question's text, type, and options. Admin-only.
  public shared ({ caller }) func updateQuestion(questionId : Common.QuestionId, edit : Types.QuestionEdit) : async Types.QuestionPublic {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin login required");
    };
    switch (Lib.findQuestion(questions, questionId)) {
      case (?question) {
        question.applyQuestionEdit(edit, Int.abs(Time.now()));
        question.toPublicQuestion();
      };
      case null Runtime.trap("Question not found");
    };
  };

  // Delete a question. Remaining questions for the quiz are renumbered to
  // keep the order sequence contiguous. Admin-only.
  public shared ({ caller }) func deleteQuestion(questionId : Common.QuestionId) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin login required");
    };
    switch (Lib.removeQuestion(questions, questionId)) {
      case (?question) {
        Lib.renumberQuestions(questions, question.quizId);
        true;
      };
      case null false;
    };
  };

  // Move a question to a new position (1-based). Other questions shift to
  // make room. Admin-only.
  public shared ({ caller }) func moveQuestion(questionId : Common.QuestionId, newOrder : Nat) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin login required");
    };
    Lib.moveQuestion(questions, questionId, newOrder);
  };
};
