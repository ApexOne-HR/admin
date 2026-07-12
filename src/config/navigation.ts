export type NavigationItemId =
  | 'dashboard'
  | 'users'
  | 'roles'
  | 'permissions'
  | 'settings';

export type NavigationItem = {
  id: NavigationItemId;
  label: string;
  path: string;
  description: string;
  /** Shown only when the user has this permission */
  permission?: string;
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
    description: 'Assign roles to users.',
    permission: 'users.view',
  },
  {
    id: 'roles',
    label: 'Roles',
    path: '/roles',
    description: 'Manage roles and permission sets.',
    permission: 'roles.view',
  },
  {
    id: 'permissions',
    label: 'Permissions',
    path: '/permissions',
    description: 'Browse the permission catalog.',
    permission: 'permissions.view',
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    description: 'Admin preferences and system settings.',
  },
];

export function getNavigationItemByPath(pathname: string) {
  return adminNavigation.find((item) => item.path === pathname) ?? adminNavigation[0];
}

export function filterNavigationByPermission(
  items: NavigationItem[],
  hasPermission: (slug: string) => boolean,
): NavigationItem[] {
  return items.filter((item) => !item.permission || hasPermission(item.permission));
}
