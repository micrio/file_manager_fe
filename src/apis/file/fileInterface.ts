export interface IFileData {
  id: number | null;
  unique_token: string | null;
  name: string | null;
  filename: string | null;
  file_extension: string | null;
  folder_id: number | null;
  created_at: string | null;
}

export interface IFileListResponse {
  data: IFileData[];
}

export interface IFileUrlResponse {
  data: {
    file_url: string;
    file_name: string;
    file_extension: string;
  }
}
