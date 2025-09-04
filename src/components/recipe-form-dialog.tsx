'use client';

import { useEffect, ChangeEvent, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Recipe, Grimoire } from '@/lib/types';
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
import { PlusCircle, Trash2, Upload } from 'lucide-react';
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
  name: z.string().min(3, 'Recipe name must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  secretDescription: z.string().optional(),
  categoryId: z.string().min(1, "Category is required."),
  rarityId: z.string().min(1, "Rarity is required."),
  components: z.array(z.object({
    recipeId: z.string().min(1, 'Ingredient is required.'),
    quantity: z.string().min(1, 'Quantity is required.'),
  })).optional(),
  image: z.string().nullable(),
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
        });
        setImagePreview(recipe.image || null);
      } else {
        form.reset({
          name: '',
          description: '',
          secretDescription: '',
          categoryId: grimoire?.categories[0]?.id || '',
          rarityId: grimoire?.rarities[0]?.id || '',
          components: [],
          image: null,
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
    const newRecipe: Recipe = {
      ...values,
      secretDescription: values.secretDescription || null,
      id: recipe?.id || new Date().toISOString() + Math.random(),
      image: values.image || null,
      components: values.components || [],
    };
    onSave(newRecipe);
    onOpenChange(false);
  }
  
  if (!grimoire) {
    return (
       <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Error</DialogTitle>
                    <DialogDescription>
                        Cannot create or edit a recipe without a valid Grimoire. Please select a Grimoire first.
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
              <DialogTitle className="font-headline">{recipe ? 'Edit Recipe' : 'Create New Recipe'}</DialogTitle>
              <DialogDescription>
                {recipe ? 'Update the details for this recipe.' : 'Fill in the details for your new creation. Recipes without ingredients are considered base components.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipe/Component Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Owlbear Omelette or Glimmer-root" {...field} />
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
                            <FormLabel>Image</FormLabel>
                            <div className="flex items-center gap-4">
                                {imagePreview && (
                                    <Image src={imagePreview} alt="Recipe Preview" width={80} height={60} className="rounded-md object-cover" />
                                )}
                                <FormControl>
                                    <>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageChange}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Upload (400x300)
                                        </Button>
                                    </>
                                </FormControl>
                            </div>
                             <FormMessage />
                        </FormItem>
                    )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {grimoire.categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="rarityId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Rarity</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a rarity" />
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
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Player-facing)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="A short, enticing description visible to players." {...field} />
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
                      <FormLabel>Secret Notes (DM only)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Secret details or substitutions only visible to you." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <FormLabel>Ingredients (Optional)</FormLabel>
                  <div className="space-y-3 pt-1">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-[1fr,2fr,auto] gap-2 items-center p-3 border rounded-md">
                        <FormField
                          control={form.control}
                          name={`components.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                                <FormLabel className="sr-only">Quantity</FormLabel>
                              <FormControl>
                                <Input placeholder="1 cup" {...field} />
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
                                <FormLabel className="sr-only">Ingredient</FormLabel>
                                <Select onValueChange={recipeIdField.onChange} value={recipeIdField.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={'Select an ingredient...'} />
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
                      Add Ingredient
                    </Button>
                </div>
                
                <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit">Save Recipe</Button>
                </DialogFooter>
              </form>
            </Form>
      </DialogContent>
    </Dialog>
  );
}
