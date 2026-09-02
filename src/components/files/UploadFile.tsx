import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { FileUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { z } from 'zod';

import { IFileData } from '@/apis/file/fileInterface';
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

import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';

const UploadFileSchema = z.object({
  files: z
    .any()
    .refine((file) => file?.length == 1, 'File is required.')
  // .refine((file) => file[0]?.type === 'application/pdf', 'Must be a PDF.')
  // .refine((file) => file[0]?.size <= 3000000, `Max file size is 3MB.`),
});

const UploadFile = () => {
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [disableUpload, setDisableUpload] = useState<boolean>(true);
  const { id } = useParams();
  const { uploadFile } = useFileStore();
  const { addSingleFileToList } = useFoldersStore();
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

    if (isFileCreation) {
      const responseData = response.data[0] as IFileData;
      const folderId = responseData.folder_id;

      if (uploadFile.folderUniqueToken === id && folderId !== null) {
        addSingleFileToList(response);
      } else if (uploadFile.folderUniqueToken === null && folderId === null) {
        addSingleFileToList(response);
      }
    }
  }, [id, receivedData, uploadFile.folderUniqueToken, addSingleFileToList]);

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
