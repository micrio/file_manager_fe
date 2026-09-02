import { useEffect, useState } from 'react';

import { File, FileX, Image, LucideMoreVertical, Video } from 'lucide-react';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { FILE_REMOVED, FILE_RENAMED } from '@/constants/socketActions';

import { FileSocketData, useFileStore } from '@/store/userFileStore';
import { useSocketStore } from '@/store/useSocketStore';

import DropdownOption from '@/components/common/DropdownOption';

import { IFileData, IFileUrlResponse } from '@/apis/file/fileInterface';
import FileView from '@/components/files/FileView';
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

  useEffect(() => {
    const responseData = receivedData as unknown as FileSocketData;
    const isFileRenamedAction =
      responseData && responseData.action === FILE_RENAMED;

    const isFileRemovedAction =
      responseData && responseData.action === FILE_REMOVED;

    if (isFileRenamedAction) {
      updateFileName(responseData);
    }

    if (isFileRemovedAction) {
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
                  <Popover>
                    <PopoverTrigger
                      asChild
                      onClick={(e) => {
                        e.stopPropagation();
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
                      className="w-full m-0 p-0 bg-white border-2 border-black border-opacity-15 border-rounded z-10"
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
        <DialogContent>
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
