import { AxiosError, AxiosResponse } from 'axios';
import { create } from 'zustand';

import {
  FILE_MOVE_FILE_API,
  FILE_REMOVE_FILE_API,
  FILE_RENAME_API,
  FILE_TRASH_FILE_API,
  FILES_BASE_API,
  FILES_GET_URL_API,
} from '@/constants/apis';
import { APP } from '@/constants/app';

import { IFileData, IFileUrlResponse } from '@/apis/file/fileInterface';
import { IFolderContentData } from '@/apis/folder/folderInterface';

import { useAuthStore } from './useAuthStore';

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
  contents: IFolderContentData[];
  getFileList: (uniqueToken?: string, sortBy?: string, direction?: string) => Promise<MutationResult>;
  getFileUrl: (uniqueToken: string) => Promise<IFileUrlResponse>;
  uploadFile: {
    folderUniqueToken: string | null;
    setFolderUniqueToken: (uniqueToken: string | null) => void;
    request: (
      files: FileList,
      folderUniqueToken?: string | null,
      onProgress?: (percent: number) => void,
    ) => Promise<MutationResult>;
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
  moveFile: {
    sourceFileToken: string | null;
    targetFolderToken: string | null;
    targetFolderName: string | null;
    setSourceFileToken: (token: string) => void;
    setTargetFolderToken: (token: string) => void;
    setTargetFolderName: (name: string) => void;
  };
  moveFileRequest: () => Promise<MutationResult>;
  updateFileContentsPath: (data: FileSocketData) => void;
  removeFileFromContents: (data: FileSocketData) => void;
}

export const useFileStore = create<IFile>((set, getState) => {
  return {
    files: [],
    contents: [],

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
        onProgress?: (percent: number) => void,
      ): Promise<MutationResult> => {
        const formData = new FormData();
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
          formData.append('file_upload[file][]', files[index]);
        }

        return requestWithResult(
          useAuthStore.getState().api.postRequest(FILES_BASE_API, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: APP.uploadTimeout,
            onUploadProgress: (event) => {
              if (!onProgress || !event.total) return;

              onProgress(Math.round((event.loaded * 100) / event.total));
            },
          })
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

    getFileList: async (
      uniqueToken?: string,
      sortBy?: string,
      direction?: string,
    ): Promise<MutationResult> => {
      const params: string[] = [];

      if (uniqueToken) {
        params.push(`folder_unique_token=${uniqueToken}`);
      }

      if (sortBy) {
        params.push(`sort_by=${sortBy}`);
      }

      if (direction) {
        params.push(`direction=${direction}`);
      }

      const url = params.length > 0
        ? `${FILES_BASE_API}?${params.join('&')}`
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
        useAuthStore.getState().api.deleteRequest(
          `${FILE_REMOVE_FILE_API}?unique_token=${uniqueToken}`
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

    moveFile: {
      sourceFileToken: null,
      targetFolderToken: null,
      targetFolderName: null,
      setSourceFileToken: (sourceFileToken: string) =>
        set((state) => ({
          ...state,
          moveFile: { ...state.moveFile, sourceFileToken: sourceFileToken },
        })),
      setTargetFolderToken: (targetFolderToken: string) =>
        set((state) => ({
          ...state,
          moveFile: { ...state.moveFile, targetFolderToken: targetFolderToken },
        })),
      setTargetFolderName: (targetFolderName: string) =>
        set((state) => ({
          ...state,
          moveFile: { ...state.moveFile, targetFolderName: targetFolderName },
        })),
    },

    moveFileRequest: async (): Promise<MutationResult> => {
      const sourceToken = getState().moveFile.sourceFileToken;
      const targetFolderToken = getState().moveFile.targetFolderToken;

      // `folder_unique_token` must live *inside* `file_upload` — the backend
      // reads it via params.require(:file_upload).permit(:folder_unique_token).
      // Sending it at the top level silently targets the root folder instead.
      const fileUpload: Record<string, unknown> = {
        unique_token: sourceToken,
      };

      if (targetFolderToken !== null) {
        fileUpload.folder_unique_token = targetFolderToken;
      }

      return requestWithResult(
        useAuthStore.getState().api.putRequest(FILE_MOVE_FILE_API, {
          file_upload: fileUpload,
        })
      );
    },

    updateFileContentsPath: (data: FileSocketData) => {
      const file = data?.data[0];

      if (!file) return;

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

    removeFileFromContents: (data: FileSocketData) => {
      const file = data?.data[0];

      if (!file) return;

      set((state) => ({
        contents: state.contents.filter(
          (item) =>
            !(item.type !== 'folder' && item.unique_token === file.unique_token)
        ),
      }));
    },
  };
});
