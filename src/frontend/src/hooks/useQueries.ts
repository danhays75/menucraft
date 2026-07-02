// React Query hooks for every backend method. All data operations go through
// the actor returned by useActor(createActor) — never localStorage or context.

import { createActor } from "@/backend";
import type {
  CategoryId,
  CategoryPublic,
  ExternalBlob,
  FontChoice,
  ItemId,
  MenuItemPublic,
  PositionId,
  PositionPublic,
  SubCategoryId,
  SubCategoryPublic,
  ThemePublic,
  TrainingStepEdit,
  TrainingStepInput,
  TrainingStepPublic,
  UserProfilePublic,
  UserRole,
} from "@/backend";
import type {
  AttemptAnswerPublic,
  AttemptInput,
  AttemptPublic,
  QuestionEdit,
  QuestionInput,
  QuestionPublic,
  QuizEdit,
  QuizInput,
  QuizPublic,
} from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/* ------------------------------------------------------------------ */
/* Theme                                                               */
/* ------------------------------------------------------------------ */

export function useTheme() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<ThemePublic>({
    queryKey: ["theme"],
    queryFn: async () => {
      if (!actor) throw new Error("actor not ready");
      return actor.getTheme();
    },
    enabled: !!actor && !isFetching,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useUpdateTheme() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      primaryColor: string | null;
      accentColor: string | null;
      font: FontChoice | null;
    }) => {
      if (!actor) throw new Error("actor not ready");
      return actor.updateTheme(vars.primaryColor, vars.accentColor, vars.font);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["theme"] }),
  });
}

export function useUpdateLogo() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (logo: ExternalBlob | null) => {
      if (!actor) throw new Error("actor not ready");
      return actor.updateLogo(logo);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["theme"] }),
  });
}

export function useResetTheme() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("actor not ready");
      return actor.resetTheme();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["theme"] }),
  });
}

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

export function useUsers() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<UserProfilePublic[]>({
    queryKey: ["users"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateUserName() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { principal: Principal; displayName: string }) => {
      if (!actor) throw new Error("actor not ready");
      return actor.saveCallerUserProfile(vars.displayName);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useAssignRole() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error("actor not ready");
      return actor.assignRole(vars.user, vars.role);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useRevokeRole() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("actor not ready");
      return actor.revokeRole(user);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

/* ------------------------------------------------------------------ */
/* Positions                                                            */
/* ------------------------------------------------------------------ */

export function usePositions() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<PositionPublic[]>({
    queryKey: ["positions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPositions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePosition(id: PositionId | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<PositionPublic | null>({
    queryKey: ["position", String(id)],
    queryFn: async () => {
      if (!actor || id === undefined) return null;
      return actor.getPosition(id);
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useCreatePosition() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      name: string;
      description: string | null;
      coverPhoto: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error("actor not ready");
      return actor.createPosition(vars.name, vars.description, vars.coverPhoto);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["positions"] }),
  });
}

export function useUpdatePosition() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: PositionId;
      name: string;
      description: string | null;
      coverPhoto: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error("actor not ready");
      await actor.updatePosition(
        vars.id,
        vars.name,
        vars.description,
        vars.coverPhoto,
      );
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["positions"] });
      qc.invalidateQueries({ queryKey: ["position", String(vars.id)] });
    },
  });
}

export function useDeletePosition() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: PositionId) => {
      if (!actor) throw new Error("actor not ready");
      return actor.deletePosition(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["positions"] }),
  });
}

export function useSetPositionSortOrder() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: PositionId; sortOrder: bigint }) => {
      if (!actor) throw new Error("actor not ready");
      await actor.setPositionSortOrder(vars.id, vars.sortOrder);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["positions"] }),
  });
}

export function useCategoriesByPosition(positionId: PositionId | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<CategoryPublic[]>({
    queryKey: ["categories", "position", String(positionId)],
    queryFn: async () => {
      if (!actor || positionId === undefined) return [];
      // The backend does not expose listCategoriesByPosition; filter the full
      // list client-side by positionId. CategoryPublic carries positionId.
      const all = await actor.listCategories();
      return all.filter((c) => c.positionId === positionId);
    },
    enabled: !!actor && !isFetching && positionId !== undefined,
  });
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export function useCategories() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<CategoryPublic[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCategories();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCategory(id: CategoryId | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<CategoryPublic | null>({
    queryKey: ["category", String(id)],
    queryFn: async () => {
      if (!actor || id === undefined) return null;
      const all = await actor.listCategories();
      return all.find((c) => c.id === id) ?? null;
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useCreateCategory() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      positionId: PositionId;
      name: string;
      coverPhoto: ExternalBlob;
    }) => {
      if (!actor) throw new Error("actor not ready");
      return actor.createCategory(vars.positionId, vars.name, vars.coverPhoto);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({
        queryKey: ["categories", "position", String(vars.positionId)],
      });
      qc.invalidateQueries({ queryKey: ["positions"] });
    },
  });
}

export function useUpdateCategory() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: CategoryId;
      positionId: PositionId;
      name: string;
      coverPhoto: ExternalBlob;
    }) => {
      if (!actor) throw new Error("actor not ready");
      await actor.updateCategory(
        vars.id,
        vars.positionId,
        vars.name,
        vars.coverPhoto,
      );
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({
        queryKey: ["categories", "position", String(vars.positionId)],
      });
      qc.invalidateQueries({ queryKey: ["positions"] });
    },
  });
}

export function useDeleteCategory() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: CategoryId) => {
      if (!actor) throw new Error("actor not ready");
      return actor.deleteCategory(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useSetCategorySortOrder() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: CategoryId; sortOrder: bigint }) => {
      if (!actor) throw new Error("actor not ready");
      await actor.setCategorySortOrder(vars.id, vars.sortOrder);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

/* ------------------------------------------------------------------ */
/* Sub-categories                                                      */
/* ------------------------------------------------------------------ */

export function useSubCategories(categoryId: CategoryId | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<SubCategoryPublic[]>({
    queryKey: ["subcategories", String(categoryId)],
    queryFn: async () => {
      if (!actor || categoryId === undefined) return [];
      return actor.listSubCategories(categoryId);
    },
    enabled: !!actor && !isFetching && categoryId !== undefined,
  });
}

export function useItemsBySubCategory(
  subCategoryId: SubCategoryId | undefined,
) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<MenuItemPublic[]>({
    queryKey: ["items", "subcategory", String(subCategoryId)],
    queryFn: async () => {
      if (!actor || subCategoryId === undefined) return [];
      return actor.listItemsBySubCategory(subCategoryId);
    },
    enabled: !!actor && !isFetching && subCategoryId !== undefined,
  });
}

export function useCreateSubCategory() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      parentCategoryId: CategoryId;
      name: string;
      coverPhoto: ExternalBlob;
    }) => {
      if (!actor) throw new Error("actor not ready");
      return actor.createSubCategory(
        vars.parentCategoryId,
        vars.name,
        vars.coverPhoto,
      );
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({
        queryKey: ["subcategories", String(vars.parentCategoryId)],
      });
    },
  });
}

export function useUpdateSubCategory() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: SubCategoryId;
      parentCategoryId: CategoryId;
      name: string;
      coverPhoto: ExternalBlob;
    }) => {
      if (!actor) throw new Error("actor not ready");
      return actor.updateSubCategory(vars.id, vars.name, vars.coverPhoto);
    },
    onSuccess: (_data, vars) => {
      // Invalidate the parent's subcategory list plus a broad sweep in case
      // the caller didn't pass the parent (covers all subcategory keys).
      qc.invalidateQueries({
        queryKey: ["subcategories", String(vars.parentCategoryId)],
      });
      qc.invalidateQueries({ queryKey: ["subcategories"] });
    },
  });
}

export function useDeleteSubCategory() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: SubCategoryId;
      parentCategoryId: CategoryId;
    }) => {
      if (!actor) throw new Error("actor not ready");
      return actor.deleteSubCategory(vars.id);
    },
    onSuccess: (_data, vars) => {
      // Item counts change on the parent category and its subcategory list;
      // items get reassigned to the parent so its item list is stale too.
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({
        queryKey: ["subcategories", String(vars.parentCategoryId)],
      });
      qc.invalidateQueries({
        queryKey: ["items", "category", String(vars.parentCategoryId)],
      });
      qc.invalidateQueries({ queryKey: ["items", "subcategory"] });
    },
  });
}

export function useSetSubCategorySortOrder() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: SubCategoryId;
      parentCategoryId: CategoryId;
      sortOrder: bigint;
    }) => {
      if (!actor) throw new Error("actor not ready");
      await actor.setSubCategorySortOrder(vars.id, vars.sortOrder);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["subcategories", String(vars.parentCategoryId)],
      });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Menu items                                                          */
/* ------------------------------------------------------------------ */

export function useCategoryItems(categoryId: CategoryId | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<MenuItemPublic[]>({
    queryKey: ["items", "category", String(categoryId)],
    queryFn: async () => {
      if (!actor || categoryId === undefined) return [];
      return actor.listItemsByCategory(categoryId);
    },
    enabled: !!actor && !isFetching && categoryId !== undefined,
  });
}

export function useMenuItem(itemId: ItemId | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<MenuItemPublic | null>({
    queryKey: ["item", String(itemId)],
    queryFn: async () => {
      if (!actor || itemId === undefined) return null;
      return actor.getMenuItem(itemId);
    },
    enabled: !!actor && !isFetching && itemId !== undefined,
  });
}

export function useCreateMenuItem() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      categoryId: CategoryId;
      subCategoryId?: SubCategoryId | null;
      name: string;
      description: string;
      itemPhoto: ExternalBlob;
    }) => {
      if (!actor) throw new Error("actor not ready");
      return actor.createMenuItem(
        vars.categoryId,
        vars.subCategoryId ?? null,
        vars.name,
        vars.description,
        vars.itemPhoto,
      );
    },
    onSuccess: (_data, vars) => {
      const subId = vars.subCategoryId ?? null;
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({
        queryKey: ["items", "category", String(vars.categoryId)],
      });
      if (subId !== null) {
        qc.invalidateQueries({
          queryKey: ["items", "subcategory", String(subId)],
        });
        qc.invalidateQueries({
          queryKey: ["subcategories", String(vars.categoryId)],
        });
      }
    },
  });
}

export function useUpdateMenuItem() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: ItemId;
      categoryId: CategoryId;
      subCategoryId?: SubCategoryId | null;
      name: string;
      description: string;
      itemPhoto: ExternalBlob;
    }) => {
      if (!actor) throw new Error("actor not ready");
      await actor.updateMenuItem(
        vars.id,
        vars.categoryId,
        vars.subCategoryId ?? null,
        vars.name,
        vars.description,
        vars.itemPhoto,
      );
    },
    onSuccess: (_data, vars) => {
      const subId = vars.subCategoryId ?? null;
      qc.invalidateQueries({ queryKey: ["item", String(vars.id)] });
      qc.invalidateQueries({
        queryKey: ["items", "category", String(vars.categoryId)],
      });
      if (subId !== null) {
        qc.invalidateQueries({
          queryKey: ["items", "subcategory", String(subId)],
        });
      }
      // Sweep all subcategory lists — an item moving into/out of a subcategory
      // changes itemCount on potentially two subcategory lists.
      qc.invalidateQueries({ queryKey: ["subcategories"] });
    },
  });
}

export function useUpdateMenuItemRecipe() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: ItemId;
      ingredients: string[];
      instructions: string[];
    }) => {
      if (!actor) throw new Error("actor not ready");
      await actor.updateMenuItemRecipe(
        vars.id,
        vars.ingredients,
        vars.instructions,
      );
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["item", String(vars.id)] });
    },
  });
}

export function useDeleteMenuItem() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: ItemId;
      categoryId: CategoryId;
      subCategoryId?: SubCategoryId | null;
    }) => {
      if (!actor) throw new Error("actor not ready");
      await actor.deleteMenuItem(vars.id);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({
        queryKey: ["items", "category", String(vars.categoryId)],
      });
      if (vars.subCategoryId) {
        qc.invalidateQueries({
          queryKey: ["items", "subcategory", String(vars.subCategoryId)],
        });
        qc.invalidateQueries({
          queryKey: ["subcategories", String(vars.categoryId)],
        });
      }
    },
  });
}

/* ------------------------------------------------------------------ */
/* Training steps                                                      */
/* ------------------------------------------------------------------ */

export function useTrainingSteps(itemId: ItemId | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<TrainingStepPublic[]>({
    queryKey: ["training", String(itemId)],
    queryFn: async () => {
      if (!actor || itemId === undefined) return [];
      return actor.listTrainingSteps(itemId);
    },
    enabled: !!actor && !isFetching && itemId !== undefined,
  });
}

export function useAddTrainingStep() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      itemId: ItemId;
      input: TrainingStepInput;
    }) => {
      if (!actor) throw new Error("actor not ready");
      return actor.createTrainingStep(vars.itemId, vars.input);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["training", String(vars.itemId)] });
    },
  });
}

export function useUpdateTrainingStep() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      stepId: bigint;
      itemId: ItemId;
      edit: TrainingStepEdit;
    }) => {
      if (!actor) throw new Error("actor not ready");
      return actor.editTrainingStep(vars.stepId, vars.edit);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["training", String(vars.itemId)] });
    },
  });
}

export function useDeleteTrainingStep() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { stepId: bigint; itemId: ItemId }) => {
      if (!actor) throw new Error("actor not ready");
      return actor.deleteTrainingStep(vars.stepId);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["training", String(vars.itemId)] });
    },
  });
}

export function useMoveTrainingStep() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      stepId: bigint;
      newOrder: bigint;
      itemId: ItemId;
    }) => {
      if (!actor) throw new Error("actor not ready");
      return actor.moveTrainingStep(vars.stepId, vars.newOrder);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["training", String(vars.itemId)] });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Quizzes                                                             */
/* ------------------------------------------------------------------ */

/**
 * Quizzes scoped to a single position (storefront + admin per-position view).
 * Backed by the real `listQuizzesByPosition` canister method.
 */
export function useQuizzesByPosition(positionId: PositionId | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<QuizPublic[]>({
    queryKey: ["quizzes", "position", String(positionId)],
    queryFn: async () => {
      if (!actor || positionId === undefined) return [];
      return actor.listQuizzesByPosition(positionId);
    },
    enabled: !!actor && !isFetching && positionId !== undefined,
  });
}

/**
 * A single quiz by id. The backend exposes quiz + questions together via
 * `getQuizWithQuestions`; this hook returns just the quiz half (or null when
 * the quiz doesn't exist). The questions half is available via `useQuestions`.
 */
export function useQuiz(quizId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<QuizPublic | null>({
    queryKey: ["quiz", String(quizId)],
    queryFn: async () => {
      if (!actor || quizId === undefined) return null;
      const data = await actor.getQuizWithQuestions(quizId);
      return data?.quiz ?? null;
    },
    enabled: !!actor && !isFetching && quizId !== undefined,
  });
}

export function useCreateQuiz() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      positionId: PositionId;
      input: QuizInput;
    }) => {
      if (!actor) throw new Error("actor not ready");
      return actor.createQuiz(vars.positionId, vars.input);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["quizzes"] });
      qc.invalidateQueries({
        queryKey: ["quizzes", "position", String(vars.positionId)],
      });
    },
  });
}

export function useUpdateQuiz() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { quizId: bigint; edit: QuizEdit }) => {
      if (!actor) throw new Error("actor not ready");
      await actor.updateQuiz(vars.quizId, vars.edit);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["quizzes"] });
      qc.invalidateQueries({ queryKey: ["quiz", String(vars.quizId)] });
    },
  });
}

export function useDeleteQuiz() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { quizId: bigint; positionId: PositionId }) => {
      if (!actor) throw new Error("actor not ready");
      await actor.deleteQuiz(vars.quizId);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["quizzes"] });
      qc.invalidateQueries({
        queryKey: ["quizzes", "position", String(vars.positionId)],
      });
      qc.invalidateQueries({ queryKey: ["quiz", String(vars.quizId)] });
      qc.invalidateQueries({ queryKey: ["questions", String(vars.quizId)] });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Quiz questions                                                      */
/* ------------------------------------------------------------------ */

/**
 * Ordered questions for a quiz. The backend exposes quiz + questions together
 * via `getQuizWithQuestions`; this hook returns just the questions half.
 */
export function useQuestions(quizId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<QuestionPublic[]>({
    queryKey: ["questions", String(quizId)],
    queryFn: async () => {
      if (!actor || quizId === undefined) return [];
      const data = await actor.getQuizWithQuestions(quizId);
      return data?.questions ?? [];
    },
    enabled: !!actor && !isFetching && quizId !== undefined,
  });
}

export function useCreateQuestion() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { quizId: bigint; input: QuestionInput }) => {
      if (!actor) throw new Error("actor not ready");
      return actor.createQuestion(vars.quizId, vars.input);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["questions", String(vars.quizId)] });
      qc.invalidateQueries({ queryKey: ["quizzes"] });
      qc.invalidateQueries({ queryKey: ["quiz", String(vars.quizId)] });
    },
  });
}

export function useUpdateQuestion() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      quizId: bigint;
      questionId: bigint;
      edit: QuestionEdit;
    }) => {
      if (!actor) throw new Error("actor not ready");
      await actor.updateQuestion(vars.questionId, vars.edit);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["questions", String(vars.quizId)] });
    },
  });
}

export function useDeleteQuestion() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { quizId: bigint; questionId: bigint }) => {
      if (!actor) throw new Error("actor not ready");
      await actor.deleteQuestion(vars.questionId);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["questions", String(vars.quizId)] });
      qc.invalidateQueries({ queryKey: ["quizzes"] });
      qc.invalidateQueries({ queryKey: ["quiz", String(vars.quizId)] });
    },
  });
}

export function useMoveQuestion() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      quizId: bigint;
      questionId: bigint;
      newOrder: bigint;
    }) => {
      if (!actor) throw new Error("actor not ready");
      await actor.moveQuestion(vars.questionId, vars.newOrder);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["questions", String(vars.quizId)] });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Quiz attempts                                                       */
/* ------------------------------------------------------------------ */

/** The signed-in user's attempts for a quiz (trainee history). */
export function useMyAttempts(quizId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AttemptPublic[]>({
    queryKey: ["attempts", "mine", String(quizId)],
    queryFn: async () => {
      if (!actor || quizId === undefined) return [];
      return actor.listMyQuizAttempts(quizId);
    },
    enabled: !!actor && !isFetching && quizId !== undefined,
  });
}

export function useSubmitAttempt() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      quizId: bigint;
      answers: AttemptAnswerPublic[];
    }) => {
      if (!actor) throw new Error("actor not ready");
      const input: AttemptInput = {
        quizId: vars.quizId,
        answers: vars.answers,
      };
      return actor.submitQuizAttempt(input);
    },
    onSuccess: (_data, vars) => {
      // Attempts are append-only — refresh the trainee history list so the
      // new attempt shows up immediately.
      qc.invalidateQueries({
        queryKey: ["attempts", "mine", String(vars.quizId)],
      });
    },
  });
}
