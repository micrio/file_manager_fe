
export interface ISigninRequest {
  data: {
    email: string;
    password: string;
  };
}

export interface ISigninResponse {
  email: string | null;
  fname: string | null;
  lname: string | null;
}

export interface ISigninTokens {
  // Response keys from BE
  token: string;
  refresh_token: string;
}

export interface ISigninErrorResponse {
  success: boolean;
  error: string;
}

export interface ISignupRequest {
  user: {
    fname: string;
    lname: string;
    email: string;
    password: string;
  };
}

export interface ISignupResponse {
  response: {
    data: {
      success: boolean;
      message: string;
    };
  };
}

export interface ISignupErrorResponseData {
  fname: string | null;
  lname: string | null;
  email: string | null;
  password: string | null;
}

export interface ISignupErrorResponse {
  error: [ISignupErrorResponseData] | string;
  success: boolean;
}

export interface IRefreshTokenResponse {
  success: boolean;
  meta: {
    token: string;
    // Optional — backend currently returns only `token`. Present so a
    // rotated refresh token (if ever issued) can be persisted.
    refresh_token?: string;
  }
}
