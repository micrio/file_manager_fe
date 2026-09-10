import { create } from 'zustand';

import { IReceivedData } from '@/hooks/useActionCable';

interface ISocket {
  receivedData: IReceivedData;
  setReceivedData: (socketMessage: IReceivedData) => void;
}

export const useSocketStore = create<ISocket>((set) => {
  const initialReceivedData = {
    action: "",
    data: []
  }
  const initialState = {
    receivedData: initialReceivedData,
    setReceivedData: () => null,
  };

  return {
    ...initialState,

    setReceivedData: async (socketMessage: IReceivedData) =>
      set((state) => ({
        ...state,
        receivedData: socketMessage,
      })),
  };
});
