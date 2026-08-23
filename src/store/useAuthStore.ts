import { create } from 'zustand';
import { AxiosError, AxiosResponse } from 'axios';

import {
  IRefreshTokenResponse,
  ISigninErrorResponse,
  ISigninRequest,
  ISigninResponse,
  ISigninTokens,
  ISignupErrorResponse,
  ISignupErrorResponseData,
  ISignupRequest,
} from '@/apis/auth/authInterface';
import {
  signinRequest,
  signupRequest,
  refreshTokenRequest,
} from '@/apis/auth/authRequest';
import {
  getAuthTokenCookie,
  getAuthUserCookie,
  getRefreshTokenCookie,
  setAuthTokenCookie,
  setAuthUserCookie,
  setRefreshTokenCookie,
} from '@/lib/cookie';
import {
  SIGNIN_SUCCESS_RESPONSE_MESSAGE,
  SIGNUP_SUCCESS_RESPONSE_MESSAGE,
} from '@/constants/reponseMessage';
import axiosConfig from '@/apis/axiosConfig';
import { API_RESPONSE_CODE } from '@/constants/apiResponseCode';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

interface IAuth {
  loading: boolean;
  signingIn: boolean;
  setSigningIn: (signingIn: boolean) => void;
  enableLoader: boolean;
  setEnableLoader: (enable: boolean) => void;
  auth: {
    accessToken: string | null;
    refreshToken: string | null;
    getHeaderToken: () => { Authorization: string };
    isAuthenticated: () => boolean;
  };
  signin: {
    errorMessage: string;
    success: boolean;
    successMessage: string;
    initializeState: () => void;
    request: (nil: ISigninRequest) => void;
  };
  signup: {
    error: ISignupErrorResponseData;
    errorMessage: string;
    success: boolean;
    successMessage: string;
    initializeState: () => void;
    request: (nil: ISignupRequest) => void;
  };
  refreshToken: {
    request: () => void;
  };
  api: {
    data: unknown;
    status: string;
    error: unknown;
    message: string | null;
    errorMessage: string | null;
    getRequest: (path: string) => void;
    postRequest: (path: string, data?: unknown, options?: unknown) => void;
    putRequest: (path: string, data?: unknown, options?: unknown) => void;
    deleteRequest: (path: string, options?: unknown) => void;
  };
}

export const useAuthStore = create<IAuth>((set, getState) => {
  const auth = {
    accessToken: null as string | null,
    refreshToken: null as string | null,
    getHeaderToken: () => ({ Authorization: "" }),
    isAuthenticated: () => false,
  };

  const initialState: IAuth = {
    loading: false,
    enableLoader: false,
    setEnableLoader: () => null,
    signingIn: false,
    setSigningIn: () => null,
    auth: auth,
    signin: {
      success: false,
      successMessage: '',
      errorMessage: '',
      initializeState: () => null,
      request: () => null,
    },
    signup: {
      success: false,
      successMessage: '',
      error: {
        fname: '',
        lname: '',
        email: '',
        password: '',
      },
      errorMessage: '',
      initializeState: () => null,
      request: () => null,
    },
    refreshToken: {
      request: () => null,
    },
    api: {
      data: {},
      status: '',
      error: {},
      message: '',
      errorMessage: '',
      getRequest: () => null,
      postRequest: () => null,
      putRequest: () => null,
      deleteRequest: () => null,
    },
  };

  const handleCookie = (
    { email, fname, lname }: ISigninResponse,
    { token, refresh_token }: ISigninTokens
  ) => {
    const userData = {
      email: email,
      fname: fname,
      lname: lname,
    };

    setAuthTokenCookie(token);
    setRefreshTokenCookie(refresh_token);
    setAuthUserCookie(userData);
  };

  return {
    ...initialState,

    setEnableLoader: (enable: boolean) => {
      set((state) => ({
        ...state,
        enableLoader: enable
      }))
    },

    setSigningIn: (signingIn: boolean) => {
      set((state) => ({
        ...state,
        signingIn: signingIn
      }));
    },

    auth: {
      ...initialState.auth,
      getHeaderToken: () => {
        const token = getState().auth.accessToken || getAuthTokenCookie() || '';
        return {
          Authorization: token,
        };
      },

      isAuthenticated: () => {
        return Boolean(getAuthTokenCookie() && getAuthUserCookie());
      },
    },

    signin: {
      ...initialState.signin,
      initializeState: () => {
        set((state) => ({
          ...state,
          signin: {
            ...state.signin,
            ...initialState.signin,
          },
        }));
      },

      request: async (data: ISigninRequest) => {
        set({ loading: true });

        await signinRequest(data)
          .then((data: AxiosResponse) => {
            const response = data.data;
            const successData = response.data as ISigninResponse;
            const metaData = response.meta as ISigninTokens;
            const successMessage = SIGNIN_SUCCESS_RESPONSE_MESSAGE;

            handleCookie(successData, metaData);

            set((state) => ({
              ...state,
              auth: {
                ...state.auth,
                accessToken: metaData.token,
                refreshToken: metaData.refresh_token,
              },
              signin: {
                ...state.signin,
                success: true,
                successMessage: successMessage,
              },
              loading: false,
            }));
          })
          .catch((error: unknown) => {
            const response = error as AxiosError;
            const errorResponse = response.response
              ?.data as ISigninErrorResponse;
            const errorMessage = errorResponse?.error;

            set((state) => ({
              ...state,
              signin: { ...state.signin, errorMessage: errorMessage },
              loading: false,
            }));
          });
      },
    },

    signup: {
      ...initialState.signup,
      initializeState: () =>
        set((state) => ({
          ...state,
          signup: {
            ...state.signup,
            errorMessage: '',
            error: initialState.signup.error,
            success: false,
            successMessage: '',
          },
        })),

      request: async (data: ISignupRequest) => {
        set({ loading: true });

        await signupRequest(data)
          .then(() => {
            const successMessage = SIGNUP_SUCCESS_RESPONSE_MESSAGE;

            set((state) => ({
              ...state,
              signup: {
                ...state.signup,
                success: true,
                successMessage: successMessage,
              },
              loading: false,
            }));
          })
          .catch((error: unknown) => {
            const errorResponse = error as AxiosError;
            const signupError = errorResponse.response
              ?.data as ISignupErrorResponse;

            if (typeof signupError.error === 'string') {
              set((state) => ({
                ...state,
                signup: {
                  ...state.signup,
                  errorMessage: String(signupError.error),
                  loading: false,
                },
              }));
            } else {
              const errorData = signupError
                .error[0] as ISignupErrorResponseData;

              set((state) => ({
                ...state,
                signup: {
                  ...state.signup,
                  error: errorData,
                },
                loading: false,
              }));
            }
          });
      },
    },

    refreshToken: {
      ...initialState.refreshToken,
      request: async () => {
        const refreshHeader = {
          headers: {
            Authorization: `Bearer ${getState().auth.refreshToken ?? getRefreshTokenCookie()
              }`,
          },
        };

        await refreshTokenRequest(refreshHeader)
          .then((data: AxiosResponse) => {
            const response = data.data as IRefreshTokenResponse;
            const token = response.meta.token;

            setAuthTokenCookie(token);

            set((state) => ({
              ...state,
              auth: {
                ...state.auth,
                refreshToken: token,
              },
            }));
          })
          .catch(() => {
            const navigate = useNavigate();

            navigate(ROUTES.signin);
          });
      },
    },

    api: {
      ...initialState.api,
      getRequest: async (path: string) => {
        return await axiosConfig
          .get(path, { headers: getState().auth.getHeaderToken() })
          .then((data: AxiosResponse) => {
            set((state) => ({
              ...state,
              api: {
                ...state.api,
                data: data,
              },
            }));

            return data;
          })
          .catch((error: AxiosError) => {
            if (error.response?.status === API_RESPONSE_CODE.unauthorized) {
              getState().refreshToken.request();
            } else {
              set((state) => ({
                ...state,
                api: {
                  ...state.api,
                  status: error.request.status,
                  error: error,
                },
              }));

              return error;
            }
          });
      },

      postRequest: async (path: string, data?: unknown, options?: unknown) => {
        const headers = getState().auth.getHeaderToken();

        options && Object.assign(headers, options);

        return await axiosConfig
          .post(path, data, { headers: headers })
          .then((data: AxiosResponse) => {
            return data;
          })
          .catch((error: AxiosError) => {
            return error;
          });
      },

      putRequest: async (path: string, data?: unknown, options?: unknown) => {
        const headers = getState().auth.getHeaderToken();

        options && Object.assign(headers, options);

        return await axiosConfig
          .put(path, data, { headers: headers })
          .then((data: AxiosResponse) => {
            return data;
          })
          .catch((error: AxiosError) => {
            return error;
          });
      },

      deleteRequest: async (path: string, options?: unknown) => {
        const headers = getState().auth.getHeaderToken();

        options && Object.assign(headers, options);

        return await axiosConfig
          .delete(path, { headers: headers })
      }
    },
  };
});
