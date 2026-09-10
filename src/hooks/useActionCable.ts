import { useEffect, useRef,useState } from 'react';

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
    // Prevent duplication subscription initialization
    if (!consumer.current) {
      const websocketUrl = process.env.REACT_APP_WEBSOCKET_URL ?? `ws://localhost:3000/cable`;
      consumer.current = ActionCable.createConsumer(`${websocketUrl}?token=${token}`);
    }

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
      if (newSubscription) {
        newSubscription.unsubscribe();
      }
    };
  }, [channelName, token]);

  return { subscription, receivedData, send };
};
