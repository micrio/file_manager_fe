import { useEffect } from 'react';

import { useActionCable } from '@/hooks/useActionCable';
import { getAuthTokenCookie } from '@/lib/cookie';
import { useAuthStore } from '@/store/useAuthStore';
import { useSocketStore } from '@/store/useSocketStore';

const ActionCableSocket = () => {
  const { auth } = useAuthStore();
  const token = auth.accessToken || getAuthTokenCookie();
  const { subscription: folderSubscribe, receivedData: folderReceivedData } =
    useActionCable('FolderChannel', String(token));
  const { subscription: fileSubscribe, receivedData: fileReceivedData } =
    useActionCable('FileChannel', String(token));
  const { setReceivedData } = useSocketStore();

  useEffect(() => {
    return () => {
      folderSubscribe;
      fileSubscribe;
    }
  }, []);

  useEffect(() => {
    folderReceivedData && setReceivedData(folderReceivedData);

    fileReceivedData && setReceivedData(fileReceivedData);
  }, [folderReceivedData, fileReceivedData, setReceivedData]);

  return <></>;
};

export default ActionCableSocket;
