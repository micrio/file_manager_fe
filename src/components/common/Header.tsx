import UploadFile from '@/components/files/UploadFile';
import CreateFolder from '@/components/folders/CreateFolder';

const Header = () => {
  return (
    <div className="flex gap-5 border-b border-border justify-end px-5 py-5">
      <CreateFolder />
      <UploadFile />
    </div>
  );
};

export default Header;
