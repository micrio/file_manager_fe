export interface IFolderData {
  id: number | null;
  unique_token: string | null;
  path: string | null;
  parentFolderId?: number | null;
  parent_folder_id?: number | null;
  created_at?: string | null;
}

export interface IFileContentData {
  id: number;
  folder_id: number | null;
  unique_token: string;
  full_path: string;
  filename: string;
  file_extension: string;
  created_at: string;
  size?: number | null;
  type: "file_upload" | "file";
  thumbnails?: { small?: string; medium?: string } | null;
}

export interface IFolderContentItemData {
  id: number;
  unique_token: string;
  path: string;
  full_path: string | null;
  parent_folder_id: number | null;
  created_at: string;
  size?: number | null;
  type: "folder";
  thumbnails?: { small?: string; medium?: string } | null;
}

export type IFolderContentData = IFileContentData | IFolderContentItemData;

export interface IFolderListResponse {
  data: IFolderData[];
}

export interface IFolderContentResponse {
  data: IFolderContentData[];
}

export interface ICreateFolderParams {
  parentFolderId: null | number;
  pathName: null | string;
}
