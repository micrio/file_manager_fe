import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Folder, File, FileX, Image, Video, LucideMoreVertical } from 'lucide-react';

import FileView from '@/components/files/FileView';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
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

const FolderFileList = ({ items = [] }: IProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useAuthStore();
  const { getFileUrl } = useFileStore();
  const {
    renameFolder,
    updateFolderPath,
    removeFolderPath,
    updateFilePath,
    removeFileFromContents,
  } = useFoldersStore();
  const { isFileImage, isFileVideo, isFileDocument } = useFileExtensionCheck();
  const { receivedData } = useSocketStore();

  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileExtension, setFileExtension] = useState<string>('');

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

  const FileLogo = ({ file_extension }: FileLogoProp) => {
    const logoSize = '20px';
    const ext = String(file_extension);

    if (isFileImage(ext)) {
      return <Image size={logoSize} />;
    } else if (isFileVideo(ext)) {
      return <Video size={logoSize} />;
    } else if (isFileDocument(ext)) {
      return <File size={logoSize} />;
    } else {
      return <FileX size={logoSize} />;
    }
  };

  const handleFileClick = async (uniqueToken: string) => {
    const response = await getFileUrl(uniqueToken) as IFileUrlResponse;
    setSourceUrl(response.data.file_url);
    setFileName(response.data.file_name);
    setFileExtension(response.data.file_extension);
  };

  const handleFolderClick = (uniqueToken: string) => {
    navigate(ROUTES.storage + `/${uniqueToken}`, {
      state: { uniqueToken: uniqueToken },
    });
  };

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
        <div className="w-10"></div>
        <div className="flex-grow">Name</div>
        <div className="mr-12">Created At</div>
      </div>

      {/* Bordered Container */}
      <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-200 bg-white">
        <Dialog>
          {items.map((item) => {
            if (item.type === 'folder') {
              return (
                <div
                  className="group flex items-center gap-3 px-4 py-3 hover:bg-slate-100 cursor-pointer transition-colors"
                  key={item.unique_token}
                  onClick={() => handleFolderClick(String(item.unique_token))}
                >
                  <Folder className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <Label className="text-sm font-medium text-slate-700 flex-grow cursor-pointer select-none">
                    {item.path}
                  </Label>
                  <span className="text-xs text-slate-400 font-medium whitespace-nowrap mr-2">
                    {item.created_at}
                  </span>
                  <Popover>
                    <PopoverTrigger
                      asChild
                      onClick={(e) => {
                        e.stopPropagation();
                        renameFolder.setUniqueToken(String(item.unique_token));
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
                        object_id={String(item.unique_token)}
                        object_name={String(item.path)}
                        object_type="folder"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              );
            } else {
              return (
                <DialogTrigger key={item.unique_token} asChild className="w-full text-left">
                  <div
                    className="group flex items-center gap-3 px-4 py-3 hover:bg-slate-100 cursor-pointer transition-colors"
                    title="Preview file"
                    onClick={() => handleFileClick(String(item.unique_token))}
                  >
                    <div className="w-4 flex items-center justify-center flex-shrink-0 text-slate-500">
                      <FileLogo file_extension={item.file_extension} />
                    </div>
                    <Label className="text-sm font-medium text-slate-700 flex-grow cursor-pointer select-none">
                      {item.filename + '.' + item.file_extension}
                    </Label>
                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap mr-2">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    <Popover>
                      <PopoverTrigger
                        asChild
                        onClick={(e) => {
                          e.stopPropagation();
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
                        className="w-40 p-1 bg-white shadow-lg border rounded-lg z-10"
                      >
                        <DropdownOption
                          object_parent_id={id}
                          object_id={String(item.unique_token)}
                          object_name={String(item.filename)}
                          object_type="file"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </DialogTrigger>
              );
            }
          })}
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

export default FolderFileList;
