import { useEffect, useRef, useState } from 'react';

import { Folder, LucideMoreVertical } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { API_RESPONSE_CODE } from '@/constants/apiResponseCode';
import { ROUTES } from '@/constants/routes';
import { FOLDER_MOVED, FOLDER_REMOVED, FOLDER_RENAMED } from '@/constants/socketActions';

import { useAuthStore } from '@/store/useAuthStore';
import { FolderSocketData, useFoldersStore } from '@/store/useFolderStore';
import { useSocketStore } from '@/store/useSocketStore';
import { useUiStore } from '@/store/useUiStore';

import DropdownOption from '@/components/common/DropdownOption';

import { IFolderData } from '@/apis/folder/folderInterface';
import { useCloseMenuOnOutsideClick } from '@/hooks/useCloseMenuOnOutsideClick';

import MoveFolderModal from './MoveFolderModal';

interface IProps {
  folders: IFolderData[];
  onFileToFolderDrop?: (fileToken: string, targetFolder: IFolderData) => void;
  isTrash?: boolean;
}

const FolderList = ({ folders, onFileToFolderDrop, isTrash = false }: IProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useAuthStore();
  const { renameFolder, updateFolderPath, removeFolderPath, moveFolder, moveFolderPath } = useFoldersStore();
  const { receivedData } = useSocketStore();
  const { openMenuId, setOpenMenuId } = useUiStore();
  useCloseMenuOnOutsideClick();

  // Move folder state — confirmation modal for folder-to-folder moves.
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [movingFolder, setMovingFolder] = useState<IFolderData | null>(null);
  const [movingTarget, setMovingTarget] = useState<IFolderData | null>(null);

  const handleCloseMoveModal = () => {
    setMoveModalOpen(false);
    setMovingFolder(null);
    setMovingTarget(null);
    clearDragOver();
  };

  // Drag-over highlight state. When a folder row is dragged over another folder
  // row, light it up as a valid drop target.
  const [dragOverToken, setDragOverToken] = useState<string | null>(null);
  const isDragged = useRef(false);

  // Authoritative "currently lit" target, kept in a ref so dragleave can tell
  // whether it's leaving the row we actually highlighted.
  const dragTokenRef = useRef<string | null>(null);
  const litTarget = (token: string) => {
    dragTokenRef.current = token;
    setDragOverToken(token);
  };

  const handleItemDragEnter = (token: string) => (e: React.DragEvent) => {
    const sourceToken = e.dataTransfer.getData('uniqueToken');
    const fileType = e.dataTransfer.getData('fileType');
    // No drag data at all — skip.
    if (!sourceToken && !fileType) return;
    // Self-drag check: skip when source is this folder (folder-to-folder).
    if (sourceToken && sourceToken === token) return;
    litTarget(token);
  };

  const handleItemDragOver = (token: string) => (e: React.DragEvent) => {
    const sourceToken = e.dataTransfer.getData('uniqueToken');
    const fileType = e.dataTransfer.getData('fileType');
    if (!sourceToken && !fileType) return;
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
    dragTokenRef.current = null;
    setDragOverToken(null);
  };

  const handleFolderClick = (uniqueToken: string) => {
    navigate(ROUTES.storage + `/${uniqueToken}`, {
      state: { uniqueToken: uniqueToken },
    });
  };

  const handleFolderDragStart = (e: React.DragEvent, uniqueToken: string | null) => {
    if (!uniqueToken) return;
    isDragged.current = true;
    e.dataTransfer.setData('uniqueToken', uniqueToken);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleFolderDrop = (e: React.DragEvent, targetToken: string | undefined) => {
    e.preventDefault();
    e.stopPropagation();

    const sourceToken = e.dataTransfer.getData('uniqueToken');
    const fileType = e.dataTransfer.getData('fileType');

    // No source at all (file drag without uniqueToken set, or no drag data)
    if (!sourceToken && !fileType) return;
    if (sourceToken && sourceToken === targetToken) return;

    // Folder-to-folder: set tokens, then open the confirmation modal.
    const folderSource = folders.find((f) => f.unique_token === sourceToken);

    if (folderSource) {
      moveFolder.setSourceFolderToken(sourceToken);
      moveFolder.setTargetFolderToken(targetToken ?? '');
      setMovingFolder(folderSource);
      const target = folders.find((f) => f.unique_token === targetToken);
      if (target) setMovingTarget(target);
      setMoveModalOpen(true);
      return;
    }

    // File-to-folder: delegate to the callback (set by FolderFileList).
    if (fileType) {
      const target = folders.find((f) => f.unique_token === targetToken);
      if (!target) return;
      onFileToFolderDrop?.(sourceToken!, target);
    }
  };

  useEffect(() => {
    const responseData = receivedData as FolderSocketData;
    const isFolderRenamedAction =
      responseData && responseData.action === FOLDER_RENAMED;
    const isFolderRemovedAction =
      responseData && responseData.action === FOLDER_REMOVED;
    const isFolderMovedAction =
      responseData && responseData.action === FOLDER_MOVED;

    if (isFolderRenamedAction) {
      updateFolderPath(responseData);
    }

    if (isFolderRemovedAction) {
      removeFolderPath(responseData);
    }

    if (isFolderMovedAction) {
      moveFolderPath(responseData);
    }
  }, [
    receivedData,
    updateFolderPath,
    id,
    removeFolderPath,
    moveFolderPath,
  ]);

  useEffect(() => {
    if (
      folders.length === 0 &&
      api.status == String(API_RESPONSE_CODE.notFound)
    ) {
      navigate(-1);
    }
  }, [api.status, folders, navigate]);

  return (
    <>
      <MoveFolderModal
        open={moveModalOpen}
        onClose={handleCloseMoveModal}
        sourceFolder={movingFolder}
        targetFolder={movingTarget}
      />

      <div className="flex flex-col mt-5">
        {id && (
          <div className="mb-4">
            <Button
              variant="outline"
              className="w-full justify-start border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={() => navigate(-1)}
            >
            <span className="text-sm font-medium">← Go Back</span>
          </Button>
        </div>
      )}

      {/* Table Header */}
      <div className="flex items-center px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <div className="w-10"></div> {/* Spacer for the icon */}
        <div className="flex-grow">Name</div>
        <div className="mr-12">Created At</div> {/* Right align with date column */}
      </div>

      {/* Bordered Container */}
      <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-200 bg-white">
        {folders.map(({ unique_token, path, created_at }: IFolderData) => {
          const isDropTarget = isTrash ? false : dragOverToken === unique_token;
          return (
            <div
              className={`group flex items-center gap-3 px-4 py-3 transition-colors ${isDropTarget ? 'bg-slate-300 dark:bg-slate-600 ring-1 ring-slate-500 dark:ring-slate-300' : 'hover:bg-slate-100'}`}
              key={unique_token}
              {...(isTrash ? {} : {
                draggable: true,
                'data-folder-row': 'true',
                'data-folder-token': String(unique_token),
                onDragStart: (e: React.DragEvent) => {
                  e.stopPropagation();
                  handleFolderDragStart(e, String(unique_token));
                },
                onDragEnter: handleItemDragEnter(String(unique_token)),
                onDragOver: (e: React.DragEvent) => {
                  e.preventDefault();
                  handleItemDragOver(String(unique_token))(e);
                },
                onDragLeave: handleItemDragLeave(String(unique_token)),
                onDragEnd: clearDragOver,
                onDrop: (e: React.DragEvent) => handleFolderDrop(e, String(unique_token)),
              })}
            >
              {/* Clickable body (navigation) — separate from drag handle */}
              <div
                className="flex-grow flex items-center gap-3 cursor-pointer"
                onMouseDown={() => { isDragged.current = false; }}
                onClick={() => {
                  if (!isDragged.current) {
                    handleFolderClick(String(unique_token));
                  }
                }}
              >
                <Folder
                  className="w-4 h-4 text-slate-500 flex-shrink-0 cursor-pointer"
                  onClick={() => { if (!isDragged.current) handleFolderClick(String(unique_token)); }}
                />

                {/* Folder Path */}
                <Label
                  className="text-sm font-medium text-slate-700 select-none cursor-pointer"
                  onClick={() => { if (!isDragged.current) handleFolderClick(String(unique_token)); }}
                >
                {String(path)}
                </Label>

                {/* Created At Date */}
                <span
                  className="text-xs text-slate-400 font-medium whitespace-nowrap mr-2 cursor-pointer"
                  onClick={() => { if (!isDragged.current) handleFolderClick(String(unique_token)); }}
                >
                  {created_at}
                </span>
              </div>

              {/* Popover (context menu) — separate from both click and drag */}
              <Popover
                open={openMenuId === String(unique_token)}
                onOpenChange={(isOpen) => {
                  if (isOpen) setOpenMenuId(String(unique_token));
                }}
              >
                <PopoverTrigger
                  asChild
                  data-row-menu-trigger
                  onClick={(e) => {
                    e.stopPropagation();
                    renameFolder.setUniqueToken(String(unique_token));
                    setOpenMenuId(
                      openMenuId === String(unique_token)
                        ? null
                        : String(unique_token)
                    );
                  }}
                >
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 opacity-100 cursor-pointer"
                  >
                    <LucideMoreVertical className="w-4 h-4 text-slate-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  data-row-menu-content
                  className="w-fit p-1 bg-white shadow-lg border rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownOption
                    object_parent_id={id}
                    object_id={String(unique_token)}
                    object_name={String(path)}
                    object_type="folder"
                  />
                </PopoverContent>
              </Popover>
            </div>
          );
        })}
      </div>
    </div>
  </>
  );
};

export default FolderList;
