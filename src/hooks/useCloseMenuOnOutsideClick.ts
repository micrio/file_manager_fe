import { useEffect } from 'react';

import { useUiStore } from '@/store/useUiStore';

// Closes the currently-open row context menu ("three dots" popover) on any
// outside pointer-down or Escape press.
//
// This replaces Radix's built-in dismiss because the row triggers stop
// propagation on their own events: when a second menu is opened, Radix sees the
// same click as an "outside" interaction for it and immediately closed it. Now
// the store is the single source of truth and dismissal is handled here.
export const useCloseMenuOnOutsideClick = () => {
  const openMenuId = useUiStore((state) => state.openMenuId);
  const setOpenMenuId = useUiStore((state) => state.setOpenMenuId);

  useEffect(() => {
    if (!openMenuId) return;

    const close = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;

      // Keep the menu open when interacting with it or any trigger/content.
      if (
        target?.closest(
          '[data-row-menu-content], [data-row-menu-trigger]'
        )
      ) {
        return;
      }

      setOpenMenuId(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenuId(null);
    };

    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openMenuId, setOpenMenuId]);
};
