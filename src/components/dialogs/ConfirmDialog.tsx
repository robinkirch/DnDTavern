import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { useI18n } from '@/context/i18n-context';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export interface ConfirmDialogData {
  isOpen: boolean;
  title: string;
  description: string;
  errorDescription?: string | null;
  successTitle: string;
  successDescription?: string | null;
  onConfirm: (() => Promise<void> | void) | null;
  onClose: () => void;
  onFinally?: (() => void) | null;
}

interface Props {
  data: ConfirmDialogData;
}

export const ActionConfirmDialog: React.FC<Props> = ({ data }) => {
  const { t } = useI18n();
  const [isPending, setIsPending] = useState(false);

  const handleConfirm = async () => {
  if (!data.onConfirm) return;

  try {
    setIsPending(true);
    await data.onConfirm(); 
    toast({ title: data.successTitle, description: data.successDescription ?? undefined,});
    data.onClose();
  } catch (error) {
    toast({ title: t('Error'), description: data.errorDescription ?? t('Something went wrong during this action.'), variant: 'destructive' });
  } finally {
    if(data.onFinally != null)
      data.onFinally();
    setIsPending(false);
  }
};

  return (
    <Dialog open={data.isOpen} onOpenChange={(open) => !open && !isPending && data.onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{data.title}</DialogTitle>
          <DialogDescription>
            {data.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={data.onClose} disabled={isPending}>{t('Cancel')}</Button>
          <Button variant="destructive" onClick={handleConfirm}disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t('Confirm')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};