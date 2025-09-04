'use client';
import type { Recipe, Grimoire } from '@/lib/types';
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
    grimoire: Grimoire | null;
    canEdit: boolean;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

const categoryIcons: { [key: string]: JSX.Element } = {
    'cat-meal': <CookingPot className="h-4 w-4" />,
    'cat-drink': <GlassWater className="h-4 w-4" />,
    'cat-snack': <Cookie className="h-4 w-4" />,
    'cat-potion': <TestTube className="h-4 w-4" />,
};

const rarityColors: { [key: string]: string } = {
    Common: 'bg-stone-500 hover:bg-stone-600',
    Uncommon: 'bg-green-600 hover:bg-green-700',
    Rare: 'bg-blue-600 hover:bg-blue-700',
    Legendary: 'bg-primary text-primary-foreground hover:bg-primary/90',
};

export function RecipeCard({ recipe, grimoire, canEdit, onEdit, onDelete }: RecipeCardProps) {
    const category = grimoire?.categories.find(c => c.id === recipe.categoryId);

    const getComponentName = (componentId: string) => {
        return grimoire?.components.find(c => c.id === componentId)?.name || 'Unknown Ingredient';
    };
    
    return (
        <Card className="flex flex-col transition-all duration-300 ease-in-out hover:shadow-lg hover:border-primary/50">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="font-headline text-2xl leading-tight mb-2 pr-4">{recipe.name}</CardTitle>
                    {canEdit && (
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
                    {category && (
                        <Badge variant="outline" className="flex items-center gap-1.5">
                            {categoryIcons[category.id] || null}
                            {category.name}
                        </Badge>
                    )}
                </div>
                <CardDescription className="pt-2">{recipe.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="ingredients">
                        <AccordionTrigger className="font-headline">Ingredients</AccordionTrigger>
                        <AccordionContent>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                {recipe.components.map((comp, i) => (
                                    <li key={i}>
                                        <span className="font-semibold text-foreground">{getComponentName(comp.componentId)}</span> - {comp.quantity}
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
                    {canEdit && recipe.secretDescription && (
                         <AccordionItem value="secret-description">
                            <AccordionTrigger className="font-headline text-accent">Secret Notes (DM Only)</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground whitespace-pre-line text-accent/90">
                                {recipe.secretDescription}
                            </AccordionContent>
                        </AccordionItem>
                    )}
                </Accordion>
            </CardContent>
        </Card>
    );
}
