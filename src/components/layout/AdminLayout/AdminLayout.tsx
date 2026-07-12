import { Box, Drawer } from '@mui/material';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar/Navbar';
import { Sidebar } from '@/components/layout/Sidebar/Sidebar';

const SIDEBAR_EXPANDED_WIDTH = 236;
const SIDEBAR_COLLAPSED_WIDTH = 76;

export function AdminLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const desktopSidebarWidth = isSidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;

  return (
    <Box className="min-h-svh bg-surface-background">
      <div
        className="hidden transition-[width] duration-200 lg:fixed lg:inset-y-0 lg:left-0 lg:block"
        style={{ width: desktopSidebarWidth }}
      >
        <Sidebar collapsed={isSidebarCollapsed} />
      </div>

      <Drawer
        open={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        ModalProps={{ keepMounted: true }}
        slotProps={{
          paper: {
            sx: {
              width: SIDEBAR_EXPANDED_WIDTH,
              border: 0,
            },
          },
        }}
      >
        <Sidebar onNavigate={() => setIsMobileSidebarOpen(false)} />
      </Drawer>

      <Box
        className="min-h-svh transition-[padding] duration-200"
        sx={{ pl: { xs: 0, lg: `${desktopSidebarWidth}px` } }}
      >
        <Navbar
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          onToggleSidebar={() => setIsSidebarCollapsed((value) => !value)}
        />
        <main className="px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-5">
          <Outlet />
        </main>
      </Box>
    </Box>
  );
}
