'use client';
import { useState, useMemo, useEffect } from 'react';
import type { Recipe, Grimoire } from '@/lib/types';
import { useI18n } from '@/context/i18n-context';
import { RecipeCard } from './recipe-card';
import { Input } from './ui/input';
import { PlusCircle, Search } from 'lucide-react';
import { Button } from './ui/button';
import { RecipeFormDialog } from './recipe-form-dialog';
import { getGrimoireById, saveRecipe, deleteRecipe } from '@/lib/data-service'; 
import { Skeleton } from './ui/skeleton';

interface RecipeGridProps {
  grimoireId: string;
  canEdit: boolean;
}

export function RecipeGrid({ canEdit, grimoireId }: RecipeGridProps) {
  const { t } = useI18n();
  const [grimoire, setGrimoire] = useState<Grimoire | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    getGrimoireById(grimoireId).then(data => {
      setGrimoire(data);
      setIsLoading(false);
    });
  }, [grimoireId]);

  const getRecipeName = (recipeId: string) => {
    return grimoire?.recipes.find(r => r.id === recipeId)?.name.toLowerCase() || '';
  };

  const getCategoryName = (categoryId: string) => {
    return grimoire?.categories.find(c => c.id === categoryId)?.name.toLowerCase() || '';
  }

  const filteredRecipes = grimoire?.recipes.filter(recipe => {
    const term = searchTerm.toLowerCase();
    return (
      recipe.name.toLowerCase().includes(term) ||
      recipe.description.toLowerCase().includes(term) ||
      recipe.components.some(c => getRecipeName(c.recipeId).includes(term)) ||
      recipe.categoryIds.some(c => getCategoryName(c).includes(term))
    );
  }) || [];
  
  const handleAddRecipe = () => {
    setEditingRecipe(null);
    setFormOpen(true);
  };

  const handleEditRecipe = (id: string) => {
    const recipeToEdit = grimoire?.recipes.find(r => r.id === id);
    if(recipeToEdit) {
        setEditingRecipe(recipeToEdit);
        setFormOpen(true);
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    if(confirm(t('Are you sure you want to delete this recipe? This cannot be undone.'))) {
        await deleteRecipe(grimoireId, id);
        if (grimoire) {
          const updatedRecipes = grimoire.recipes.filter(r => r.id !== id);
          setGrimoire({ ...grimoire, recipes: updatedRecipes });
        }
    }
  };

  const handleSaveRecipe = async (savedRecipe: Recipe) => {
    await saveRecipe(grimoireId, savedRecipe);
    if (grimoire) {
      const existingIndex = grimoire.recipes.findIndex(r => r.id === savedRecipe.id);
      let updatedRecipes;
      if (existingIndex !== -1) {
        updatedRecipes = grimoire.recipes.map(r => r.id === savedRecipe.id ? savedRecipe : r);
      } else {
        updatedRecipes = [...grimoire.recipes, savedRecipe];
      }
      setGrimoire({ ...grimoire, recipes: updatedRecipes });
    }

    setFormOpen(false);
    setEditingRecipe(null);
  };

  if (isLoading) {
    return (
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <Skeleton className="h-96 rounded-lg" />
         <Skeleton className="h-96 rounded-lg" />
         <Skeleton className="h-96 rounded-lg" />
       </div>
    )
  }

  if (!grimoire) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
        <h3 className="font-headline text-2xl">{t('Grimoire Not Found')}</h3>
        <p className="text-muted-foreground">{t('This collection of recipes could not be loaded.')}</p>
      </div>
    )
  }

  return (
    <>
      <RecipeFormDialog
        isOpen={isFormOpen}
        onOpenChange={setFormOpen}
        onSave={handleSaveRecipe}
        recipe={editingRecipe}
        grimoire={grimoire}
      />
      <div>
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t('Search recipes or ingredients...')}
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {canEdit && (
            <Button onClick={handleAddRecipe}>
                <PlusCircle className="mr-2 h-4 w-4"/>
                {t('Create New Recipe')}
            </Button>
          )}
        </div>

        {filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} grimoire={grimoire} canEdit={canEdit} onEdit={handleEditRecipe} onDelete={handleDeleteRecipe} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="font-headline text-2xl">{t('No Recipes Found')}</h3>
            <p className="text-muted-foreground">
              {searchTerm ? t('No recipes match "{{searchTerm}}".', { searchTerm }) : t("This grimoire is empty.")}
            </p>
            {canEdit && !searchTerm && (
              <Button onClick={handleAddRecipe} className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4"/>
                {t('Create the First Recipe')}
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
