// App — TanStack Router with all routes + theme application wired app-wide.

import { AdminLayout } from "@/components/AdminLayout";
import { AdminRoute } from "@/components/AdminRoute";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useThemeSettings } from "@/hooks/useThemeSettings";
import { CategoryPage } from "@/pages/CategoryPage";
import { PositionPage } from "@/pages/PositionPage";
import { RecipeCardPage } from "@/pages/RecipeCardPage";
import { StorefrontHomePage } from "@/pages/StorefrontHomePage";
import { SubCategoryPage } from "@/pages/SubCategoryPage";
import { TrainingPage } from "@/pages/TrainingPage";
import { AdminCategoriesPage } from "@/pages/admin/AdminCategoriesPage";
import { AdminItemEditPage } from "@/pages/admin/AdminItemEditPage";
import { AdminItemsPage } from "@/pages/admin/AdminItemsPage";
import { AdminPositionsPage } from "@/pages/admin/AdminPositionsPage";
import { AdminThemePage } from "@/pages/admin/AdminThemePage";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import {
  Outlet,
  RouterProvider,
  createRootRouteWithContext,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

/* ------------------------------------------------------------------ */
/* Router                                                              */
/* ------------------------------------------------------------------ */

const rootRoute = createRootRouteWithContext<Record<string, never>>()({
  component: () => {
    // Apply theme app-wide so both storefront and admin re-theme instantly.
    useThemeSettings();
    return <Outlet />;
  },
});

const storefrontLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "storefront-layout",
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => storefrontLayoutRoute,
  path: "/",
  component: StorefrontHomePage,
});

const categoryRoute = createRoute({
  getParentRoute: () => storefrontLayoutRoute,
  path: "/category/$id",
  component: CategoryPage,
});

const subCategoryRoute = createRoute({
  getParentRoute: () => storefrontLayoutRoute,
  path: "/category/$id/sub/$subId",
  component: SubCategoryPage,
});

const itemRoute = createRoute({
  getParentRoute: () => storefrontLayoutRoute,
  path: "/item/$id",
  component: RecipeCardPage,
});

const trainingRoute = createRoute({
  getParentRoute: () => storefrontLayoutRoute,
  path: "/item/$id/training",
  component: () => (
    <ProtectedRoute>
      <TrainingPage />
    </ProtectedRoute>
  ),
});

const positionRoute = createRoute({
  getParentRoute: () => storefrontLayoutRoute,
  path: "/position/$id",
  component: PositionPage,
});

const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "admin-layout",
  component: () => (
    <AdminRoute>
      <AdminLayout />
    </AdminRoute>
  ),
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin",
  component: AdminCategoriesPage,
});

const adminCategoriesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/categories",
  component: AdminCategoriesPage,
});

const adminPositionsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/positions",
  component: AdminPositionsPage,
});

const adminItemsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/items",
  component: AdminItemsPage,
});

const adminItemEditRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/items/$id",
  component: AdminItemEditPage,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/users",
  component: AdminUsersPage,
});

const adminThemeRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/theme",
  component: AdminThemePage,
});

const routeTree = rootRoute.addChildren([
  storefrontLayoutRoute.addChildren([
    homeRoute,
    categoryRoute,
    subCategoryRoute,
    itemRoute,
    trainingRoute,
    positionRoute,
  ]),
  adminLayoutRoute.addChildren([
    adminDashboardRoute,
    adminCategoriesRoute,
    adminPositionsRoute,
    adminItemsRoute,
    adminItemEditRoute,
    adminUsersRoute,
    adminThemeRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
