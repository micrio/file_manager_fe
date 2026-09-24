import { useEffect, useRef, useState } from 'react';

import ActionCable, { Channel } from 'actioncable';

type SendFunction = (action: string, message: unknown) => void;

export interface IReceivedData {
  action: string;
  data: unknown[];
}

interface HookReturnType {
  subscription: Channel | null;
  receivedData: IReceivedData | null | undefined;
  send: SendFunction | null;
}

export const useActionCable = (channelName: string, token: string): HookReturnType => {
  const [subscription, setSubscription] = useState<Channel | null>(null);
  const [receivedData, setReceivedData] = useState<IReceivedData>();
  const [send, setSend] = useState<SendFunction | null>(null);
  const consumer = useRef<ActionCable.Cable | null>(null);

  useEffect(() => {
    // Don't open a socket before we have a real token (otherwise the URL gets
    // `?token=undefined` and the handshake is rejected).
    if (!token || token === 'undefined') return;

    const websocketUrl = process.env.REACT_APP_WEBSOCKET_URL ?? 'ws://localhost:3000/cable';

    // One consumer per (re)connect so token changes / StrictMode remounts don't
    // leave stale subscriptions behind.
    consumer.current = ActionCable.createConsumer(`${websocketUrl}?token=${token}`);

    const newSubscription = consumer.current.subscriptions.create(channelName, {
      connected() {
        console.log('Connected to channel');
      },

      disconnected() {
        console.log('Disconnected');
      },

      received(data: IReceivedData) {
        setReceivedData(data);
      },
    }) as Channel;

    const sendFn: SendFunction = (action, message) => {
      newSubscription.perform(action, { message });
    };

    setSubscription(newSubscription);
    setSend(() => sendFn);

    return () => {
      consumer.current?.disconnect();
      consumer.current = null;
    };
  }, [channelName, token]);

  return { subscription, receivedData, send };
};
