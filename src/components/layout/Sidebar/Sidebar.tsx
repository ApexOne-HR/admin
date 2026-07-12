import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded';
import { Typography } from '@mui/material';
import { useMemo } from 'react';
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
  organization: AccountTreeRoundedIcon,
  users: PeopleRoundedIcon,
  roles: SecurityRoundedIcon,
  permissions: VpnKeyRoundedIcon,
  settings: SettingsRoundedIcon,
};

type SidebarProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

function navItemClass(active: boolean, collapsed: boolean) {
  return [
    'flex items-center rounded-lg py-2.5 text-sm font-medium transition',
    collapsed ? 'justify-center px-2' : 'gap-3 px-3',
    active
      ? 'bg-brand-50 text-brand-700'
      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950',
  ].join(' ');
}

function iconWrapClass(active: boolean) {
  return [
    'grid h-9 w-9 shrink-0 place-items-center rounded-lg transition',
    active ? 'bg-white text-brand-700 shadow-sm' : 'text-neutral-500',
  ].join(' ');
}

export function Sidebar({ collapsed = false, onNavigate }: SidebarProps) {
  const location = useLocation();
  const { session } = useAdminSession();

  const visibleNavigation = useMemo(
    () => filterNavigationByPermission(adminNavigation, (slug) => can(session?.user, slug)),
    [session?.user],
  );

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
          const isActive = location.pathname === item.path;
          const Icon = navigationIcons[item.id];

          return (
            <Link
              key={item.id}
              title={collapsed ? item.label : undefined}
              to={item.path}
              onClick={onNavigate}
              className={navItemClass(isActive, collapsed)}
            >
              <span className={iconWrapClass(isActive)}>
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
