import { useEffect } from 'react';

import { useParams } from 'react-router-dom';

import { FOLDER_TRASHED_PARAM } from '@/constants/apis';

import { useFoldersStore } from '@/store/useFolderStore';

import FolderFileList from '@/components/folders/FolderFileList';

const Trash = () => {
  const { contents, getFoldersContent, contentSort, contentFilter } = useFoldersStore();
  const { id } = useParams();

  useEffect(() => {
    getFoldersContent(FOLDER_TRASHED_PARAM, id);
  }, [
    id,
    getFoldersContent,
    contentSort.sortBy,
    contentSort.direction,
    contentFilter.itemType,
  ]);

  return (
    <div className="mx-10">
      <FolderFileList items={contents} isTrash />
    </div>
  );
};

export default Trash;
