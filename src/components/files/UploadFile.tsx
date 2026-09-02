import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { FileUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

import {
  TOAST_VARIANT_DEFAULT,
  TOAST_VARIANT_DESTRUCTIVE,
  TOAST_VARIANT_GHOST,
} from '@/constants/components/ui/toastConstant';
import { FILE_CREATED } from '@/constants/socketActions';

import { useFoldersStore } from '@/store/useFolderStore';
import { FileSocketData, useFileStore } from '@/store/userFileStore';
import { useSocketStore } from '@/store/useSocketStore';

const UploadFileSchema = z.object({
  files: z
    .any()
    .refine((file) => file instanceof FileList && file.length > 0, 'Select one or more files.'),
  // .refine((file) => file[0]?.type === 'application/pdf', 'Must be a PDF.')
  // .refine((file) => file[0]?.size <= 3000000, `Max file size is 3MB.`),
});

const UploadFile = () => {
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [disableUpload, setDisableUpload] = useState<boolean>(true);
  const { id } = useParams();
  const { uploadFile } = useFileStore();
  const { addFilesToList } = useFoldersStore();
  const { receivedData } = useSocketStore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof UploadFileSchema>>({
    resolver: zodResolver(UploadFileSchema),
    defaultValues: {
      files: undefined,
    },
  });

  useEffect(() => {
    useFileStore.getState().uploadFile.setFolderUniqueToken(id ?? null);
  }, [id]);

  useEffect(() => {
    const response = receivedData as unknown as FileSocketData;
    const isFileCreation = response && response.action === FILE_CREATED;

    if (!isFileCreation) return;

    // A multi-upload broadcasts several files under one FILE_CREATED action.
    // Match each broadcast entry against the dialog's upload target and merge
    // all matches into the list at once.
    const matching = response.data.filter((entry) => {
      const folderId = entry.folder_id;

      return uploadFile.folderUniqueToken === id
        ? folderId !== null
        : uploadFile.folderUniqueToken === null && folderId === null;
    });

    addFilesToList(matching);
  }, [id, receivedData, uploadFile.folderUniqueToken, addFilesToList]);

  const onSubmit = async (values: z.infer<typeof UploadFileSchema>) => {
    const result = await uploadFile.request(values.files);

    if (!result.ok) {
      toast({ variant: TOAST_VARIANT_DESTRUCTIVE, title: result.message });
      return;
    }

    toast({ variant: TOAST_VARIANT_DEFAULT, title: 'File uploaded successfully' });
    setOpenDialog(false);
    setDisableUpload(true);
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <div className="w-auto">
        <DialogTrigger
          className="flex items-center gap-3 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
          title="Upload File"
        >
          <FileUp className="w-6 h-6" />
        </DialogTrigger>
      </div>
      <DialogContent className="absolute py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="files"
              render={({ field: { onChange, onBlur, name, ref } }) => (
                <FormItem>
                  <FormLabel />
                  <FormControl>
                    <Input
                      type="file"
                      className="h-18 leading-5"
                      name={name}
                      ref={ref}
                      onBlur={onBlur}
                      onChange={(e) => {
                        // Pass the FileList directly to React Hook Form
                        onChange(e.target.files);
                        // Enable upload button as soon as a file is chosen
                        setDisableUpload(!e.target.files || e.target.files.length === 0);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end mt-5">
              <Button
                type="button"
                variant={TOAST_VARIANT_GHOST}
                className="mr-4"
                onClick={() => {
                  setOpenDialog(false);
                  setDisableUpload(true);
                }}
              >
                Close
              </Button>
              <Button type="submit" disabled={disableUpload}>
                Upload
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadFile;
