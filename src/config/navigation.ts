export type NavigationItemId =
  | 'dashboard'
  | 'organization'
  | 'masters'
  | 'users'
  | 'roles'
  | 'permissions'
  | 'settings'
  | 'rbac';

export type NavigationItem = {
  id: NavigationItemId;
  label: string;
  path: string;
  description: string;
  /** Shown only when the user has this permission */
  permission?: string;
};

export type NavigationGroup = {
  id: NavigationItemId;
  label: string;
  children: NavigationItem[];
};

export type NavigationEntry = NavigationItem | NavigationGroup;

export function isNavigationGroup(entry: NavigationEntry): entry is NavigationGroup {
  return 'children' in entry;
}

export const adminNavigation: NavigationEntry[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    description: 'Overview of HR operations and admin activity.',
  },
  {
    id: 'organization',
    label: 'Organization',
    path: '/organization',
    description: 'Companies, divisions, departments, and designations.',
    permission: 'organizations.view',
  },
  {
    id: 'masters',
    label: 'Masters',
    path: '/masters',
    description: 'Locations, work schedules, and policies.',
    permission: 'organizations.view',
  },
  {
    id: 'users',
    label: 'Users',
    path: '/users',
    description: 'Assign roles and data scopes to users.',
    permission: 'users.view',
  },
  {
    id: 'rbac',
    label: 'RBAC',
    children: [
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
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    description: 'Admin preferences and system settings.',
  },
];

function flattenNavigation(entries: NavigationEntry[]): NavigationItem[] {
  return entries.flatMap((entry) => (isNavigationGroup(entry) ? entry.children : [entry]));
}

export function getNavigationItemByPath(pathname: string) {
  return flattenNavigation(adminNavigation).find((item) => item.path === pathname)
    ?? flattenNavigation(adminNavigation)[0];
}

export function filterNavigationByPermission(
  entries: NavigationEntry[],
  hasPermission: (slug: string) => boolean,
): NavigationEntry[] {
  return entries
    .map((entry) => {
      if (!isNavigationGroup(entry)) {
        if (entry.permission && !hasPermission(entry.permission)) {
          return null;
        }
        return entry;
      }

      const children = entry.children.filter(
        (child) => !child.permission || hasPermission(child.permission),
      );

      if (children.length === 0) {
        return null;
      }

      return { ...entry, children };
    })
    .filter((entry): entry is NavigationEntry => entry !== null);
}
