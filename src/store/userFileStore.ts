import { create } from 'zustand';
import { AxiosError, AxiosResponse } from 'axios';

import { useAuthStore } from './useAuthStore';
import { IFileData, IFileUrlResponse } from '@/apis/file/fileInterface';
import {
  FILES_BASE_API,
  FILES_GET_URL_API,
  FILE_TRASH_FILE_API,
  FILE_REMOVE_FILE_API,
  FILE_RENAME_API,
} from '@/constants/apis';

export type MutationResult = {
  ok: boolean;
  data?: unknown;
  message?: string;
};

type ResponseEnvelope = {
  success?: boolean;
  data?: unknown;
  meta?: { error?: string; message?: string };
};

function extractErrorMessage(err: AxiosError): string {
  const body = err.response?.data as
    | {
        meta?: { error?: string; message?: string };
        error?: string;
        message?: string;
      }
    | undefined;

  return (
    body?.meta?.error ??
    body?.meta?.message ??
    body?.error ??
    body?.message ??
    'Something went wrong'
  );
}

function requestWithResult(promise: Promise<unknown>): Promise<MutationResult> {
  return promise.then((response) => {
    const result = response as AxiosResponse | AxiosError;

    if (result instanceof AxiosError) {
      return { ok: false, message: extractErrorMessage(result) };
    }

    const envelope = result.data as ResponseEnvelope | undefined;

    if (envelope?.success === false) {
      return {
        ok: false,
        message:
          envelope.meta?.error ?? envelope.meta?.message ?? 'Something went wrong',
      };
    }

    return { ok: true, data: envelope?.data };
  });
}

export interface FileSocketData {
  action: string;
  data: Array<{
    id: number | null;
    unique_token: string | null;
    name: string | null;
    filename: string | null;
    file_extension: string | null;
    folder_id: number | null;
    created_at: string;
  }>;
}

interface IFile {
  files: IFileData[];
  getFileList: (uniqueToken?: string) => Promise<MutationResult>;
  getFileUrl: (uniqueToken: string) => Promise<IFileUrlResponse>;
  uploadFile: {
    folderUniqueToken: string | null;
    setFolderUniqueToken: (uniqueToken: string | null) => void;
    request: (files: FileList, folderUniqueToken?: string | null) => Promise<MutationResult>;
  };
  renameFile: {
    folderUniqueToken: string | null;
    newPathName: string | null;
    setFolderUniqueToken: (uniqueToken: string | null) => void;
    setNewPathName: (newPath: string) => void;
    request: (file_token: string) => Promise<MutationResult>;
  };
  updateFileName: (data: FileSocketData) => void;
  updateFileListName: (uniqueToken: string, newName: string) => void;
  trashFileRequest: (uniqueToken: string) => Promise<MutationResult>;
  removeFileRequest: (uniqueToken: string) => Promise<MutationResult>;
  removeFilePath: (data: FileSocketData) => void;
}

export const useFileStore = create<IFile>((set, getState) => {
  return {
    files: [],

    uploadFile: {
      folderUniqueToken: '',
      setFolderUniqueToken: (uniqueToken: string | null) =>
        set((state) => ({
          ...state,
          uploadFile: { ...state.uploadFile, folderUniqueToken: uniqueToken },
        })),

      request: async (
        files: FileList,
        folderUniqueToken: string | null | undefined = undefined,
      ): Promise<MutationResult> => {
        const formData = new FormData();
        const headerOptions = {
          'Content-Type': 'multipart/form-data',
        };
        // An explicit token (e.g. from a drag-and-drop in a specific folder)
        // wins; otherwise fall back to the store's synced token.
        const folderToken =
          folderUniqueToken === undefined
            ? getState().uploadFile.folderUniqueToken
            : folderUniqueToken;

        if (folderToken) {
          formData.append('file_upload[folder_unique_token]', folderToken);
        }

        for (let index = 0; index < files.length; index++) {
          formData.append('file_upload[file]', files[index]);
        }

        return requestWithResult(
          useAuthStore.getState().api.postRequest(FILES_BASE_API, formData, headerOptions)
        );
      },
    },

    renameFile: {
      folderUniqueToken: '',
      newPathName: '',
      setFolderUniqueToken: (uniqueToken: string | null) =>
        set((state) => ({
          ...state,
          renameFile: { ...state.renameFile, folderUniqueToken: uniqueToken },
        })),

      setNewPathName: (newPathName: string) =>
        set((state) => ({
          ...state,
          renameFile: { ...state.renameFile, newPathName: newPathName },
        })),

      request: async (file_token: string): Promise<MutationResult> => {
        const folderToken = getState().renameFile.folderUniqueToken;
        const bodyData = {
          file_upload: {
            unique_token: file_token,
            name: getState().renameFile.newPathName,
          },
        };

        if (folderToken !== null) {
          Object.assign(bodyData, { folder_unique_token: folderToken });
        }

        return requestWithResult(
          useAuthStore.getState().api.putRequest(FILE_RENAME_API, bodyData)
        );
      },
    },

    getFileList: async (uniqueToken?: string): Promise<MutationResult> => {
      const url = uniqueToken
        ? `${FILES_BASE_API}?folder_unique_token=${uniqueToken}`
        : FILES_BASE_API;

      const result = await requestWithResult(
        useAuthStore.getState().api.getRequest(url)
      );

      if (result.ok) {
        set((state) => ({
          ...state,
          files: (result.data as IFileData[]) ?? [],
        }));
      }

      return result;
    },

    getFileUrl: async (uniqueToken: string): Promise<IFileUrlResponse> => {
      const url = uniqueToken
        ? `${FILES_GET_URL_API}?unique_token=${uniqueToken}`
        : FILES_GET_URL_API;

      const result = await requestWithResult(
        useAuthStore.getState().api.getRequest(url)
      );

      return result.ok
        ? { data: result.data as IFileUrlResponse['data'] }
        : { data: { file_url: '', file_name: '', file_extension: '' } };
    },

    updateFileName: (data: FileSocketData) => {
      const item = data?.data[0];

      if (!item) return;

      // Same bridge as updateFilePath: the rename request carries the new base
      // name in `name`, but the list displays `filename`.
      set((state) => ({
        files: state.files.map((obj) =>
          obj.unique_token === item.unique_token
            ? {
                ...obj,
                name: item.name,
                filename: item.name ?? item.filename ?? obj.filename,
              }
            : obj
        ),
      }));
    },

    updateFileListName: (uniqueToken: string, newName: string) => {
      set((state) => ({
        files: state.files.map((obj) =>
          obj.unique_token === uniqueToken
            ? { ...obj, name: newName, filename: newName }
            : obj
        ),
      }));
    },

    trashFileRequest: async (uniqueToken: string): Promise<MutationResult> => {
      return requestWithResult(
        useAuthStore.getState().api.deleteRequest(
          `${FILE_TRASH_FILE_API}?unique_token=${uniqueToken}`
        )
      );
    },

    removeFileRequest: async (uniqueToken: string): Promise<MutationResult> => {
      return requestWithResult(
        useAuthStore.getState().api.postRequest(
          FILE_REMOVE_FILE_API,
          { file_upload: { unique_token: uniqueToken } }
        )
      );
    },

    removeFilePath: (data: FileSocketData) => {
      const item = data?.data[0];

      if (!item) return;

      set((state) => ({
        files: state.files.filter((file) => file.unique_token !== item.unique_token),
      }));
    },
  };
});
