import { useEffect } from 'react';

import { File as FileIcon, Folder as FolderIcon, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { SHARE_CREATED, SHARE_REMOVED } from '@/constants/socketActions';

import { useShareStore } from '@/store/useShareStore';
import { useSocketStore } from '@/store/useSocketStore';

const SharedWithMe = () => {
  const { sharedWithMe, getSharedWithMe } = useShareStore();
  const { receivedData } = useSocketStore();

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

  return (
    <div className="mx-10">
      <div className="my-5 flex items-center gap-2">
        <Users className="h-5 w-5 text-foreground" />
        <h1 className="text-lg font-semibold text-foreground">Shared with me</h1>
      </div>

      {sharedWithMe.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing has been shared with you yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          {sharedWithMe.map((share) => (
            <Link
              key={share.id}
              to={share.path}
              className="flex items-center gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0 hover:bg-secondary"
            >
              {share.shareable_type === 'Folder' ? (
                <FolderIcon className="h-4 w-4 flex-shrink-0 text-foreground" />
              ) : (
                <FileIcon className="h-4 w-4 flex-shrink-0 text-foreground" />
              )}
              <span className="flex-grow truncate text-foreground">
                {share.shareable_name}
              </span>
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                from {share.owner_email}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SharedWithMe;
