import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded';
import { Collapse, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  adminNavigation,
  filterNavigationByPermission,
  isNavigationGroup,
  type NavigationEntry,
  type NavigationItem,
  type NavigationItemId,
} from '@/config/navigation';
import { can } from '@/features/auth/services/auth.service';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';

const navigationIcons: Record<NavigationItemId, typeof DashboardRoundedIcon> = {
  dashboard: DashboardRoundedIcon,
  organization: AccountTreeRoundedIcon,
  masters: TuneRoundedIcon,
  users: PeopleRoundedIcon,
  rbac: AdminPanelSettingsRoundedIcon,
  roles: SecurityRoundedIcon,
  permissions: VpnKeyRoundedIcon,
  settings: SettingsRoundedIcon,
};

type SidebarProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

function navItemClass(active: boolean, collapsed: boolean, nested = false) {
  return [
    'flex w-full items-center rounded-lg py-2 text-sm font-medium transition',
    collapsed ? 'justify-center px-2' : nested ? 'gap-3 py-2 pl-3 pr-3' : 'gap-3 px-3 py-2.5',
    active
      ? 'bg-brand-50 text-brand-700'
      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950',
  ].join(' ');
}

function iconWrapClass(active: boolean, nested = false) {
  return [
    'grid shrink-0 place-items-center rounded-lg transition',
    nested ? 'h-8 w-8' : 'h-9 w-9',
    active ? 'bg-white text-brand-700 shadow-sm' : 'text-neutral-500',
  ].join(' ');
}

function groupHasActiveChild(entry: NavigationEntry, pathname: string): boolean {
  return isNavigationGroup(entry) && entry.children.some((child) => child.path === pathname);
}

export function Sidebar({ collapsed = false, onNavigate }: SidebarProps) {
  const location = useLocation();
  const { session } = useAdminSession();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const visibleNavigation = useMemo(
    () => filterNavigationByPermission(adminNavigation, (slug) => can(session?.user, slug)),
    [session?.user],
  );

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const entry of visibleNavigation) {
      if (isNavigationGroup(entry) && groupHasActiveChild(entry, location.pathname)) {
        next[entry.id] = true;
      }
    }
    if (Object.keys(next).length > 0) {
      setOpenGroups((current) => ({ ...current, ...next }));
    }
  }, [location.pathname, visibleNavigation]);

  const toggleGroup = (id: string) => {
    setOpenGroups((current) => ({ ...current, [id]: !current[id] }));
  };

  const renderLink = (item: NavigationItem, nested = false) => {
    const isActive = location.pathname === item.path;
    const Icon = navigationIcons[item.id];

    return (
      <Link
        key={item.id}
        title={collapsed ? item.label : undefined}
        to={item.path}
        onClick={onNavigate}
        className={navItemClass(isActive, collapsed, nested)}
      >
        <span className={iconWrapClass(isActive, nested)}>
          <Icon sx={{ fontSize: nested ? 20 : 22 }} />
        </span>
        {!collapsed ? <span className="truncate">{item.label}</span> : null}
      </Link>
    );
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
        {visibleNavigation.map((entry) => {
          if (!isNavigationGroup(entry)) {
            return renderLink(entry);
          }

          const GroupIcon = navigationIcons[entry.id];
          const isChildActive = groupHasActiveChild(entry, location.pathname);
          const isOpen = Boolean(openGroups[entry.id]) || isChildActive;

          if (collapsed) {
            return (
              <div key={entry.id} className="flex flex-col gap-0.5">
                {entry.children.map((child) => renderLink(child))}
              </div>
            );
          }

          return (
            <div key={entry.id} className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => toggleGroup(entry.id)}
                className={navItemClass(isChildActive, false)}
                aria-expanded={isOpen}
              >
                <span className={iconWrapClass(isChildActive)}>
                  <GroupIcon sx={{ fontSize: 22 }} />
                </span>
                <span className="min-w-0 flex-1 truncate text-left">{entry.label}</span>
                {isOpen ? (
                  <ExpandLessRoundedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                ) : (
                  <ExpandMoreRoundedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                )}
              </button>

              <Collapse in={isOpen} timeout="auto" unmountOnExit>
                <div className="ml-3 flex flex-col gap-0.5 border-l border-surface-border pl-2">
                  {entry.children.map((child) => renderLink(child, true))}
                </div>
              </Collapse>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
