import List "mo:core/List";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import PrincipalLib "mo:core/Principal";
import Types "../types/quizzes";
import Common "../types/common";

module {
  public type QuizId = Common.QuizId;
  public type QuestionId = Common.QuestionId;
  public type AttemptId = Common.AttemptId;
  public type PositionId = Common.PositionId;
  public type Timestamp = Common.Timestamp;
  public type Principal = PrincipalLib.Principal;
  public type Quiz = Types.Quiz;
  public type QuizPublic = Types.QuizPublic;
  public type QuizInput = Types.QuizInput;
  public type QuizEdit = Types.QuizEdit;
  public type Question = Types.Question;
  public type QuestionPublic = Types.QuestionPublic;
  public type QuestionInput = Types.QuestionInput;
  public type QuestionEdit = Types.QuestionEdit;
  public type AnswerOption = Types.AnswerOption;
  public type AnswerOptionInput = Types.AnswerOptionInput;
  public type Attempt = Types.Attempt;
  public type AttemptPublic = Types.AttemptPublic;
  public type AttemptInput = Types.AttemptInput;
  public type AttemptAnswer = Types.AttemptAnswer;

  // Convert an internal Quiz to its shared public form, with question count.
  public func toPublicQuiz(self : Quiz, questionCount : Nat) : QuizPublic {
    {
      id = self.id;
      positionId = self.positionId;
      title = self.title;
      description = self.description;
      passingPercentage = self.passingPercentage;
      questionCount;
      createdAt = self.createdAt;
      updatedAt = self.updatedAt;
    };
  };

  // Create a new Quiz record. description is optional. passingPercentage is
  // admin-set (0-100).
  public func newQuiz(id : QuizId, positionId : PositionId, input : QuizInput, now : Timestamp) : Quiz {
    {
      id;
      positionId;
      var title = input.title;
      var description = input.description;
      var passingPercentage = input.passingPercentage;
      var createdAt = now;
      var updatedAt = now;
    };
  };

  // Apply an edit to an existing quiz in place.
  public func applyQuizEdit(self : Quiz, edit : QuizEdit, now : Timestamp) : () {
    self.title := edit.title;
    self.description := edit.description;
    self.passingPercentage := edit.passingPercentage;
    self.updatedAt := now;
  };

  // Find a quiz by id in the list.
  public func findQuiz(quizzes : List.List<Quiz>, id : QuizId) : ?Quiz {
    quizzes.find(func(q : Quiz) : Bool { q.id == id });
  };

  // List all quizzes for a position, sorted by id ascending, with question
  // counts.
  public func listQuizzesForPosition(quizzes : List.List<Quiz>, questions : List.List<Question>, positionId : PositionId) : [QuizPublic] {
    let filtered = quizzes.filter(func(q : Quiz) : Bool { q.positionId == positionId });
    let mapped = filtered.map<Quiz, QuizPublic>(func(q : Quiz) : QuizPublic {
      toPublicQuiz(q, countQuestionsInQuiz(questions, q.id));
    });
    let arr = mapped.toArray();
    arr.sort(func(a : QuizPublic, b : QuizPublic) : { #less; #equal; #greater } {
      Nat.compare(a.id, b.id);
    });
  };

  // Count the questions in a quiz.
  public func countQuestionsInQuiz(questions : List.List<Question>, quizId : QuizId) : Nat {
    questions.filter(func(q : Question) : Bool { q.quizId == quizId }).size();
  };

  // Validate a quiz title is non-empty (after trimming whitespace).
  public func validateTitle(title : Text) : Bool {
    title.trim(#char ' ').size() > 0;
  };

  // Validate a passing percentage is in the range 0-100 inclusive.
  public func validatePassingPercentage(pct : Nat) : Bool {
    pct >= 0 and pct <= 100;
  };

  // Convert an internal Question to its shared public form.
  public func toPublicQuestion(self : Question) : QuestionPublic {
    {
      id = self.id;
      quizId = self.quizId;
      order = self.order;
      text = self.text;
      questionType = self.questionType;
      options = self.options;
    };
  };

  // Build the options array from input, assigning sequential ids starting at 1.
  func buildOptions(input : [AnswerOptionInput]) : [AnswerOption] {
    Array.tabulate(
      input.size(),
      func(i : Nat) : AnswerOption {
        {
          id = i + 1;
          text = input[i].text;
          correct = input[i].correct;
        };
      },
    );
  };

  // Create a new Question record. `order` is assigned by the caller
  // (typically the next position in the quiz's question sequence). Option
  // ids are assigned sequentially starting at 1.
  public func newQuestion(id : QuestionId, quizId : QuizId, order : Nat, input : QuestionInput, now : Timestamp) : Question {
    {
      id;
      quizId;
      var order;
      var text = input.text;
      var questionType = input.questionType;
      var options = buildOptions(input.options);
      var createdAt = now;
      var updatedAt = now;
    };
  };

  // Apply an edit to an existing question in place. Option ids are reassigned
  // sequentially starting at 1.
  public func applyQuestionEdit(self : Question, edit : QuestionEdit, now : Timestamp) : () {
    self.text := edit.text;
    self.questionType := edit.questionType;
    self.options := buildOptions(edit.options);
    self.updatedAt := now;
  };

  // Return the questions for a given quiz, sorted ascending by `order`.
  public func listQuestionsForQuiz(questions : List.List<Question>, quizId : QuizId) : [QuestionPublic] {
    let filtered = questions.filter(func(q : Question) : Bool { q.quizId == quizId });
    let mapped = filtered.map<Question, QuestionPublic>(func(q : Question) : QuestionPublic { toPublicQuestion(q) });
    let arr = mapped.toArray();
    arr.sort(func(a : QuestionPublic, b : QuestionPublic) : { #less; #equal; #greater } {
      Nat.compare(a.order, b.order);
    });
  };

  // Find a question by id across all questions.
  public func findQuestion(questions : List.List<Question>, id : QuestionId) : ?Question {
    questions.find(func(q : Question) : Bool { q.id == id });
  };

  // Remove a question from the list by id. Returns the removed question
  // (if any).
  public func removeQuestion(questions : List.List<Question>, id : QuestionId) : ?Question {
    let found = questions.find(func(q : Question) : Bool { q.id == id });
    switch (found) {
      case (?question) {
        let kept = questions.filter(func(q : Question) : Bool { q.id != id });
        questions.clear();
        questions.addAll(kept.values());
        ?question;
      };
      case null null;
    };
  };

  // Renumber the `order` field of each question in the list to match its
  // index+1, preserving the current list order. Used after a deletion or
  // reorder.
  public func renumberQuestions(questions : List.List<Question>) : () {
    questions.forEachEntry(func(idx : Nat, q : Question) : () {
      q.order := idx + 1;
    });
  };

  // Move a question to a new position (1-based). Other questions shift to
  // make room. Returns true if the question was found and moved.
  public func moveQuestion(questions : List.List<Question>, id : QuestionId, newOrder : Nat) : Bool {
    let arr = questions.toArray();
    let size = arr.size();
    if (size == 0) { return false };
    let foundIdx = arr.findIndex(func(q : Question) : Bool { q.id == id });
    switch (foundIdx) {
      case null { return false };
      case (?fromIdx) {
        if (newOrder < 1 or newOrder > size) { return false };
        let toIdx = newOrder - 1;
        if (fromIdx == toIdx) { return true };
        let question = arr[fromIdx];
        let newArr = Array.tabulate(
          size,
          func(i : Nat) : Question {
            if (i == fromIdx) {
              if (toIdx < fromIdx) { arr[toIdx] } else { arr[toIdx - 1] };
            } else if (i == toIdx) {
              question;
            } else if (toIdx < fromIdx and i >= toIdx and i < fromIdx) {
              arr[i + 1];
            } else if (toIdx > fromIdx and i > fromIdx and i <= toIdx) {
              arr[i - 1];
            } else {
              arr[i];
            };
          },
        );
        questions.clear();
        questions.addAll(newArr.values());
        renumberQuestions(questions);
        true;
      };
    };
  };

  // Convert an internal Attempt to its shared public form.
  public func toPublicAttempt(self : Attempt) : AttemptPublic {
    {
      id = self.id;
      quizId = self.quizId;
      answers = self.answers;
      score = self.score;
      maxScore = self.maxScore;
      passed = self.passed;
      createdAt = self.createdAt;
    };
  };

  // Create a new Attempt record. `score`, `maxScore`, and `passed` are
  // computed by the caller (typically the mixin) from the submitted answers
  // and the quiz's questions/passingPercentage. Attempts are append-only.
  public func newAttempt(id : AttemptId, quizId : QuizId, principal : Principal, answers : [AttemptAnswer], score : Nat, maxScore : Nat, passed : Bool, now : Timestamp) : Attempt {
    {
      id;
      quizId;
      principal;
      var answers;
      var score;
      var maxScore;
      var passed;
      var createdAt = now;
    };
  };

  // List a trainee's attempts for a quiz, sorted by createdAt ascending
  // (oldest first). Append-only — never overwrites.
  public func listAttemptsForUserAndQuiz(attempts : List.List<Attempt>, principal : Principal, quizId : QuizId) : [AttemptPublic] {
    let filtered = attempts.filter(func(a : Attempt) : Bool {
      PrincipalLib.equal(a.principal, principal) and a.quizId == quizId;
    });
    let mapped = filtered.map<Attempt, AttemptPublic>(func(a : Attempt) : AttemptPublic { toPublicAttempt(a) });
    let arr = mapped.toArray();
    arr.sort(func(a : AttemptPublic, b : AttemptPublic) : { #less; #equal; #greater } {
      Nat.compare(a.createdAt, b.createdAt);
    });
  };

  // Grade a submitted attempt against the quiz's questions. Returns
  // (score, maxScore, passed). Each question is worth 1 point; a question is
  // scored as correct only when the selected option ids exactly match the
  // set of correct option ids for that question. `passed` is true when
  // score/maxScore * 100 >= quiz.passingPercentage (maxScore == 0 => passed
  // when passingPercentage == 0).
  public func gradeAttempt(questions : List.List<Question>, quiz : Quiz, answers : [AttemptAnswer]) : (Nat, Nat, Bool) {
    let quizQuestions = listQuestionsForQuiz(questions, quiz.id);
    let maxScore = quizQuestions.size();
    var score = 0;
    for (question in quizQuestions.values()) {
      // Find the user's answer for this question.
      let answerOpt = answers.find(
        func(a : AttemptAnswer) : Bool { a.questionId == question.id }
      );
      switch (answerOpt) {
        case null {};
        case (?answer) {
          // Collect the correct option ids for this question.
          let correctIds = question.options.map(func(o : AnswerOption) : Nat { o.id }).filter(
            func(id : Nat) : Bool {
              question.options.find(
                func(o : AnswerOption) : Bool { o.id == id and o.correct }
              ) != null;
            }
          );
          let selected = answer.selectedOptionIds;
          // Correct iff selected set == correct set (same size, all selected
          // are correct, and all correct are selected).
          if (selected.size() == correctIds.size()) {
            var allMatch = true;
            for (sel in selected.values()) {
              let isCorrect = correctIds.find(
                func(c : Nat) : Bool { c == sel }
              ) != null;
              if (not isCorrect) { allMatch := false };
            };
            if (allMatch) { score += 1 };
          };
        };
      };
    };
    let passed = if (maxScore == 0) {
      quiz.passingPercentage == 0;
    } else {
      (score * 100) / maxScore >= quiz.passingPercentage;
    };
    (score, maxScore, passed);
  };
};
