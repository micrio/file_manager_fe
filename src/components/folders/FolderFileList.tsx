import { useEffect, useRef, useState } from 'react';

import { File, FileX, Folder, Grid3x3, Image, List, LucideMoreVertical, Video } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { API_RESPONSE_CODE } from '@/constants/apiResponseCode';
import { ROUTES } from '@/constants/routes';
import { FILE_MOVED, FILE_REMOVED, FILE_RENAMED, FOLDER_MOVED, FOLDER_REMOVED, FOLDER_RENAMED } from '@/constants/socketActions';

import { useAuthStore } from '@/store/useAuthStore';
import { FolderSocketData, useFoldersStore } from '@/store/useFolderStore';
import { FileSocketData, useFileStore } from '@/store/userFileStore';
import { useSocketStore } from '@/store/useSocketStore';

import DropdownOption from '@/components/common/DropdownOption';

import { IFileUrlResponse } from '@/apis/file/fileInterface';
import {
  IFileContentData,
  IFolderContentData,
  IFolderData,
} from '@/apis/folder/folderInterface';
import FileView from '@/components/files/FileView';
import { useFileExtensionCheck } from '@/hooks/useFileExtensionCheck';

import MoveFileModal from './MoveFileModal';
import MoveFolderModal from './MoveFolderModal';

interface IProps {
  items: IFolderContentData[] | [];
  isTrash?: boolean;
}

interface FileLogoProp {
  file_extension: string | null;
}

type ViewMode = 'list' | 'grid';

const FOLDER_MOVE_THRESHOLD = 5; // pixels

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

const FolderFileList = ({ items = [], isTrash = false }: IProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const parentToken = (location.state as { parentToken?: string | null })
    ?.parentToken ?? null;

  const handleGoBack = () => {
    if (parentToken) {
      navigate(ROUTES.storage + `/${parentToken}`);
    } else {
      navigate(ROUTES.storage);
    }
  };

  const { api } = useAuthStore();
  const { getFileUrl } = useFileStore();
  const {
    updateFolderPath,
    removeFolderPath,
    updateFilePath,
    removeFileFromContents,
    moveFolder,
    moveFolderPath,
  } = useFoldersStore();
  const { receivedData } = useSocketStore();

  // File-to-folder drag drop state (for MoveFileModal).
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [movingFile, setMovingFile] = useState<IFileContentData | null>(null);
  const [movingTargetFolder, setMovingTargetFolder] = useState<IFolderData | null>(null);

  // Folder-to-folder drag drop state (for MoveFolderModal).
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [movingFolder, setMovingFolder] = useState<IFolderData | null>(null);
  const [movingTarget, setMovingTarget] = useState<IFolderData | null>(null);

  const handleCloseFolderModal = () => {
    setMoveModalOpen(false);
    setMovingFolder(null);
    setMovingTarget(null);
  };

  const handleCloseFileModal = () => {
    setFileModalOpen(false);
    setMovingFile(null);
    setMovingTargetFolder(null);
  };

  const applyMoveForTarget = (sourceToken: string, targetItem: IFolderContentData) => {
    const source = items.find(
      (i) => i.unique_token === sourceToken,
    ) as IFolderContentData | undefined;

    if (!source) return;

    if (source.type !== 'folder' && targetItem.type === 'file') return;
    if (source.type === 'folder' && sourceToken === targetItem.unique_token) return;

    if (source.type === 'folder') {
      moveFolder.setSourceFolderToken(sourceToken);
      moveFolder.setTargetFolderToken(targetItem.unique_token);
      const sourcePath = (source as IFolderData).path;
      const targetPath = (targetItem as IFolderData).path;
      setMovingFolder({
        id: source.id,
        unique_token: source.unique_token,
        path: typeof sourcePath === 'string' ? sourcePath : '',
      });
      setMovingTarget({
        id: targetItem.id,
        unique_token: targetItem.unique_token,
        path: typeof targetPath === 'string' ? targetPath : '',
      });
      setMoveModalOpen(true);
      return;
    }

    // File-to-folder: set store state AND open the confirmation modal.
    useFileStore.getState().moveFile.setSourceFileToken(source.unique_token);
    useFileStore.getState().moveFile.setTargetFolderToken(targetItem.unique_token);
    setMovingFile(source);
    setMovingTargetFolder({
      unique_token: targetItem.unique_token,
      path: typeof targetItem.full_path === 'string' ? targetItem.full_path : '',
      id: null,
      created_at: '',
      parentFolderId: null,
    } as IFolderData);
    setFileModalOpen(true);
  };

  const handleFolderDragHandleDrop = (targetItem: IFolderContentData) => (e: React.DragEvent) => {
    e.preventDefault();
    const sourceToken = e.dataTransfer.getData('uniqueToken') || dragStartTokenRef.current;

    if (!sourceToken) return;

    applyMoveForTarget(sourceToken, targetItem);
    dragStartTokenRef.current = null;
  };

  const [dragOverToken, setDragOverToken] = useState<string | null>(null);
  const dragTokenRef = useRef<string | null>(null);
  const dragStartTokenRef = useRef<string | null>(null);

  const litTarget = (token: string) => {
    dragTokenRef.current = token;
    setDragOverToken(token);
  };

  const handleItemDragEnter =
    (token: string, isFolderItem: boolean) => () => {
      if (!isFolderItem) return;
      const sourceToken = dragStartTokenRef.current;
      if (sourceToken && sourceToken === token) return;
      litTarget(token);
    };

  const handleItemDragOver =
    (token: string, isFolderItem: boolean) => (e: React.DragEvent) => {
      e.preventDefault();
      if (!isFolderItem) return;
      const sourceToken = dragStartTokenRef.current;
      if (sourceToken && sourceToken === token) return;
      litTarget(token);
    };

  const handleItemDragLeave = (token: string) => (e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    const nextTarget = e.relatedTarget as HTMLElement | null;

    if (!nextTarget || el.contains(nextTarget)) return;
    if (token === dragTokenRef.current) {
      dragTokenRef.current = null;
      setDragOverToken((prev) => (prev === token ? null : prev));
    }
  };

  const clearDragOver = () => {
    dragStartTokenRef.current = null;
    dragTokenRef.current = null;
    setDragOverToken(null);
  };

  const manualDrag = useRef<{
    active: boolean;
    start: { x: number; y: number };
    source: string | null;
  }>({ active: false, start: { x: 0, y: 0 }, source: null });

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (manualDrag.current.active) {
      const { start, source } = manualDrag.current;
      const dx = Math.abs(e.clientX - start.x);
      const dy = Math.abs(e.clientY - start.y);

      if (dx <= FOLDER_MOVE_THRESHOLD && dy <= FOLDER_MOVE_THRESHOLD) return;

      const rows = document.querySelectorAll<HTMLElement>('[data-folder-row]');
      for (const row of rows) {
        const rect = row.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          const tok = row.getAttribute('data-folder-token');
          setDragOverToken(tok && tok !== source ? tok : null);
          return;
        }
      }
    }

    const source = dragStartTokenRef.current;
    if (source) {
      const rows = document.querySelectorAll<HTMLElement>('[data-folder-row]');
      for (const row of rows) {
        const rect = row.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          const tok = row.getAttribute('data-folder-token');
          setDragOverToken(tok && tok !== source ? tok : null);
          return;
        }
      }
    }
  };

  const onManualMouseDown = (token: string, x: number, y: number) => {
    manualDrag.current = { active: true, start: { x, y }, source: token };
  };

  const onManualCancel = () => {
    manualDrag.current.active = false;
  };

  const onManualDrop = (targetItem: IFolderContentData) => {
    manualDrag.current.active = false;

    if (manualDrag.current.source) {
      applyMoveForTarget(manualDrag.current.source, targetItem);
    }

    setDragOverToken(null);
  };

  const readInitialView = (): ViewMode => {
    try {
      const stored = localStorage.getItem('fileListView') as ViewMode;
      return stored === 'list' || stored === 'grid' ? stored : 'list';
    } catch {
      return 'list';
    }
  };

  const [view, setView] = useState<ViewMode>(readInitialView);

  const commitView = (next: ViewMode) => {
    setView(next);
    try {
      localStorage.setItem('fileListView', next);
    } catch { /* storage unavailable */ }
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
      .catch(() => { });
  };

  const renderItem = (item: IFolderContentData) => {
    const isFolderItem = item.type === 'folder';
    const token = String(item.unique_token);

    return (
      <ContentItem
        key={item.unique_token}
        item={item}
        view={view}
        isTrash={isTrash}
        onFileClick={handlePreviewFile}
        onDrop={handleFolderDragHandleDrop}
        isDropTarget={isTrash ? false : isFolderItem && dragOverToken === token}
        onDragStartTracking={(tok) => {
          dragStartTokenRef.current = tok;
        }}
        onDragEnter={handleItemDragEnter(token, isFolderItem)}
        onDragOver={handleItemDragOver(token, isFolderItem)}
        onDragLeave={handleItemDragLeave(token)}
        onDragEnd={clearDragOver}
        onManualMouseDown={onManualMouseDown}
        onManualCancel={onManualCancel}
        onManualDrop={onManualDrop}
      />
    );
  };

  useEffect(() => {
    const responseData = receivedData as unknown as FolderSocketData;
    if (!responseData) return;

    if (responseData.action === FILE_RENAMED) {
      updateFilePath(responseData as unknown as FileSocketData);
    } else if (responseData.action === FILE_MOVED) {
      // A moved file left this folder: drop it from `contents` (same handler as
      // FILE_REMOVED). It previously wrote to `useFileStore`'s `contents`, which
      // Storage/Trash never render, so the moved row lingered on screen.
      removeFileFromContents(responseData as unknown as FileSocketData);
    } else if (responseData.action === FILE_REMOVED) {
      removeFileFromContents(responseData as unknown as FileSocketData);
    } else if (responseData.action === FOLDER_RENAMED) {
      updateFolderPath(responseData);
    } else if (responseData.action === FOLDER_REMOVED) {
      removeFolderPath(responseData);
    } else if (responseData.action === FOLDER_MOVED) {
      moveFolderPath(responseData);
    }
  }, [
    receivedData,
    updateFilePath,
    removeFileFromContents,
    updateFolderPath,
    removeFolderPath,
    moveFolderPath,
  ]);

  useEffect(() => {
    if (items.length === 0 && api.status == String(API_RESPONSE_CODE.notFound)) {
      navigate(-1);
    }
  }, [api.status, items, navigate]);

  return (
    <>
      <MoveFileModal
        open={fileModalOpen}
        onClose={handleCloseFileModal}
        sourceFile={movingFile}
        targetFolder={movingTargetFolder}
      />

      <MoveFolderModal
        open={moveModalOpen}
        onClose={handleCloseFolderModal}
        sourceFolder={movingFolder}
        targetFolder={movingTarget}
      />

      <div className="flex flex-col mt-5">
        {id && (
          <div className="mb-4">
            <Button
              variant="outline"
              className="w-full justify-start border-border text-foreground hover:bg-secondary"
              onClick={handleGoBack}
            >
              <span className="text-sm font-medium">← Go Back</span>
            </Button>
          </div>
        )}

        <div className="flex items-center justify-end gap-1 px-4 pt-2">
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

        <div className="flex items-center px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="w-10"></div>
          <div className="flex-grow">Name</div>
          <div className="mr-3">Created At</div>
        </div>

        <div
          className={`border border-border rounded-lg overflow-hidden bg-background ${view === 'grid' ? 'grid grid-cols-3 gap-4 p-4' : 'divide-y divide-border'}`}
          onMouseMove={handleContainerMouseMove}
        >
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            {items.map(renderItem)}
            <DialogContent className="w-[95vw] max-w-[95vw] sm:w-[60vw] sm:max-w-[60vw]">
              <FileView
                sourceUrl={sourceUrl}
                fileExtension={fileExtension}
                fileName={fileName}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
};

const ContentItem = ({
  item,
  view,
  isTrash,
  onFileClick,
  onDrop,
  isDropTarget,
  onDragStartTracking,
  onDragEnter,
  onDragLeave,
  onDragEnd,
  onDragOver,
  onManualMouseDown,
  onManualCancel,
  onManualDrop,
}: {
  item: IFolderContentData;
  view: ViewMode;
  onFileClick: (token: string) => void;
  onDrop: (targetItem: IFolderContentData) => (e: React.DragEvent) => void;
  isDropTarget?: boolean;
  onDragStartTracking?: (token: string) => void;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onManualMouseDown?: (token: string, x: number, y: number) => void;
  onManualCancel?: () => void;
  onManualDrop?: (targetItem: IFolderContentData) => void;
  isTrash?: boolean;
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFileImage, isFileVideo, isFileDocument } = useFileExtensionCheck();

  const isFolder = item.type === 'folder';
  const isFile = !isFolder;
  const token = String(item.unique_token);
  const name = isFolder
    ? String((item as IFolderData).path)
    : `${item.filename}.${item.file_extension}`;
  const created = isFolder
    ? (item.created_at as string)
    : formatCreatedAt(item.created_at ?? null);

  const thumbKey: 'small' | 'medium' = view === 'grid' ? 'medium' : 'small';
  const dataThumb = item.thumbnails ? item.thumbnails[thumbKey] : '';

  const dragRef = useRef<{
    startX: number;
    startY: number;
    isDragging: boolean;
  }>({ startX: 0, startY: 0, isDragging: false });

  const isDraggedRef = useRef(false);

  const handleContentMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, isDragging: false };
    if (isFolder) {
      onManualMouseDown?.(token, e.clientX, e.clientY);
    }
  };

  const handleContentClick = () => {
    if (dragRef.current.isDragging) {
      dragRef.current.isDragging = false;
      return;
    }
    if (isDraggedRef.current) {
      isDraggedRef.current = false;
      return;
    }
    openContent();
  };

  const handleFolderDragStart = (e: React.DragEvent) => {
    dragRef.current.isDragging = true;
    onManualCancel?.();
    if (!item.unique_token) return;
    onDragStartTracking?.(String(item.unique_token));
    e.dataTransfer.setData('uniqueToken', String(item.unique_token));
    e.dataTransfer.setData('fileType', 'folder');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleFileDragStart = (e: React.DragEvent) => {
    dragRef.current.isDragging = true;
    onManualCancel?.();
    if (!item.unique_token) return;
    onDragStartTracking?.(String(item.unique_token));
    e.dataTransfer.setData('uniqueToken', String(item.unique_token));
    e.dataTransfer.setData('fileType', 'file');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const { startX, startY, isDragging } = dragRef.current;
    if (isDragging) return;

    const dx = Math.abs(e.clientX - startX);
    const dy = Math.abs(e.clientY - startY);

    if (dx > FOLDER_MOVE_THRESHOLD || dy > FOLDER_MOVE_THRESHOLD) {
      isDraggedRef.current = true;
      dragRef.current.isDragging = true;
      onManualDrop?.(item);
    }
  };

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
      navigate(ROUTES.storage + `/${token}`, { state: { parentToken: id } });
    } else {
      onFileClick(token);
    }
  };

  const moreMenu = () => (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 opacity-100 cursor-pointer"
          >
            <LucideMoreVertical className="w-4 h-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-fit p-1 bg-popover shadow-lg border-border rounded-lg"
        >
          <DropdownOption
            object_parent_id={id}
            object_id={token}
            object_name={name}
            object_type={isFolder ? 'folder' : 'file'}
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <>
      {view === 'grid' ? (
        <div
          role="button"
          tabIndex={0}
          className={`group min-w-0 flex flex-col gap-3 rounded-md border border-border bg-background p-3 hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${isFile ? 'cursor-grab' : 'cursor-pointer'} ${isDropTarget ? 'bg-secondary/70 border-border ring-2 ring-ring/30 shadow-md' : ''}`}
          {...(isFolder ? { 'data-folder-row': true, 'data-folder-token': token } : {})}
          {...(isTrash ? {} : {
            draggable: true,
            onDragStart: isFolder ? handleFolderDragStart : handleFileDragStart,
            onDragOver: onDragOver,
            onDrop: onDrop(item),
            onDragEnter: onDragEnter,
            onDragLeave: onDragLeave,
            onDragEnd: onDragEnd,
            onMouseDown: handleContentMouseDown,
          })}
          onClick={handleContentClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              (e.currentTarget as HTMLElement).click();
            }
          }}
        >
          {isFile ? (
            <div
              onMouseDown={handleContentMouseDown}
              onClick={handleContentClick}
              onMouseUp={handleMouseUp}
            >
              <div className="relative flex aspect-[4/3] items-center justify-center rounded-md bg-secondary overflow-hidden">
                {dataThumb ? (
                  <img src={dataThumb} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <FileLogo file_extension={item.file_extension} />
                )}
              </div>
              <div className="flex flex-col gap-1 mt-2">
                <div className="truncate text-sm font-medium text-foreground">
                  {name}
                </div>
                <div className="text-xs text-muted-foreground">{created}</div>
              </div>
            </div>
          ) : (
            <>
              <div className="relative flex aspect-[4/3] items-center justify-center rounded-md bg-secondary overflow-hidden">
                {dataThumb ? (
                  <img src={dataThumb} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <Folder className="w-9 h-9 text-foreground" />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div className="truncate text-sm font-medium text-foreground">
                  {name}
                </div>
                <div className="text-xs text-muted-foreground">{created}</div>
              </div>
            </>
          )}
          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            {moreMenu()}
          </div>
        </div>
      ) : (
        <div
          className={`group flex items-center gap-3 px-4 py-3 transition-colors ${isFile ? 'hover:bg-secondary cursor-grab' : 'hover:bg-secondary cursor-pointer'} ${isDropTarget ? 'bg-secondary/70 border-border ring-2 ring-ring/30 shadow-md' : ''}`}
          {...(isFolder ? { 'data-folder-row': true, 'data-folder-token': token } : {})}
          {...(isTrash ? {} : {
            draggable: true,
            onDragStart: isFolder ? handleFolderDragStart : handleFileDragStart,
            onDragOver: onDragOver,
            onDrop: onDrop(item),
            onDragEnter: onDragEnter,
            onDragLeave: onDragLeave,
            onDragEnd: onDragEnd,
            onMouseDown: handleContentMouseDown,
          })}
          onClick={handleContentClick}
          onMouseUp={handleMouseUp}
        >
          {isFolder ? (
            <>
              <Folder className="w-4 h-4 text-foreground flex-shrink-0"
                onClick={() => { if (!dragRef.current.isDragging) openContent(); }}
              />
              <Label className="text-sm font-medium text-foreground flex-grow cursor-pointer select-none"
                onClick={() => { if (!dragRef.current.isDragging) openContent(); }}
              >
                {name}
              </Label>
              <span className="text-xs text-muted-foreground font-medium whitespace-nowrap mr-2"
                onClick={() => { if (!dragRef.current.isDragging) openContent(); }}
              >
                {created}
              </span>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {moreMenu()}
              </div>
            </>
          ) : (
            <>
              <div className="h-8 w-8 flex-shrink-0 rounded-md overflow-hidden bg-secondary flex items-center justify-center">
                {dataThumb ? (
                  <img src={dataThumb} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <FileLogo file_extension={item.file_extension} />
                )}
              </div>
              <Label className="text-sm font-medium text-foreground flex-grow cursor-pointer select-none">
                {name}
              </Label>
              <span className="text-xs text-muted-foreground font-medium whitespace-nowrap mr-2">
                {created}
              </span>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {moreMenu()}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default FolderFileList;
