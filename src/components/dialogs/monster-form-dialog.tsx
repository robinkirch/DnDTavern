'use client';

import { useEffect, ChangeEvent, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Monster, DamageType } from '@/lib/types';
import { useI18n } from '@/context/i18n-context';
import { Button } from '@/components/ui/button';
import { fetchDamageTypes } from '@/lib/data-service';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { resizeImage } from '../../lib/utils'

const formSchema = z.object({
  name: z.string().min(1, 'Creature name is required.'),
  description: z.string().min(1, 'Description is required.'),
  behavior: z.enum(['aggressive', 'neutral', 'friendly']),
  hitPoints: z.coerce.number().positive().nullable(),
  image: z.string().nullable(),
  location: z.string().default(''),
  isNPC: z.boolean().default(false),
  resistances: z.array(z.number()).default([]),
  immunities: z.array(z.number()).default([]),
  vulnerabilities: z.array(z.number()).default([]),
});

type FormData = z.infer<typeof formSchema>;

interface MonsterFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (monster: Omit<Monster, 'id' | 'creatorUsername'>) => void;
  monster?: Monster | null;
  grimoireId: string;
}

export function MonsterFormDialog({ isOpen, onOpenChange, onSave, monster, grimoireId }: MonsterFormDialogProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [damageTypes, setDamageTypes] = useState<DamageType[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      behavior: 'neutral',
      hitPoints: null,
      image: null,
      location: '',
      isNPC: false,
      resistances: [],
      immunities: [],
      vulnerabilities: [],
    }
  });

  // 1. Damage Types laden, sobald der Dialog öffnet
  useEffect(() => {
    if (isOpen && damageTypes.length === 0) {
      fetchDamageTypes(grimoireId).then(setDamageTypes).catch(console.error);
    }
  }, [isOpen, damageTypes]);

  // 2. Formular zurücksetzen, wenn ein Monster geladen wird
  useEffect(() => {
    if (isOpen) {
      if (monster) {
        form.reset({
          name: monster.name,
          description: monster.description,
          behavior: monster.behavior as 'aggressive' | 'neutral' | 'friendly',
          hitPoints: monster.hitPoints,
          image: monster.image,
          location: monster.location || '',
          isNPC: !!monster.isNPC,
          resistances: monster.resistances || [],
          immunities: monster.immunities || [],
          vulnerabilities: monster.vulnerabilities || [],
        });
        setImagePreview(monster.image || null);
      } else {
        form.reset({
          name: '',
          description: '',
          behavior: 'neutral',
          hitPoints: null,
          image: null,
          location: '',
          isNPC: false,
          resistances: [],
          immunities: [],
          vulnerabilities: [],
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

  const getLocalizedName = (dt: DamageType) => {
  const name = t(dt.name as any); 
  const categoryLabel = dt.category !== 'special' ? ` (${t(dt.category as any)})` : '';
    
  return `${name}${categoryLabel}`;
};

  function onSubmit(values: FormData) {
    onSave(values);
    onOpenChange(false);
  }

  // Hilfskomponente für die Checkbox-Listen
  const DamageTypeList = ({ title, fieldName }: { title: string, fieldName: keyof FormData }) => (
    <FormField
      control={form.control}
      name={fieldName as any}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel>{t(title as any)}</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-md p-3 max-h-40 overflow-y-auto bg-muted/20">
            {damageTypes.map((dt) => (
              <div key={dt.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`${fieldName}-${dt.id}`}
                  checked={(field.value as number[])?.includes(dt.id)}
                  onCheckedChange={(checked) => {
                    const currentValues = (field.value as number[]) || [];
                    const newValue = checked
                      ? [...currentValues, dt.id]
                      : currentValues.filter((id) => id !== dt.id);
                    field.onChange(newValue);
                  }}
                />
                <label htmlFor={`${fieldName}-${dt.id}`} className="text-sm leading-none cursor-pointer">
                  {getLocalizedName(dt)}
                </label>
              </div>
            ))}
          </div>
        </FormItem>
      )}
    />
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">{monster ? t('Edit Creature') : t('Add New Creature')}</DialogTitle>
          <DialogDescription>{t('Detail a new creature for the bestiary.')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 overflow-y-auto pr-2">
            
            {/* Image Upload Section */}
            <div className="flex flex-row justify-between items-start gap-4">
              <FormField
                control={form.control}
                name="image"
                render={() => (
                  <FormItem className="flex-1">
                    <FormLabel>{t('Image')}</FormLabel>
                    <div className="flex items-center gap-4">
                      <div className="relative w-32 h-24 border-2 border-dashed rounded-md bg-muted flex items-center justify-center overflow-hidden">
                        {imagePreview ? (
                          <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                        ) : (
                          <span className="text-[10px] text-muted-foreground">-</span>
                        )}
                      </div>
                      <FormControl>
                        <div className="flex flex-col gap-2">
                          <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                            {t('Upload Image')}
                          </Button>
                        </div>
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />

              {/* NPC Switch in der rechten Ecke */}
              <FormField
                control={form.control}
                name="isNPC"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center justify-center space-y-2 border rounded-lg p-3 bg-muted/30 min-w-[120px]">
                    <Label htmlFor="npc-mode" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {field.value ? t('NPC') : t('Monster')}
                    </Label>
                    <FormControl>
                      <Switch
                        id="npc-mode"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t('Monster/NPC Name')}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="hitPoints" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Hit Points (HP)')}</FormLabel>
                  <FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Location')}</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />

            <FormField control={form.control} name="behavior" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Behavior')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="aggressive">{t('Aggressive')}</SelectItem>
                    <SelectItem value="neutral">{t('Neutral')}</SelectItem>
                    <SelectItem value="friendly">{t('Friendly')}</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Description')}</FormLabel>
                <FormControl><Textarea rows={3} {...field} /></FormControl>
              </FormItem>
            )} />

            {/* Hier kommen die drei neuen ID-Listen */}
            <div className="space-y-6">
                <DamageTypeList title="Resistances" fieldName="resistances" />
                <DamageTypeList title="Immunities" fieldName="immunities" />
                <DamageTypeList title="Vulnerabilities" fieldName="vulnerabilities" />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
              <Button type="submit">{monster ? t('Save Changes') : t('Add Creature')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}