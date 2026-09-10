import { AxiosRequestConfig } from 'axios';

import { FOLDERS_BASE_API } from '@/constants/apis';

import axiosConfig from '../axiosConfig';
import { ICreateFolderParams } from './folderInterface';

export const getFolderListRequest = async (options?: AxiosRequestConfig) => {
  return await axiosConfig.get(FOLDERS_BASE_API, options);
};

export const createFolderRequest = async (options?: AxiosRequestConfig, data?: ICreateFolderParams) => {
  return await axiosConfig.post(FOLDERS_BASE_API, data, options);
};
