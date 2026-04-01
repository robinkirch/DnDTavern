'use client';
import { useState, useEffect } from 'react'; // useEffect hinzugefügt
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Grimoire, Recipe, InventoryItem, User } from '@/lib/types';
import { useI18n } from '@/context/i18n-context';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { Input } from '@/components/ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  recipeId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  quantity: z.number().min(1).default(1),
  value: z.string().optional().nullable(),
  isFood: z.preprocess((val) => Boolean(val), z.boolean().default(false)),
  isKey: z.preprocess((val) => Boolean(val), z.boolean().default(false)),
  isQuestItem: z.preprocess((val) => Boolean(val), z.boolean().default(false)),
  foodValue: z.string().default('1'),
});

const itemSchemaAdmin = z.object({
  name: z.string().min(1, 'Name is required'),
  recipeId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  quantity: z.number().min(1).default(1),
  value: z.string().optional().nullable(),
  isFood: z.preprocess((val) => Boolean(val), z.boolean().default(false)),
  isKey: z.preprocess((val) => Boolean(val), z.boolean().default(false)),
  isQuestItem: z.preprocess((val) => Boolean(val), z.boolean().default(false)),
  foodValue: z.string().default('1'),
  targetUser: z.string().min(1, 'Please select a player'),
});

interface AddInventoryItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (item: InventoryItem) => void;
  grimoire: Grimoire | null;
  preset?: 'food' | 'key' | 'normal';
}

interface AddAdminInventoryItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (item: InventoryItem, targetPlayer: string) => void;
  grimoire: Grimoire | null;
  users: User[];
}

export function AddInventoryItemDialog({ isOpen, onOpenChange, onSave, grimoire, preset = 'normal'}: AddInventoryItemDialogProps) {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const form = useForm({
    resolver: zodResolver(itemSchema),
    defaultValues: { 
      name: '', recipeId: '', description: '', quantity: 1, 
      value: '', isFood: false, foodValue: '1', isQuestItem: false, isKey: false 
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (preset === 'food') {
        form.reset({ 
          ...form.getValues(), 
          isFood: true, 
          isKey: false, 
          recipeId: ''
        });
      } else if (preset === 'key') {
        form.reset({ 
          ...form.getValues(), 
          isKey: true, 
          isFood: false, 
          recipeId: '' // Key ist immer Custom
        });
      } else {
        form.reset({ 
          ...form.getValues(), 
          isKey: false, 
          isFood: false, 
          isQuestItem: false,
          description: '',
          quantity: 1,
          name: '',
          recipeId: ''
        });
      }
    }
  }, [isOpen, preset, form]);

  const watchRecipeId = form.watch('recipeId');
  const isFoodChecked = form.watch('isFood');
  const isCustom = !watchRecipeId;

  const suggestions = grimoire?.recipes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (preset === 'food') {
      return matchesSearch && r.isFood;
    }
    if (preset === 'key') {
      return false;
    }
    return matchesSearch;
  }).slice(0, 5) || [];

  const selectRecipe = (recipe: Recipe) => {
    form.setValue('recipeId', recipe.id);
    form.setValue('name', recipe.name);
    form.setValue('description', recipe.description || '');
    form.setValue('value', recipe.value || '');
    form.setValue('isFood', recipe.isFood);

    setSearchTerm(recipe.name);
  };

  const onSubmit = async (values: z.infer<typeof itemSchema>) => {
    const isCustom = !values.recipeId;
    const selectedRecipe = grimoire?.recipes.find(r => r.id === values.recipeId);

    const metadataObj = {
      isQuestItem: values.isQuestItem,
      isFood: values.isFood,
      food: values.isFood ? values.foodValue : null,
      isKey: values.isKey
    };

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      recipeId: values.recipeId || null,
      name: values.name,
      description: values.description || null,
      quantity: values.quantity.toString(),
      value: values.value || null,
      isCustom: isCustom,
      image: selectedRecipe?.image || null,
      isBackpack: selectedRecipe?.isBackpack || false,
      isFood: values.isFood,
      metadata: JSON.stringify(metadataObj),
      isCurrentBackpack: false,
      isTemporary: false,
      isLocked: false,
    };

    await onSave(newItem);
    form.reset();
    setSearchTerm('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-headline">
            {preset === 'food' ? `${t('Add')} ${t('Food')}` : preset === 'key' ? `${t('Add')} ${t('Key')}` : t('Add Item')}
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
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        onChange={(e) => {
                          field.onChange(e);
                          setSearchTerm(e.target.value);
                          if (watchRecipeId) form.setValue('recipeId', ''); 
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {isFocused && searchTerm.length > 1 && suggestions.length > 0 && isCustom && preset !== 'key' && (
                <div className="absolute z-50 w-full border border-slate-700 rounded-md mt-1 shadow-2xl overflow-hidden bg-[#3d3d3d]">
                  {suggestions.map(recipe => (
                    <button
                      key={recipe.id}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-blue-600/20 flex justify-between items-center group transition-all border-b border-slate-700 last:border-0"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        selectRecipe(recipe);
                        setIsFocused(false);
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-100">{recipe.name}</span>
                        <span className="text-[10px] text-slate-500 group-hover:text-blue-300 line-clamp-1">{recipe.description}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border border-slate-700 text-slate-400">{t("Grimoire")}</span>
                    </button>
                  ))}
                </div>
              )}
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
                    disabled={!isCustom || preset === 'food' || preset === 'key'} 
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
                    disabled={!isCustom || preset === 'food' || preset === 'key'} 
                  />
                  <FormLabel className="text-xs text-slate-300 cursor-pointer">{t('Key')}</FormLabel>
                </FormItem>
              )} />

              <FormField control={form.control} name="isQuestItem" render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={!isCustom} />
                  <FormLabel className="text-xs text-slate-300 cursor-pointer">{t('QuestItem')}</FormLabel>
                </FormItem>
              )} />
            </div>

            {isFoodChecked && (
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
                        className="border-slate-700 h-8"
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
                {t('Add to Inventory')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function AddAdminInventoryItemDialog({ isOpen, onOpenChange, onSave, grimoire, users}: AddAdminInventoryItemDialogProps) {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const form = useForm({
    resolver: zodResolver(itemSchemaAdmin),
    defaultValues: { name: '', recipeId: '', description: '', quantity: 1, value: '', isFood: false, foodValue: '1', isQuestItem: false, isKey: false, targetUser: ''
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ 
        ...form.getValues(), 
        isKey: false, 
        isFood: false, 
        isQuestItem: false,
        description: '',
        quantity: 1,
        name: '',
        recipeId: ''
      });
    }
  }, [isOpen, form]);

  const watchRecipeId = form.watch('recipeId');
  const isFoodChecked = form.watch('isFood');
  const isCustom = !watchRecipeId;

  const suggestions = grimoire?.recipes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }).slice(0, 5) || [];

  const selectRecipe = (recipe: Recipe) => {
    form.setValue('recipeId', recipe.id);
    form.setValue('name', recipe.name);
    form.setValue('description', recipe.description || '');
    form.setValue('value', recipe.value || '');
    form.setValue('isFood', recipe.isFood);

    setSearchTerm(recipe.name);
  };

  const onSubmit = async (values: z.infer<typeof itemSchema>) => {
    const isCustom = !values.recipeId;
    const selectedRecipe = grimoire?.recipes.find(r => r.id === values.recipeId);

    const metadataObj = {
      isQuestItem: values.isQuestItem,
      isFood: values.isFood,
      food: values.isFood ? values.foodValue : null,
      isKey: values.isKey
    };

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      recipeId: values.recipeId || null,
      name: values.name,
      description: values.description || null,
      quantity: values.quantity.toString(),
      value: values.value || null,
      isCustom: isCustom,
      image: selectedRecipe?.image || null,
      isBackpack: selectedRecipe?.isBackpack || false,
      isFood: values.isFood,
      metadata: JSON.stringify(metadataObj),
      isCurrentBackpack: false,
      isTemporary: false,
      isLocked: false,
    };

    await onSave(newItem, values.targetUser);
    form.reset();
    setSearchTerm('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-headline">
            {t('Add Item')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="targetUser"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-amber-500 text-xs uppercase tracking-wider font-bold">
                    {t('Assign to Player')}
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-amber-600/50 bg-amber-900/10 focus:ring-amber-500">
                        <SelectValue placeholder={t('Select a player')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {users.map((user: any) => (
                        <SelectItem key={user.username} value={user.username}>
                          {user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <hr className="border-slate-800 my-4" />
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
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        onChange={(e) => {
                          field.onChange(e);
                          setSearchTerm(e.target.value);
                          if (watchRecipeId) form.setValue('recipeId', ''); 
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {isFocused && searchTerm.length > 1 && suggestions.length > 0 && isCustom && (
                <div className="absolute z-50 w-full border border-slate-700 rounded-md mt-1 shadow-2xl overflow-hidden bg-[#3d3d3d]">
                  {suggestions.map(recipe => (
                    <button
                      key={recipe.id}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-blue-600/20 flex justify-between items-center group transition-all border-b border-slate-700 last:border-0"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        selectRecipe(recipe);
                        setIsFocused(false);
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-100">{recipe.name}</span>
                        <span className="text-[10px] text-slate-500 group-hover:text-blue-300 line-clamp-1">{recipe.description}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border border-slate-700 text-slate-400">{t("Grimoire")}</span>
                    </button>
                  ))}
                </div>
              )}
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
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={!isCustom} />
                  <FormLabel className="text-xs text-slate-300 cursor-pointer">{t('QuestItem')}</FormLabel>
                </FormItem>
              )} />
            </div>

            {isFoodChecked && (
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
                        className="border-slate-700 h-8"
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
                {t('Add to Inventory')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}