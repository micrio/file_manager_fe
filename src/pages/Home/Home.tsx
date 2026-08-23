import { useEffect } from 'react';

import FolderList from '@/components/folders/FolderList';

import { useFoldersStore } from '@/store/useFolderStore';
import { FOLDER_DEFAULT_PARAM } from '@/constants/apis';

const Home = () => {
  const { folders, getFoldersList } = useFoldersStore();

  useEffect(() => {
    getFoldersList(FOLDER_DEFAULT_PARAM);
  }, [getFoldersList]);

  return (
    <>
      <FolderList folders={folders} />
    </>
  );
};

export default Home;
