'use client';
import { useState, useMemo } from 'react';
import type { Recipe } from '@/lib/types';
import { RecipeCard } from './recipe-card';
import { Input } from './ui/input';
import { PlusCircle, Search } from 'lucide-react';
import { Button } from './ui/button';
import { RecipeFormDialog } from './recipe-form-dialog';
import { mockGrimoires } from '@/lib/mock-data'; 

interface RecipeGridProps {
  grimoireId: string;
  canEdit: boolean;
}

export function RecipeGrid({ canEdit, grimoireId }: RecipeGridProps) {
  const grimoire = useMemo(() => mockGrimoires.find(g => g.id === grimoireId), [grimoireId]);
  
  const [recipes, setRecipes] = useState(grimoire?.recipes || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const getComponentName = (componentId: string) => {
    return grimoire?.components.find(c => c.id === componentId)?.name.toLowerCase() || '';
  };

  const filteredRecipes = recipes.filter(recipe => {
    const term = searchTerm.toLowerCase();
    return (
      recipe.name.toLowerCase().includes(term) ||
      recipe.description.toLowerCase().includes(term) ||
      recipe.components.some(c => getComponentName(c.componentId).includes(term))
    );
  });
  
  const handleAddRecipe = () => {
    setEditingRecipe(null);
    setFormOpen(true);
  };

  const handleEditRecipe = (id: string) => {
    const recipeToEdit = recipes.find(r => r.id === id);
    if(recipeToEdit) {
        setEditingRecipe(recipeToEdit);
        setFormOpen(true);
    }
  };

  const handleDeleteRecipe = (id: string) => {
    if(confirm('Are you sure you want to delete this recipe? This cannot be undone.')) {
        const updatedRecipes = recipes.filter(r => r.id !== id);
        setRecipes(updatedRecipes);
        
        const grimoireIndex = mockGrimoires.findIndex(g => g.id === grimoireId);
        if (grimoireIndex !== -1) {
            mockGrimoires[grimoireIndex].recipes = updatedRecipes;
        }
    }
  };

  const handleSaveRecipe = (savedRecipe: Recipe) => {
    let updatedRecipes;
    if (editingRecipe) {
      updatedRecipes = recipes.map(r => (r.id === savedRecipe.id ? savedRecipe : r));
    } else {
      updatedRecipes = [...recipes, savedRecipe];
    }
    setRecipes(updatedRecipes);

    const grimoireIndex = mockGrimoires.findIndex(g => g.id === grimoireId);
    if (grimoireIndex !== -1) {
        mockGrimoires[grimoireIndex].recipes = updatedRecipes;
    }

    setFormOpen(false);
    setEditingRecipe(null);
  };

  if (!grimoire) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
        <h3 className="font-headline text-2xl">Grimoire Not Found</h3>
        <p className="text-muted-foreground">This collection of recipes could not be loaded.</p>
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
        grimoireId={grimoireId}
      />
      <div>
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search recipes or ingredients..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {canEdit && (
            <Button onClick={handleAddRecipe}>
                <PlusCircle className="mr-2 h-4 w-4"/>
                Create New Recipe
            </Button>
          )}
        </div>

        {filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} grimoireId={grimoireId} canEdit={canEdit} onEdit={handleEditRecipe} onDelete={handleDeleteRecipe} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="font-headline text-2xl">No Recipes Found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? `No recipes match "${searchTerm}".` : "This grimoire is empty."}
            </p>
            {canEdit && !searchTerm && (
              <Button onClick={handleAddRecipe} className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4"/>
                Create the First Recipe
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
