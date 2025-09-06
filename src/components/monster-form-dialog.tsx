'use client';

import { useEffect, ChangeEvent, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Monster } from '@/lib/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  name: z.string().min(1, 'Creature name is required.'),
  description: z.string().min(1, 'Description is required.'),
  behavior: z.enum(['aggressive', 'neutral', 'friendly']),
  hitPoints: z.coerce.number().positive().nullable(),
  image: z.string().nullable(),
  resistances: z.string().optional(),
  damageTypes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface MonsterFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (monster: Omit<Monster, 'id' | 'creatorUsername'>) => void;
  monster?: Monster | null;
}

export function MonsterFormDialog({ isOpen, onOpenChange, onSave, monster }: MonsterFormDialogProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (monster) {
        form.reset({
          ...monster,
          hitPoints: monster.hitPoints || null,
          image: monster.image || null,
          resistances: monster.resistances.join(', '),
          damageTypes: monster.damageTypes.join(', '),
        });
        setImagePreview(monster.image || null);
      } else {
        form.reset({
          name: '',
          description: '',
          behavior: 'neutral',
          hitPoints: null,
          image: null,
          resistances: '',
          damageTypes: '',
        });
        setImagePreview(null);
      }
    }
  }, [monster, isOpen, form]);

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
        hitPoints: values.hitPoints || null,
        resistances: values.resistances ? values.resistances.split(',').map(s => s.trim()).filter(Boolean) : [],
        damageTypes: values.damageTypes ? values.damageTypes.split(',').map(s => s.trim()).filter(Boolean) : [],
    };
    onSave(processedData);
    onOpenChange(false);
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline">{monster ? t('Edit Creature') : t('Add New Creature')}</DialogTitle>
              <DialogDescription>
                {t('Detail a new creature for the bestiary.')}
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
                                    <Image src={imagePreview} alt="Recipe Preview" width={80} height={60} className="rounded-md object-cover" />
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
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                            <FormLabel>{t('Creature Name')}</FormLabel>
                            <FormControl><Input placeholder={t('e.g., Grumpy Owlbear')} {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="hitPoints" render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('Hit Points (HP)')}</FormLabel>
                            <FormControl><Input type="number" placeholder="e.g., 59" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                
                 <FormField control={form.control} name="behavior" render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('Behavior')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="aggressive">{t('Aggressive')}</SelectItem>
                                <SelectItem value="neutral">{t('Neutral')}</SelectItem>
                                <SelectItem value="friendly">{t('Friendly')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('Description')}</FormLabel>
                        <FormControl><Textarea placeholder={t('Describe the creature\'s appearance, habits, and any notable features.')} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="resistances" render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('Resistances')}</FormLabel>
                        <FormControl><Input placeholder={t('Fire, Bludgeoning, ... (comma-separated)')} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="damageTypes" render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('Damage Types')}</FormLabel>
                        <FormControl><Input placeholder={t('Slashing, Poison, ... (comma-separated)')} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                
                <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
                    <Button type="submit">{monster ? t('Save Changes') : t('Add Creature')}</Button>
                </DialogFooter>
              </form>
            </Form>
      </DialogContent>
    </Dialog>
  );
}
