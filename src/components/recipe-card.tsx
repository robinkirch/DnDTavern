'use client';
import type { Recipe } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CookingPot, GlassWater, Cookie, TestTube, Pencil, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface RecipeCardProps {
    recipe: Recipe;
    isCreator: boolean;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

const categoryIcons = {
    Meal: <CookingPot className="h-4 w-4" />,
    Drink: <GlassWater className="h-4 w-4" />,
    Snack: <Cookie className="h-4 w-4" />,
    Potion: <TestTube className="h-4 w-4" />,
};

const rarityColors = {
    Common: 'bg-stone-500 hover:bg-stone-600',
    Uncommon: 'bg-green-600 hover:bg-green-700',
    Rare: 'bg-blue-600 hover:bg-blue-700',
    Legendary: 'bg-primary text-primary-foreground hover:bg-primary/90',
};

export function RecipeCard({ recipe, isCreator, onEdit, onDelete }: RecipeCardProps) {
    return (
        <Card className="flex flex-col transition-all duration-300 ease-in-out hover:shadow-lg hover:border-primary/50">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="font-headline text-2xl leading-tight mb-2 pr-4">{recipe.name}</CardTitle>
                    {isCreator && (
                        <div className="flex gap-1 -mr-2 -mt-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(recipe.id)}>
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                            </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(recipe.id)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                            </Button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Badge className={`${rarityColors[recipe.rarity]}`}>{recipe.rarity}</Badge>
                    <Badge variant="outline" className="flex items-center gap-1.5">
                        {categoryIcons[recipe.category]}
                        {recipe.category}
                    </Badge>
                </div>
                <CardDescription className="pt-2">{recipe.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="ingredients">
                        <AccordionTrigger className="font-headline">Ingredients</AccordionTrigger>
                        <AccordionContent>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                {recipe.ingredients.map((ing, i) => (
                                    <li key={i}>
                                        <span className="font-semibold text-foreground">{ing.item}</span> - {ing.quantity}
                                    </li>
                                ))}
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="instructions">
                        <AccordionTrigger className="font-headline">Instructions</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground whitespace-pre-line">
                            {recipe.instructions}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
}
