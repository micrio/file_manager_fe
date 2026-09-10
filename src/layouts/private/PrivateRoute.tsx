import { ReactNode, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';

import { useAuthStore } from '@/store/useAuthStore';

import ActionCableSocket from '@/components/common/ActionCableSocket';

interface IProp {
  children: ReactNode;
}

const PrivateLayout = ({ children }: IProp) => {
  const { auth } = useAuthStore((state) => ({
    auth: state.auth,
  }));
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      const message = localStorage.getItem('logout_message');
      if (message) {
        localStorage.removeItem('logout_message');
      }
      navigate(ROUTES.signin, { state: { message } });
    }
  }, [auth.isAuthenticated(), navigate]);

  return (
    <>
      {children}
      <ActionCableSocket />
    </>
  );
};

export default PrivateLayout;
