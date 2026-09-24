import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';

import {
  TOAST_VARIANT_DEFAULT,
  TOAST_VARIANT_DESTRUCTIVE,
} from '@/constants/components/ui/toastConstant';

import { useFoldersStore } from '@/store/useFolderStore';
import { useFileStore } from '@/store/userFileStore';

import type { IFileData } from '@/apis/file/fileInterface';

const renderProgress = (percent: number) => (
  <div className="flex flex-col gap-2">
    <Progress value={percent} />
    <span className="text-xs text-muted-foreground">{percent}%</span>
  </div>
);

/**
 * Uploads files while showing a single progress-toast, then swaps it for a
 * success or destructive toast. Shared by the upload dialog and the
 * drag-and-drop upload in `DefaultLayout`.
 */
export const useUploadWithProgress = () => {
  const { toast } = useToast();

  const uploadWithProgress = async (
    files: FileList,
    folderToken?: string | null,
  ) => {
    const fileCount = files.length;
    const label = fileCount > 1 ? `${fileCount} files` : files[0]?.name ?? 'file';

    // Keep one toast open for the whole upload and drive its progress bar via
    // axios' onUploadProgress. The toast is dismissed once the request settles.
    const progressToast = toast({
      variant: TOAST_VARIANT_DEFAULT,
      title: `Uploading ${label}`,
      description: renderProgress(0),
      duration: 1000000,
    });

    const result = await useFileStore
      .getState()
      .uploadFile.request(files, folderToken, (percent) => {
        progressToast.update({
          id: progressToast.id,
          title: `Uploading ${label}`,
          description: renderProgress(percent),
        });
      });

    progressToast.dismiss();

    if (!result.ok) {
      toast({ variant: TOAST_VARIANT_DESTRUCTIVE, title: result.message });
      return result;
    }

    // Insert straight from the HTTP response so the list updates immediately.
    // The ActionCable FILE_CREATED broadcast also does this (for other tabs),
    // and addFilesToList de-dupes by unique_token, so there's no double entry.
    const created = result.data as IFileData[] | undefined;
    if (created?.length) {
      useFoldersStore.getState().addFilesToList(created);
    }

    toast({ variant: TOAST_VARIANT_DEFAULT, title: 'File uploaded successfully' });
    return result;
  };

  return { uploadWithProgress };
};
