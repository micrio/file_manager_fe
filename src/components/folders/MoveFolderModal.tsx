import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useFoldersStore } from '@/store/useFolderStore';

import type { IFolderData } from '@/apis/folder/folderInterface';

interface IProps {
  open: boolean;
  onClose: () => void;
  sourceFolder: IFolderData | null;
  // Set (a folder dragged onto a known target) → just confirm "move A into B",
  // no picker. Null (the more-menu "Move" action) → show the destination dropdown.
  targetFolder?: IFolderData | null;
}

const MoveFolderModal = ({
  open,
  onClose,
  sourceFolder,
  targetFolder,
}: IProps) => {
  const { moveFolder, moveFolderRequest } = useFoldersStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [destinationFolders, setDestinationFolders] = useState<IFolderData[]>([]);

  // Populate the destination dropdown when the modal is used to *pick* a target
  // (the more-menu "Move" action). The drag-to-target case already knows its
  // destination, so no fetch is needed there (and it is skipped when targetFolder is set).
  useEffect(() => {
    if (!open || targetFolder) return;

    // Fetch folders for the destination dropdown when dialog opens.
    useFoldersStore.getState().getFoldersList("default").then((result) => {
      if (result.ok) {
        const folders = result.data as IFolderData[] | undefined;
        setDestinationFolders(
          (folders ?? []).filter(
            (f) => f.unique_token !== sourceFolder?.unique_token
          )
        );
      }
    });
  }, [open, targetFolder, sourceFolder]);

  const handleMove = async () => {
    setError(null);
    setLoading(true);

    const result = await moveFolderRequest();

    if (!result.ok) {
      setError(result.message ?? 'Failed to move folder');
    } else {
      onClose();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move Folder</DialogTitle>
          {targetFolder ? (
            <DialogDescription>
              Move{' '}
              <span className="font-semibold">{String(sourceFolder?.path)}</span>
              {' '}into{' '}
              <span className="font-semibold">{String(targetFolder.path)}</span>?
            </DialogDescription>
          ) : (
            <DialogDescription>
              Select the destination folder to move{' '}
              <span className="font-semibold">{String(sourceFolder?.path)}</span> into.
            </DialogDescription>
          )}
        </DialogHeader>

        {!targetFolder && (
          <div className="grid gap-4 py-2">
            <label className="text-sm font-medium text-foreground">
              Destination
            </label>

            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={moveFolder.targetFolderToken ?? ''}
              onChange={(e) => moveFolder.setTargetFolderToken(e.target.value)}
            >
              <option value="">Root (no parent)</option>
              {destinationFolders.map((f) => (
                <option key={f.unique_token} value={f.unique_token ?? ''}>
                  {String(f.path)}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={loading}>
            {loading ? 'Moving...' : 'Move'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveFolderModal;
