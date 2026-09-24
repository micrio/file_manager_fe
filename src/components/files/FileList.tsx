import { useEffect, useState } from 'react';

import { File, FileX, Image, LucideMoreVertical, Video } from 'lucide-react';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { FILE_MOVED, FILE_REMOVED, FILE_RENAMED } from '@/constants/socketActions';

import { FileSocketData, useFileStore } from '@/store/userFileStore';
import { useSocketStore } from '@/store/useSocketStore';
import { useUiStore } from '@/store/useUiStore';

import DropdownOption from '@/components/common/DropdownOption';

import { IFileData, IFileUrlResponse } from '@/apis/file/fileInterface';
import FileView from '@/components/files/FileView';
import { useCloseMenuOnOutsideClick } from '@/hooks/useCloseMenuOnOutsideClick';
import { useFileExtensionCheck } from '@/hooks/useFileExtensionCheck';

interface IProps {
  files: IFileData[];
}

interface FileLogoProp {
  file_extension: string | null;
}

const FileList = ({ files }: IProps) => {
  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileExtension, setFileExtension] = useState<string>('');
  const { getFileUrl, updateFileName, removeFilePath } = useFileStore();
  const { isFileImage, isFileVideo, isFileDocument } = useFileExtensionCheck();
  const { receivedData } = useSocketStore();
  const { openMenuId, setOpenMenuId } = useUiStore();
  useCloseMenuOnOutsideClick();

  useEffect(() => {
    const responseData = receivedData as unknown as FileSocketData;
    const isFileRenamedAction =
      responseData && responseData.action === FILE_RENAMED;

    const isFileMovedAction =
      responseData && responseData.action === FILE_MOVED;

    const isFileRemovedAction =
      responseData && responseData.action === FILE_REMOVED;

    if (isFileRenamedAction) {
      updateFileName(responseData);
    }

    if (isFileMovedAction || isFileRemovedAction) {
      // A moved file leaves the current folder, so drop it from the list the
      // same way a removed file is handled.
      removeFilePath(responseData);
    }
  }, [receivedData, updateFileName, removeFilePath]);

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
  }

  return (
    <>
      <Dialog>
        <DialogTrigger className="w-full">
          {files.map(
            ({ unique_token, filename, file_extension }: IFileData) => {
              return (
                <div
                  className="flex gap-5 px-2 py-3 hover:cursor-pointer hover:bg-black hover:bg-opacity-5"
                  key={unique_token}
                  title="Preview file"
                  onClick={() => handleFileClick(String(unique_token))}
                >
                  <FileLogo file_extension={file_extension} />
                  <Label className="text-md hover:cursor-pointer">
                    {filename + '.' + file_extension}
                  </Label>
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
                        setOpenMenuId(
                          openMenuId === String(unique_token)
                            ? null
                            : String(unique_token)
                        );
                      }}
                    >
                      <LucideMoreVertical
                        className="absolute right-16 mt-[-2px] hover:bg-black hover:bg-opacity-10"
                        size={'20px'}
                        width={'25px'}
                        height={'30px'}
                      />
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      side="left"
                      data-row-menu-content
                      className="w-fit m-0 p-0 bg-white border-2 border-black border-opacity-15 border-rounded z-10"
                    >
                      <DropdownOption
                        object_id={String(unique_token)}
                        object_name={String(filename)}
                        object_type="file"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              );
            }
          )}
        </DialogTrigger>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:w-[60vw] sm:max-w-[60vw]">
          <FileView
            sourceUrl={sourceUrl}
            fileExtension={fileExtension}
            fileName={fileName}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FileList;
