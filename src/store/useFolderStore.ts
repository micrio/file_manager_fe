import { create } from 'zustand';
import { AxiosResponse } from 'axios';

import { useAuthStore } from './useAuthStore';
import {
  IFolderData,
  IFolderContentData,
  IFolderListResponse,
  IFolderContentResponse
} from '@/apis/folder/folderInterface';
import {
  FOLDERS_BASE_API,
  FOLDERS_CONTENT_API,
  FOLDERS_REMOVE_FOLDER_API,
  FOLDERS_RENAME_API,
  FOLDERS_TRASH_FOLDER_API,
} from '@/constants/apis';

interface IFolder {
  folders: IFolderData[];
  contents: IFolderContentData[];
  getFoldersList: (type: string, uniqueToken?: string) => void;
  getFoldersContent: (type: string, uniqueToken?: string) => void;
  createFolder: {
    pathName: string | null;
    parentFolderToken: string | null;
    setPathName: (pathName: string) => void;
    setParentFolderToken: (parentFolderToken: string | null) => void;
  };
  createFolderRequest: () => void;
  addSingleFolderToList: (data: unknown) => void;
  renameFolder: {
    uniqueToken: string | null;
    newPathName: string | null;
    setNewPathName: (newPath: string) => void;
    setUniqueToken: (uniqueToken: string) => void;
  };
  renameFolderRequest: () => void;
  updateFolderPath: (data: unknown) => void;
  trashFolderRequest: (uniqueToken: string) => void;
  trashFolderPath: (data: unknown) => void;
  removeFolderRequest: (uniqueToken: string) => void;
  removeFolderPath: (data: unknown) => void;
}

export interface ICreatedFolderSocketData {
  action: string;
  data: [
    {
      id: number;
      unique_token: string;
      path: string;
      parent_folder_id: number;
      created_at: string;
    }
  ];
}

export interface IRenamedFolderSocketData {
  action: string;
  data: [
    {
      id: number;
      unique_token: string;
      path: string;
      parent_folder_id: number;
      created_at: string;
    }
  ];
}


export interface ITrashedFolderSocketData {
  action: string;
  data: [
    {
      id: number;
      unique_token: string;
      path: string;
      parent_folder_id: number;
      created_at: string;
    }
  ];
}

export interface IRemovedFolderSocketData {
  action: string;
  data: [
    {
      id: number;
      unique_token: string;
      path: string;
      parent_folder_id: number;
      created_at: string;
    }
  ];
}

export const useFoldersStore = create<IFolder>((set, getState) => {
  const initialState = {
    folders: [],
    contents: [],
    getFolderList: () => null,
    getFoldersContent: () => null,
    createFolder: {
      pathName: '',
      uniqueToken: '',
      parentFolderToken: null,
      setPathName: (pathName: string) =>
        set((state) => ({
          ...state,
          createFolder: {
            ...state.createFolder,
            pathName: pathName,
          },
        })),
      setParentFolderToken: (parentFolderToken: string | null) =>
        set((state) => ({
          ...state,
          createFolder: {
            ...state.createFolder,
            parentFolderToken: parentFolderToken,
          },
        })),
      request: () => null,
    },
    createFolderRequest: () => null,
    addSingleFolderToList: () => null,
    renameFolder: {
      uniqueToken: null,
      newPathName: null,
      setUniqueToken: (uniqueToken: string) =>
        set((state) => ({
          ...state,
          renameFolder: {
            ...state.renameFolder,
            uniqueToken: uniqueToken,
          },
        })),
      setNewPathName: (newPathName: string) =>
        set((state) => ({
          ...state,
          renameFolder: {
            ...state.renameFolder,
            newPathName: newPathName,
          },
        })),
    },
    renameFolderRequest: () => null,
    updateFolderPath: () => null,
    trashFolderRequest: () => null,
    trashFolderPath: () => null,
    removeFolderRequest: () => null,
    removeFolderPath: () => null
  };

  return {
    ...initialState,
    getFoldersList: async (type: string, uniqueToken?: string) => {
      const url = !uniqueToken
        ? FOLDERS_BASE_API + `?type=${type}`
        : FOLDERS_BASE_API + `?unique_token=${uniqueToken}&type=${type}`;

      await useAuthStore.getState().api.getRequest(url);

      const response = useAuthStore.getState().api.data as AxiosResponse;
      const responseData = response.data as IFolderListResponse;
      const folders = responseData?.data ?? [];

      set((state) => ({
        ...state,
        folders: folders,
      }));
    },

    getFoldersContent: async (type: string, uniqueToken?: string) => {
      const url = !uniqueToken
        ? FOLDERS_CONTENT_API + `?type=${type}`
        : FOLDERS_CONTENT_API + `?unique_token=${uniqueToken}&type=${type}`;

      await useAuthStore.getState().api.getRequest(url);

      const response = useAuthStore.getState().api.data as AxiosResponse;
      const responseData = response.data as IFolderContentResponse;
      const contents = responseData?.data ?? [];

      set((state) => ({
        ...state,
        contents: contents,
      }));
    },

    createFolderRequest: async () => {
      const newData = {
        folder: {
          path: getState().createFolder.pathName + "/",
          parent_unique_token: getState().createFolder.parentFolderToken,
        },
      };

      await useAuthStore.getState().api.postRequest(FOLDERS_BASE_API, newData);
    },

    addSingleFolderToList(data: unknown) {
      const responseData = data as ICreatedFolderSocketData;
      const folderItem = responseData?.data[0];

      if (!folderItem) return;

      set((state) => ({
        ...state,
        folders: [folderItem, ...state.folders],
        contents: [
          {
            ...folderItem,
            full_path: folderItem.path ? folderItem.path + "/" : null,
            type: "folder",
          } as IFolderContentData,
          ...state.contents,
        ],
      }));
    },

    renameFolderRequest: async () => {
      const bodyData = {
        folder: {
          unique_token: getState().renameFolder.uniqueToken,
          path: getState().renameFolder.newPathName + "/",
        },
      };

      await useAuthStore
        .getState()
        .api.putRequest(FOLDERS_RENAME_API, bodyData);
    },

    updateFolderPath: async (data: unknown) => {
      const responseData = data as IRenamedFolderSocketData;
      const updatedItem = responseData?.data[0];

      if (!updatedItem) return;

      set((state) => ({
        ...state,
        folders: state.folders.map((obj) => {
          if (obj.unique_token === updatedItem.unique_token) {
            return {
              ...obj,
              path: updatedItem.path,
            };
          }

          return obj;
        }),
        contents: state.contents.map((obj) => {
          if (obj.unique_token === updatedItem.unique_token) {
            return {
              ...obj,
              path: updatedItem.path,
            } as IFolderContentData;
          }

          return obj;
        }),
      }));
    },

    trashFolderRequest: async (unique_token: string) => {
      const url = FOLDERS_TRASH_FOLDER_API + '?unique_token=' + unique_token;

      await useAuthStore.getState().api.deleteRequest(url);
    },

    trashFolderPath: (data: unknown) => {
      const response = data as IRemovedFolderSocketData;
      const responseData = response.data[0];

      set((state) => ({
        ...state,
        folders: state.folders.filter(
          (item) => item.unique_token !== responseData.unique_token
        ),
        contents: state.contents.filter(
          (item) => item.unique_token !== responseData.unique_token
        ),
      }));
    },

    removeFolderRequest: async (unique_token: string) => {
      const url = FOLDERS_REMOVE_FOLDER_API + '?unique_token=' + unique_token;

      await useAuthStore.getState().api.deleteRequest(url);
    },

    removeFolderPath: (data: unknown) => {
      const response = data as IRemovedFolderSocketData;
      const responseData = response.data[0];

      set((state) => ({
        ...state,
        folders: state.folders.filter(
          (item) => item.unique_token !== responseData.unique_token
        ),
        contents: state.contents.filter(
          (item) => item.unique_token !== responseData.unique_token
        ),
      }));
    }
  };
});
