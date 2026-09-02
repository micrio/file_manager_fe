import UploadFile from "../files/UploadFile";
import CreateFolder from "../folders/CreateFolder";

const Header = () => {
  return (
    <div className="flex gap-5 border-b border-border justify-end px-5 py-5">
      <CreateFolder />
      <UploadFile />
    </div>
  );
};

export default Header;
