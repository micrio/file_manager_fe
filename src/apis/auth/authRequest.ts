import { AxiosRequestConfig } from 'axios';

import { REFRESH_TOKEN_API,SIGNIN_API, SIGNUP_API } from '@/constants/apis';

import { ISigninRequest, ISignupRequest } from '@/apis/auth/authInterface';
import axiosConfig from '@/apis/axiosConfig';

export const signinRequest = async ({ data }: ISigninRequest) => {
  return await axiosConfig.post(SIGNIN_API, data);
};

export const signupRequest = async (data: ISignupRequest) => {
  return await axiosConfig.post(SIGNUP_API, data);
};

export const refreshTokenRequest = async (options?: AxiosRequestConfig) => {
  return await axiosConfig.post(REFRESH_TOKEN_API, {}, options);
};
