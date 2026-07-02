// Visual QA mock backend. Implements the backendInterface surface used by the
// app plus the QuizActor surface (listQuizzes, getQuiz, listQuestions,
// submitAttempt, listMyAttempts, …) the quiz hooks cast the actor to via
// quizActor(). Returns realistic sample data so the storefront, position,
// quizzes, and admin screens render with content during visual QA.
//
// Kept after QA — enables `VITE_USE_MOCK=true pnpm dev` for frontend-only
// iteration without a running backend.

import type { backendInterface } from "@/backend";
import {
  ExternalBlob,
  FontChoice,
  QuestionType,
  UserRole,
} from "@/backend";
import type { Principal } from "@icp-sdk/core/principal";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const NOW_NS = BigInt(Date.now()) * 1_000_000n;
const DAY_NS = 86_400_000_000_000n;

function ts(daysAgo: number): bigint {
  return NOW_NS - BigInt(daysAgo) * DAY_NS;
}

/** A 1x1 transparent PNG used as a stand-in cover/photo URL. */
const PLACEHOLDER_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

function placeholderBlob(): ExternalBlob {
  return ExternalBlob.fromURL(PLACEHOLDER_PNG);
}

/** A stable fake principal string for the mock admin user. */
const MOCK_PRINCIPAL_TEXT =
  "2vxsx-fae" // 5 chars — a minimal-length principal text form
  ;

/* ------------------------------------------------------------------ */
/* Sample data                                                         */
/* ------------------------------------------------------------------ */

const POSITIONS = [
  {
    id: 1n,
    sortOrder: 0n,
    name: "Bartender",
    description: "Front-of-bar cocktail and service training.",
    createdAt: ts(40),
    updatedAt: ts(2),
    categoryCount: 3n,
  },
  {
    id: 2n,
    sortOrder: 1n,
    name: "Line Cook",
    description: "Hot kitchen station fundamentals.",
    createdAt: ts(38),
    updatedAt: ts(5),
    categoryCount: 2n,
  },
  {
    id: 3n,
    sortOrder: 2n,
    name: "Server",
    description: null,
    createdAt: ts(30),
    updatedAt: ts(8),
    categoryCount: 1n,
  },
];

const CATEGORIES = [
  {
    id: 10n,
    sortOrder: 0n,
    name: "Cocktails",
    itemCount: 4n,
    positionId: 1n,
    coverPhoto: placeholderBlob(),
  },
  {
    id: 11n,
    sortOrder: 1n,
    name: "Spirits & Liqueurs",
    itemCount: 2n,
    positionId: 1n,
    coverPhoto: placeholderBlob(),
  },
  {
    id: 12n,
    sortOrder: 2n,
    name: "Beer & Wine",
    itemCount: 3n,
    positionId: 1n,
    coverPhoto: placeholderBlob(),
  },
  {
    id: 20n,
    sortOrder: 0n,
    name: "Hot Apps",
    itemCount: 3n,
    positionId: 2n,
    coverPhoto: placeholderBlob(),
  },
  {
    id: 21n,
    sortOrder: 1n,
    name: "Mains",
    itemCount: 5n,
    positionId: 2n,
    coverPhoto: placeholderBlob(),
  },
  {
    id: 30n,
    sortOrder: 0n,
    name: "Service Flow",
    itemCount: 2n,
    positionId: 3n,
    coverPhoto: placeholderBlob(),
  },
];

const QUIZZES = [
  {
    id: 100n,
    positionId: 1n,
    title: "Cocktail Fundamentals",
    description: "Core cocktail knowledge every bartender must master.",
    passingPercentage: 80n,
    questionCount: 3n,
    createdAt: ts(20),
    updatedAt: ts(1),
  },
  {
    id: 101n,
    positionId: 1n,
    title: "Spirits Identification",
    description: null,
    passingPercentage: 70n,
    questionCount: 2n,
    createdAt: ts(12),
    updatedAt: ts(6),
  },
  {
    id: 102n,
    positionId: 2n,
    title: "Kitchen Safety Quiz",
    description: "Health, safety, and sanitation essentials for the line.",
    passingPercentage: 90n,
    questionCount: 2n,
    createdAt: ts(9),
    updatedAt: ts(3),
  },
];

const QUESTIONS = [
  // Quiz 100 — Cocktail Fundamentals
  {
    id: 1000n,
    quizId: 100n,
    order: 0n,
    text: "What is the base spirit of a classic Margarita?",
    type: QuestionType.single,
    options: [
      { id: 1n, questionId: 1000n, order: 0n, text: "Tequila", isCorrect: true },
      { id: 2n, questionId: 1000n, order: 1n, text: "Vodka", isCorrect: false },
      { id: 3n, questionId: 1000n, order: 2n, text: "Gin", isCorrect: false },
      { id: 4n, questionId: 1000n, order: 3n, text: "Rum", isCorrect: false },
    ],
  },
  {
    id: 1001n,
    quizId: 100n,
    order: 1n,
    text: "Which of the following are citrus juices used in a Margarita? (Select all that apply)",
    type: QuestionType.multiple,
    options: [
      { id: 5n, questionId: 1001n, order: 0n, text: "Lime juice", isCorrect: true },
      { id: 6n, questionId: 1001n, order: 1n, text: "Lemon juice", isCorrect: false },
      { id: 7n, questionId: 1001n, order: 2n, text: "Orange juice", isCorrect: false },
      { id: 8n, questionId: 1001n, order: 3n, text: "Grapefruit juice", isCorrect: false },
    ],
  },
  {
    id: 1002n,
    quizId: 100n,
    order: 2n,
    text: "A Negroni is built with equal parts gin, Campari, and sweet vermouth.",
    type: QuestionType.single,
    options: [
      { id: 9n, questionId: 1002n, order: 0n, text: "True", isCorrect: true },
      { id: 10n, questionId: 1002n, order: 1n, text: "False", isCorrect: false },
    ],
  },
  // Quiz 101 — Spirits Identification
  {
    id: 1010n,
    quizId: 101n,
    order: 0n,
    text: "Which spirit is distilled from fermented grain mash and aged in oak?",
    type: QuestionType.single,
    options: [
      { id: 11n, questionId: 1010n, order: 0n, text: "Whiskey", isCorrect: true },
      { id: 12n, questionId: 1010n, order: 1n, text: "Tequila", isCorrect: false },
      { id: 13n, questionId: 1010n, order: 2n, text: "Vodka", isCorrect: false },
    ],
  },
  {
    id: 1011n,
    quizId: 101n,
    order: 1n,
    text: "Which of these are clear spirits? (Select all that apply)",
    type: QuestionType.multiple,
    options: [
      { id: 14n, questionId: 1011n, order: 0n, text: "Vodka", isCorrect: true },
      { id: 15n, questionId: 1011n, order: 1n, text: "White rum", isCorrect: true },
      { id: 16n, questionId: 1011n, order: 2n, text: "Aged rum", isCorrect: false },
      { id: 17n, questionId: 1011n, order: 3n, text: "Cognac", isCorrect: false },
    ],
  },
  // Quiz 102 — Kitchen Safety
  {
    id: 1020n,
    quizId: 102n,
    order: 0n,
    text: "What is the minimum safe internal temperature for cooked chicken?",
    type: QuestionType.single,
    options: [
      { id: 18n, questionId: 1020n, order: 0n, text: "145°F (63°C)", isCorrect: false },
      { id: 19n, questionId: 1020n, order: 1n, text: "165°F (74°C)", isCorrect: true },
      { id: 20n, questionId: 1020n, order: 2n, text: "155°F (68°C)", isCorrect: false },
    ],
  },
  {
    id: 1021n,
    quizId: 102n,
    order: 1n,
    text: "Which practices help prevent cross-contamination? (Select all that apply)",
    type: QuestionType.multiple,
    options: [
      { id: 21n, questionId: 1021n, order: 0n, text: "Separate cutting boards for raw meat and produce", isCorrect: true },
      { id: 22n, questionId: 1021n, order: 1n, text: "Wash hands between tasks", isCorrect: true },
      { id: 23n, questionId: 1021n, order: 2n, text: "Use the same knife for everything", isCorrect: false },
    ],
  },
];

/** A couple of past attempts for the signed-in trainee on quiz 100. */
const ATTEMPTS = [
  {
    id: 5000n,
    quizId: 100n,
    userId: MOCK_PRINCIPAL_TEXT,
    score: 2n,
    total: 3n,
    percentage: 67n,
    passed: false,
    answers: [
      { questionId: 1000n, selectedOptionIds: [1n] },
      { questionId: 1001n, selectedOptionIds: [5n, 6n] },
      { questionId: 1002n, selectedOptionIds: [9n] },
    ],
    submittedAt: ts(4),
  },
  {
    id: 5001n,
    quizId: 100n,
    userId: MOCK_PRINCIPAL_TEXT,
    score: 3n,
    total: 3n,
    percentage: 100n,
    passed: true,
    answers: [
      { questionId: 1000n, selectedOptionIds: [1n] },
      { questionId: 1001n, selectedOptionIds: [5n] },
      { questionId: 1002n, selectedOptionIds: [9n] },
    ],
    submittedAt: ts(1),
  },
];

const THEME = {
  font: FontChoice.sansSerif,
  primaryColor: "#8a4a2a",
  accentColor: "#3f7d5a",
  logo: undefined,
  updatedAt: ts(15),
};

const USERS = [
  {
    principal: { toText: () => MOCK_PRINCIPAL_TEXT } as unknown as Principal,
    displayName: "Alex Morgan",
    createdAt: ts(40),
    role: UserRole.admin,
  },
  {
    principal: { toText: () => "2vxsx-fae-2" } as unknown as Principal,
    displayName: "Jamie Cook",
    createdAt: ts(20),
    role: UserRole.user,
  },
];

/* ------------------------------------------------------------------ */
/* Mutable in-memory store (so create/update/delete reflect in QA)     */
/* ------------------------------------------------------------------ */

let quizzes = QUIZZES.map((q) => ({ ...q }));
let questions = QUESTIONS.map((q) => ({
  ...q,
  options: q.options.map((o) => ({ ...o })),
}));
let attempts = ATTEMPTS.map((a) => ({ ...a }));
let nextQuizId = 200n;
let nextQuestionId = 2000n;
let nextOptionId = 100n;
let nextAttemptId = 6000n;

/* ------------------------------------------------------------------ */
/* Mock backend                                                        */
/* ------------------------------------------------------------------ */

export const mockBackend: backendInterface = {
  /* ---- Theme ---- */
  async getTheme() {
    return { ...THEME };
  },
  async updateTheme(primaryColor, accentColor, font) {
    if (primaryColor !== null) THEME.primaryColor = primaryColor;
    if (accentColor !== null) THEME.accentColor = accentColor;
    if (font !== null) THEME.font = font;
    THEME.updatedAt = ts(0);
    return { ...THEME };
  },
  async updateLogo(logo) {
    THEME.logo = logo ?? undefined;
    THEME.updatedAt = ts(0);
    return { ...THEME };
  },
  async resetTheme() {
    THEME.primaryColor = "#8a4a2a";
    THEME.accentColor = "#3f7d5a";
    THEME.font = FontChoice.sansSerif;
    THEME.logo = undefined;
    THEME.updatedAt = ts(0);
    return { ...THEME };
  },

  /* ---- Auth / users ---- */
  async getCallerUserProfile() {
    return USERS[0] ?? null;
  },
  async getCallerUserRole() {
    return UserRole.admin;
  },
  async isCallerAdmin() {
    return true;
  },
  async listUsers() {
    return [...USERS];
  },
  async saveCallerUserProfile(displayName) {
    USERS[0] = { ...USERS[0], displayName };
    return USERS[0];
  },
  async assignCallerUserRole() {
    return undefined;
  },
  async assignRole(_user, role) {
    return { ...USERS[0], role };
  },
  async revokeRole() {
    return { ...USERS[0], role: UserRole.guest };
  },

  /* ---- Positions ---- */
  async listPositions() {
    return POSITIONS.map((p) => ({ ...p, coverPhoto: undefined }));
  },
  async getPosition(id) {
    const p = POSITIONS.find((x) => x.id === id);
    return p ? { ...p, coverPhoto: undefined } : null;
  },
  async createPosition(name, description, _coverPhoto) {
    return 4n;
  },
  async updatePosition() {
    return undefined;
  },
  async deletePosition() {
    return 0n;
  },
  async setPositionSortOrder() {
    return undefined;
  },

  /* ---- Categories ---- */
  async listCategories() {
    return CATEGORIES.map((c) => ({ ...c }));
  },
  async createCategory() {
    return 99n;
  },
  async updateCategory() {
    return undefined;
  },
  async deleteCategory() {
    return 0n;
  },
  async setCategorySortOrder() {
    return undefined;
  },

  /* ---- Sub-categories ---- */
  async listSubCategories() {
    return [];
  },
  async createSubCategory() {
    return {
      id: 999n,
      sortOrder: 0n,
      name: "New Sub",
      itemCount: 0n,
      parentCategoryId: 0n,
      coverPhoto: placeholderBlob(),
    };
  },
  async updateSubCategory() {
    return {
      id: 999n,
      sortOrder: 0n,
      name: "Sub",
      itemCount: 0n,
      parentCategoryId: 0n,
      coverPhoto: placeholderBlob(),
    };
  },
  async deleteSubCategory() {
    return { itemCount: 0n };
  },
  async setSubCategorySortOrder() {
    return undefined;
  },

  /* ---- Menu items ---- */
  async listItemsByCategory() {
    return [];
  },
  async listItemsBySubCategory() {
    return [];
  },
  async getMenuItem() {
    return null;
  },
  async createMenuItem() {
    return 1n;
  },
  async updateMenuItem() {
    return undefined;
  },
  async updateMenuItemRecipe() {
    return undefined;
  },
  async deleteMenuItem() {
    return undefined;
  },
  async searchItems() {
    return [];
  },
  async searchItemsInCategory() {
    return [];
  },

  /* ---- Training steps ---- */
  async listTrainingSteps() {
    return [];
  },
  async getTrainingStep() {
    return null;
  },
  async createTrainingStep() {
    return {
      id: 1n,
      itemId: 1n,
      order: 0n,
      text: "Step one",
      photo: undefined,
      video: undefined,
    };
  },
  async editTrainingStep() {
    return {
      id: 1n,
      itemId: 1n,
      order: 0n,
      text: "Step one",
      photo: undefined,
      video: undefined,
    };
  },
  async deleteTrainingStep() {
    return true;
  },
  async moveTrainingStep() {
    return true;
  },

  /* ---- Quizzes (QuizActor surface — accessed via quizActor() cast) ---- */
  // NOTE: the hooks call these through `quizActor(actor).listQuizzes()` etc.
  // They are NOT on backendInterface but the same actor object is cast, so
  // they must exist on the mock.
  async listQuizzes() {
    return quizzes.map((q) => ({ ...q }));
  },
  async listQuizzesByPosition(positionId) {
    return quizzes
      .filter((q) => q.positionId === positionId)
      .map((q) => ({ ...q }));
  },
  async getQuiz(quizId) {
    const q = quizzes.find((x) => x.id === quizId);
    return q ? { ...q } : null;
  },
  async getQuizWithQuestions(quizId) {
    const q = quizzes.find((x) => x.id === quizId);
    if (!q) return null;
    return {
      quiz: { ...q },
      questions: questions
        .filter((qq) => qq.quizId === quizId)
        .map((qq) => ({
          id: qq.id,
          order: qq.order,
          text: qq.text,
          questionType: qq.type,
          quizId: qq.quizId,
          options: qq.options.map((o) => ({
            id: o.id,
            text: o.text,
            correct: o.isCorrect,
          })),
        })),
    };
  },
  async createQuiz(positionId, input) {
    const id = nextQuizId++;
    const newQuiz = {
      id,
      positionId,
      title: input.title,
      description: input.description ?? null,
      passingPercentage: input.passingPercentage,
      questionCount: 0n,
      createdAt: ts(0),
      updatedAt: ts(0),
    };
    quizzes = [...quizzes, newQuiz];
    return id;
  },
  async updateQuiz(quizId, edit) {
    quizzes = quizzes.map((q) =>
      q.id === quizId
        ? {
            ...q,
            title: edit.title,
            description: edit.description ?? null,
            passingPercentage: edit.passingPercentage,
            updatedAt: ts(0),
          }
        : q,
    );
    return undefined;
  },
  async deleteQuiz(quizId) {
    quizzes = quizzes.filter((q) => q.id !== quizId);
    questions = questions.filter((qq) => qq.quizId !== quizId);
    return true;
  },

  /* ---- Questions ---- */
  async listQuestions(quizId) {
    return questions
      .filter((q) => q.quizId === quizId)
      .map((q) => ({ ...q, options: q.options.map((o) => ({ ...o })) }));
  },
  async createQuestion(quizId, input) {
    const id = nextQuestionId++;
    const opts = input.options.map((o, i) => ({
      id: nextOptionId++,
      questionId: id,
      order: BigInt(i),
      text: o.text,
      isCorrect: o.isCorrect,
    }));
    const newQ = {
      id,
      quizId,
      order: BigInt(questions.filter((q) => q.quizId === quizId).length),
      text: input.text,
      type: input.type,
      options: opts,
    };
    questions = [...questions, newQ];
    quizzes = quizzes.map((q) =>
      q.id === quizId
        ? { ...q, questionCount: BigInt(q.questionCount) + 1n, updatedAt: ts(0) }
        : q,
    );
    return {
      id,
      order: newQ.order,
      text: newQ.text,
      questionType: newQ.type,
      quizId,
      options: opts.map((o) => ({
        id: o.id,
        text: o.text,
        correct: o.isCorrect,
      })),
    };
  },
  async updateQuestion(questionId, edit) {
    questions = questions.map((q) => {
      if (q.id !== questionId) return q;
      const opts = edit.options.map((o, i) => {
        const existing = q.options.find((eo) => eo.id === o.id);
        return {
          id: o.id ?? existing?.id ?? nextOptionId++,
          questionId,
          order: BigInt(i),
          text: o.text,
          isCorrect: o.isCorrect,
        };
      });
      return { ...q, text: edit.text, type: edit.type, options: opts };
    });
    const updated = questions.find((q) => q.id === questionId)!;
    return {
      id: updated.id,
      order: updated.order,
      text: updated.text,
      questionType: updated.type,
      quizId: updated.quizId,
      options: updated.options.map((o) => ({
        id: o.id,
        text: o.text,
        correct: o.isCorrect,
      })),
    };
  },
  async deleteQuestion(questionId) {
    const q = questions.find((x) => x.id === questionId);
    questions = questions.filter((x) => x.id !== questionId);
    if (q) {
      quizzes = quizzes.map((qq) =>
        qq.id === q.quizId
          ? { ...qq, questionCount: BigInt(qq.questionCount) - 1n }
          : qq,
      );
    }
    return true;
  },
  async moveQuestion(questionId, newOrder) {
    questions = questions.map((q) =>
      q.id === questionId ? { ...q, order: newOrder } : q,
    );
    return true;
  },

  /* ---- Attempts ---- */
  async listAttempts(quizId) {
    return attempts.filter((a) => a.quizId === quizId).map((a) => ({ ...a }));
  },
  async listMyQuizAttempts(quizId) {
    return attempts.filter((a) => a.quizId === quizId).map((a) => ({ ...a }));
  },
  async submitQuizAttempt(input) {
    const quizId = input.quizId;
    const quizQuestions = questions.filter((q) => q.quizId === quizId);
    let score = 0n;
    for (const ans of input.answers) {
      const q = quizQuestions.find((x) => x.id === ans.questionId);
      if (!q) continue;
      const correctIds = new Set(
        q.options.filter((o) => o.isCorrect).map((o) => o.id),
      );
      const selected = new Set<bigint>(ans.selectedOptionIds);
      const isCorrect =
        correctIds.size === selected.size &&
        [...selected].every((id: bigint) => correctIds.has(id));
      if (isCorrect) score += 1n;
    }
    const total = BigInt(quizQuestions.length);
    const percentage =
      total > 0n ? (score * 100n) / total : 0n;
    const quiz = quizzes.find((x) => x.id === quizId);
    const passed = percentage >= (quiz?.passingPercentage ?? 0n);
    const attempt = {
      id: nextAttemptId++,
      quizId,
      userId: MOCK_PRINCIPAL_TEXT,
      score,
      total,
      percentage,
      passed,
      answers: input.answers.map((a) => ({ ...a })),
      submittedAt: ts(0),
    };
    attempts = [...attempts, attempt];
    return { ...attempt };
  },

  /* ---- Bindgen quiz methods (backendInterface surface) ---- */
  // These mirror the QuizActor methods above but with the bindgen arg/return
  // shapes (e.g. QuestionInput with questionType, AnswerOption with correct).
  // Provided for completeness; the hooks use the QuizActor-cast versions.
  async createQuestion_bindgen() {
    throw new Error("not used in mock");
  },

  /* ---- Stubbed internal/storage methods (not used by the UI) ---- */
  async __accessControlState() {
    return {};
  },
  async __categories() {
    return [];
  },
  async __items() {
    return [];
  },
  async __positions() {
    return [];
  },
  async __quizAttempts() {
    return [];
  },
  async __quizQuestions() {
    return [];
  },
  async __quizState() {
    return {};
  },
  async __quizzes() {
    return [];
  },
  async __state() {
    return {};
  },
  async __steps() {
    return [];
  },
  async __subCategories() {
    return [];
  },
  async __theme() {
    return {};
  },
  async __trainingState() {
    return {};
  },
  async __users() {
    return [];
  },
  async _immutableObjectStorageBlobsAreLive() {
    return [];
  },
  async _immutableObjectStorageBlobsToDelete() {
    return [];
  },
  async _immutableObjectStorageConfirmBlobDeletion() {
    return undefined;
  },
  async _immutableObjectStorageCreateCertificate() {
    return { method: "stub", blob_hash: "stub" };
  },
  async _immutableObjectStorageRefillCashier() {
    return { success: true, topped_up_amount: 0n };
  },
  async _immutableObjectStorageUpdateGatewayPrincipals() {
    return undefined;
  },
  async _initialize_access_control() {
    return undefined;
  },
  async _internet_identity_sign_in_finish() {
    return { __kind__: "ok" as const, ok: null };
  },
  async _internet_identity_sign_in_start() {
    return new Uint8Array(0);
  },
} as unknown as backendInterface;
