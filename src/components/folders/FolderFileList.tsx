import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Folder, File, FileX, Image, Video, LucideMoreVertical, List, Grid3x3 } from 'lucide-react';

import FileView from '@/components/files/FileView';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Dialog, DialogContent } from '../ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import DropdownOption from '../common/DropdownOption';

import { useAuthStore } from '@/store/useAuthStore';
import { FileSocketData, useFileStore } from '@/store/userFileStore';
import { useFoldersStore, FolderSocketData } from '@/store/useFolderStore';
import { useFileExtensionCheck } from '@/hooks/useFileExtensionCheck';
import { useSocketStore } from '@/store/useSocketStore';

import { IFolderContentData } from '@/apis/folder/folderInterface';
import { IFileUrlResponse } from '@/apis/file/fileInterface';
import { ROUTES } from '@/constants/routes';
import { API_RESPONSE_CODE } from '@/constants/apiResponseCode';
import { FILE_REMOVED, FILE_RENAMED, FOLDER_REMOVED, FOLDER_RENAMED } from '@/constants/socketActions';

interface IProps {
  items: IFolderContentData[] | [];
}

interface FileLogoProp {
  file_extension: string | null;
}

type ViewMode = 'list' | 'grid';

function formatCreatedAt(createdAt: string | null): string {
  if (!createdAt) return '';

  const parts = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(new Date(createdAt));

  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  }

  return `${values.weekday}, ${values.day}, ${values.year} ${values.hour}:${values.minute} ${values.dayPeriod}`;
}

const FolderFileList = ({ items = [] }: IProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { api } = useAuthStore();
  const { getFileUrl } = useFileStore();
  const {
    updateFolderPath,
    removeFolderPath,
    updateFilePath,
    removeFileFromContents,
  } = useFoldersStore();
  const { receivedData } = useSocketStore();

  // Persist the chosen view per route path (/storage, /trash) so switching
  // between pages restores each page's own selection.
  const readInitialView = (): ViewMode => {
    try {
      const stored = localStorage.getItem(`fileListView:${pathname}`) as ViewMode;
      return stored === 'list' || stored === 'grid' ? stored : 'list';
    } catch {
      return 'list';
    }
  };

  const [view, setView] = useState<ViewMode>(readInitialView);

  const commitView = (next: ViewMode) => {
    setView(next);
    try {
      localStorage.setItem(`fileListView:${pathname}`, next);
    } catch {
      /* storage unavailable — keep in-memory value */
    }
  };
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileExtension, setFileExtension] = useState<string>('');

  const handlePreviewFile = (uniqueToken: string) => {
    setPreviewOpen(true);
    getFileUrl(uniqueToken)
      .then((response) => {
        const result = response as IFileUrlResponse;
        setSourceUrl(result.data.file_url);
        setFileName(result.data.file_name);
        setFileExtension(result.data.file_extension);
      })
      .catch(() => {
        /* preview error — leave placeholder */
      });
  };

  const renderItem = (item: IFolderContentData) => (
    <ContentItem key={item.unique_token} item={item} view={view} onFileClick={handlePreviewFile} getFileUrl={getFileUrl} />
  );

  useEffect(() => {
    const responseData = receivedData as unknown as FolderSocketData;
    if (!responseData) return;

    if (responseData.action === FILE_RENAMED) {
      updateFilePath(responseData as unknown as FileSocketData);
    } else if (responseData.action === FILE_REMOVED) {
      removeFileFromContents(responseData as unknown as FileSocketData);
    } else if (responseData.action === FOLDER_RENAMED) {
      updateFolderPath(responseData);
    } else if (responseData.action === FOLDER_REMOVED) {
      removeFolderPath(responseData);
    }
  }, [receivedData, updateFilePath, removeFileFromContents, updateFolderPath, removeFolderPath]);

  useEffect(() => {
    if (items.length === 0 && api.status == String(API_RESPONSE_CODE.notFound)) {
      navigate(-1);
    }
  }, [api.status, items, navigate]);

  return (
    <div className="flex flex-col mt-5">
      {id && (
        <div className="mb-4">
          <Button
            variant="outline"
            className="w-full justify-start border-border text-foreground hover:bg-secondary"
            onClick={() => navigate(-1)}
          >
            <span className="text-sm font-medium">← Go Back</span>
          </Button>
        </div>
      )}

      {/* Table Header */}
      <div className="flex items-center px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <div className="w-10"></div>
        <div className="flex-grow">Name</div>
        <div className="mr-3">Created At</div>
        <div className="flex items-center gap-1">
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
      </div>

      {/* Bordered Container */}
      <div className={`border border-border rounded-lg overflow-hidden bg-background ${view === 'grid' ? 'grid grid-cols-3 gap-4 p-4' : 'divide-y divide-border'}`}>
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          {items.map(renderItem)}
          <DialogContent>
            <FileView
              sourceUrl={sourceUrl}
              fileExtension={fileExtension}
              fileName={fileName}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

const ContentItem = ({ item, view, onFileClick, getFileUrl }: { item: IFolderContentData; view: ViewMode; onFileClick: (token: string) => void; getFileUrl: (token: string) => Promise<IFileUrlResponse> }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFileImage, isFileVideo, isFileDocument } = useFileExtensionCheck();

  const isFolder = item.type === 'folder';
  const token = String(item.unique_token);
  const name = isFolder ? String(item.path) : `${item.filename}.${item.file_extension}`;
  const created = isFolder ? (item.created_at as string) : formatCreatedAt(item.created_at ?? null);

  // Image thumbnail: fetch signed URL once the tile scrolls into view (icon shows until loaded).
  const tileRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState('');
  const imageTile = !isFolder && isFileImage(String(item.file_extension ?? ''));

  useEffect(() => {
    if (!imageTile) return;
    const node = tileRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          observer.disconnect();
          getFileUrl(token).then(
            (r) => setThumb((r as IFileUrlResponse).data.file_url),
            () => setThumb('')
          );
        }
      },
      { threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [imageTile, token, getFileUrl]);

  const FileLogo = ({ file_extension }: FileLogoProp) => {
    const logoSize = '20px';
    const ext = String(file_extension);

    if (isFileImage(ext)) {
      return <Image size={logoSize} />;
    } else if (isFileVideo(ext)) {
      return <Video size={logoSize} />;
    } else if (isFileDocument(ext)) {
      return <File size={logoSize} />;
    }

    return <FileX size={logoSize} />;
  };

  const openContent = () => {
    if (isFolder) {
      navigate(ROUTES.storage + `/${token}`, { state: { uniqueToken: token } });
    } else {
      onFileClick(token);
    }
  };

  const moreMenu = (zIndex: string) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <LucideMoreVertical className="w-4 h-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className={`w-40 p-1 bg-popover shadow-lg border-border rounded-lg ${zIndex}`}>
        <DropdownOption object_parent_id={id} object_id={token} object_name={name} object_type={isFolder ? 'folder' : 'file'} />
      </PopoverContent>
    </Popover>
  );

  return (
    <>
      {view === 'grid' ? (
        <div
          role="button"
          tabIndex={0}
          className="group min-w-0 flex flex-col gap-3 rounded-md border border-border bg-background p-3 hover:bg-secondary cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          onClick={openContent}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              (e.currentTarget as HTMLElement).click();
            }
          }}
        >
          <div
            ref={tileRef}
            className="relative flex aspect-[4/3] items-center justify-center rounded-md bg-secondary overflow-hidden"
          >
            {thumb ? (
              <img src={thumb} alt={name} className="h-full w-full object-cover" />
            ) : isFolder ? (
              <Folder className="w-9 h-9 text-foreground" />
            ) : (
              <FileLogo file_extension={item.file_extension} />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <div className="truncate text-sm font-medium text-foreground">{name}</div>
            <div className="text-xs text-muted-foreground">{created}</div>
          </div>
          <div className="flex justify-end">{moreMenu('z-10')}</div>
        </div>
      ) : (
        <div
          className="group flex items-center gap-3 px-4 py-3 hover:bg-secondary cursor-pointer transition-colors"
          onClick={openContent}
        >
          {isFolder ? (
            <Folder className="w-4 h-4 text-foreground flex-shrink-0" />
          ) : (
            <div className="w-4 flex items-center justify-center flex-shrink-0 text-foreground">
              <FileLogo file_extension={item.file_extension} />
            </div>
          )}
          <Label className="text-sm font-medium text-foreground flex-grow cursor-pointer select-none">{name}</Label>
          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap mr-2">{created}</span>
          <div className="mr-2">{moreMenu('')}</div>
        </div>
      )}
    </>
  );
};

export default FolderFileList;
