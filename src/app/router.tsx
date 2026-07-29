import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout/AdminLayout';
import { OrganizationPage } from '@/features/organization/pages/OrganizationPage';
import { MastersPage } from '@/features/masters/pages/MastersPage';
import { LeavePage } from '@/features/leave/pages/LeavePage';
import { CompensationPage } from '@/features/compensation/pages/CompensationPage';
import { FiscalYearsPage } from '@/features/fiscal/pages/FiscalYearsPage';
import { EmployeesPage } from '@/features/employees/pages/EmployeesPage';
import { EmployeeFormPage } from '@/features/employees/pages/EmployeeFormPage';
import { EmployeeDetailPage } from '@/features/employees/pages/EmployeeDetailPage';
import { PermissionsPage } from '@/features/rbac/pages/PermissionsPage';
import { RolesPage } from '@/features/rbac/pages/RolesPage';
import { UsersPage } from '@/features/rbac/pages/UsersPage';
import { ComingSoonPage } from './routes/ComingSoonPage';
import { LoginRoute } from './routes/LoginRoute';
import { ProtectedRoute } from './routes/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginRoute />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          {
            path: 'dashboard',
            element: (
              <ComingSoonPage
                title="Dashboard"
                description="Overview of HR operations and admin activity."
              />
            ),
          },
          { path: 'organization', element: <OrganizationPage /> },
          { path: 'masters', element: <MastersPage /> },
          { path: 'leave', element: <LeavePage /> },
          { path: 'compensation', element: <CompensationPage /> },
          { path: 'fiscal-years', element: <FiscalYearsPage /> },
          { path: 'employees', element: <EmployeesPage /> },
          { path: 'employees/new', element: <EmployeeFormPage /> },
          { path: 'employees/:id/edit', element: <EmployeeFormPage /> },
          { path: 'employees/:id', element: <EmployeeDetailPage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'roles', element: <RolesPage /> },
          { path: 'permissions', element: <PermissionsPage /> },
          {
            path: 'settings',
            element: (
              <ComingSoonPage
                title="Settings"
                description="Admin preferences and system settings."
              />
            ),
          },
          { path: '*', element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
]);
