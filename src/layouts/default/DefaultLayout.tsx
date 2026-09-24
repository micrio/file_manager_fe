import { ReactNode, useEffect } from 'react';

import { Loader2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Dialog, DialogContent } from '@/components/ui/dialog';

import { ROUTES } from '@/constants/routes';

import { useAuthStore } from '@/store/useAuthStore';

import ErrorBoundary from "@/components/common/ErrorBoundary";
import Header from "@/components/common/Header";
import Sidebar from "@/components/common/Sidebar";

import { removeAllCookie } from '@/lib/cookie';

interface IProp {
  children: ReactNode;
}

const DefaultLayout = ({ children }: IProp) => {
  const { auth, enableLoader, setEnableLoader, signingIn, setSigningIn } = useAuthStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (
      !enableLoader && !signingIn &&
      (pathname === ROUTES.signin || pathname === ROUTES.signup) &&
      auth.isAuthenticated()
    ) {
      setEnableLoader(true);
      setSigningIn(true);

      setTimeout(() => {
        navigate(ROUTES.home);
        setEnableLoader(false);
        setSigningIn(false);
      }, 2000);
    }

    if (
      !enableLoader &&
      !auth.isAuthenticated()
    ) {
      navigate(ROUTES.signin);
    }
  }, [
    auth,
    pathname,
    enableLoader,
    setEnableLoader,
    signingIn,
    setSigningIn,
    navigate
  ]);

  const handleLogout = () => {
    setEnableLoader(true);
    removeAllCookie();

    setTimeout(() => {
      setEnableLoader(false);
      location.pathname = ROUTES.signin;
      navigate(ROUTES.signin);
    }, 1500);
  };

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen w-full">
        <Dialog open={enableLoader} onOpenChange={setEnableLoader}>
          <DialogContent className="flex justify-center items-center h-screen max-w-screen">
            <Loader2
              className="animate-spin"
              size={'200px'}
              strokeWidth={'1px'}
            />
          </DialogContent>
        </Dialog>

        <div className="flex justify-between">
          {!enableLoader && auth.isAuthenticated() && (
            <Sidebar handleLogout={handleLogout} />
          )}

          <div className="flex flex-col flex-1">
            {!enableLoader && auth.isAuthenticated() && <Header />}

            <main className="relative w-full h-full">
              {children}
            </main>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DefaultLayout;
