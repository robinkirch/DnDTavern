'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useI18n } from '@/context/i18n-context';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  id: z.string().min(3, 'Data Source ID must be at least 3 characters.'),
  name: z.string().min(3, 'Grimoire Name must be at least 3 characters.')
});

type FormData = z.infer<typeof formSchema>;

interface GrimoireFormDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSave: (id: string, name: string) => void;
}

export function GrimoireFormDialog({ isOpen, onOpenChange, onSave }: GrimoireFormDialogProps) {
  const { t } = useI18n();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: '',
      name: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ id: '', name: '' });
    }
  }, [isOpen, form]);

  function onSubmit(values: FormData) {
    onSave(values.id, values.name);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{t('Add New Grimoire')}</DialogTitle>
          <DialogDescription>
            {t('Provide a unique ID for your data source and a display name for your Grimoire.')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Grimoire Name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("e.g., Volo's Vile Brews")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Data Source ID')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('e.g., my-firestore-db')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
                <Button type="submit">{t('Add Grimoire')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
