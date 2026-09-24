import { useEffect, useState } from 'react';

import { AxiosError, AxiosResponse } from 'axios';
import { Download, File as FileIcon, Folder as FolderIcon } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';

import { SHARED_API } from '@/constants/apis';

import { useAuthStore } from '@/store/useAuthStore';

import FileView from '@/components/files/FileView';
import { formatFileSize } from '@/lib/formatFileSize';

interface SharedItem {
  id: number;
  unique_token: string;
  type: string;
  path?: string;
  filename?: string;
  file_extension?: string | null;
  size?: number | null;
  full_path?: string;
  file_url?: string;
}

interface SharedData {
  type: string;
  name?: string;
  filename?: string;
  file_extension?: string;
  size?: number | null;
  file_url?: string;
  items?: SharedItem[];
}

const Message = ({ title, body }: { title: string; body: string }) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background px-6 text-center">
    <h1 className="text-lg font-semibold text-foreground">{title}</h1>
    {body && <p className="max-w-md text-sm text-muted-foreground">{body}</p>}
  </div>
);

const SharedView = () => {
  const { token } = useParams();
  const [data, setData] = useState<SharedData | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [folderToken, setFolderToken] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    setStatus(null);

    const query = folderToken ? `?folder_token=${folderToken}` : '';

    useAuthStore
      .getState()
      .api.getRequest(`${SHARED_API}/${token}${query}`)
      .then((result) => {
        if (result instanceof AxiosError) {
          setData(null);
          setStatus(result.response?.status ?? 500);
          return;
        }

        const envelope = (result as AxiosResponse).data as { data?: SharedData };
        setData(envelope.data ?? null);
        setStatus(200);
      })
      .catch(() => {
        setData(null);
        setStatus(401);
      });
  }, [token, folderToken]);

  if (status === 401 || status === 403) {
    return (
      <Message
        title="Sign in required"
        body="This item was shared with a specific account. Sign in with that email address to view it."
      />
    );
  }

  if (status && status >= 400) {
    return (
      <Message
        title="Not available"
        body="This link is invalid, expired, or has been revoked."
      />
    );
  }

  if (!data) {
    return <Message title="Loading…" body="" />;
  }

  const isFolder = data.type === 'folder';

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Shared {isFolder ? 'folder' : 'file'}
            </p>
            <h1 className="truncate text-xl font-semibold text-foreground">
              {isFolder ? data.name : `${data.filename}.${data.file_extension}`}
            </h1>
          </div>

          {!isFolder && data.file_url && (
            <a href={data.file_url} download>
              <Button className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </a>
          )}
        </header>

        {isFolder ? (
          <div className="overflow-hidden rounded-lg border border-border">
            {folderToken && (
              <button
                type="button"
                onClick={() => setFolderToken(null)}
                className="w-full border-b border-border px-4 py-3 text-left text-sm font-medium hover:bg-secondary"
              >
                ← Back to root
              </button>
            )}

            {(data.items ?? []).length === 0 && (
              <p className="px-4 py-6 text-sm text-muted-foreground">This folder is empty.</p>
            )}

            {(data.items ?? []).map((item) =>
              item.type === 'folder' ? (
                <button
                  key={item.unique_token}
                  type="button"
                  onClick={() => setFolderToken(item.unique_token)}
                  className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left text-sm last:border-b-0 hover:bg-secondary"
                >
                  <FolderIcon className="w-4 h-4 flex-shrink-0 text-foreground" />
                  <span className="truncate">{item.path}</span>
                </button>
              ) : (
                <div
                  key={item.unique_token}
                  className="flex items-center gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0"
                >
                  <FileIcon className="w-4 h-4 flex-shrink-0 text-foreground" />
                  <span className="flex-grow truncate">
                    {item.filename}.{item.file_extension}
                  </span>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatFileSize(item.size)}
                  </span>
                  {item.file_url && (
                    <a href={item.file_url} target="_blank" rel="noreferrer" download>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Download">
                        <Download className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                </div>
              )
            )}
          </div>
        ) : (
          data.file_url && (
            <div className="flex justify-center">
              <FileView
                sourceUrl={data.file_url}
                fileName={data.filename ?? data.name ?? ''}
                fileExtension={data.file_extension ?? ''}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default SharedView;
