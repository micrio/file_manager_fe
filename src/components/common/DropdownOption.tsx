import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

import { useFoldersStore, MutationResult } from "@/store/useFolderStore";
import { useFileStore } from "@/store/userFileStore";
import { useToast } from "@/components/ui/use-toast";
import { TOAST_VARIANT_DESTRUCTIVE, TOAST_VARIANT_GHOST } from "@/constants/components/ui/toastConstant";
import { ROUTES } from "@/constants/routes";

interface IProps {
  object_parent_id?: string;
  object_id: string;
  object_name: string;
  object_type: 'folder' | 'file';
}

const DropdownOption = ({
  object_id,
  object_name,
  object_type,
  object_parent_id,
}: IProps) => {
  const location = useLocation();
  const [openRenameDialog, setOpenRenameDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [disableRenameBtn, setDisableRenameBtn] = useState<boolean>(true);
  const {
    renameFolder,
    renameFolderRequest,
    trashFolderRequest,
    removeFolderRequest
  } = useFoldersStore();
  const { renameFile, trashFileRequest, removeFileRequest } = useFileStore();
  const isObjectTypeFolder = object_type === 'folder';
  const isObjectTypeFile = object_type === 'file';

  const isTrashRoute = location.pathname.startsWith(ROUTES.trash);
  const { toast } = useToast();

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (isObjectTypeFolder) {
      renameFolder.setNewPathName(value);
    } else {
      renameFile.setNewPathName(value);
    }
  };

  const handleRename = async () => {
    if (isObjectTypeFolder) {
      renameFolder.setUniqueToken(object_id);

      const result: MutationResult = await renameFolderRequest();

      if (!result.ok) {
        toast({ variant: TOAST_VARIANT_DESTRUCTIVE, title: result.message });
        return;
      }
    }

    if (isObjectTypeFile) {
      // Set the parent folder token (like folder rename does) so the request
      // targets the file's real folder, then reflect the new name in the list
      // immediately — without waiting for the socket broadcast.
      renameFile.setFolderUniqueToken(object_parent_id ?? null);

      const result = await renameFile.request(object_id);

      if (!result.ok) {
        toast({ variant: TOAST_VARIANT_DESTRUCTIVE, title: result.message });
        return;
      }

      const newName = renameFile.newPathName;

      if (newName) {
        useFoldersStore.getState().updateFileContentsName(object_id, newName);
        useFileStore.getState().updateFileListName(object_id, newName);
      }
    }

    setOpenRenameDialog(false);
  };

  const handleDelete = async () => {
    if (isObjectTypeFolder) {
      const result: MutationResult = isTrashRoute
        ? await removeFolderRequest(object_id)
        : await trashFolderRequest(object_id);

      if (!result.ok) {
        toast({ variant: TOAST_VARIANT_DESTRUCTIVE, title: result.message });
        return;
      }
    }

    if (isObjectTypeFile) {
      const result = isTrashRoute
        ? await removeFileRequest(object_id)
        : await trashFileRequest(object_id);

      if (!result.ok) {
        toast({ variant: TOAST_VARIANT_DESTRUCTIVE, title: result.message });
        return;
      }
    }

    setOpenDeleteDialog(false);
  };

  useEffect(() => {
    if (isObjectTypeFolder) {
      if (
        renameFolder.newPathName?.length === 0 ||
        renameFolder.newPathName === null ||
        renameFolder.newPathName === object_name
      ) {
        setDisableRenameBtn(true);
      } else {
        setDisableRenameBtn(false);
      }
    }

    if (isObjectTypeFile) {
      if (
        renameFile.newPathName?.length !== 0 &&
        renameFile.newPathName !== null &&
        renameFile.newPathName !== undefined &&
        renameFile.newPathName !== object_name
      ) {
        setDisableRenameBtn(false);
      } else {
        setDisableRenameBtn(true);
      }
    }
  }, [
    isObjectTypeFile,
    isObjectTypeFolder,
    renameFolder.newPathName,
    renameFile.newPathName,
    setDisableRenameBtn,
    object_name,
  ]);

  return (
    <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
      <Dialog open={openRenameDialog} onOpenChange={setOpenRenameDialog}>
        <DialogTrigger className="p-2 hover:bg-black hover:bg-opacity-20">
          <Label>Rename</Label>
        </DialogTrigger>
        <DialogContent>
          <Input
            className="mt-5"
            onChange={handleInput}
            defaultValue={object_name}
          />
          <div className="w-full flex justify-end mt-2">
            <Button
              type="button"
              variant={TOAST_VARIANT_GHOST}
              className="mr-4"
              onClick={() => {
                setOpenRenameDialog(false);
              }}
            >
              Close
            </Button>
            <Button
              className="w-20"
              onClick={handleRename}
              disabled={disableRenameBtn}
            >
              Rename
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogTrigger className="p-2 hover:bg-black/10 dark:hover:bg-white/10">
          <Label>Delete</Label>
        </DialogTrigger>
        <DialogContent>
          <Label className="mx-2 my-2">
            Are you sure you want to delete this {object_type} ?
          </Label>
          <div className="w-full flex justify-end">
            <Button
              type="button"
              variant={TOAST_VARIANT_GHOST}
              className="mr-4"
              onClick={() => {
                setOpenDeleteDialog(false);
              }}
            >
              Close
            </Button>
            <Button
              className="w-20"
              variant={TOAST_VARIANT_DESTRUCTIVE}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DropdownOption;
