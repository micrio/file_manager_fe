import { useEffect } from 'react';

import { useParams } from 'react-router-dom';

import { FOLDER_TRASHED_PARAM } from '@/constants/apis';

import { useFoldersStore } from '@/store/useFolderStore';
import { useFileStore } from '@/store/userFileStore';

import FileList from '@/components/files/FileList';
import FolderList from '@/components/folders/FolderList';

const Folders = () => {
  const { folders, getFoldersList } = useFoldersStore();
  const { files, getFileList } = useFileStore();
  const { id } = useParams();

  useEffect(() => {
    getFoldersList(FOLDER_TRASHED_PARAM, id);
  }, [id, getFoldersList]);

  useEffect(() => {
    getFileList(id);
  }, [id, getFileList]);

  return (
    <div className="mx-10">
      <FolderList folders={folders} />
      <FileList files={files} />
    </div>
  );
};

export default Folders;
