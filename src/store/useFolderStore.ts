import { create } from 'zustand';
import { AxiosError, AxiosResponse } from 'axios';

import { useAuthStore } from './useAuthStore';
import type { FileSocketData } from './userFileStore';
import { IFolderData, IFolderContentData } from '@/apis/folder/folderInterface';
import {
  FOLDERS_BASE_API,
  FOLDERS_CONTENT_API,
  FOLDERS_REMOVE_FOLDER_API,
  FOLDERS_RENAME_API,
  FOLDERS_TRASH_FOLDER_API,
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

const buildUrl = (base: string, uniqueToken?: string, type?: string) => {
  const params: string[] = [];

  if (uniqueToken !== undefined) {
    params.push(`unique_token=${uniqueToken}`);
  }

  if (type !== undefined) {
    params.push(`type=${type}`);
  }

  return params.length > 0 ? `${base}?${params.join('&')}` : base;
};

const removeItemByToken = (
  folders: IFolderData[],
  contents: IFolderContentData[],
  token: string
) => ({
  folders: folders.filter((item) => item.unique_token !== token),
  contents: contents.filter((item) => item.unique_token !== token),
});

export interface FolderSocketData {
  action: string;
  data: Array<{
    id: number;
    unique_token: string;
    path: string;
    parent_folder_id: number;
    created_at: string;
  }>;
}

interface IFolder {
  folders: IFolderData[];
  contents: IFolderContentData[];
  getFoldersList: (type: string, uniqueToken?: string) => Promise<MutationResult>;
  getFoldersContent: (type: string, uniqueToken?: string) => Promise<MutationResult>;
  createFolder: {
    pathName: string | null;
    parentFolderToken: string | null;
    setPathName: (pathName: string) => void;
    setParentFolderToken: (parentFolderToken: string | null) => void;
  };
  createFolderRequest: () => Promise<MutationResult>;
  addSingleFolderToList: (data: FolderSocketData) => void;
  addSingleFileToList: (data: FileSocketData) => void;
  updateFilePath: (data: FileSocketData) => void;
  removeFileFromContents: (data: FileSocketData) => void;
  renameFolder: {
    uniqueToken: string | null;
    newPathName: string | null;
    setNewPathName: (newPath: string) => void;
    setUniqueToken: (uniqueToken: string) => void;
  };
  renameFolderRequest: () => Promise<MutationResult>;
  updateFolderPath: (data: FolderSocketData) => void;
  trashFolderRequest: (uniqueToken: string) => Promise<MutationResult>;
  trashFolderPath: (data: FolderSocketData) => void;
  removeFolderRequest: (uniqueToken: string) => Promise<MutationResult>;
  removeFolderPath: (data: FolderSocketData) => void;
}

export const useFoldersStore = create<IFolder>((set, getState) => {
  return {
    folders: [],
    contents: [],

    createFolder: {
      pathName: '',
      parentFolderToken: null,
      setPathName: (pathName: string) =>
        set((state) => ({
          ...state,
          createFolder: { ...state.createFolder, pathName: pathName },
        })),
      setParentFolderToken: (parentFolderToken: string | null) =>
        set((state) => ({
          ...state,
          createFolder: {
            ...state.createFolder,
            parentFolderToken: parentFolderToken,
          },
        })),
    },

    renameFolder: {
      uniqueToken: null,
      newPathName: null,
      setUniqueToken: (uniqueToken: string) =>
        set((state) => ({
          ...state,
          renameFolder: { ...state.renameFolder, uniqueToken: uniqueToken },
        })),
      setNewPathName: (newPathName: string) =>
        set((state) => ({
          ...state,
          renameFolder: { ...state.renameFolder, newPathName: newPathName },
        })),
    },

    getFoldersList: async (type: string, uniqueToken?: string): Promise<MutationResult> => {
      const url = buildUrl(FOLDERS_BASE_API, uniqueToken, type);
      const result = await requestWithResult(
        useAuthStore.getState().api.getRequest(url)
      );

      if (result.ok) {
        set((state) => ({
          ...state,
          folders: (result.data as IFolderData[]) ?? [],
        }));
      }

      return result;
    },

    getFoldersContent: async (
      type: string,
      uniqueToken?: string
    ): Promise<MutationResult> => {
      const url = buildUrl(FOLDERS_CONTENT_API, uniqueToken, type);
      const result = await requestWithResult(
        useAuthStore.getState().api.getRequest(url)
      );

      if (result.ok) {
        set((state) => ({
          ...state,
          contents: (result.data as IFolderContentData[]) ?? [],
        }));
      }

      return result;
    },

    createFolderRequest: async (): Promise<MutationResult> => {
      const newData = {
        folder: {
          path: getState().createFolder.pathName + '/',
          parent_unique_token: getState().createFolder.parentFolderToken,
        },
      };

      return requestWithResult(
        useAuthStore.getState().api.postRequest(FOLDERS_BASE_API, newData)
      );
    },

    addSingleFolderToList: (data: FolderSocketData) => {
      const folderItem = data?.data[0];

      if (!folderItem) return;

      set((state) => ({
        folders: [folderItem, ...state.folders],
        contents: [
          {
            ...folderItem,
            full_path: folderItem.path ? `${folderItem.path}/` : null,
            type: 'folder',
          } as IFolderContentData,
          ...state.contents,
        ],
      }));
    },

    // Mirror of addSingleFolderToList for uploaded files: prepend the file as a
    // `type: 'file'` entry into `contents`, which Storage/Trash render. The
    // folder socket broadcast is the only mechanism that surfaces a new file, so
    // without this the uploaded file never appears in the list.
    addSingleFileToList: (data: FileSocketData) => {
      const file = data?.data[0];

      if (!file) return;

      set((state) => ({
        contents: [
          {
            ...file,
            id: file.id ?? 0,
            unique_token: file.unique_token ?? '',
            filename: file.filename ?? '',
            file_extension: file.file_extension ?? '',
            full_path: file.filename ?? '',
            type: 'file',
          } as IFolderContentData,
          ...state.contents,
        ],
      }));
    },

    updateFilePath: (data: FileSocketData) => {
      const file = data?.data[0];

      if (!file) return;

      set((state) => ({
        contents: state.contents.map((item) =>
          item.type === 'file' && item.unique_token === file.unique_token
            ? {
                ...item,
                filename: file.filename ?? item.filename,
                full_path: file.filename ?? item.full_path,
              }
            : item
        ),
      }));
    },

    removeFileFromContents: (data: FileSocketData) => {
      const file = data?.data[0];

      if (!file) return;

      set((state) => ({
        contents: state.contents.filter(
          (item) => item.type !== 'file' || item.unique_token !== file.unique_token
        ),
      }));
    },

    renameFolderRequest: async (): Promise<MutationResult> => {
      const bodyData = {
        folder: {
          unique_token: getState().renameFolder.uniqueToken,
          path: getState().renameFolder.newPathName + '/',
        },
      };

      return requestWithResult(
        useAuthStore.getState().api.putRequest(FOLDERS_RENAME_API, bodyData)
      );
    },

    updateFolderPath: (data: FolderSocketData) => {
      const updatedItem = data?.data[0];

      if (!updatedItem) return;

      set((state) => ({
        folders: state.folders.map((obj) =>
          obj.unique_token === updatedItem.unique_token
            ? { ...obj, path: updatedItem.path }
            : obj
        ),
        contents: state.contents.map((obj) =>
          obj.unique_token === updatedItem.unique_token
            ? ({ ...obj, path: updatedItem.path } as IFolderContentData)
            : obj
        ),
      }));
    },

    trashFolderRequest: async (uniqueToken: string): Promise<MutationResult> => {
      const url = buildUrl(FOLDERS_TRASH_FOLDER_API, uniqueToken);

      return requestWithResult(
        useAuthStore.getState().api.deleteRequest(url)
      );
    },

    trashFolderPath: (data: FolderSocketData) => {
      const item = data?.data[0];

      if (!item) return;

      set((state) =>
        removeItemByToken(state.folders, state.contents, item.unique_token)
      );
    },

    removeFolderRequest: async (uniqueToken: string): Promise<MutationResult> => {
      const url = buildUrl(FOLDERS_REMOVE_FOLDER_API, uniqueToken);

      return requestWithResult(
        useAuthStore.getState().api.deleteRequest(url)
      );
    },

    removeFolderPath: (data: FolderSocketData) => {
      const item = data?.data[0];

      if (!item) return;

      set((state) =>
        removeItemByToken(state.folders, state.contents, item.unique_token)
      );
    },
  };
});
