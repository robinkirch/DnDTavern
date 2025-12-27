'use client';
import type { Recipe, Grimoire, Rarity, PermissionLevel } from '@/lib/types';
import { useI18n } from '@/context/i18n-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { CookingPot, GlassWater, Cookie, TestTube, Pencil, Trash2, BookCopy, Coins, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import Image from 'next/image';

interface RecipeCardProps {
    recipe: Recipe;
    grimoire: Grimoire | null;
    canEdit: boolean;
    permissionLevel: PermissionLevel;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

const categoryIcons: { [key: string]: JSX.Element } = {
    'cat-meal': <CookingPot className="h-4 w-4" />,
    'cat-drink': <GlassWater className="h-4 w-4" />,
    'cat-snack': <Cookie className="h-4 w-4" />,
    'cat-potion': <TestTube className="h-4 w-4" />,
};


export function RecipeCard({ recipe, grimoire, canEdit, permissionLevel, onEdit, onDelete }: RecipeCardProps) {
    const { t } = useI18n();

    const categories = grimoire?.categories.filter(c => recipe.categoryIds?.includes(c.id)) || [];

    const rarity = grimoire?.rarities.find(r => r.id === recipe.rarityId);

    const getIngredientName = (ingredientId: string) => {
        return grimoire?.recipes.find(r => r.id === ingredientId)?.name || t('Unknown Ingredient');
    };

    const hasPartialAccess = !canEdit && permissionLevel === 'partial';
    
    return (
        <Card id={recipe.id ?? "no_id"} className="flex flex-col transition-all duration-300 ease-in-out hover:shadow-lg hover:border-primary/50 overflow-hidden">
            {(recipe.image || canEdit) && (
                <div className="relative h-48 w-full">
                    {/* Bild, falls vorhanden */}
                    {recipe.image && (
                         <Image src={recipe.image} alt={recipe.name} fill className="object-cover" data-ai-hint="fantasy food"/>
                    )}
                    
                    {/* Buttons als Overlay, oben links positioniert */}
                    {canEdit && (
                        <div className="absolute top-2 left-2 z-10 flex gap-1 rounded-md overflow-hidden bg-background/50 backdrop-blur-sm p-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20" onClick={() => onEdit(recipe.id)}>
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">{t('Edit')}</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/20 hover:text-destructive" onClick={() => onDelete(recipe.id)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">{t('Delete')}</span>
                            </Button>
                        </div>
                    )}
                </div>
            )}
            <CardHeader className={recipe.image ? 'pt-4' : ''}>
                <div className="flex justify-between items-start">
                    <CardTitle className="font-headline text-2xl leading-tight mb-2 pr-4">{recipe.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2 text-sm flex-wrap">
                    {rarity && <Badge style={{ backgroundColor: rarity.color }} className="text-white hover:opacity-90">{rarity.name}</Badge>}
                    {categories.map(category => (
                        <Badge key={category.id} variant="outline" className="flex items-center gap-1.5">
                            {categoryIcons[category.id] || null}
                            {category.name}
                        </Badge>
                    ))}
                </div>
                {hasPartialAccess ? (
                    <CardDescription className="pt-4 text-amber-600 italic flex items-center gap-2">
                        <EyeOff className='h-4 w-4' />
                        {t('Your knowledge of this recipe is incomplete.')}
                    </CardDescription>
                ) : (
                    <CardDescription className="pt-2">{recipe.description}</CardDescription>
                )}
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
                {!hasPartialAccess && (
                    <Accordion type="single" collapsible className="w-full">
                        {recipe.components && recipe.components.length > 0 && (
                            <AccordionItem value="ingredients">
                                <AccordionTrigger className="font-headline">{t('Ingredients')}</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-none pl-0 space-y-1 text-muted-foreground">
                                        {recipe.components.map((comp, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <BookCopy className="h-4 w-4 text-primary" />
                                                <div>
                                                    <span className="font-semibold text-foreground">{getIngredientName(comp.recipeId)}</span> : {comp.quantity}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        )}
                        {canEdit && recipe.secretDescription && (
                            <AccordionItem value="secret-description">
                                <AccordionTrigger className="font-headline text-accent">{t('Secret Notes (DM Only)')}</AccordionTrigger>
                                <AccordionContent className="text-muted-foreground whitespace-pre-line text-accent/90">
                                    {recipe.secretDescription}
                                </AccordionContent>
                            </AccordionItem>
                        )}
                    </Accordion>
                )}
            </CardContent>
            {recipe.value && (
                <CardFooter className='bg-muted/50 p-2 px-4 justify-end'>
                    <div className='flex items-center gap-2 text-sm font-semibold text-amber-600'>
                        <Coins className='h-4 w-4' />
                        <span>{recipe.value}</span>
                    </div>
                </CardFooter>
            )}
        </Card>
    );
}
