import { create } from 'zustand';
import { AxiosResponse } from 'axios';

import { useAuthStore } from './useAuthStore';

import { IFileData, IFileListResponse, IFileUrlResponse } from '@/apis/file/fileInterface';
import {
  FILES_BASE_API,
  FILES_GET_URL_API,
  FILE_TRASH_FILE_API,
  FILE_REMOVE_FILE_API,
  FILE_RENAME_API,
} from '@/constants/apis';

export interface ICreatedFileSocketData {
  action: string;
  data: [
    {
      id: number | null;
      unique_token: string | null;
      name: string | null;
      filename: string | null;
      file_extension: string | null;
      folder_id: number | null;
      created_at: string;
    }
  ];
}

export interface IRenamedFileSocketData {
  action: string;
  data: [
    {
      id: number | null;
      unique_token: string | null;
      name: string | null;
      filename: string | null;
      file_extension: string | null;
      folder_id: number | null;
      created_at: string;
    }
  ];
}

export interface IRemovedFileSocketData {
  action: string;
  data: [
    {
      id: number | null;
      unique_token: string | null;
      name: string | null;
      filename: string | null;
      file_extension: string | null;
      folder_id: number | null;
      created_at: string;
    }
  ];
}

interface IFile {
  files: IFileData[];
  getFileList: (uniqueToken?: string) => void;
  getFileUrl: (uniqueToken: string) => Promise<IFileUrlResponse>;
  addFileToFileList: (data: unknown) => void;
  uploadFile: {
    folderUniqueToken: string | null;
    setFolderUniqueToken: (uniqueToken: string | null) => void;
    request: (files: FileList) => void;
  };
  renameFile: {
    newPathName: string | null;
    folderUniqueToken: string | null;
    setNewPathName: (newPath: string) => void;
    request: (file_token: string) => void;
  };
  updateFileName: (data: unknown) => void;
  removeFilePath: (data: unknown) => void;
  trashFileRequest: (uniqueToken: string) => void,
  removeFileRequest: (uniqueToken: string) => void,
}

export const useFileStore = create<IFile>((set, getState) => {
  const initialState = {
    files: [],
    getFileList: () => null,
    getFileUrl: async () => ({} as IFileUrlResponse),
    addFileToFileList: () => null,
    uploadFile: {
      folderUniqueToken: '',
      setFolderUniqueToken: () => null,
      request: () => null,
    },
    renameFile: {
      newPathName: '',
      folderUniqueToken: '',
      setNewPathName: () => null,
      request: () => null,
    },
    updateFileName: () => null,
    removeFileRequest: () => null,
    removeFilePath: () => null
  };

  return {
    ...initialState,

    getFileList: async (uniqueToken?: string) => {
      const url = !uniqueToken
        ? FILES_BASE_API
        : FILES_BASE_API + `?folder_unique_token=${uniqueToken}`;

      await useAuthStore.getState().api.getRequest(url);

      const response = useAuthStore.getState().api.data as AxiosResponse;
      const responseData = response.data as IFileListResponse;
      const files = responseData?.data ?? [];

      set((state) => ({
        ...state,
        files: files,
      }));
    },

    getFileUrl: async (uniqueToken: string) => {
      const url = !uniqueToken
        ? FILES_GET_URL_API
        : FILES_GET_URL_API + `?unique_token=${uniqueToken}`;

      await useAuthStore.getState().api.getRequest(url);

      const response = useAuthStore.getState().api.data as AxiosResponse;
      const responseData = response.data as IFileUrlResponse;

      return responseData;
    },

    addFileToFileList: (data: unknown) => {
      const responseData = data as ICreatedFileSocketData;

      set((state) => ({
        ...state,
        files: [responseData?.data[0], ...state.files],
      }));
    },

    uploadFile: {
      ...initialState.uploadFile,
      setFolderUniqueToken: (token: string | null) =>
        set((state) => ({
          ...state,
          uploadFile: {
            ...state.uploadFile,
            folderUniqueToken: token,
          },
        })),

      request: async (files: FileList) => {
        const formData = new FormData();
        const headerOptions = {
          'Content-Type': 'multipart/form-data',
        };
        const folderToken = getState().uploadFile.folderUniqueToken;

        if (folderToken) {
          formData.append('file_upload[folder_unique_token]', folderToken);
        }

        formData.append('file_upload[file]', files[0]);

        useAuthStore
          .getState()
          .api.postRequest(FILES_BASE_API, formData, headerOptions);
      },
    },

    renameFile: {
      ...initialState.renameFile,
      setNewPathName: (newPathName: string) => {
        set((state) => ({
          ...state,
          renameFile: {
            ...state.renameFile,
            newPathName: newPathName,
          },
        }));
      },

      setFolderUniqueToken: (token: string | null) => {
        set((state) => ({
          ...state,
          renameFile: {
            ...state.renameFile,
            folderUniqueToken: token,
          },
        }));
      },

      request: async (file_token: string) => {
        const folderToken = getState().renameFile.folderUniqueToken;
        const bodyData = {
          file_upload: {
            unique_token: file_token,
            name: getState().renameFile.newPathName,
          },
        };

        if (folderToken !== null) {
          const folderUniqueToken = {
            folder_unique_token: folderToken,
          };

          Object.assign(bodyData, folderUniqueToken);
        }

        useAuthStore.getState().api.putRequest(FILE_RENAME_API, bodyData);
      },
    },

    updateFileName: async (data: unknown) => {
      const responseData = data as IRenamedFileSocketData;

      set((state) => ({
        ...state,
        files: state.files.map((obj) => {
          const data = responseData?.data[0];
          if (obj.unique_token === data.unique_token) {
            obj.filename = data.filename;
            return obj;
          }

          return obj;
        }),
      }));
    },

    trashFileRequest: async (uniqueToken: string) => {
      const url = FILE_TRASH_FILE_API + "?unique_token=" + uniqueToken;

      await useAuthStore.getState().api.deleteRequest(url);
    },

    removeFileRequest: async (uniqueToken: string) => {
      const url = FILE_REMOVE_FILE_API + "?unique_token=" + uniqueToken;

      await useAuthStore.getState().api.postRequest(url, { file_upload: { unique_token: uniqueToken } });
    },

    removeFilePath: (data: unknown) => {
      const response = data as IRemovedFileSocketData;
      const responseData = response.data[0];

      set((state) => ({
        files: state.files.filter(
          (item) => item.unique_token !== responseData.unique_token
        ),
      }));
    }
  };
});
