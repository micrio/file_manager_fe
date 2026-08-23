import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

import { useFoldersStore } from "@/store/useFolderStore";
import { useFileStore } from "@/store/userFileStore";
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
  const { renameFile, removeFileRequest } = useFileStore();
  const isObjectTypeFolder = object_type === 'folder';
  const isObjectTypeFile = object_type === 'file';

  const isTrashRoute = location.pathname.startsWith(ROUTES.trash);

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

      await renameFolderRequest();
    }

    if (isObjectTypeFile) {
      await renameFile.request(object_id);
    }

    setOpenRenameDialog(false);
  };

  const handleDelete = async () => {
    if (isObjectTypeFolder) {
      if (isTrashRoute) {
        await removeFolderRequest(object_id);
      } else {
        await trashFolderRequest(object_id);
      }
    }

    if (isObjectTypeFile) {
      await removeFileRequest(object_id);
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
        <DialogTrigger className="p-2 hover:bg-red-500">
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
