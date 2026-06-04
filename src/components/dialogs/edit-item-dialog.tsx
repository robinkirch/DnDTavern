'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { InventoryItem } from '@/lib/types';
import { useI18n } from '@/context/i18n-context';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';

import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';

const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  quantity: z.number().min(1).default(1),
  value: z.string().optional().nullable(),
  isFood: z.preprocess((val) => Boolean(val), z.boolean().default(false)),
  isKey: z.preprocess((val) => Boolean(val), z.boolean().default(false)),
  isQuestItem: z.preprocess((val) => Boolean(val), z.boolean().default(false)),
  foodValue: z.string().default('1'),
});

interface EditItemDialogProps {
    item: InventoryItem | null
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSave: (item: InventoryItem) => void;
}

export function EditItemDialog({ item, isOpen, onOpenChange, onSave}: EditItemDialogProps) {
  const { t } = useI18n();

  const form = useForm({
    resolver: zodResolver(itemSchema),
    defaultValues: { 
      name: '', description: '', quantity: 1,
      value: '', isFood: false, foodValue: '0', isQuestItem: false, isKey: false 
    },
  });

  useEffect(() => {
    if (isOpen && item) {
      const meta = typeof item.metadata === "string" && item.metadata.trim() !== "" ? JSON.parse(item.metadata) : (item.metadata || {});

      console.log(meta);
      console.log(item);
      form.reset({
        name: item.name || '',
        description: item.description || '',
        quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) || 1 : item.quantity || 1,
        value: item.value || '',
        isFood: meta.isFood || false,
        isKey: meta.isKey || false,
        isQuestItem: meta.isQuestItem || false,
        foodValue: meta.food || '0',
      });
    }
  }, [isOpen, form]);

  const isFoodChecked = form.watch('isFood');
  const isCustom = !(item && item.recipeIds && item.recipeIds.length > 0);

  const onSubmit = async (values: z.infer<typeof itemSchema>) => {

    const metadataObj = {
      isQuestItem: values.isQuestItem,
      isFood: values.isFood,
      food: values.isFood ? values.foodValue : null,
      isKey: values.isKey
    };

    const newItem: InventoryItem = {
      id: item!.id,
      recipeIds: item!.recipeIds,
      name: values.name,
      description: values.description || null,
      quantity: values.quantity.toString(),
      value: values.value || null,
      isCustom: isCustom,
      image: item?.image || null,
      isBackpack: item?.isBackpack || false,
      isFood: values.isFood,
      metadata: JSON.stringify(metadataObj),
      isCurrentBackpack: item!.isCurrentBackpack,
      isTemporary: item!.isBackpack,
      isLocked: item!.isLocked,
      originalRecipeId: item!.originalRecipeId,
      inventoryName: item!.inventoryName,
      slotNumber: item!.slotNumber
    };

    onSave(newItem);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-headline">
            {t('Edit Item')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="relative">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-400 text-xs uppercase tracking-wider">{t('Item Name')}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="border-slate-700 focus:border-blue-500"
                        autoComplete="off"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-400 text-xs uppercase tracking-wider">{t('Description')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      readOnly={!isCustom}
                      className={`h-20 resize-none border-slate-700 ${!isCustom ? 'opacity-60 cursor-not-allowed' : ''}`} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex flex-wrap gap-4 p-3 rounded-lg border border-slate-800/50">
              <FormField control={form.control} name="isFood" render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={(val) => { 
                      field.onChange(val); 
                      if(val) form.setValue('isKey', false); 
                    }} 
                    disabled={!isCustom} 
                  />
                  <FormLabel className="text-xs text-slate-300 cursor-pointer">{t('Food')}</FormLabel>
                </FormItem>
              )} />

              <FormField control={form.control} name="isKey" render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={(val) => { 
                      field.onChange(val); 
                      if(val) form.setValue('isFood', false); 
                    }} 
                    disabled={!isCustom} 
                  />
                  <FormLabel className="text-xs text-slate-300 cursor-pointer">{t('Key')}</FormLabel>
                </FormItem>
              )} />

              <FormField control={form.control} name="isQuestItem" render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  <FormLabel className="text-xs text-slate-300 cursor-pointer">{t('QuestItem')}</FormLabel>
                </FormItem>
              )} />
            </div>

            {!!isFoodChecked && (
              <FormField
                control={form.control}
                name="foodValue"
                render={({ field }) => (
                  <FormItem className="animate-in fade-in slide-in-from-top-1">
                    <FormLabel className="text-slate-400 text-[10px] uppercase">{t("Food Supply Value")}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        className={`border-slate-700 h-8 ${!isCustom ? 'opacity-60 cursor-not-allowed' : ''}`}
                        readOnly={!isCustom}
                        min={1}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-400 text-xs uppercase tracking-wider">{t('Quantity')}</FormLabel>
                  <Input type="number" {...field} className="border-slate-700" onChange={e => field.onChange(parseInt(e.target.value) || 1)} />
                </FormItem>
              )} />
              <FormField control={form.control} name="value" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-400 text-xs uppercase tracking-wider">{t('Value (Optional)')}</FormLabel>
                  <Input {...field} readOnly={!isCustom} className={`border-slate-700 ${!isCustom ? 'opacity-60 cursor-not-allowed' : ''}`} placeholder={t('e.g., 50gp')} />
                </FormItem>
              )} />
            </div>

            <DialogFooter className="pt-2">
              <Button type="submit" className={`w-full ${isCustom ? 'bg-blue-600 hover:bg-blue-500' : 'bg-amber-600 hover:bg-amber-500'}`}>
                {t('Edit Item')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}