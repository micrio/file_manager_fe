import { useEffect } from 'react';

import { Folder, HardDrive, Home, LogOut, Trash2, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';

import { APP } from '@/constants/app';
import { ROUTES } from '@/constants/routes';
import { FILE_CREATED, FILE_REMOVED, FOLDER_REMOVED } from '@/constants/socketActions';

import { useFileStore } from '@/store/userFileStore';
import { useSocketStore } from '@/store/useSocketStore';

import { ThemeToggle } from '@/components/common/ThemeToggle';

import { formatFileSize } from '@/lib/formatFileSize';

interface ISidebar {
  handleLogout: () => void;
}

const Sidebar = ({ handleLogout }: ISidebar) => {
  const { pathname } = useLocation();
  const isActivePath = (path: string) => pathname === path;

  const { storageUsed, getStorageUsage } = useFileStore();
  const { receivedData } = useSocketStore();

  useEffect(() => {
    getStorageUsage();
  }, [getStorageUsage]);

  // Keep the total fresh as uploads/removals arrive over the socket.
  useEffect(() => {
    const action = (receivedData as { action?: string } | null)?.action;

    // Files: trash/remove. Folders: trash/remove (cascades to their files).
    if (
      action === FILE_CREATED ||
      action === FILE_REMOVED ||
      action === FOLDER_REMOVED
    ) {
      getStorageUsage();
    }
  }, [receivedData, getStorageUsage]);

  const NAV_ITEMS = [
    { name: "Home", path: "/home", icon: <Home className="w-4 h-4" /> },
    { name: "My Storage", path: "/storage", icon: <Folder className="w-4 h-4" /> },
    { name: "Shared with me", path: ROUTES.sharedWithMe, icon: <Users className="w-4 h-4" /> },
    { name: "Trash", path: "/trash", icon: <Trash2 className="w-4 h-4" /> },
  ];

  return (
    <>
      <div className="relative w-[280px] min-h-screen border-r py-10 px-4">
        <div className="flex justify-between items-center mb-10 px-2">
          <h1 className="font-bold text-lg">{APP.appName}</h1>
          <ThemeToggle />
        </div>

        <nav className="flex flex-col gap-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              replace
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActivePath(item.path)
                  ? 'bg-neutral-100 text-foreground dark:bg-neutral-800'
                  : 'text-muted-foreground hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800'
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="mt-6 rounded-md border border-border bg-neutral-50 px-3 py-3 dark:bg-neutral-900">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <HardDrive className="w-3.5 h-3.5" />
            Storage used
          </div>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {formatFileSize(storageUsed)}
          </p>
        </div>

        <div className="absolute bottom-10 left-4">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
