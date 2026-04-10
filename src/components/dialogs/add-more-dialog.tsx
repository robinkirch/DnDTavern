'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { InventoryItem } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';
import { useI18n } from '@/context/i18n-context';

interface AddMoreItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  item: InventoryItem | null;
  onConfirm: (amount: number) => void;
}

export function AddMoreItemDialog({ isOpen, onOpenChange, item, onConfirm }: AddMoreItemDialogProps) {
  const { t } = useI18n();
  if (!item) return null;
  
  const schema = z.object({
    amount: z.number()
      .min(1, 'Mindestens 1')
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { amount: 1 },
  });

  const handleSubmit = (values: { amount: number }) => {
    onConfirm(values.amount);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>"{item.name}" {t('adding amount')}</DialogTitle>
          <p className="text-sm">{t('Current amount')}: {item.quantity}</p>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Amount to add')}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} min={1} onChange={e => field.onChange(parseInt(e.target.value) || 0)}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
              <Button type="submit">{t('Add')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}