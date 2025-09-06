'use client';

import { useEffect, ChangeEvent, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Note } from '@/lib/types';
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
import { Textarea } from '@/components/ui/textarea';
import { Upload } from 'lucide-react';
import Image from 'next/image';

const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL(file.type));
        };
        img.onerror = (error) => reject(error);
    });
};


const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  content: z.string().min(1, 'Content is required.'),
  location: z.string().min(1, 'Location found is required.'),
  tags: z.string().optional(),
  image: z.string().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface NoteFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (note: Omit<Note, 'id' | 'creatorUsername'>) => void;
  note?: Note | null;
}

export function NoteFormDialog({ isOpen, onOpenChange, onSave, note }: NoteFormDialogProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (note) {
        form.reset({
          ...note,
          tags: note.tags.join(', '),
          image: note.image || null,
        });
        setImagePreview(note.image || null);
      } else {
        form.reset({
          title: '',
          content: '',
          location: '',
          tags: '',
          image: null,
        });
        setImagePreview(null);
      }
    }
  }, [note, isOpen, form]);

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resizedImage = await resizeImage(file, 400, 300);
        form.setValue('image', resizedImage, { shouldValidate: true });
        setImagePreview(resizedImage);
      } catch (error) {
        console.error("Failed to resize image", error);
      }
    }
  };

  function onSubmit(values: FormData) {
    const processedData = {
        ...values,
        tags: values.tags ? values.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
    };
    onSave(processedData);
    onOpenChange(false);
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline">{note ? t('Edit Note') : t('Add New Note')}</DialogTitle>
              <DialogDescription>
                {t('Record a document, letter, or piece of information you have found.')}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                 <FormField
                    control={form.control}
                    name="image"
                    render={() => (
                        <FormItem>
                            <FormLabel>{t('Image')}</FormLabel>
                            <div className="flex items-center gap-4">
                                {imagePreview && (
                                    <Image src={imagePreview} alt="Note Preview" width={120} height={90} className="rounded-md object-cover" />
                                )}
                                <FormControl>
                                    <div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageChange}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                            <Upload className="mr-2 h-4 w-4" />
                                            {t('Upload (400x300)')}
                                        </Button>
                                    </div>
                                </FormControl>
                            </div>
                             <FormMessage />
                        </FormItem>
                    )}
                />
                
                <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('Title')}</FormLabel>
                        <FormControl><Input placeholder={t('e.g., A Blood-Stained Letter')} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="content" render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('Content')}</FormLabel>
                        <FormControl><Textarea className="min-h-32" placeholder={t('Transcribe the content of the note here.')} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                
                <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('Location Found')}</FormLabel>
                        <FormControl><Input placeholder={t('e.g., In the secret compartment of the desk.')} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="tags" render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('Tags')}</FormLabel>
                        <FormControl><Input placeholder={t('secret, letter, plot, ... (comma-separated)')} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                
                <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
                    <Button type="submit">{note ? t('Save Changes') : t('Add Note')}</Button>
                </DialogFooter>
              </form>
            </Form>
      </DialogContent>
    </Dialog>
  );
}

    