import { useEffect } from 'react';

import FolderList from '@/components/folders/FolderList';

import { useFoldersStore } from '@/store/useFolderStore';

const Home = () => {
  const { folders, getFoldersList } = useFoldersStore();

  useEffect(() => {
    return () => {
      getFoldersList();
    }
  }, []);

  return (
    <>
      <FolderList folders={folders} />
    </>
  );
};

export default Home;
