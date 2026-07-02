// Shared frontend types — re-exported from the bindgen so pages and hooks
// import a single canonical source. These mirror the backend's public types
// (see src/backend.d.ts) and are kept here for ergonomic short imports.

import { UserRole } from "@/backend";
import type {
  AnswerOption,
  AttemptAnswer,
  AttemptId,
  AttemptInput,
  AttemptPublic,
  CategoryId,
  CategoryPublic,
  ExternalBlob,
  FontChoice,
  ItemId,
  MenuItemPublic,
  PositionId,
  PositionPublic,
  QuestionEdit,
  QuestionId,
  QuestionInput,
  QuestionPublic,
  QuestionType,
  QuizEdit,
  QuizId,
  QuizInput,
  QuizPublic,
  SubCategoryId,
  SubCategoryPublic,
  ThemePublic,
  Timestamp,
  TrainingStepEdit,
  TrainingStepInput,
  TrainingStepPublic,
  UserProfilePublic,
} from "@/backend";
import { blobUrl } from "@/lib/blob";

export { UserRole };
export type {
  AnswerOption,
  AttemptAnswer,
  AttemptId,
  AttemptInput,
  AttemptPublic,
  CategoryId,
  CategoryPublic,
  ExternalBlob,
  FontChoice,
  ItemId,
  MenuItemPublic,
  PositionId,
  PositionPublic,
  QuestionEdit,
  QuestionId,
  QuestionInput,
  QuestionPublic,
  QuestionType,
  QuizEdit,
  QuizId,
  QuizInput,
  QuizPublic,
  SubCategoryId,
  SubCategoryPublic,
  ThemePublic,
  Timestamp,
  TrainingStepEdit,
  TrainingStepInput,
  TrainingStepPublic,
  UserProfilePublic,
};

/**
 * Legacy alias kept so existing imports (`AttemptAnswerPublic`) keep working.
 * The real bindgen type is `AttemptAnswer`; this is the same type under the
 * old name. Prefer `AttemptAnswer` in new code.
 */
export type AttemptAnswerPublic = AttemptAnswer;

/** A category card enriched with a usable cover-photo URL for display. */
export interface CategoryView {
  id: bigint;
  name: string;
  itemCount: number;
  sortOrder: number;
  coverUrl: string;
}

/** A position card enriched with a usable cover-photo URL for display. */
export interface PositionView {
  id: bigint;
  name: string;
  description: string | null;
  categoryCount: number;
  sortOrder: number;
  coverUrl: string;
  createdAt: bigint;
  updatedAt: bigint;
}

/** A sub-category card enriched with a usable cover-photo URL for display. */
export interface SubCategoryView {
  id: bigint;
  name: string;
  parentCategoryId: bigint;
  sortOrder: number;
  itemCount: number;
  coverUrl: string;
}

/** A menu item card enriched with a usable item-photo URL for display. */
export interface MenuItemView {
  id: bigint;
  categoryId: bigint;
  subCategoryId: bigint | null;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  photoUrl: string;
}

/** A training step enriched with usable media URLs for display. */
export interface TrainingStepView {
  id: bigint;
  itemId: bigint;
  order: number;
  text: string;
  photoUrl?: string;
  videoUrl?: string;
}

/** Theme settings normalized for the theme-applier hook. */
export interface ThemeSettings {
  primaryColor: string | null;
  accentColor: string | null;
  font: FontChoice | null;
  logoUrl: string | null;
  updatedAt: bigint;
}

/** Auth state surfaced by the useAuth hook. */
export interface AuthState {
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoggingIn: boolean;
  login: () => void;
  clear: () => void;
}

/** Convert a backend CategoryPublic into a display-ready CategoryView. */
export function toCategoryView(c: CategoryPublic): CategoryView {
  return {
    id: c.id,
    name: c.name,
    itemCount: Number(c.itemCount),
    sortOrder: Number(c.sortOrder),
    coverUrl: blobUrl(c.coverPhoto),
  };
}

/** Convert a backend PositionPublic into a display-ready PositionView. */
export function toPositionView(p: PositionPublic): PositionView {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    categoryCount: Number(p.categoryCount),
    sortOrder: Number(p.sortOrder),
    coverUrl: blobUrl(p.coverPhoto ?? null),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

/** Convert a backend SubCategoryPublic into a display-ready SubCategoryView. */
export function toSubCategoryView(s: SubCategoryPublic): SubCategoryView {
  return {
    id: s.id,
    name: s.name,
    parentCategoryId: s.parentCategoryId,
    sortOrder: Number(s.sortOrder),
    itemCount: Number(s.itemCount),
    coverUrl: blobUrl(s.coverPhoto),
  };
}

/* ------------------------------------------------------------------ */
/* Quizzes (frontend display models)                                   */
/* ------------------------------------------------------------------ */
//
// The quiz feature is backed by the real canister methods (see backend.d.ts):
// listQuizzesByPosition, getQuizWithQuestions, submitQuizAttempt,
// listMyQuizAttempts, createQuiz, updateQuiz, deleteQuiz, createQuestion,
// updateQuestion, deleteQuestion, moveQuestion. The display models below are
// stable frontend shapes; the to*View converters map from the real bindgen
// types (QuizPublic, QuestionPublic, AnswerOption, AttemptPublic) into them.

/** A quiz attached to a position, with admin-set passing percentage. */
export interface QuizView {
  id: bigint;
  positionId: bigint;
  title: string;
  description: string | null;
  passingPercentage: number;
  questionCount: number;
  createdAt: bigint;
  updatedAt: bigint;
}

/** A question within a quiz, with ordered answer options and marked correct answers. */
export interface QuestionView {
  id: bigint;
  quizId: bigint;
  order: number;
  text: string;
  type: QuestionType;
  options: QuestionOptionView[];
}

/** An answer option for a question. */
export interface QuestionOptionView {
  id: bigint;
  questionId: bigint;
  order: number;
  text: string;
  isCorrect: boolean;
}

/** A trainee's attempt at a quiz — append-only, never overwritten. */
export interface AttemptView {
  id: bigint;
  quizId: bigint;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  answers: AttemptAnswerView[];
  submittedAt: bigint;
}

/** A single answer within an attempt — the option ids the trainee selected. */
export interface AttemptAnswerView {
  questionId: bigint;
  selectedOptionIds: bigint[];
}

/** Convert a backend QuizPublic into a display-ready QuizView. */
export function toQuizView(q: QuizPublic): QuizView {
  return {
    id: q.id,
    positionId: q.positionId,
    title: q.title,
    description: q.description ?? null,
    passingPercentage: Number(q.passingPercentage),
    questionCount: Number(q.questionCount),
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  };
}

/** Convert a backend QuestionPublic into a display-ready QuestionView. */
export function toQuestionView(q: QuestionPublic): QuestionView {
  return {
    id: q.id,
    quizId: q.quizId,
    order: Number(q.order),
    text: q.text,
    type: q.questionType,
    options: q.options.map((o, i) => ({
      id: o.id,
      questionId: q.id,
      order: i,
      text: o.text,
      isCorrect: o.correct,
    })),
  };
}

/** Convert a backend AttemptPublic into a display-ready AttemptView. */
export function toAttemptView(a: AttemptPublic): AttemptView {
  const score = Number(a.score);
  const total = Number(a.maxScore);
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  return {
    id: a.id,
    quizId: a.quizId,
    score,
    total,
    percentage,
    passed: a.passed,
    answers: a.answers.map((ans) => ({
      questionId: ans.questionId,
      selectedOptionIds: ans.selectedOptionIds,
    })),
    submittedAt: a.createdAt,
  };
}

/** Role guard helper — staff means admin or user (not guest). */
export function isStaff(role: UserRole | undefined | null): boolean {
  return role === UserRole.admin || role === UserRole.user;
}

export function isAdmin(role: UserRole | undefined | null): boolean {
  return role === UserRole.admin;
}
