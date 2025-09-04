'use client';
import { useState } from 'react';
import type { Recipe } from '@/lib/types';
import { RecipeCard } from './recipe-card';
import { Input } from './ui/input';
import { Search } from 'lucide-react';
import { Button } from './ui/button';

interface RecipeGridProps {
  initialRecipes: Recipe[];
  isCreator: boolean;
}

export function RecipeGrid({ initialRecipes, isCreator }: RecipeGridProps) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecipes = recipes.filter(recipe => {
    const term = searchTerm.toLowerCase();
    return (
      recipe.name.toLowerCase().includes(term) ||
      recipe.description.toLowerCase().includes(term) ||
      recipe.category.toLowerCase().includes(term) ||
      recipe.ingredients.some(ing => ing.item.toLowerCase().includes(term))
    );
  });
  
  // For demonstration purposes, we'll just log these actions
  const handleAddRecipe = () => {
    console.log("Add new recipe (UI only)");
    alert("This would open a form to add a new recipe.");
  };

  const handleEditRecipe = (id: string) => {
    console.log(`Edit recipe ${id} (UI only)`);
    alert(`This would open a form to edit recipe ${id}.`);
  };

  const handleDeleteRecipe = (id: string) => {
    if(confirm('Are you sure you want to delete this recipe? This cannot be undone.')) {
        setRecipes(recipes.filter(r => r.id !== id));
        console.log(`Deleted recipe ${id}`);
    }
  };

  return (
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
        {isCreator && (
          <Button onClick={handleAddRecipe}>
            Create New Recipe
          </Button>
        )}
      </div>

      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} isCreator={isCreator} onEdit={handleEditRecipe} onDelete={handleDeleteRecipe} />
          ))}
        </div>
      ) : (
         <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
          <h3 className="font-headline text-2xl">No Recipes Found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? `No recipes match "${searchTerm}".` : "This grimoire is empty."}
          </p>
          {isCreator && !searchTerm && (
            <Button onClick={handleAddRecipe} className="mt-4">
              Create the First Recipe
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
