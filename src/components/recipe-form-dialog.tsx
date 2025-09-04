'use client';

import { useEffect } from 'react';
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
import { PlusCircle, Trash2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(3, 'Recipe name must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  secretDescription: z.string().optional(),
  categoryId: z.string().min(1, "Category is required."),
  rarity: z.enum(['Common', 'Uncommon', 'Rare', 'Legendary']),
  components: z.array(z.object({
    componentId: z.string().min(1, 'Component is required.'),
    quantity: z.string().min(1, 'Quantity is required.'),
  })).min(1, 'At least one component is required.'),
  instructions: z.string().min(10, 'Instructions must be at least 10 characters.'),
});

type FormData = z.infer<typeof formSchema>;

interface RecipeFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (recipe: Recipe) => void;
  recipe?: Recipe | null;
  grimoire: Grimoire;
}

export function RecipeFormDialog({ isOpen, onOpenChange, onSave, recipe, grimoire }: RecipeFormDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'components',
  });

  useEffect(() => {
    if (grimoire) {
        if (recipe) {
          form.reset({
            ...recipe,
            secretDescription: recipe.secretDescription || '',
          });
        } else {
          form.reset({
            name: '',
            description: '',
            secretDescription: '',
            categoryId: grimoire?.categories[0]?.id || '',
            rarity: 'Common',
            components: [{ componentId: '', quantity: '' }],
            instructions: '',
          });
        }
    }
  }, [recipe, isOpen, form, grimoire]);

  function onSubmit(values: FormData) {
    const newRecipe: Recipe = {
      ...values,
      secretDescription: values.secretDescription || null,
      id: recipe?.id || new Date().toISOString() + Math.random(),
    };
    onSave(newRecipe);
    onOpenChange(false);
  }
  
  if (!grimoire) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">{recipe ? 'Edit Recipe' : 'Create New Recipe'}</DialogTitle>
          <DialogDescription>
            {recipe ? 'Update the details for this recipe.' : 'Fill in the details for your new creation.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipe Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Owlbear Omelette" {...field} />
                  </FormControl>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                name="rarity"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Rarity</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a rarity" />
                        </Trigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Common">Common</SelectItem>
                        <SelectItem value="Uncommon">Uncommon</SelectItem>
                        <SelectItem value="Rare">Rare</SelectItem>
                        <SelectItem value="Legendary">Legendary</SelectItem>
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
              <FormLabel>Components / Ingredients</FormLabel>
              <div className="space-y-2 pt-1">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr,2fr,auto] gap-2 items-start">
                    <FormField
                      control={form.control}
                      name={`components.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="1 cup" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`components.${index}.componentId`}
                      render={({ field }) => (
                        <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a component" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {grimoire.components.map(comp => (
                                    <SelectItem key={comp.id} value={comp.id}>{comp.name}</SelectItem>
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
                      className="text-destructive hover:text-destructive mt-1"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
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
                  onClick={() => append({ componentId: '', quantity: '' })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Component
                </Button>
            </div>
            
             <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions</FormLabel>
                  <FormControl>
                    <Textarea placeholder="1. Mix the things.
2. Cook the things.
3. Serve the things." className="min-h-[120px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
