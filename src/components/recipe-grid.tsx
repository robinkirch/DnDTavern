'use client';
import { useState, useMemo, useEffect } from 'react';
import type { Recipe, Grimoire, Category, PermissionLevel } from '@/lib/types';
import { useI18n } from '@/context/i18n-context';
import { useAuth } from '@/context/auth-context';
import { CardSelection } from './recipe-card';
import { Input } from './ui/input';
import { PlusCircle, Search } from 'lucide-react';
import { Button } from './ui/button';
import { RecipeFormDialog } from './recipe-form-dialog';
import { getGrimoireById, saveRecipe, deleteRecipe } from '@/lib/data-service'; 
import { Skeleton } from './ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ActionConfirmDialog, ConfirmDialogData } from './ConfirmDialog';

interface RecipeGridProps {
  grimoire: Grimoire | null;
  grimoireId: string; //Fallback
  canEdit: boolean;
  userPermissions?: { [categoryId: string]: PermissionLevel };
}

export function RecipeGrid({ canEdit, grimoire, grimoireId, userPermissions = {} }: RecipeGridProps) {
  const { t } = useI18n();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [grim, setGrimoire] = useState<Grimoire | null>(grimoire);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

   useEffect(() => {
    if(!grimoire)
      getGrimoireById(grimoireId).then(data => {
        setGrimoire(data);
        setIsLoading(false);
      });
    else {
      setGrimoire(grimoire);
       setIsLoading(false);
    }
  }, [grimoireId]);

  const getRecipeName = (recipeId: string) => {
    return grim?.recipes.find(r => r.id === recipeId)?.name.toLowerCase() || '';
  };

  const getCategoryName = (categoryId: string) => {
    return grim?.categories.find(c => c.id === categoryId)?.name.toLowerCase() || '';
  }

  const getPermissionForRecipe = (recipe: Recipe): PermissionLevel => {
    if (canEdit) return 'full'; // DM always has full access
    
    // If no specific permissions are set for the user, default to full access.
    if (Object.keys(userPermissions).length === 0) return 'full';

    // The most restrictive permission applies.
    // Start with the least restrictive and move to most restrictive.
    let highestPermission: PermissionLevel = 'full';

    for (const catId of recipe.categoryIds) {
        const perm = userPermissions[catId] || 'full'; // Default to full if a category is not explicitly set
        
        if (perm === 'none') {
            return 'none'; // 'none' overrides everything
        }
        if (perm === 'partial') {
            highestPermission = 'partial'; // 'partial' is more restrictive than 'full'
        }
    }
    return highestPermission;
  };

  const filteredRecipes = useMemo(() => {
     if (!grim) return [];

     return grim.recipes.filter(recipe => {
        const term = searchTerm.toLowerCase();
        const permission = getPermissionForRecipe(recipe);

        if (permission === 'none') return false;

        const categoryFilter = selectedCategory === 'all' || recipe.categoryIds.includes(selectedCategory);
        
        const searchFilter = (
          recipe.name.toLowerCase().includes(term) ||
          recipe.description.toLowerCase().includes(term) ||
          recipe.components.some(c => getRecipeName(c.recipeId).includes(term)) ||
          recipe.categoryIds.some(c => getCategoryName(c).includes(term))
        );
        
        return categoryFilter && searchFilter;
      });
  }, [grim, searchTerm, selectedCategory, canEdit, user, userPermissions]);

  
  const handleAddRecipe = () => {
    setEditingRecipe(null);
    setFormOpen(true);
  };

  const handleEditRecipe = (id: string) => {
    const recipeToEdit = grim?.recipes.find(r => r.id === id);
    if(recipeToEdit) {
        setEditingRecipe(recipeToEdit);
        setFormOpen(true);
    }
  };

  const [confirmData, setConfirmData] = useState<ConfirmDialogData>({isOpen: false,title: '',description: '', errorDescription: null, successTitle:'', onConfirm: null,onClose: () => setConfirmData(prev => ({ ...prev, isOpen: false }))});
  const showConfirm = (title: string, description: string, successTitle: string, action: () => void, errorDescription?: string | null, successDescription?: string | null) => {
      setConfirmData(prev => ({
          ...prev,
          isOpen: true,
          title,
          description,
          successTitle,
          onConfirm: action,
          errorDescription: errorDescription ?? null,
          successDescription: successDescription ?? null,
      }));
  };

  const handleDeleteRecipe = async (id: string) => {
    showConfirm(
          t('Delete Recipe'),
          t('Are you sure you want to delete this recipe? This cannot be undone.'),
          t('Success'),
          async () => {
              await deleteRecipe(grim!.id, id);
              if (grim) {
                const updatedRecipes = grim.recipes.filter(r => r.id !== id);
                setGrimoire({ ...grim, recipes: updatedRecipes });
              }
          }
      );
  };

  const handleSaveRecipe = async (savedRecipe: Recipe) => {
    await saveRecipe(grim!.id, savedRecipe);
    if (grim) {
      const existingIndex = grim.recipes.findIndex(r => r.id === savedRecipe.id);
      let updatedRecipes;
      if (existingIndex !== -1) {
        updatedRecipes = grim.recipes.map(r => r.id === savedRecipe.id ? savedRecipe : r);
      } else {
        updatedRecipes = [...grim.recipes, savedRecipe];
      }
      setGrimoire({ ...grim, recipes: updatedRecipes });
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

  if (!grim) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
        <h3 className="font-headline text-2xl">{t('Grimoire Not Found')}</h3>
        <p className="text-muted-foreground">{t('This collection of recipes could not be loaded.')}</p>
      </div>
    )
  }

  return (
    <>
      <ActionConfirmDialog  data={confirmData} />
      <RecipeFormDialog
        isOpen={isFormOpen}
        onOpenChange={setFormOpen}
        onSave={handleSaveRecipe}
        recipe={editingRecipe}
        grimoire={grim}
      />
      <div>
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <div className="flex gap-2 w-full flex-col sm:flex-row">
            <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                placeholder={t('Search recipes or ingredients...')}
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                <SelectTrigger className='w-full sm:max-w-[200px]'>
                    <SelectValue placeholder={t('Filter by category...')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{t('All Categories')}</SelectItem>
                    {grim.categories.map((cat: Category) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          {canEdit && (
            <Button onClick={handleAddRecipe} className='w-full mt-2 md:mt-0 md:w-auto flex-shrink-0'>
                <PlusCircle className="mr-2 h-4 w-4"/>
                {t('Create New Recipe')}
            </Button>
          )}
        </div>

        {filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map(recipe => (
              <CardSelection key={recipe.id} recipe={recipe} grimoire={grim} canEdit={canEdit} permissionLevel={getPermissionForRecipe(recipe)} onEdit={handleEditRecipe} onDelete={handleDeleteRecipe} />
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
