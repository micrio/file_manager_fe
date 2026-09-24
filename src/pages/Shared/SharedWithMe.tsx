import { useEffect, useState } from 'react';

import { File as FileIcon, Folder as FolderIcon, Grid3x3, List, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

import { SHARE_CREATED, SHARE_REMOVED } from '@/constants/socketActions';

import { useShareStore } from '@/store/useShareStore';
import { useSocketStore } from '@/store/useSocketStore';

type ViewMode = 'list' | 'grid';

const readInitialView = (): ViewMode => {
  try {
    const stored = localStorage.getItem('fileListView') as ViewMode;
    return stored === 'list' || stored === 'grid' ? stored : 'list';
  } catch {
    return 'list';
  }
};

const SharedWithMe = () => {
  const { sharedWithMe, getSharedWithMe } = useShareStore();
  const { receivedData } = useSocketStore();
  const [view, setView] = useState<ViewMode>(readInitialView);

  const commitView = (next: ViewMode) => {
    setView(next);
    try {
      localStorage.setItem('fileListView', next);
    } catch { /* storage unavailable */ }
  };

  useEffect(() => {
    getSharedWithMe();
  }, [getSharedWithMe]);

  // Live updates when someone invites/revokes this account by email.
  useEffect(() => {
    const action = (receivedData as { action?: string } | null)?.action;

    if (action === SHARE_CREATED || action === SHARE_REMOVED) {
      getSharedWithMe();
    }
  }, [receivedData, getSharedWithMe]);

  const renderName = (name: string | undefined) => (
    <span className="truncate text-sm font-medium text-foreground">{name}</span>
  );

  return (
    <div className="mx-10">
      <div className="my-5 flex items-center gap-2">
        <Users className="h-5 w-5 text-foreground" />
        <h1 className="text-lg font-semibold text-foreground">Shared with me</h1>
      </div>

      <div className="flex items-center justify-end gap-1 pb-2">
        <Button
          size="icon"
          variant="outline"
          aria-label="List view"
          title="List view"
          onClick={() => commitView('list')}
          className={view === 'list' ? 'bg-neutral-200 dark:bg-neutral-700' : ''}
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          aria-label="Grid view"
          title="Grid view"
          onClick={() => commitView('grid')}
          className={view === 'grid' ? 'bg-neutral-200 dark:bg-neutral-700' : ''}
        >
          <Grid3x3 className="w-4 h-4" />
        </Button>
      </div>

      {sharedWithMe.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing has been shared with you yet.
        </p>
      ) : view === 'list' ? (
        <div className="overflow-hidden rounded-lg border border-border">
          {sharedWithMe.map((share) => (
            <Link
              key={share.id}
              to={`/shared/${share.token}`}
              className="flex items-center gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0 hover:bg-secondary"
            >
              {share.shareable_type === 'Folder' ? (
                <FolderIcon className="h-4 w-4 flex-shrink-0 text-foreground" />
              ) : (
                <FileIcon className="h-4 w-4 flex-shrink-0 text-foreground" />
              )}
              <span className="flex-grow truncate text-foreground">{share.shareable_name}</span>
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                from {share.owner_email}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 rounded-lg border border-border p-4">
          {sharedWithMe.map((share) => (
            <Link
              key={share.id}
              to={`/shared/${share.token}`}
              className="flex min-w-0 flex-col gap-3 rounded-md border border-border bg-background p-3 hover:bg-secondary"
            >
              <span className="flex aspect-[4/3] items-center justify-center rounded-md bg-secondary">
                {share.shareable_type === 'Folder' ? (
                  <FolderIcon className="h-9 w-9 text-foreground" />
                ) : (
                  <FileIcon className="h-9 w-9 text-foreground" />
                )}
              </span>
              <div className="flex flex-col gap-1">
                {renderName(share.shareable_name)}
                <span className="truncate text-xs text-muted-foreground">
                  from {share.owner_email}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SharedWithMe;
