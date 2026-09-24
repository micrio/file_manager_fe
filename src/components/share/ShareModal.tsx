import { useEffect, useState } from 'react';

import { Check, Copy, Link2, Mail, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

import {
  TOAST_VARIANT_DEFAULT,
  TOAST_VARIANT_DESTRUCTIVE,
  TOAST_VARIANT_GHOST,
} from '@/constants/components/ui/toastConstant';

import { useShareStore } from '@/store/useShareStore';

interface IProps {
  objectId: string;
  objectName: string;
  objectType: 'folder' | 'file';
}

const ShareModal = ({ objectId, objectName, objectType }: IProps) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'link' | 'email'>('link');
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const { toast } = useToast();
  const {
    shares,
    loading,
    getShares,
    createLinkShare,
    createEmailShare,
    revokeShare,
  } = useShareStore();

  const shareableType = objectType === 'folder' ? 'Folder' : 'FileUpload';

  useEffect(() => {
    if (!open) return;

    getShares(shareableType, objectId);
    setMode('link');
    setEmail('');
    setCopied(false);
  }, [open, shareableType, objectId, getShares]);

  const linkShare = shares.find((share) => share.link_share);
  const shareUrl = linkShare ? `${window.location.origin}${linkShare.path}` : '';

  const copyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ variant: TOAST_VARIANT_DEFAULT, title: 'Link copied' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: TOAST_VARIANT_DESTRUCTIVE, title: 'Could not copy link' });
    }
  };

  const handleCreateLink = async () => {
    const created = await createLinkShare(shareableType, objectId);

    if (!created) {
      toast({ variant: TOAST_VARIANT_DESTRUCTIVE, title: 'Could not create link' });
    }
  };

  const handleCreateEmail = async () => {
    if (!email.trim()) return;

    const created = await createEmailShare(shareableType, objectId, email.trim());

    if (!created) {
      toast({ variant: TOAST_VARIANT_DESTRUCTIVE, title: 'Could not share with that email' });
      return;
    }

    setEmail('');
    toast({
      variant: TOAST_VARIANT_DEFAULT,
      title: `Shared with ${created.shared_with_email}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full p-2 text-left hover:bg-black/10 dark:hover:bg-white/10">
        <Label>Share</Label>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share &ldquo;{objectName}&rdquo;</DialogTitle>
          <DialogDescription>
            Get a secure link for anyone, or invite a specific email.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === 'link' ? TOAST_VARIANT_DEFAULT : TOAST_VARIANT_GHOST}
            className="flex-1 gap-2"
            onClick={() => setMode('link')}
          >
            <Link2 className="w-4 h-4" />
            Link
          </Button>
          <Button
            type="button"
            variant={mode === 'email' ? TOAST_VARIANT_DEFAULT : TOAST_VARIANT_GHOST}
            className="flex-1 gap-2"
            onClick={() => setMode('email')}
          >
            <Mail className="w-4 h-4" />
            Email
          </Button>
        </div>

        {mode === 'link' ? (
          <div className="grid gap-3">
            {linkShare ? (
              <div className="flex items-center gap-2">
                <Input readOnly value={shareUrl} className="text-xs" />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={copyLink}
                  title="Copy link"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={handleCreateLink}
                disabled={loading}
                className="gap-2"
              >
                <Link2 className="w-4 h-4" />
                Create link
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Anyone with the link can view this {objectType}.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleCreateEmail();
              }}
            />
            <Button type="button" onClick={handleCreateEmail} disabled={!email.trim()}>
              Invite
            </Button>
          </div>
        )}

        {shares.length > 0 && (
          <div className="mt-1 grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Who has access
            </p>
            {shares.map((share) => (
              <div
                key={share.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
              >
                <span className="truncate text-sm">
                  {share.link_share ? 'Anyone with the link' : share.shared_with_email}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => revokeShare(share.id)}
                  title="Remove access"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
