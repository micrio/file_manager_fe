import { useEffect, useState } from 'react';

import { AxiosError, AxiosResponse } from 'axios';
import {
  Download,
  File as FileIcon,
  Folder as FolderIcon,
  Grid3x3,
  List,
  LucideMoreVertical,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { SHARED_API } from '@/constants/apis';
import { ROUTES } from '@/constants/routes';

import { useAuthStore } from '@/store/useAuthStore';

import FileView from '@/components/files/FileView';
import { formatFileSize } from '@/lib/formatFileSize';

interface SharedItem {
  id: number;
  unique_token: string;
  type: string;
  path?: string;
  filename?: string;
  file_extension?: string | null;
  size?: number | null;
  created_at?: string | null;
  file_url?: string;
  thumbnails?: { small?: string; medium?: string } | null;
}

interface SharedData {
  type: string;
  name?: string;
  filename?: string;
  file_extension?: string;
  file_url?: string;
  items?: SharedItem[];
}

const Message = ({ title, body }: { title: string; body: string }) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-24 text-center">
    <h1 className="text-lg font-semibold text-foreground">{title}</h1>
    {body && <p className="max-w-md text-sm text-muted-foreground">{body}</p>}
  </div>
);

// Folder serializer returns an already-formatted date, files return ISO.
const formatItemDate = (value?: string | null): string => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

const SharedBrowser = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<SharedData | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  // Stack of folder tokens we've drilled into (empty = the shared root).
  const [folderStack, setFolderStack] = useState<string[]>([]);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [preview, setPreview] = useState<SharedItem | null>(null);

  const currentFolderToken =
    folderStack.length > 0 ? folderStack[folderStack.length - 1] : null;

  useEffect(() => {
    if (!token) return;

    setStatus(null);

    const query = currentFolderToken ? `?folder_token=${currentFolderToken}` : '';

    useAuthStore
      .getState()
      .api.getRequest(`${SHARED_API}/${token}${query}`)
      .then((result) => {
        if (result instanceof AxiosError) {
          setData(null);
          setStatus(result.response?.status ?? 500);
          return;
        }

        setData(((result as AxiosResponse).data as { data?: SharedData }).data ?? null);
        setStatus(200);
      })
      .catch(() => {
        setData(null);
        setStatus(401);
      });
  }, [token, currentFolderToken]);

  const triggerBlobDownload = (href: string, filename: string) => {
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadItem = async (item: SharedItem) => {
    if (item.type === 'folder') {
      const result = await useAuthStore
        .getState()
        .api.getRequest(`${SHARED_API}/${token}/download_folder?folder_token=${item.unique_token}`, {
          responseType: 'blob',
        });

      if (result instanceof AxiosError) return;

      const url = URL.createObjectURL((result as AxiosResponse).data as Blob);
      triggerBlobDownload(url, `${String(item.path).replace(/\/$/, '')}.zip`);
      URL.revokeObjectURL(url);
      return;
    }

    if (item.file_url) {
      triggerBlobDownload(item.file_url, `${item.filename}.${item.file_extension}`);
    }
  };

  // Mirrors FolderFileList: go to the parent folder, or, at the share root, leave
  // the share back to the "Shared with me" list.
  const handleGoBack = () => {
    if (folderStack.length > 0) {
      setFolderStack((stack) => stack.slice(0, -1));
      return;
    }

    navigate(ROUTES.sharedWithMe);
  };

  if (status === 401 || status === 403) {
    return (
      <Message
        title="You don't have access to this item"
        body="It was shared with a different account. Sign in with the invited email to view it."
      />
    );
  }

  if (status && status >= 400) {
    return <Message title="Not available" body="This share was removed or expired." />;
  }

  if (!data) {
    return <Message title="Loading…" body="" />;
  }

  const isFolder = data.type === 'folder';
  const items = data.items ?? [];
  const thumbKey: 'small' | 'medium' = view === 'grid' ? 'medium' : 'small';

  const itemName = (item: SharedItem) =>
    item.type === 'folder'
      ? String(item.path)
      : `${item.filename}.${item.file_extension}`;

  const itemThumb = (item: SharedItem) => (item.thumbnails ? item.thumbnails[thumbKey] : '');

  const openItem = (item: SharedItem) => {
    if (item.type === 'folder') {
      setFolderStack((stack) => [...stack, item.unique_token]);
      return;
    }

    if (item.file_url) setPreview(item);
  };

  const goBackButton = (
    <div className="mb-4">
      <Button
        variant="outline"
        className="w-full justify-start border-border text-foreground hover:bg-secondary"
        onClick={handleGoBack}
      >
        <span className="text-sm font-medium">← Go Back</span>
      </Button>
    </div>
  );

  const itemMenu = (item: SharedItem) => (
    <div onClick={(event) => event.stopPropagation()} className="flex-shrink-0">
      <Popover>
        <PopoverTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8" title="More">
            <LucideMoreVertical className="w-4 h-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-40 p-1 bg-popover">
          <button
            type="button"
            onClick={() => downloadItem(item)}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-secondary"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <div className="mx-10">
      <div className="mb-5 mt-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Shared {isFolder ? 'folder' : 'file'}
          </p>
          <h1 className="truncate text-xl font-semibold text-foreground">
            {isFolder ? data.name : `${data.filename}.${data.file_extension}`}
          </h1>
        </div>

        {!isFolder && data.file_url && (
          <a href={data.file_url} download>
            <Button className="gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
          </a>
        )}
      </div>

      {!isFolder ? (
        <>
          {goBackButton}
          <div className="flex justify-center">
            <FileView
              sourceUrl={data.file_url ?? ''}
              fileName={data.filename ?? data.name ?? ''}
              fileExtension={data.file_extension ?? ''}
            />
          </div>
        </>
      ) : (
        <>
          {goBackButton}

          <div className="flex items-center justify-end gap-1 pb-2">
            <Button
              size="icon"
              variant="outline"
              aria-label="List view"
              title="List view"
              onClick={() => setView('list')}
              className={view === 'list' ? 'bg-neutral-200 dark:bg-neutral-700' : ''}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              aria-label="Grid view"
              title="Grid view"
              onClick={() => setView('grid')}
              className={view === 'grid' ? 'bg-neutral-200 dark:bg-neutral-700' : ''}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="rounded-lg border border-border px-4 py-8 text-center text-sm text-muted-foreground">
              This folder is empty.
            </p>
          ) : view === 'list' ? (
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <div className="w-8" />
                <div className="flex-grow">Name</div>
                <div className="w-24 text-right">File Size</div>
                <div className="w-56 text-right">Created At</div>
                <div className="w-8" />
              </div>
              {items.map((item) => (
                <div
                  key={item.unique_token}
                  role="button"
                  tabIndex={0}
                  onClick={() => openItem(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openItem(item);
                    }
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-secondary"
                >
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary">
                    {itemThumb(item) ? (
                      <img src={itemThumb(item)} alt={itemName(item)} className="h-full w-full object-cover" />
                    ) : item.type === 'folder' ? (
                      <FolderIcon className="h-4 w-4 text-foreground" />
                    ) : (
                      <FileIcon className="h-4 w-4 text-foreground" />
                    )}
                  </span>
                  <span className="flex-grow truncate text-sm font-medium text-foreground">
                    {itemName(item)}
                  </span>
                  <span className="w-24 whitespace-nowrap text-right text-xs text-muted-foreground">
                    {formatFileSize(item.size)}
                  </span>
                  <span className="w-56 whitespace-nowrap text-right text-xs text-muted-foreground">
                    {formatItemDate(item.created_at)}
                  </span>
                  {itemMenu(item)}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 rounded-lg border border-border p-4">
              {items.map((item) => (
                <div
                  key={item.unique_token}
                  role="button"
                  tabIndex={0}
                  onClick={() => openItem(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openItem(item);
                    }
                  }}
                  className="flex min-w-0 cursor-pointer flex-col gap-3 rounded-md border border-border bg-background p-3 text-left hover:bg-secondary"
                >
                  <span className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md bg-secondary">
                    {itemThumb(item) ? (
                      <img src={itemThumb(item)} alt={itemName(item)} className="h-full w-full object-cover" />
                    ) : item.type === 'folder' ? (
                      <FolderIcon className="h-9 w-9 text-foreground" />
                    ) : (
                      <FileIcon className="h-9 w-9 text-foreground" />
                    )}
                  </span>
                  <span className="truncate text-sm font-medium text-foreground">
                    {itemName(item)}
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(item.size)}
                    </span>
                    {itemMenu(item)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={!!preview} onOpenChange={(isOpen) => !isOpen && setPreview(null)}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:w-[60vw] sm:max-w-[60vw]">
          {preview && (
            <FileView
              sourceUrl={preview.file_url ?? ''}
              fileName={preview.filename ?? ''}
              fileExtension={preview.file_extension ?? ''}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SharedBrowser;
