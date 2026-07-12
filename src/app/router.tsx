import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout/AdminLayout';
import { LoginRoute } from './routes/LoginRoute';
import { ModulePlaceholderPage } from './routes/ModulePlaceholderPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PermissionsPage } from '@/features/rbac/pages/PermissionsPage';
import { RolesPage } from '@/features/rbac/pages/RolesPage';
import { UsersPage } from '@/features/rbac/pages/UsersPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginRoute />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: (
              <ModulePlaceholderPage
                title="Dashboard"
                description="Overview of HR operations and admin activity."
              />
            ),
          },
          {
            path: 'users',
            element: <UsersPage />,
          },
          {
            path: 'notifications',
            element: (
              <ModulePlaceholderPage
                title="Notifications"
                description="Monitor notification tools and future broadcast workflows."
              />
            ),
          },
          {
            path: 'admins',
            element: (
              <ModulePlaceholderPage
                title="Admins"
                description="Manage dashboard administrator accounts."
              />
            ),
          },
          {
            path: 'admins/roles',
            element: <RolesPage />,
          },
          {
            path: 'admins/permissions',
            element: <PermissionsPage />,
          },
          {
            path: 'settings',
            element: (
              <ModulePlaceholderPage
                title="Settings"
                description="Manage local admin preferences and future system settings."
              />
            ),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
