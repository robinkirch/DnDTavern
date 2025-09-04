'use client';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Grimoire, Recipe, InventoryItem } from '@/lib/types';
import { useI18n } from '@/context/i18n-context';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';

const grimoireItemSchema = z.object({
  recipeId: z.string().min(1, 'Please select an item.'),
  quantity: z.number().min(1, 'Quantity must be at least 1.'),
});

const customItemSchema = z.object({
  name: z.string().min(1, 'Item name is required.'),
  description: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1.'),
  value: z.string().optional(),
});

interface AddInventoryItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (item: InventoryItem) => void;
  grimoire: Grimoire | null;
}

export function AddInventoryItemDialog({ isOpen, onOpenChange, onSave, grimoire }: AddInventoryItemDialogProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('grimoire');

  const grimoireForm = useForm({
    resolver: zodResolver(grimoireItemSchema),
    defaultValues: { recipeId: '', quantity: 1 },
  });

  const customForm = useForm({
    resolver: zodResolver(customItemSchema),
    defaultValues: { name: '', description: '', quantity: 1, value: '' },
  });

  const handleGrimoireSubmit = (values: z.infer<typeof grimoireItemSchema>) => {
    if (!grimoire) return;
    const selectedRecipe = grimoire.recipes.find(r => r.id === values.recipeId);
    if (!selectedRecipe) return;

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      recipeId: selectedRecipe.id,
      name: selectedRecipe.name,
      description: selectedRecipe.description,
      quantity: values.quantity,
      value: selectedRecipe.value,
      isCustom: false,
    };
    onSave(newItem);
    grimoireForm.reset();
  };

  const handleCustomSubmit = (values: z.infer<typeof customItemSchema>) => {
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      recipeId: null,
      name: values.name,
      description: values.description || null,
      quantity: values.quantity,
      value: values.value || null,
      isCustom: true,
    };
    onSave(newItem);
    customForm.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">{t('Add Item to Inventory')}</DialogTitle>
          <DialogDescription>{t('Add an item from the grimoire or create a custom one.')}</DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="grimoire" disabled={!grimoire}>{t('Grimoire Item')}</TabsTrigger>
                <TabsTrigger value="custom">{t('Custom Item')}</TabsTrigger>
            </TabsList>
            <TabsContent value="grimoire">
                 <Form {...grimoireForm}>
                    <form onSubmit={grimoireForm.handleSubmit(handleGrimoireSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={grimoireForm.control}
                            name="recipeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('Item')}</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder={t('Select an item...')} /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {grimoire?.recipes.map((recipe: Recipe) => (
                                                <SelectItem key={recipe.id} value={recipe.id}>{recipe.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={grimoireForm.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('Quantity')}</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">{t('Add to Inventory')}</Button>
                        </DialogFooter>
                    </form>
                 </Form>
            </TabsContent>
            <TabsContent value="custom">
                <Form {...customForm}>
                    <form onSubmit={customForm.handleSubmit(handleCustomSubmit)} className="space-y-4 py-4">
                        <FormField control={customForm.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>{t('Item Name')}</FormLabel><FormControl><Input {...field} placeholder={t('e.g., A mysterious amulet')} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={customForm.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>{t('Description')}</FormLabel><FormControl><Textarea {...field} placeholder={t('A short description of the item.')} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <div className="grid grid-cols-2 gap-4">
                             <FormField control={customForm.control} name="quantity" render={({ field }) => (
                                <FormItem><FormLabel>{t('Quantity')}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={customForm.control} name="value" render={({ field }) => (
                                <FormItem><FormLabel>{t('Value (Optional)')}</FormLabel><FormControl><Input {...field} placeholder={t('e.g., 50gp')} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <DialogFooter>
                            <Button type="submit">{t('Add to Inventory')}</Button>
                        </DialogFooter>
                    </form>
                 </Form>
            </TabsContent>
        </Tabs>

      </DialogContent>
    </Dialog>
  );
}

    