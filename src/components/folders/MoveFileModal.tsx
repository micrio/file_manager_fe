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
import { useToast } from '@/components/ui/use-toast';

import { TOAST_VARIANT_DEFAULT, TOAST_VARIANT_DESTRUCTIVE } from '@/constants/components/ui/toastConstant';

import { useFileStore } from '@/store/userFileStore';

import type { IFileContentData } from '@/apis/folder/folderInterface';
import type { IFolderData } from '@/apis/folder/folderInterface';

interface IProps {
  open: boolean;
  onClose: () => void;
  sourceFile: IFileContentData | null;
  targetFolder: IFolderData | null;
}

const MoveFileModal = ({
  open,
  onClose,
  sourceFile,
  targetFolder,
}: IProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && sourceFile && targetFolder) {
      useFileStore.getState().moveFile.setSourceFileToken(sourceFile.unique_token);
      useFileStore.getState().moveFile.setTargetFolderToken(targetFolder.unique_token!);
    }
  }, [open, sourceFile, targetFolder]);

  const fileName = sourceFile
    ? `${sourceFile.filename}.${sourceFile.file_extension}`
    : '';

  const targetPath = targetFolder
    ? String(targetFolder.path)
    : 'Root (no parent)';

  const handleMove = async () => {
    setLoading(true);

    const result = await useFileStore.getState().moveFileRequest();
    setLoading(false);

    if (result.ok) {
      toast({
        variant: TOAST_VARIANT_DEFAULT,
        title: `Moved "${fileName}" to ${targetPath}`,
      });
      onClose();
    } else {
      toast({
        variant: TOAST_VARIANT_DESTRUCTIVE,
        title: result.message ?? 'Failed to move file',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move File</DialogTitle>
          <DialogDescription>
            Move{' '}
            <span className="font-semibold">{fileName}</span>
            {' '}to{' '}
            <span className="font-semibold">
              {targetPath}
            </span>?
          </DialogDescription>
        </DialogHeader>

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

export default MoveFileModal;
