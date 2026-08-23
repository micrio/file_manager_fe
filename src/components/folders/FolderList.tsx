import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Label } from '../ui/label';
import { Folder, LucideMoreVertical } from 'lucide-react';

import { IFolderData } from '@/apis/folder/folderInterface';
import { ROUTES } from '@/constants/routes';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import DropdownOption from '../common/DropdownOption';

import { useAuthStore } from '@/store/useAuthStore';
import { IRenamedFolderSocketData, useFoldersStore } from '@/store/useFolderStore';
import { useSocketStore } from '@/store/useSocketStore';
import { FOLDER_REMOVED, FOLDER_RENAMED } from '@/constants/socketActions';
import { API_RESPONSE_CODE } from '@/constants/apiResponseCode';

interface IProps {
  folders: IFolderData[];
}

const FolderList = ({ folders }: IProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useAuthStore();
  const { renameFolder, updateFolderPath, removeFolderPath } = useFoldersStore();
  const { receivedData } = useSocketStore();

  const handleFolderClick = (uniqueToken: string) => {
    navigate(ROUTES.storage + `/${uniqueToken}`, {
      state: { uniqueToken: uniqueToken },
    });
  };

  useEffect(() => {
    const responseData = receivedData as IRenamedFolderSocketData;
    const isFolderRenamedAction =
      responseData && responseData.action === FOLDER_RENAMED;
    const isFolderRemovedAction =
      responseData && responseData.action === FOLDER_REMOVED;

    if (isFolderRenamedAction) {
      updateFolderPath(responseData);
    }

    if (isFolderRemovedAction) {
      removeFolderPath(responseData);
    }
  }, [
    receivedData,
    updateFolderPath,
    id,
    removeFolderPath,
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
        {folders.map(({ unique_token, path, created_at }: IFolderData) => (
          <div
            className="group flex items-center gap-3 px-4 py-3 hover:bg-slate-100 cursor-pointer transition-colors"
            key={unique_token}
            onClick={() => handleFolderClick(String(unique_token))}
          >
            <Folder className="w-4 h-4 text-slate-500 flex-shrink-0" />

            {/* Folder Path */}
            <Label className="text-sm font-medium text-slate-700 flex-grow cursor-pointer select-none">
              {path}
            </Label>

            {/* Created At Date */}
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap mr-2">
              {created_at}
            </span>

            {/* Popover */}
            <Popover>
              <PopoverTrigger
                asChild
                onClick={(e) => {
                  e.stopPropagation();
                  renameFolder.setUniqueToken(String(unique_token));
                }}
              >
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <LucideMoreVertical className="w-4 h-4 text-slate-500" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-40 p-1 bg-white shadow-lg border rounded-lg"
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
        ))}
      </div>
    </div>
  );
};

export default FolderList;
