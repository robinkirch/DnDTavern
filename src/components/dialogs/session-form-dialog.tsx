'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Session } from '@/lib/types';
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
  name: z.string().min(1, 'Name is required.'),
  date: z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
  }, z.date()),
  number: z.coerce.number().default(1),
});

type FormData = z.infer<typeof formSchema>;

interface SessionFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (session: Omit<Session, 'id' | 'campaignId' | 'note' | 'logs'>) => void;
}

export function SessionFormDialog({ isOpen, onOpenChange, onSave }: SessionFormDialogProps) {
  const { t } = useI18n();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      date: new Date(),
      number: 1,
    }
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: '',
        date: new Date(),
        number: 1,
      });
    }
  }, [isOpen, form]);

  function onSubmit(values: FormData) {
    onSave(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('Add New Session')}</DialogTitle>
          <DialogDescription>
            {t('Add a new Session to your Campaign.')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <FormField control={form.control} name="number" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('No.')}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>{t('Session Title')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('e.g. The Great Escape')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Date')}</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit">{t('Create Session')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}