import { useFileExtensionCheck } from '@/hooks/useFileExtensionCheck';

interface IProp {
  sourceUrl: string;
  fileName: string;
  fileExtension: string;
}

const FileView = ({ sourceUrl, fileExtension, fileName }: IProp) => {
  const { isFileImage, isFileVideo, isFileDocument } =
    useFileExtensionCheck();

  const File = () => {
    if (isFileImage(fileExtension)) {
      return (
        <img
          src={sourceUrl}
          alt={fileName}
          className="max-h-[80vh] w-full rounded-md object-contain"
        />
      );
    }

    if (isFileVideo(fileExtension)) {
      return (
        <video
          src={sourceUrl}
          controls
          className="max-h-[80vh] w-full rounded-md bg-black"
        />
      );
    }

    if (isFileDocument(fileExtension)) {
      return (
        <a href={sourceUrl} className="underline">
          Download Document <b>{fileName}</b>
        </a>
      );
    }

    return <></>;
  };

  return (
    // `pt-8` keeps the media clear of the dialog's absolutely-positioned close
    // button (top-right), which would otherwise overlap the image/video corner.
    <div className="flex w-full flex-col items-center pt-8">
      <File />
    </div>
  );
};

export default FileView;
