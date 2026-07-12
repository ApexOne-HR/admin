import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { Avatar, Badge, Divider, IconButton, ListItemIcon, Menu, MenuItem, Stack, Typography } from '@mui/material';
import { useState, type MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getNavigationItemByPath } from '@/config/navigation';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';

type NavbarProps = {
  onOpenSidebar: () => void;
  onToggleSidebar: () => void;
};

export function Navbar({ onOpenSidebar, onToggleSidebar }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentItem = getNavigationItemByPath(location.pathname);
  const { logout, session } = useAdminSession();
  const [profileAnchorEl, setProfileAnchorEl] = useState<HTMLElement | null>(null);
  const isProfileMenuOpen = Boolean(profileAnchorEl);

  const handleOpenProfileMenu = (event: MouseEvent<HTMLButtonElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleCloseProfileMenu = () => {
    setProfileAnchorEl(null);
  };

  const handleLogout = async () => {
    handleCloseProfileMenu();
    await logout();
  };

  const handleOpenSettings = () => {
    handleCloseProfileMenu();
    void navigate('/settings');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-surface-border bg-white/95 backdrop-blur">
      <div className="flex min-h-14 items-center justify-between gap-3 px-4 sm:px-5 lg:px-6">
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
          <IconButton
            aria-label="Toggle navigation"
            onClick={onOpenSidebar}
            edge="start"
            sx={{ display: { xs: 'inline-flex', lg: 'none' } }}
          >
            <MenuRoundedIcon />
          </IconButton>
          <IconButton
            aria-label="Toggle sidebar"
            onClick={onToggleSidebar}
            edge="start"
            sx={{ display: { xs: 'none', lg: 'inline-flex' } }}
          >
            <MenuRoundedIcon />
          </IconButton>

          <div className="min-w-0">
            <Typography className="truncate text-sm" sx={{ fontWeight: 500 }}>
              {currentItem.label}
            </Typography>
          </div>
        </Stack>

        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <IconButton aria-label="Notifications" size="small">
            <Badge badgeContent="9+" color="error">
              <NotificationsRoundedIcon fontSize="small" />
            </Badge>
          </IconButton>
          <button
            aria-controls={isProfileMenuOpen ? 'profile-menu' : undefined}
            aria-expanded={isProfileMenuOpen ? 'true' : undefined}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition hover:bg-neutral-100 sm:px-2"
            type="button"
            onClick={handleOpenProfileMenu}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
              {session?.user.name.slice(0, 1).toUpperCase() ?? 'A'}
            </Avatar>
          </button>
          <Menu
            id="profile-menu"
            anchorEl={profileAnchorEl}
            open={isProfileMenuOpen}
            onClose={handleCloseProfileMenu}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1.5,
                  minWidth: 260,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.16)',
                  overflow: 'visible',
                  '&::before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: -6,
                    right: 16,
                    width: 12,
                    height: 12,
                    bgcolor: 'background.paper',
                    borderLeft: '1px solid',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    transform: 'rotate(45deg)',
                    zIndex: 0,
                  },
                },
              },
            }}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-400">
                <PersonRoundedIcon fontSize="small" />
              </div>
              <div className="min-w-0">
                <Typography className="truncate text-sm text-neutral-500" sx={{ fontWeight: 400 }}>
                  {session?.user.name ?? 'Admin'}
                </Typography>
                <Typography variant="body2" className="truncate text-neutral-400">
                  {session?.user.email}
                  {session?.user.role ? ` · ${session.user.role.name}` : ''}
                </Typography>
              </div>
            </div>
            <Divider />
            <MenuItem onClick={handleOpenSettings} sx={{ gap: 1.5, py: 1.25 }}>
              <ListItemIcon sx={{ minWidth: 'auto !important', color: 'text.secondary' }}>
                <SettingsRoundedIcon fontSize="small" />
              </ListItemIcon>
              <span>Settings</span>
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1.25 }}>
              <ListItemIcon sx={{ minWidth: 'auto !important', color: 'text.secondary' }}>
                <LogoutRoundedIcon fontSize="small" />
              </ListItemIcon>
              <span>Logout</span>
            </MenuItem>
          </Menu>
        </Stack>
      </div>
    </header>
  );
}
