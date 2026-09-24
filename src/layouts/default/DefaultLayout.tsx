import { DragEvent, ReactNode, useEffect, useRef, useState } from 'react';

import { FileUp, Loader2 } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Dialog, DialogContent } from '@/components/ui/dialog';

import { ROUTES } from '@/constants/routes';

import { useAuthStore } from '@/store/useAuthStore';

import ErrorBoundary from "@/components/common/ErrorBoundary";
import Header from "@/components/common/Header";
import Sidebar from "@/components/common/Sidebar";

import { useUploadWithProgress } from '@/hooks/useUploadWithProgress';
import { removeAllCookie } from '@/lib/cookie';

interface IProp {
  children: ReactNode;
}

const DefaultLayout = ({ children }: IProp) => {
  const { auth, enableLoader, setEnableLoader, signingIn, setSigningIn } = useAuthStore();
  const { pathname } = useLocation();
  const { id } = useParams();
  const { uploadWithProgress } = useUploadWithProgress();
  const navigate = useNavigate();

  const [isDragActive, setIsDragActive] = useState(false);
  const dragEnterCount = useRef(0);
  const signingInRef = useRef(false);

  // Drag-and-drop upload is scoped to the storage routes, since only they carry
  // a folder token (`id`) to attach the dropped files to.
  const isStorageRoute = (path: string) =>
    path === ROUTES.storage || path.startsWith(`${ROUTES.storage}/`);

  // The layout-level handlers must ignore internal drags (folder/file moves),
  // which only ever expose the custom `uniqueToken`/`fileType` types. OS file
  // drags always include the `Files` type.
  const isFileDrag = (event: DragEvent) =>
    Array.from(event.dataTransfer?.types ?? []).includes('Files');

  const onDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(event) || !isStorageRoute(pathname)) return;

    event.preventDefault();
    dragEnterCount.current += 1;
    setIsDragActive(true);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(event) || !isStorageRoute(pathname)) return;

    event.preventDefault();
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    // Don't gate on `isFileDrag` here: some browsers report an empty
    // `dataTransfer.types` on dragleave, which would leave the highlight stuck.
    // Only file drags ever bump the counter, so decrementing unconditionally is
    // safe (internal move drags sit at 0).
    dragEnterCount.current = Math.max(0, dragEnterCount.current - 1);

    if (dragEnterCount.current === 0) {
      setIsDragActive(false);
    }
  };

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(event)) return;

    event.preventDefault();
    setIsDragActive(false);
    dragEnterCount.current = 0;

    if (!isStorageRoute(pathname)) return;

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    await uploadWithProgress(files, id ?? null);
  };

  useEffect(() => {
    if (
      !signingIn &&
      (pathname === ROUTES.signin || pathname === ROUTES.signup) &&
      auth.isAuthenticated()
    ) {
      // Guard on `signingIn` (not `enableLoader`) so this fires once per sign-in.
      //
      // A ref latch is also required: React StrictMode invokes effects twice on
      // mount, and both runs read the same stale `signingIn=false` from the
      // store before React flushes state — scheduling two redirect/loader
      // passes (the double modal). The ref flips synchronously, so the second
      // run bails. The timer is cleared on cleanup to avoid a stray redirect.
      if (signingInRef.current) return;
      signingInRef.current = true;

      setEnableLoader(true);
      setSigningIn(true);

      setTimeout(() => {
        navigate(ROUTES.home);
        setEnableLoader(false);
        setSigningIn(false);
        signingInRef.current = false;
      }, 2000);

      // No cleanup here: StrictMode's mount→cleanup→mount would clear this
      // timer after the ref latch already blocked a reschedule, killing the
      // redirect. The ref guard is what prevents duplicates.
    }

    if (
      !enableLoader &&
      !auth.isAuthenticated() &&
      pathname !== ROUTES.signin &&
      pathname !== ROUTES.signup
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
        <Dialog open={enableLoader}>
          <DialogContent
            hideClose
            onEscapeKeyDown={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
            className="flex justify-center items-center h-screen max-w-screen"
          >
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
              className={`relative w-full h-full rounded-md border-2 border-dashed transition-colors ${
                isDragActive ? 'border-foreground bg-secondary/50' : 'border-transparent'
              }`}
            >
              {isDragActive && (
                <div className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 rounded-md bg-background/80">
                  <FileUp className="h-10 w-10 text-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    Drop files to upload
                  </p>
                </div>
              )}

              {children}
            </main>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DefaultLayout;
