import { useLocation } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';

import UploadFile from '@/components/files/UploadFile';
import CreateFolder from '@/components/folders/CreateFolder';

const Header = () => {
  const { pathname } = useLocation();

  // No create/upload actions in Trash, or while browsing someone else's share.
  if (pathname === ROUTES.trash || pathname.startsWith('/shared/')) return null;

  return (
    <div className="flex gap-5 border-b border-border justify-end px-5 py-5">
      <CreateFolder />
      <UploadFile />
    </div>
  );
};

export default Header;
