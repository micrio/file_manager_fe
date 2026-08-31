import { DragEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAuthStore } from '@/store/useAuthStore';
import { useFileStore } from '@/store/userFileStore';

import Sidebar from "@/components/common/Sidebar";
import Header from "@/components/common/Header";
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

import {
  TOAST_VARIANT_DEFAULT,
  TOAST_VARIANT_DESTRUCTIVE,
} from '@/constants/components/ui/toastConstant';
import { useToast } from '@/components/ui/use-toast';
import { ROUTES } from '@/constants/routes';
import { removeAllCookie } from '@/lib/cookie';
import ErrorBoundary from "@/components/common/ErrorBoundary";

interface IProp {
  children: ReactNode;
}

const DefaultLayout = ({ children }: IProp) => {
  const { auth, enableLoader, setEnableLoader, signingIn, setSigningIn } = useAuthStore();
  const { pathname } = useLocation();
  const { id } = useParams();
  const { uploadFile } = useFileStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isDragActive, setIsDragActive] = useState(false);
  const dragEnterCount = useRef(0);

  // Drag-and-drop upload is scoped to the storage routes, since only they carry
  // a folder token (`id`) to attach the dropped file to. On every other route
  // a drop is ignored.
  const isStorageRoute = (path: string) =>
    path === ROUTES.storage || path.startsWith(`${ROUTES.storage}/`);

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    dragEnterCount.current = 0;

    if (!isStorageRoute(pathname)) return;

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    // `id` is the current folder's unique_token (undefined on the storage root),
    // uploaded through the same contract as the UploadFile dialog.
    const result = await uploadFile.request(files, id ?? null);

    if (!result.ok) {
      toast({ variant: TOAST_VARIANT_DESTRUCTIVE, title: result.message });
      return;
    }

    toast({ variant: TOAST_VARIANT_DEFAULT, title: 'File uploaded successfully' });
  };

  const onDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragEnterCount.current += 1;
    setIsDragActive(isStorageRoute(pathname));
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragEnterCount.current -= 1;
    if (dragEnterCount.current === 0) {
      setIsDragActive(false);
    }
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

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
      <div
        className="relative min-h-screen w-full"
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
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

            <main
              className={`w-full h-full rounded-md border-2 border-dashed transition-colors ${
                isDragActive ? 'border-neutral-600 dark:border-neutral-400' : 'border-transparent'
              }`}
            >
              {children}
            </main>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DefaultLayout;
