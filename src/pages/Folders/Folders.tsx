import { useState } from 'react';
import { useEffect } from 'react';

import { useParams } from 'react-router-dom';

import { FOLDER_TRASHED_PARAM } from '@/constants/apis';

import { useFoldersStore } from '@/store/useFolderStore';
import { useFileStore } from '@/store/userFileStore';

import { IFolderData } from '@/apis/folder/folderInterface';
import { IFileContentData } from '@/apis/folder/folderInterface';
import FileList from '@/components/files/FileList';
import FolderList from '@/components/folders/FolderList';
import MoveFileModal from '@/components/folders/MoveFileModal';

const Folders = () => {
  const { folders, getFoldersList } = useFoldersStore();
  const { files, getFileList } = useFileStore();
  const { id } = useParams();

  // File-to-folder move state (drag + drop from FolderList).
  const [moveFileModalOpen, setMoveFileModalOpen] = useState(false);
  const [movingFile, setMovingFile] = useState<IFileContentData | null>(null);
  const [movingFileTarget, setMovingFileTarget] = useState<IFolderData | null>(null);

  const handleFileToFolderDrop = (fileToken: string, targetFolder: IFolderData) => {
    const file = files.find((f) => f.unique_token === fileToken);
    if (!file) return;
    useFileStore.getState().moveFile.setSourceFileToken(fileToken);
    useFileStore.getState().moveFile.setTargetFolderToken(targetFolder.unique_token!);
    setMovingFile(file as unknown as IFileContentData);
    setMovingFileTarget({
      unique_token: targetFolder.unique_token,
      path: targetFolder.path,
      id: null,
      created_at: '',
      parentFolderId: null,
    });
    setMoveFileModalOpen(true);
  };

  useEffect(() => {
    getFoldersList(FOLDER_TRASHED_PARAM, id);
  }, [id, getFoldersList]);

  useEffect(() => {
    getFileList(id);
  }, [id, getFileList]);

  return (
    <div className="mx-10">
      <MoveFileModal
        open={moveFileModalOpen}
        onClose={() => {
          setMoveFileModalOpen(false);
          setMovingFile(null);
          setMovingFileTarget(null);
        }}
        sourceFile={movingFile}
        targetFolder={movingFileTarget}
      />
      <FolderList folders={folders} onFileToFolderDrop={handleFileToFolderDrop} isTrash />
      <FileList files={files} />
    </div>
  );
};

export default Folders;
