import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface QuizEdit {
    title: string;
    description?: string;
    passingPercentage: bigint;
}
export type Timestamp = bigint;
export type PositionId = bigint;
export interface TrainingStepEdit {
    video?: ExternalBlob;
    text: string;
    photo?: ExternalBlob;
}
export interface ThemePublic {
    font: FontChoice;
    primaryColor: string;
    logo?: ExternalBlob;
    accentColor: string;
    updatedAt: Timestamp;
}
export type SubCategoryId = bigint;
export interface QuizPublic {
    id: QuizId;
    title: string;
    createdAt: Timestamp;
    description?: string;
    positionId: PositionId;
    updatedAt: Timestamp;
    passingPercentage: bigint;
    questionCount: bigint;
}
export interface QuestionPublic {
    id: QuestionId;
    order: bigint;
    text: string;
    questionType: QuestionType;
    quizId: QuizId;
    options: Array<AnswerOption>;
}
export interface CategoryPublic {
    id: CategoryId;
    sortOrder: bigint;
    name: string;
    itemCount: bigint;
    positionId: PositionId;
    coverPhoto: ExternalBlob;
}
export interface QuizInput {
    title: string;
    description?: string;
    passingPercentage: bigint;
}
export interface AttemptPublic {
    id: AttemptId;
    maxScore: bigint;
    answers: Array<AttemptAnswer>;
    createdAt: Timestamp;
    score: bigint;
    quizId: QuizId;
    passed: boolean;
}
export type AttemptId = bigint;
export interface TrainingStepPublic {
    id: bigint;
    itemId: ItemId;
    order: bigint;
    video?: ExternalBlob;
    text: string;
    photo?: ExternalBlob;
}
export type ItemId = bigint;
export interface AnswerOptionInput {
    text: string;
    correct: boolean;
}
export interface QuestionEdit {
    text: string;
    questionType: QuestionType;
    options: Array<AnswerOptionInput>;
}
export interface AttemptInput {
    answers: Array<AttemptAnswer>;
    quizId: QuizId;
}
export interface PositionPublic {
    id: PositionId;
    sortOrder: bigint;
    name: string;
    createdAt: Timestamp;
    description?: string;
    coverPhoto?: ExternalBlob;
    updatedAt: Timestamp;
    categoryCount: bigint;
}
export type QuestionId = bigint;
export type Principal = Principal;
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface UserProfilePublic {
    principal: Principal;
    displayName: string;
    createdAt: Timestamp;
    role: UserRole;
}
export interface TrainingStepInput {
    video?: ExternalBlob;
    text: string;
    photo?: ExternalBlob;
}
export interface SubCategoryPublic {
    id: SubCategoryId;
    sortOrder: bigint;
    name: string;
    itemCount: bigint;
    parentCategoryId: CategoryId;
    coverPhoto: ExternalBlob;
}
export type Result = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface AttemptAnswer {
    questionId: QuestionId;
    selectedOptionIds: Array<bigint>;
}
export type CategoryId = bigint;
export interface QuestionInput {
    text: string;
    questionType: QuestionType;
    options: Array<AnswerOptionInput>;
}
export interface MenuItemPublic {
    id: ItemId;
    categoryId: CategoryId;
    name: string;
    description: string;
    instructions: Array<string>;
    subCategoryId?: SubCategoryId;
    itemPhoto: ExternalBlob;
    ingredients: Array<string>;
}
export interface AnswerOption {
    id: bigint;
    text: string;
    correct: boolean;
}
export type QuizId = bigint;
export enum FontChoice {
    sansSerif = "sansSerif",
    monospace = "monospace",
    serif = "serif",
    systemFont = "systemFont"
}
export enum QuestionType {
    multiple = "multiple",
    single = "single"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignRole(user: Principal, role: UserRole): Promise<UserProfilePublic>;
    createCategory(positionId: PositionId, name: string, coverPhoto: ExternalBlob): Promise<CategoryId>;
    createMenuItem(categoryId: CategoryId, subCategoryId: SubCategoryId | null, name: string, description: string, itemPhoto: ExternalBlob): Promise<ItemId>;
    createPosition(name: string, description: string | null, coverPhoto: ExternalBlob | null): Promise<PositionId>;
    createQuestion(quizId: QuizId, input: QuestionInput): Promise<QuestionPublic>;
    createQuiz(positionId: PositionId, input: QuizInput): Promise<QuizId>;
    createSubCategory(parentCategoryId: CategoryId, name: string, coverPhoto: ExternalBlob): Promise<SubCategoryPublic>;
    createTrainingStep(itemId: ItemId, input: TrainingStepInput): Promise<TrainingStepPublic>;
    deleteCategory(id: CategoryId): Promise<bigint>;
    deleteMenuItem(id: ItemId): Promise<void>;
    deletePosition(id: PositionId): Promise<bigint>;
    deleteQuestion(questionId: QuestionId): Promise<boolean>;
    deleteQuiz(quizId: QuizId): Promise<boolean>;
    deleteSubCategory(id: SubCategoryId): Promise<{
        itemCount: bigint;
    }>;
    deleteTrainingStep(stepId: bigint): Promise<boolean>;
    editTrainingStep(stepId: bigint, edit: TrainingStepEdit): Promise<TrainingStepPublic>;
    getCallerUserProfile(): Promise<UserProfilePublic | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMenuItem(itemId: ItemId): Promise<MenuItemPublic | null>;
    getPosition(id: PositionId): Promise<PositionPublic | null>;
    getQuizWithQuestions(quizId: QuizId): Promise<{
        quiz: QuizPublic;
        questions: Array<QuestionPublic>;
    } | null>;
    getTheme(): Promise<ThemePublic>;
    getTrainingStep(stepId: bigint): Promise<TrainingStepPublic | null>;
    isCallerAdmin(): Promise<boolean>;
    listCategories(): Promise<Array<CategoryPublic>>;
    listItemsByCategory(categoryId: CategoryId): Promise<Array<MenuItemPublic>>;
    listItemsBySubCategory(subCategoryId: SubCategoryId): Promise<Array<MenuItemPublic>>;
    listMyQuizAttempts(quizId: QuizId): Promise<Array<AttemptPublic>>;
    listPositions(): Promise<Array<PositionPublic>>;
    listQuizzesByPosition(positionId: PositionId): Promise<Array<QuizPublic>>;
    listSubCategories(categoryId: CategoryId): Promise<Array<SubCategoryPublic>>;
    listTrainingSteps(itemId: ItemId): Promise<Array<TrainingStepPublic>>;
    listUsers(): Promise<Array<UserProfilePublic>>;
    moveQuestion(questionId: QuestionId, newOrder: bigint): Promise<boolean>;
    moveTrainingStep(stepId: bigint, newOrder: bigint): Promise<boolean>;
    resetTheme(): Promise<ThemePublic>;
    revokeRole(user: Principal): Promise<UserProfilePublic>;
    saveCallerUserProfile(displayName: string): Promise<UserProfilePublic>;
    searchItems(searchTerm: string): Promise<Array<MenuItemPublic>>;
    searchItemsInCategory(categoryId: CategoryId, searchTerm: string): Promise<Array<MenuItemPublic>>;
    setCategorySortOrder(id: CategoryId, sortOrder: bigint): Promise<void>;
    setPositionSortOrder(id: PositionId, sortOrder: bigint): Promise<void>;
    setSubCategorySortOrder(id: SubCategoryId, sortOrder: bigint): Promise<void>;
    submitQuizAttempt(input: AttemptInput): Promise<AttemptPublic>;
    updateCategory(id: CategoryId, positionId: PositionId, name: string, coverPhoto: ExternalBlob): Promise<void>;
    updateLogo(logo: ExternalBlob | null): Promise<ThemePublic>;
    updateMenuItem(id: ItemId, categoryId: CategoryId, subCategoryId: SubCategoryId | null, name: string, description: string, itemPhoto: ExternalBlob): Promise<void>;
    updateMenuItemRecipe(id: ItemId, ingredients: Array<string>, instructions: Array<string>): Promise<void>;
    updatePosition(id: PositionId, name: string, description: string | null, coverPhoto: ExternalBlob | null): Promise<void>;
    updateQuestion(questionId: QuestionId, edit: QuestionEdit): Promise<QuestionPublic>;
    updateQuiz(quizId: QuizId, edit: QuizEdit): Promise<void>;
    updateSubCategory(id: SubCategoryId, name: string, coverPhoto: ExternalBlob): Promise<SubCategoryPublic>;
    updateTheme(primaryColor: string | null, accentColor: string | null, font: FontChoice | null): Promise<ThemePublic>;
}
