import { AxiosError, AxiosResponse } from 'axios';
import { create } from 'zustand';

import { SHARES_API } from '@/constants/apis';

import { useAuthStore } from './useAuthStore';

export interface IShare {
  id: number;
  token: string;
  link_share: boolean;
  shared_with_email: string | null;
  permission: string;
  shareable_type: string;
  shareable_token: string;
  shareable_name: string;
  owner_email?: string | null;
  path: string;
}

type ShareableType = 'Folder' | 'FileUpload';

type Envelope<T> = { success?: boolean; data?: T };

const unwrap = <T>(result: AxiosResponse | AxiosError): T | undefined => {
  if (result instanceof AxiosError) return undefined;

  return (result.data as Envelope<T> | undefined)?.data;
};

interface IShareStore {
  shares: IShare[];
  sharedWithMe: IShare[];
  loading: boolean;
  getShares: (shareableType: ShareableType, shareableToken: string) => Promise<void>;
  getSharedWithMe: () => Promise<void>;
  createLinkShare: (shareableType: ShareableType, shareableToken: string) => Promise<IShare | null>;
  createEmailShare: (
    shareableType: ShareableType,
    shareableToken: string,
    email: string,
  ) => Promise<IShare | null>;
  revokeShare: (id: number) => Promise<void>;
}

export const useShareStore = create<IShareStore>((set) => ({
  shares: [],
  sharedWithMe: [],
  loading: false,

  getShares: async (shareableType, shareableToken) => {
    set({ loading: true });

    const result = await useAuthStore.getState().api.getRequest(
      `${SHARES_API}?shareable_type=${shareableType}&shareable_token=${shareableToken}`
    );

    set({ shares: unwrap<IShare[]>(result) ?? [], loading: false });
  },

  getSharedWithMe: async () => {
    set({ loading: true });

    const result = await useAuthStore
      .getState()
      .api.getRequest(`${SHARES_API}/shared_with_me`);

    set({ sharedWithMe: unwrap<IShare[]>(result) ?? [], loading: false });
  },

  createLinkShare: async (shareableType, shareableToken) => {
    const result = await useAuthStore.getState().api.postRequest(SHARES_API, {
      share: { shareable_type: shareableType, shareable_token: shareableToken, link_share: true },
    });

    const created = unwrap<IShare>(result);
    if (created) set((state) => ({ shares: [created, ...state.shares] }));

    return created ?? null;
  },

  createEmailShare: async (shareableType, shareableToken, email) => {
    const result = await useAuthStore.getState().api.postRequest(SHARES_API, {
      share: {
        shareable_type: shareableType,
        shareable_token: shareableToken,
        shared_with_email: email,
      },
    });

    const created = unwrap<IShare>(result);
    if (created) set((state) => ({ shares: [created, ...state.shares] }));

    return created ?? null;
  },

  revokeShare: async (id) => {
    const result = await useAuthStore.getState().api.deleteRequest(`${SHARES_API}/${id}`);

    if (!(result instanceof AxiosError)) {
      set((state) => ({ shares: state.shares.filter((share) => share.id !== id) }));
    }
  },
}));
