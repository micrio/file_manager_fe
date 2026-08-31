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
  removeAllCookie,
} from '@/lib/cookie';
import {
  SIGNIN_SUCCESS_RESPONSE_MESSAGE,
  SIGNUP_SUCCESS_RESPONSE_MESSAGE,
} from '@/constants/reponseMessage';
import axiosConfig from '@/apis/axiosConfig';
import { API_RESPONSE_CODE } from '@/constants/apiResponseCode';
import { ROUTES } from '@/constants/routes';

let navigate: (path: string, state?: any) => void;
export const setGlobalNavigate = (n: (path: string, state?: any) => void) => {
  navigate = n;
};

interface IAuth {
  loading: boolean;
  signingIn: boolean;
  setSigningIn: (signingIn: boolean) => void;
  enableLoader: boolean;
  setEnableLoader: (enable: boolean) => void;
  logout: (message?: string) => void;
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
    request: () => Promise<boolean>;
    retryCount: number;
    incrementRetry: () => void;
    resetRetry: () => void;
  };
  api: {
    data: unknown;
    status: string;
    error: unknown;
    message: string | null;
    errorMessage: string | null;
    getRequest: (path: string) => Promise<AxiosResponse>;
    postRequest: (path: string, data?: unknown, options?: unknown) => Promise<AxiosResponse>;
    putRequest: (path: string, data?: unknown, options?: unknown) => Promise<AxiosResponse>;
    deleteRequest: (path: string, options?: unknown) => Promise<AxiosResponse>;
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
      error: {
        fname: '',
        lname: '',
        email: '',
        password: '',
      },
      errorMessage: '',
      success: false,
      successMessage: '',
      initializeState: () => null,
      request: () => null,
    },
    refreshToken: {
      request: () => null,
      retryCount: 0,
      incrementRetry: () => {},
      resetRetry: () => {},
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
            ...initialState.signup,
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
                  loading: false,
                },
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

        try {
          const data = await refreshTokenRequest(refreshHeader);
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
          return true;
        } catch (error) {
          set((state) => ({
            ...state,
            auth: {
              ...state.auth,
              accessToken: null,
              refreshToken: null,
            },
          }));
          const msg = 'Logged out. Sign in again';
          localStorage.setItem('logout_message', msg);
          removeAllCookie();
          if (navigate) {
            navigate(ROUTES.signin, { state: { message: msg } });
          }
          return false;
        }
      },
      retryCount: 0,
      incrementRetry: () => {
        set((state) => ({
          refreshToken: {
            ...state.refreshToken,
            retryCount: state.refreshToken.retryCount + 1,
          },
        }));
      },
      resetRetry: () => {
        set((state) => ({
          refreshToken: {
            ...state.refreshToken,
            retryCount: 0,
          },
        }));
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
              getState().refreshToken.request().then((success) => {
                if (!success) {
                   if (navigate) {
                     navigate(ROUTES.signin, { state: { message: 'Logged out. Sign in again' } });
                   }
                }
              });
            } else {
              set((state) => ({
                ...state,
                api: {
                  ...state.api,
                  status: error.response?.status || error.request?.status || 500,
                  error: error,
                  message: (error.response?.data as any)?.message || error.message,
                  errorMessage: (error.response?.data as any)?.error || error.message,
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
            if (error.response?.status === API_RESPONSE_CODE.unauthorized) {
              getState().refreshToken.request().then((success) => {
                if (!success) {
                   if (navigate) {
                     navigate(ROUTES.signin, { state: { message: 'Logged out. Sign in again' } });
                   }
                }
              });
            }
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
            if (error.response?.status === API_RESPONSE_CODE.unauthorized) {
              getState().refreshToken.request().then((success) => {
                if (!success) {
                   if (navigate) {
                     navigate(ROUTES.signin, { state: { message: 'Logged out. Sign in again' } });
                   }
                }
              });
            }
            return error;
          });
      },

      deleteRequest: async (path: string, options?: unknown) => {
        const headers = getState().auth.getHeaderToken();

        options && Object.assign(headers, options);

        return await axiosConfig
          .delete(path, { headers: headers })
          .then((data: AxiosResponse) => {
            return data;
          })
          .catch((error: AxiosError) => {
            if (error.response?.status === API_RESPONSE_CODE.unauthorized) {
              getState().refreshToken.request().then((success) => {
                if (!success) {
                   if (navigate) {
                     navigate(ROUTES.signin, { state: { message: 'Logged out. Sign in again' } });
                   }
                }
              });
            }
            return error;
          });
      },
    },
  };
});