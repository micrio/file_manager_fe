import { Folder, Home, LogOut,Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { APP } from '@/constants/app';

import { Button } from '../ui/button';
import { ThemeToggle } from './ThemeToggle';

interface ISidebar {
  handleLogout: () => void;
}

const Sidebar = ({ handleLogout }: ISidebar) => {
  const { pathname } = useLocation();
  const isActivePath = (path: string) => pathname === path;

  const NAV_ITEMS = [
    { name: "Home", path: "/home", icon: <Home className="w-4 h-4" /> },
    { name: "My Storage", path: "/storage", icon: <Folder className="w-4 h-4" /> },
    { name: "Trash", path: "/trash", icon: <Trash2 className="w-4 h-4" /> },
  ];

  return (
    <>
      <div className="relative w-[280px] min-h-screen border-r p-10">
        <div className="flex justify-between items-center mb-10">
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

        <div className="absolute bottom-10 left-10">
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
