import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded';
import { Collapse } from '@mui/material';
import { Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  adminNavigation,
  filterNavigationByPermission,
  type NavigationItem,
} from '@/config/navigation';
import { can } from '@/features/auth/services/auth.service';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';

const navigationIcons: Record<NavigationItem['id'], typeof DashboardRoundedIcon> = {
  dashboard: DashboardRoundedIcon,
  users: PeopleRoundedIcon,
  notifications: NotificationsRoundedIcon,
  adminManagement: AdminPanelSettingsRoundedIcon,
  admins: ManageAccountsRoundedIcon,
  roles: SecurityRoundedIcon,
  permissions: VpnKeyRoundedIcon,
  settings: SettingsRoundedIcon,
};

type SidebarProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function Sidebar({ collapsed = false, onNavigate }: SidebarProps) {
  const location = useLocation();
  const { session } = useAdminSession();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    adminManagement: true,
  });

  const visibleNavigation = useMemo(
    () =>
      filterNavigationByPermission(adminNavigation, (slug) => can(session?.user, slug)),
    [session?.user],
  );

  const toggleGroup = (id: NavigationItem['id']) => {
    setOpenGroups((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  return (
    <aside
      className={[
        'flex h-full flex-col border-r border-surface-border bg-white py-3 text-neutral-950',
        collapsed ? 'px-2' : 'px-3',
      ].join(' ')}
    >
      <div
        className={[
          'mb-4 flex items-center border-b border-surface-border pb-3',
          collapsed ? 'justify-center px-0' : 'gap-3 px-2',
        ].join(' ')}
      >
        <img src="/logo.png" alt="ApexOne" className="h-9 w-9 rounded-xl object-contain" />
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <Typography variant="h3" sx={{ fontSize: 17, color: 'primary.dark' }}>
              Admin
            </Typography>
            <Typography variant="body2" color="text.secondary" className="truncate">
              ApexOne-HR
            </Typography>
          </div>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {visibleNavigation.map((item) => {
          const hasChildren = Boolean(item.children?.length);
          const isActive =
            location.pathname === item.path ||
            Boolean(item.children?.some((child) => child.path === location.pathname));
          const Icon = navigationIcons[item.id];

          if (hasChildren && item.children) {
            if (collapsed) {
              return (
                <Link
                  key={item.id}
                  title={item.label}
                  to={item.path}
                  onClick={onNavigate}
                  className={[
                    'flex items-center rounded-lg py-2.5 text-sm font-medium transition',
                    'justify-center px-2',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'grid h-9 w-9 shrink-0 place-items-center rounded-lg transition',
                      isActive ? 'bg-white text-brand-700 shadow-sm' : 'text-neutral-500',
                    ].join(' ')}
                  >
                    <Icon sx={{ fontSize: 22 }} />
                  </span>
                </Link>
              );
            }

            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(item.id)}
                  className={[
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'grid h-9 w-9 shrink-0 place-items-center rounded-lg transition',
                      isActive ? 'bg-white text-brand-700 shadow-sm' : 'text-neutral-500',
                    ].join(' ')}
                  >
                    <Icon sx={{ fontSize: 22 }} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {openGroups[item.id] ? (
                    <ExpandLessRoundedIcon fontSize="small" />
                  ) : (
                    <ExpandMoreRoundedIcon fontSize="small" />
                  )}
                </button>

                <Collapse in={openGroups[item.id]} timeout="auto" unmountOnExit>
                  <div className="mt-0.5 space-y-0.5 pl-5">
                    {item.children.map((child) => {
                      const childIsActive = location.pathname === child.path;
                      const ChildIcon = navigationIcons[child.id];

                      return (
                        <Link
                          key={child.id}
                          to={child.path}
                          onClick={onNavigate}
                          className={[
                            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                            childIsActive
                              ? 'bg-brand-50 text-brand-700'
                              : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950',
                          ].join(' ')}
                        >
                          <span
                            className={[
                              'grid h-9 w-9 shrink-0 place-items-center rounded-lg transition',
                              childIsActive ? 'bg-white text-brand-700 shadow-sm' : 'text-neutral-500',
                            ].join(' ')}
                          >
                            <ChildIcon sx={{ fontSize: 22 }} />
                          </span>
                          <span className="truncate">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </Collapse>
              </div>
            );
          }

          return (
            <Link
              key={item.id}
              title={collapsed ? item.label : undefined}
              to={item.path}
              onClick={onNavigate}
              className={[
                'flex items-center rounded-lg py-2.5 text-sm font-medium transition',
                collapsed ? 'justify-center px-2' : 'gap-3 px-3',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950',
              ].join(' ')}
            >
              <span
                className={[
                  'grid h-9 w-9 shrink-0 place-items-center rounded-lg transition',
                  isActive ? 'bg-white text-brand-700 shadow-sm' : 'text-neutral-500',
                ].join(' ')}
              >
                <Icon sx={{ fontSize: 22 }} />
              </span>
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
