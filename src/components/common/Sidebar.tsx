import { Button } from '../ui/button';
import { Home, Folder, Trash2, LogOut } from 'lucide-react';

import { APP } from '@/constants/app';
import { ThemeToggle } from './ThemeToggle';

interface ISidebar {
  handleLogout: () => void;
}

const Sidebar = ({ handleLogout }: ISidebar) => {
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
            <a
              key={item.name}
              href={item.path}
              className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.icon}
              {item.name}
            </a>
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
