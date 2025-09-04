'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Grimoire } from '@/lib/types';

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
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  name: z.string().min(3, 'Grimoire name must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
});

type FormData = z.infer<typeof formSchema>;

interface GrimoireFormDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSave: (data: { name: string; description: string }) => void;
    grimoire?: Grimoire | null;
}

export function GrimoireFormDialog({ isOpen, onOpenChange, onSave, grimoire }: GrimoireFormDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (grimoire) {
      form.reset(grimoire);
    } else {
      form.reset({ name: '', description: '' });
    }
  }, [grimoire, isOpen, form]);

  function onSubmit(values: FormData) {
    onSave(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{grimoire ? 'Edit Grimoire' : 'Create New Grimoire'}</DialogTitle>
          <DialogDescription>
            {grimoire ? 'Update the details for this grimoire.' : 'A grimoire is a collection of recipes you can link to your campaigns.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grimoire Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Elminster's Everyday Eats" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A short, enticing description of this recipe collection."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">{grimoire ? 'Save Changes' : 'Create Grimoire'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
