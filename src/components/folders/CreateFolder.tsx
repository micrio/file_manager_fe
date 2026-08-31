import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { FolderPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

import { useFoldersStore, FolderSocketData } from '@/store/useFolderStore';
import { useSocketStore } from '@/store/useSocketStore';
import { FOLDER_CREATED } from '@/constants/socketActions';
import { TOAST_VARIANT_GHOST } from '@/constants/components/ui/toastConstant';

const CreateFolder = () => {
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const { id } = useParams();
  const { createFolder, createFolderRequest, addSingleFolderToList } = useFoldersStore();
  const { receivedData } = useSocketStore();

  useEffect(() => {
    // Set token same as in URL params token
    useFoldersStore.getState().createFolder.setParentFolderToken(id ?? null);
  }, [id]);

  useEffect(() => {
    const responseData = receivedData as FolderSocketData;
    const isFolderCreateAction =
      responseData && responseData.action === FOLDER_CREATED;

    if (isFolderCreateAction) {
      const parentFolderId = responseData.data[0]?.parent_folder_id || null;

      if (createFolder.parentFolderToken === id && parentFolderId !== null) {
        addSingleFolderToList(responseData);
      } else if (createFolder.parentFolderToken === null && parentFolderId === null) {
        addSingleFolderToList(responseData);
      }
    }
  }, [receivedData, addSingleFolderToList, id, createFolder.parentFolderToken]);

  const handlePathInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    createFolder.setPathName(e?.target?.value);
  };

  const handleCreateFolder = () => {
    createFolderRequest();

    // Note: Use success message to handle closing of dialog
    setOpenDialog(false);
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <div className="w-auto">
        <DialogTrigger
          className="flex items-center gap-3 p-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md"
          title="Create Folder"
        >
          <FolderPlus className="w-6 h-6" />
        </DialogTrigger>
      </div>
      <DialogContent className="absolute py-8">
        <Label>Folder Name</Label>
        <Input onChange={handlePathInput} />
        <div className="w-full flex justify-end mt-2">
          <Button
            type="button"
            variant={TOAST_VARIANT_GHOST}
            className="mr-4"
            onClick={() => {
              setOpenDialog(false);
            }}
          >
            Close
          </Button>
          <Button
            className="w-20"
            disabled={!createFolder.pathName}
            onClick={handleCreateFolder}
          >
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFolder;
