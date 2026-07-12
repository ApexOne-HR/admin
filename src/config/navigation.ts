export type NavigationItemId =
  | 'dashboard'
  | 'users'
  | 'notifications'
  | 'adminManagement'
  | 'admins'
  | 'roles'
  | 'permissions'
  | 'settings';

export type NavigationItem = {
  id: NavigationItemId;
  label: string;
  path: string;
  description: string;
  /** If set, item is shown only when the user has this permission */
  permission?: string;
  children?: NavigationItem[];
};

export const adminNavigation: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    description: 'Overview of HR operations and admin activity.',
  },
  {
    id: 'users',
    label: 'Users',
    path: '/users',
    description: 'Manage users and role assignments.',
    permission: 'users.view',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    path: '/notifications',
    description: 'Monitor notification tools and future broadcast workflows.',
  },
  {
    id: 'adminManagement',
    label: 'Admin',
    path: '/admins',
    description: 'Manage admin access, roles, and permissions.',
    children: [
      {
        id: 'admins',
        label: 'Admins',
        path: '/admins',
        description: 'Manage dashboard administrator accounts.',
      },
      {
        id: 'roles',
        label: 'Roles',
        path: '/admins/roles',
        description: 'Configure admin role groups and responsibility levels.',
        permission: 'roles.view',
      },
      {
        id: 'permissions',
        label: 'Permissions',
        path: '/admins/permissions',
        description: 'Review permission groups for Admin RBAC access.',
        permission: 'permissions.view',
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    description: 'Manage local admin preferences and future system settings.',
  },
];

export function getFlatNavigationItems() {
  return adminNavigation.flatMap((item) => item.children ?? [item]);
}

export function getNavigationItemByPath(pathname: string) {
  return getFlatNavigationItems().find((item) => item.path === pathname) ?? adminNavigation[0];
}

export function filterNavigationByPermission(
  items: NavigationItem[],
  hasPermission: (slug: string) => boolean,
): NavigationItem[] {
  return items
    .map((item) => {
      const children = item.children
        ? filterNavigationByPermission(item.children, hasPermission)
        : undefined;

      if (item.permission && !hasPermission(item.permission)) {
        return null;
      }

      if (item.children) {
        if (!children?.length) {
          return null;
        }
        return { ...item, children };
      }

      return item;
    })
    .filter((item): item is NavigationItem => item !== null);
}
