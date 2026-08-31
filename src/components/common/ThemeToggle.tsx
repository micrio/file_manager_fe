import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '../ui/button';

export const ThemeToggle = () => {
  const { setTheme, resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="outline"
      size="icon"
      className="h-8 w-8"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <>
          <Moon className="h-4 w-4" />
          <span className="sr-only">Switch to light</span>
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" />
          <span className="sr-only">Switch to dark</span>
        </>
      )}
    </Button>
  );
};

export default ThemeToggle;
