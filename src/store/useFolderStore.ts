import { AxiosError, AxiosResponse } from 'axios';
import { create } from 'zustand';

import {
  FOLDERS_BASE_API,
  FOLDERS_CONTENT_API,
  FOLDERS_MOVE_FOLDER_API,
  FOLDERS_REMOVE_FOLDER_API,
  FOLDERS_RENAME_API,
  FOLDERS_TRASH_FOLDER_API,
  FOLDERS_ZIP_API,
} from '@/constants/apis';

import { IFileData } from '@/apis/file/fileInterface';
import { IFolderContentData,IFolderData } from '@/apis/folder/folderInterface';

import { useAuthStore } from './useAuthStore';
import type { FileSocketData } from './userFileStore';

export type MutationResult = {
  ok: boolean;
  data?: unknown;
  message?: string;
};

type ResponseEnvelope = {
  success?: boolean;
  data?: unknown;
  meta?: { error?: unknown; message?: unknown };
  error?: unknown;
  message?: unknown;
};

// Errors from the API are not always strings: Rails validation failures arrive
// as `error: [{ field: "message" }]`. Rendering that directly into a toast or
// `<p>{error}</p>` throws "Objects are not valid as a React child". Flatten any
// shape (string, array, object) into a single readable string.
function formatErrorMessage(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((entry) => formatErrorMessage(entry))
      .filter((entry): entry is string => Boolean(entry));
    return parts.length > 0 ? parts.join(', ') : undefined;
  }

  if (typeof value === 'object') {
    const parts = Object.values(value as Record<string, unknown>)
      .map((entry) => formatErrorMessage(entry))
      .filter((entry): entry is string => Boolean(entry));
    return parts.length > 0 ? parts.join(', ') : undefined;
  }

  return String(value);
}

function extractErrorMessage(err: AxiosError): string {
  const body = err.response?.data as ResponseEnvelope | undefined;

  return (
    formatErrorMessage(body?.meta?.error) ??
    formatErrorMessage(body?.meta?.message) ??
    formatErrorMessage(body?.error) ??
    formatErrorMessage(body?.message) ??
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
          formatErrorMessage(envelope.meta?.error) ??
          formatErrorMessage(envelope.meta?.message) ??
          formatErrorMessage(envelope.error) ??
          formatErrorMessage(envelope.message) ??
          'Something went wrong',
      };
    }

    return { ok: true, data: envelope?.data };
  });
}

const buildUrl = (
  base: string,
  uniqueToken?: string,
  type?: string,
  sortBy?: string,
  direction?: string,
) => {
  const params: string[] = [];

  if (uniqueToken !== undefined) {
    params.push(`unique_token=${uniqueToken}`);
  }

  if (type !== undefined) {
    params.push(`type=${type}`);
  }

  if (sortBy !== undefined) {
    params.push(`sort_by=${sortBy}`);
  }

  if (direction !== undefined) {
    params.push(`direction=${direction}`);
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
  getFoldersContent: (
    type: string,
    uniqueToken?: string,
    sortBy?: string,
    direction?: string,
  ) => Promise<MutationResult>;
  createFolder: {
    pathName: string | null;
    parentFolderToken: string | null;
    setPathName: (pathName: string) => void;
    setParentFolderToken: (parentFolderToken: string | null) => void;
  };
  createFolderRequest: () => Promise<MutationResult>;
  addSingleFolderToList: (data: FolderSocketData) => void;
  addSingleFileToList: (data: FileSocketData) => void;
  addFilesToList: (files: IFileData[]) => void;
  updateFilePath: (data: FileSocketData) => void;
  updateFileContentsName: (uniqueToken: string, newName: string) => void;
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
  moveFolder: {
    sourceFolderToken: string | null;
    targetFolderToken: string | null;
    setSourceFolderToken: (token: string) => void;
    setTargetFolderToken: (token: string) => void;
  };
  moveFolderRequest: () => Promise<MutationResult>;
  moveFolderPath: (data: FolderSocketData) => void;
  downloadFolderRequest: (
    folderToken: string,
    folderName: string,
  ) => Promise<void>;
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

    moveFolder: {
      sourceFolderToken: null,
      targetFolderToken: null,
      setSourceFolderToken: (sourceFolderToken: string) =>
        set((state) => ({
          ...state,
          moveFolder: { ...state.moveFolder, sourceFolderToken: sourceFolderToken },
        })),
      setTargetFolderToken: (targetFolderToken: string) =>
        set((state) => ({
          ...state,
          moveFolder: { ...state.moveFolder, targetFolderToken: targetFolderToken },
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
      uniqueToken?: string,
      sortBy?: string,
      direction?: string,
    ): Promise<MutationResult> => {
      const url = buildUrl(FOLDERS_CONTENT_API, uniqueToken, type, sortBy, direction);
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

    // Mirror of addSingleFolderToList for uploaded files: prepend the file(s) as
    // `type: 'file'` entries into `contents`, which Storage/Trash render. The
    // socket broadcast is the only mechanism that surfaces a new file, so
    // without this the uploaded files never appear in the list.
    addFilesToList: (files: IFileData[]) => {
      if (!files || files.length === 0) return;

      set((state) => {
        // The same files can arrive twice — once from the upload response and
        // once from the FILE_CREATED broadcast — so de-dupe by unique_token.
        const existing = new Set(state.contents.map((item) => item.unique_token));

        const newItems = files
          .filter((file) => !existing.has(file.unique_token ?? ''))
          .map(
            (file) =>
            ({
              ...file,
              id: file.id ?? 0,
              unique_token: file.unique_token ?? '',
              filename: file.filename ?? '',
              file_extension: file.file_extension ?? '',
              full_path: file.filename ?? '',
              type: 'file',
            } as IFolderContentData)
          );

        return { contents: newItems.concat(state.contents) };
      });
    },

    // Thin wrapper over addFilesToList for the single-file broadcast case.
    addSingleFileToList: (data: FileSocketData) => {
      const file = data?.data[0];

      getState().addFilesToList(file ? [file] : []);
    },

    updateFilePath: (data: FileSocketData) => {
      const file = data?.data[0];

      if (!file) return;

      // A file rename request sends the new base name in `name` (not `filename`),
      // but the list displays `filename`. Bridge the two: prefer the renamed
      // `name`, then `filename`, then whatever is already stored.
      //
      // Files are rendered as "not a folder", but they arrive with two shapes:
      // `type: 'file_upload'` straight from the API, and `type: 'file'` after
      // `addSingleFileToList`. Match on the folder discriminator, not one of
      // these two string variants, so the row updates regardless of which form
      // the stored entry uses.
      set((state) => ({
        contents: state.contents.map((item) =>
          item.type !== 'folder' && item.unique_token === file.unique_token
            ? {
              ...item,
              filename: file.name ?? file.filename ?? item.filename,
              full_path: file.name ?? file.filename ?? item.full_path,
            }
            : item
        ),
      }));
    },

    updateFileContentsName: (uniqueToken: string, newName: string) => {
      set((state) => ({
        contents: state.contents.map((item) =>
          item.type === 'file' && item.unique_token === uniqueToken
            ? { ...item, filename: newName }
            : item
        ),
      }));
    },

    removeFileFromContents: (data: FileSocketData) => {
      const file = data?.data[0];

      if (!file) return;

      set((state) => ({
        contents: state.contents.filter(
          // Keep everything that is not a file matching this token. A file can
          // be `type: 'file_upload'` (from the API) or `type: 'file'`; both are
          // "not a folder", so match on the folder discriminator rather than
          // one specific string.
          (item) =>
            !(item.type !== 'folder' && item.unique_token === file.unique_token)
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

    moveFolderRequest: async (): Promise<MutationResult> => {
      const bodyData = {
        folder: {
          unique_token: getState().moveFolder.sourceFolderToken,
          target_parent_unique_token: getState().moveFolder.targetFolderToken,
        },
      };

      return requestWithResult(
        useAuthStore.getState().api.putRequest(FOLDERS_MOVE_FOLDER_API, bodyData)
      );
    },

    moveFolderPath: (data: FolderSocketData) => {
      const item = data?.data[0];

      if (!item) return;

      // The moved folder is no longer a child of the folder currently being
      // viewed, so drop it from the visible lists — same as removeFolderPath.
      // This is the ActionCable path that keeps the UI in sync after a move.
      set((state) =>
        removeItemByToken(state.folders, state.contents, item.unique_token)
      );
    },

    downloadFolderRequest: async (
      folderToken: string,
      folderName: string,
    ): Promise<void> => {
      try {
        const url = `${FOLDERS_ZIP_API}?unique_token=${folderToken}`;
        const response = await useAuthStore.getState().api.getRequest(
          url,
          { responseType: 'blob' },
        );

        const contentDisposition = (response as AxiosResponse).headers?.['content-disposition'] || '';
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        const zipName = match?.[1] ?? `${folderName || 'folder'}.zip`;

        const urlObj = URL.createObjectURL((response as AxiosResponse).data as Blob);
        const link = document.createElement('a');
        link.href = urlObj;
        link.download = zipName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(urlObj);
      } catch (error) {
        const axiosError = error as AxiosError;
        const toastTitle = (axiosError.response?.status ?? 0) >= 400
          ? (axiosError.response?.data as { meta?: { error?: string } })?.meta?.error ?? 'Failed to download folder'
          : 'Failed to download folder';
        const toast = (window as unknown as { toast: (opts: { variant: string; title: string }) => void }).toast;
        toast?.({ variant: 'destructive', title: toastTitle });
      }
    },
  };
});
