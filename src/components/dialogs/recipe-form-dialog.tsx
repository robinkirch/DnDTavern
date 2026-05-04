'use client';

import { useEffect, ChangeEvent, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Recipe, Grimoire } from '@/lib/types';
import { useI18n } from '@/context/i18n-context';
import { Button } from '@/components/ui/button';
import { Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle } from '@/components/ui/dialog';
import {Form,FormControl,FormField,FormItem,FormLabel,FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { resizeImage } from '../../lib/utils'


const formSchema = z.object({
  name: z.string().min(3, 'Recipe name must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  secretDescription: z.string().optional(),
  categoryIds: z.array(z.string()).min(1, "At least one category is required."),
  rarityId: z.string().min(1, "Rarity is required."),
  components: z.array(z.object({
    recipeId: z.string().min(1, 'Ingredient is required.'),
    quantity: z.string().min(1, 'Quantity is required.'),
  })).optional(),
  image: z.string().nullable(),
  value: z.string().nullable(),
  aliases: z.string().nullable(),
  isFood: z.preprocess(
    (val) => (typeof val === 'number' ? val === 1 : !!val), 
    z.boolean().default(false)
  ),
  isBackpack: z.preprocess(
    (val) => (typeof val === 'number' ? val === 1 : !!val), 
    z.boolean().default(false)
  ),
  metadata: z.string().nullable().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface RecipeFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (recipe: Recipe) => void;
  recipe?: Recipe | null;
  grimoire: Grimoire | null;
}

export function RecipeFormDialog({ isOpen, onOpenChange, onSave, recipe, grimoire }: RecipeFormDialogProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'components',
  });

  useEffect(() => {
    if (isOpen) {
      if (recipe) {
        form.reset({
          ...recipe,
          secretDescription: recipe.secretDescription || '',
          image: recipe.image || null,
          value: recipe.value || null,
          isFood: recipe.isFood ?? false,
          isBackpack: recipe.isBackpack ?? false,
          metadata: recipe.metadata ? JSON.stringify(recipe.metadata, null, 2) : '',
        });
        setImagePreview(recipe.image || null);
      } else {
        form.reset({
          name: '',
          description: '',
          secretDescription: '',
          categoryIds: [],
          rarityId: grimoire?.rarities[0]?.id || '',
          components: [],
          image: null,
          value: null,
          isFood: false,
          isBackpack: false,
          metadata: '',
        });
        setImagePreview(null);
      }
    }
  }, [recipe, isOpen, form, grimoire]);

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resizedImage = await resizeImage(file, 400, 300);
        form.setValue('image', resizedImage, { shouldValidate: true });
        setImagePreview(resizedImage);
      } catch (error) {
        console.error("Failed to resize image", error);
        // Optionally show a toast to the user
      }
    }
  };

  function onSubmit(values: FormData) {
    let parsedMetadata = null;
    try {
      parsedMetadata = values.metadata ? JSON.parse(values.metadata) : null;
    } catch (e) {
      form.setError('metadata', { message: 'Invalid JSON format' });
      return;
    }

    const newRecipe: Recipe = {
      ...values,
      secretDescription: values.secretDescription || null,
      id: recipe?.id || new Date().toISOString() + Math.random(),
      image: values.image || null,
      value: values.value || null,
      components: values.components || [],
      metadata: parsedMetadata,
    };
    onSave(newRecipe);
    onOpenChange(false);
  }
  
  if (!grimoire) {
    return (
       <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>{t('Error')}</DialogTitle>
                    <DialogDescription>
                        {t('Cannot create or edit a recipe without a valid Grimoire. Please select a Grimoire first.')}
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
       </Dialog>
    );
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline">{recipe ? t('Edit Recipe') : t('Create New Recipe')}</DialogTitle>
              <DialogDescription>
                {recipe ? t('Update the details for this recipe.') : t('Fill in the details for your new creation. Recipes without ingredients are considered base components.')}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Recipe/Component Name')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('e.g., Owlbear Omelette or Glimmer-root')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                                            {t('Upload (500x500)')}
                                        </Button>
                                    </div>
                                </FormControl>
                            </div>
                             <FormMessage />
                        </FormItem>
                    )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="categoryIds"
                      render={() => (
                        <FormItem>
                          <FormLabel>{t('Category')}</FormLabel>
                          <ScrollArea className="h-32 w-full rounded-md border p-4">
                            {grimoire.categories.map((item) => (
                              <FormField
                                key={item.id}
                                control={form.control}
                                name="categoryIds"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={item.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(item.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...(field.value || []), item.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== item.id
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {item.name}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </ScrollArea>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className='space-y-2'>
                        <FormField
                        control={form.control}
                        name="rarityId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t('Rarity')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('Select a rarity')} />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {grimoire.rarities.map(rarity => (
                                    <SelectItem key={rarity.id} value={rarity.id}>{rarity.name}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('Value (Optional)')}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t('e.g., 50gp')} {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="aliases"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Aliases (For searching)')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('Plant, herb, dangerous, etc.')} {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 border p-3 rounded-md bg-muted/20">
                <FormField
                  control={form.control}
                  name="isFood"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={!!field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
                      </FormControl>
                      <FormLabel>{t('Is it Food ?')}</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isBackpack"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={!!field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
                      </FormControl>
                      <FormLabel>{t('Is it a Backpack ?')}</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="metadata"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Metadata (JSON)')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={'e.g. { "slots": 10, "weight": 2 }'} 
                        className="font-mono text-xs"
                        {...field} 
                        value={field.value ?? ''}
                      />
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
                      <FormLabel>{t('Description (Player-facing)')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t('A short, enticing description visible to players.')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secretDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Secret Notes (DM only)')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t('Secret details or substitutions only visible to you.')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <FormLabel>{t('Ingredients (Optional)')}</FormLabel>
                  <div className="space-y-3 pt-1">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-[1fr,2fr,auto] gap-2 items-center p-3 border rounded-md">
                        <FormField
                          control={form.control}
                          name={`components.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                                <FormLabel className="sr-only">{t('Quantity')}</FormLabel>
                              <FormControl>
                                <Input placeholder={t('1 cup')} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`components.${index}.recipeId`}
                          render={({ field: recipeIdField }) => (
                            <FormItem>
                                <FormLabel className="sr-only">{t('Ingredient')}</FormLabel>
                                <Select onValueChange={recipeIdField.onChange} value={recipeIdField.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Select an ingredient...')} />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {grimoire.recipes.filter(r => r.id !== recipe?.id).map(rec => (
                                            <SelectItem key={rec.id} value={rec.id}>{rec.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                               <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                   <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => append({ recipeId: '', quantity: '' })}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {t('Add Ingredient')}
                    </Button>
                </div>
                
                <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
                    <Button type="submit">{t('Save Recipe')}</Button>
                </DialogFooter>
              </form>
            </Form>
      </DialogContent>
    </Dialog>
  );
}
