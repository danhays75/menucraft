// Shared frontend types — re-exported from the bindgen so pages and hooks
// import a single canonical source. These mirror the backend's public types
// (see src/backend.d.ts) and are kept here for ergonomic short imports.

import { UserRole } from "@/backend";
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
  Timestamp,
  TrainingStepEdit,
  TrainingStepInput,
  TrainingStepPublic,
  UserProfilePublic,
} from "@/backend";
import { blobUrl } from "@/lib/blob";

export { UserRole };
export type {
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
  Timestamp,
  TrainingStepEdit,
  TrainingStepInput,
  TrainingStepPublic,
  UserProfilePublic,
};

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

/** Role guard helper — staff means admin or user (not guest). */
export function isStaff(role: UserRole | undefined | null): boolean {
  return role === UserRole.admin || role === UserRole.user;
}

export function isAdmin(role: UserRole | undefined | null): boolean {
  return role === UserRole.admin;
}
