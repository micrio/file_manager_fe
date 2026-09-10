import { useEffect, useState } from 'react';

import { File, FileX, Grid3x3, Image, List, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import { FOLDER_DEFAULT_PARAM } from '@/constants/apis';
import { ROUTES } from '@/constants/routes';

import { useFoldersStore } from '@/store/useFolderStore';
import { useFileStore } from '@/store/userFileStore';

import { IFileData, IFileUrlResponse } from '@/apis/file/fileInterface';
import FileView from '@/components/files/FileView';
import { useFileExtensionCheck } from '@/hooks/useFileExtensionCheck';

type ViewMode = 'list' | 'grid';

const Home = () => {
  const navigate = useNavigate();
  const { folders, getFoldersList } = useFoldersStore();
  const { files, getFileList } = useFileStore();
  const { isFileImage, isFileVideo, isFileDocument } = useFileExtensionCheck();

  const openFolder = (token: string) => {
    navigate(ROUTES.storageWithId, { state: { uniqueToken: token } });
  };

  const [fileView, setFileView] = useState<ViewMode>('list');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileExtension, setFileExtension] = useState('');
  const { getFileUrl } = useFileStore();

  useEffect(() => {
    getFoldersList(FOLDER_DEFAULT_PARAM);
  }, [getFoldersList]);

  useEffect(() => {
    getFileList();
  }, [getFileList]);

  const handleFileClick = async (uniqueToken: string) => {
    try {
      const result = await getFileUrl(uniqueToken) as IFileUrlResponse;
      setSourceUrl(result.data.file_url);
      setFileName(result.data.file_name);
      setFileExtension(result.data.file_extension);
      setPreviewOpen(true);
    } catch {
      /* preview error — leave placeholder */
    }
  };

  const openContent = (token: string) => handleFileClick(token);

  return (
    <div className="mx-6 my-6 space-y-6">
      {/* Suggested Folders — 6 items, grid */}
      {folders.length > 0 && (
        <section>
          <h2 className="text-base font-normal mb-3">Suggested Folders</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {folders.slice(0, 6).map(({ unique_token, path }) => (
              <div
                key={String(unique_token)}
                className="group flex flex-col items-center gap-1 rounded-lg border border-border bg-background p-3 hover:bg-secondary cursor-pointer transition-colors"
                onClick={() => openFolder(String(unique_token))}
              >
                <div className="w-6 h-6 text-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z" />
                  </svg>
                </div>
                <span className="text-sm truncate text-foreground text-center w-full">{path}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Suggested Files */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-normal">Suggested Files</span>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="outline"
              aria-label="List view"
              title="List view"
              onClick={() => setFileView('list')}
              className={fileView === 'list' ? 'bg-neutral-200 dark:bg-neutral-700' : ''}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              aria-label="Grid view"
              title="Grid view"
              onClick={() => setFileView('grid')}
              className={fileView === 'grid' ? 'bg-neutral-200 dark:bg-neutral-700' : ''}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {fileView === 'list' ? (
          <div className="border border-border rounded-lg divide-y divide-border bg-background">
            {files.map(({ unique_token, filename, file_extension, thumbnails }) => (
              <FileRow
                key={String(unique_token)}
                file={{ unique_token, filename, file_extension }}
                thumbnailSrc={thumbnails?.small}
                onClick={openContent}
                isFileImage={isFileImage}
                isFileVideo={isFileVideo}
                isFileDocument={isFileDocument}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {files.map(({ unique_token, filename, file_extension, created_at, thumbnails }) => (
              <GridFileRow
                key={String(unique_token)}
                file={{ unique_token, filename, file_extension }}
                created_at={created_at}
                thumbnailSrc={thumbnails?.medium}
                onClick={openContent}
                isFileImage={isFileImage}
                isFileVideo={isFileVideo}
                isFileDocument={isFileDocument}
              />
            ))}
          </div>
        )}
      </section>

      {/* File preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <FileView
            sourceUrl={sourceUrl}
            fileExtension={fileExtension}
            fileName={fileName}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ---------- Sub-components ---------- */

const FileRow = ({
  file,
  thumbnailSrc,
  onClick,
  isFileImage,
  isFileVideo,
  isFileDocument,
}: {
  file: Pick<IFileData, 'unique_token' | 'filename' | 'file_extension'>;
  thumbnailSrc?: string;
  onClick: (token: string) => void;
  isFileImage: (ext: string) => boolean | undefined;
  isFileVideo: (ext: string) => boolean | undefined;
  isFileDocument: (ext: string) => boolean | undefined;
}) => {
  const ext = String(file.file_extension ?? '');

  const FileIcon = () => {
    if (isFileImage(ext)) return <Image className="w-4 h-4 text-foreground" />;
    if (isFileVideo(ext)) return <Video className="w-4 h-4 text-foreground" />;
    if (isFileDocument(ext)) return <File className="w-4 h-4 text-foreground" />;
    return <FileX className="w-4 h-4 text-foreground" />;
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-secondary cursor-pointer transition-colors"
      onClick={() => onClick(String(file.unique_token))}
    >
      {thumbnailSrc ? (
        <img
          src={thumbnailSrc}
          alt=""
          className="h-10 w-10 flex-shrink-0 rounded object-cover"
        />
      ) : (
        <FileIcon />
      )}
      <Label className="text-sm text-foreground truncate flex-grow">
        {file.filename}.{file.file_extension}
      </Label>
    </div>
  );
};

const GridFileRow = ({
  file,
  created_at,
  thumbnailSrc,
  onClick,
  isFileImage,
  isFileVideo,
  isFileDocument,
}: {
  file: Pick<IFileData, 'unique_token' | 'filename' | 'file_extension'>;
  created_at: string | null;
  thumbnailSrc?: string;
  onClick: (token: string) => void;
  isFileImage: (ext: string) => boolean | undefined;
  isFileVideo: (ext: string) => boolean | undefined;
  isFileDocument: (ext: string) => boolean | undefined;
}) => {
  const ext = String(file.file_extension ?? '');

  const FileIcon = () => {
    if (isFileImage(ext)) return <Image className="w-8 h-8 text-foreground mx-auto" />;
    if (isFileVideo(ext)) return <Video className="w-8 h-8 text-foreground mx-auto" />;
    if (isFileDocument(ext)) return <File className="w-8 h-8 text-foreground mx-auto" />;
    return <FileX className="w-8 h-8 text-foreground mx-auto" />;
  };

  return (
    <div
      className="group flex flex-col gap-2 rounded-lg border border-border bg-background p-3 hover:bg-secondary cursor-pointer transition-colors"
      onClick={() => onClick(String(file.unique_token))}
    >
      <div className="flex items-center justify-center py-3">
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt=""
            className="h-16 w-16 object-cover rounded"
          />
        ) : (
          <FileIcon />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground truncate text-center">
          {file.filename}.{file.file_extension}
        </span>
        {created_at && (
          <span className="text-xs text-muted-foreground text-center">
            {new Date(created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
    </div>
  );
};

export default Home;
