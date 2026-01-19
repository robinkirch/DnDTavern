'use client';
import type { Recipe, Grimoire, Rarity, PermissionLevel, InventoryItem } from '@/lib/types';
import { useI18n } from '@/context/i18n-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { CookingPot, GlassWater, Cookie, TestTube, Pencil, ScanSearch, Trash2, BookCopy, Coins, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import Image from 'next/image';

import { useState } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog";

interface RecipeCardProps {
    recipe: Recipe;
    grimoire: Grimoire | null;
    canEdit: boolean;
    canOpenMore?: boolean;
    permissionLevel: PermissionLevel;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

interface ItemCardProps {
    item: InventoryItem;
    grimoire: Grimoire | null;
    permissionLevel: PermissionLevel;
    canOpenMore?: boolean;
}

interface CardProps {
    recipe?: Recipe;
    item?: InventoryItem;
    grimoire: Grimoire | null;
    canEdit?: boolean;
    canOpenMore?: boolean;
    permissionLevel: PermissionLevel;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
}

const categoryIcons: { [key: string]: JSX.Element } = {
    'cat-meal': <CookingPot className="h-4 w-4" />,
    'cat-drink': <GlassWater className="h-4 w-4" />,
    'cat-snack': <Cookie className="h-4 w-4" />,
    'cat-potion': <TestTube className="h-4 w-4" />,
};

export function CardSelection({ recipe, item, grimoire, canEdit, permissionLevel, onEdit, onDelete, canOpenMore = true }: CardProps) {

    if(recipe != null)
        return <RecipeCard key={recipe.id} recipe={recipe} grimoire={grimoire} canEdit={canEdit!} canOpenMore={canOpenMore} permissionLevel={permissionLevel} onEdit={onEdit!} onDelete={onDelete!} />
    else if(item != null)
        return <ItemCard key={item.id} item={item} grimoire={grimoire} permissionLevel={permissionLevel} canOpenMore={canOpenMore} />
    else
        return <></>
}
function ItemCard({ item, grimoire, permissionLevel, canOpenMore }: ItemCardProps) {
    const { t } = useI18n();
    
    const [selectedSubRecipe, setSelectedSubRecipe] = useState<Recipe | null>(null);
    const [isMainModalOpen, setIsMainModalOpen] = useState(false);

    //const getRecipeById = (id: string) => grimoire?.recipes.find(r => r.id === id);

    // const categories = grimoire?.categories.filter(c => recipe.categoryIds?.includes(c.id)) || [];
    // const rarity = grimoire?.rarities.find(r => r.id === item.rarityId);

    const hasPartialAccess = permissionLevel === 'partial';

    return (
        <>
            <Card id={item.id} className="flex flex-col h-full transition-all hover:shadow-lg hover:border-primary/50 overflow-hidden">
                {(item.image) && (
                    <div 
                        className={`relative h-48 w-full ${item.image && canOpenMore ? 'cursor-pointer' : ''}`}
                        onClick={() => item.image && canOpenMore ? setIsMainModalOpen(true) : undefined}
                    >
                        {item.image && (
                             <Image src={item.image} alt={item.name} fill className="object-cover" />
                        )}
                        {canOpenMore &&
                            <div className="absolute top-2 left-2 z-10 flex gap-1 bg-background/50 backdrop-blur-sm p-1 rounded-md" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMainModalOpen(true)}><ScanSearch className="h-5 w-5" /></Button>
                            </div>
                        }
                    </div>
                )}

                <CardHeader className={item.image ? 'pt-4' : ''}>
                    <div className="flex justify-between items-start">
                        <CardTitle className="font-headline text-2xl leading-tight mb-2 pr-4">{item.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                        {/* {rarity && <Badge style={{ backgroundColor: rarity.color }} className="text-white hover:opacity-90">{rarity.name}</Badge>}
                        {categories.map(category => (
                            <Badge key={category.id} variant="outline" className="flex items-center gap-1.5">
                                {categoryIcons[category.id] || null}
                                {category.name}
                            </Badge>
                        ))} */}
                    </div>
                    {hasPartialAccess ? (
                        <CardDescription className="pt-4 text-amber-600 italic flex items-center gap-2">
                            <EyeOff className='h-4 w-4' />
                            {t('Your knowledge of this recipe is incomplete.')}
                        </CardDescription>
                    ) : (
                        <CardDescription className="pt-2">{item.description}</CardDescription>
                    )}
                </CardHeader>

                <CardContent className="flex-grow">
                    {!hasPartialAccess && (
                        <Accordion type="single" collapsible>
                            {/* {recipe.components && recipe.components.length > 0 && (
                                <AccordionItem value="ingredients">
                                    <AccordionTrigger>{t('Ingredients')}</AccordionTrigger>
                                    <AccordionContent>
                                        <ul className="space-y-2">
                                            {recipe.components.map((comp, i) => {
                                                const subRecipe = getRecipeById(comp.recipeId);
                                                return (
                                                    <li 
                                                        key={i} 
                                                        className={`flex items-center gap-2 p-1 rounded-sm transition-colors ${subRecipe ? 'cursor-pointer hover:bg-muted' : ''}`}
                                                        onClick={() => subRecipe && setSelectedSubRecipe(subRecipe)}
                                                    >
                                                        <BookCopy className="h-4 w-4 text-primary" />
                                                        <span className={subRecipe ? 'underline decoration-dotted underline-offset-4' : ''}>
                                                            {subRecipe?.name || t('Unknown Ingredient')}
                                                        </span>
                                                        <span className="text-muted-foreground ml-auto">x{comp.quantity}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            )} */}
                        </Accordion>
                    )}
                </CardContent>
                {item.value && (
                    <CardFooter className='bg-muted/50 p-2 px-4 justify-end'>
                        <div className='flex items-center gap-2 text-sm font-semibold text-amber-600'>
                            <Coins className='h-4 w-4' />
                            <span>{item.value}</span>
                        </div>
                    </CardFooter>
                )}
            </Card>

            {/* MODAL FÜR ZUTATEN (Sub-Rezepte) */}
            <Dialog open={!!selectedSubRecipe} onOpenChange={(open) => !open && setSelectedSubRecipe(null)}>
                <DialogContent className="max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none">
                    {selectedSubRecipe && (
                        <CardSelection 
                            recipe={selectedSubRecipe}
                            grimoire={grimoire}
                            canEdit={false}
                            permissionLevel="full"//???
                            onEdit={() => {}}
                            onDelete={() => {}}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* MODAL FÜR DAS HAUPT-ITEM (Bild/Details-Ansicht) */}
            <Dialog open={isMainModalOpen} onOpenChange={setIsMainModalOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none">
                    <CardSelection 
                        item={item}
                        grimoire={grimoire}
                        permissionLevel="full"//???
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}

function RecipeCard({ recipe, grimoire, canEdit, canOpenMore, permissionLevel, onEdit, onDelete }: RecipeCardProps) {
    const { t } = useI18n();
    
    const [selectedSubRecipe, setSelectedSubRecipe] = useState<Recipe | null>(null);
    const [isMainModalOpen, setIsMainModalOpen] = useState(false);

    const getRecipeById = (id: string) => grimoire?.recipes.find(r => r.id === id);

    const categories = grimoire?.categories.filter(c => recipe.categoryIds?.includes(c.id)) || [];
    const rarity = grimoire?.rarities.find(r => r.id === recipe.rarityId);

    const hasPartialAccess = !canEdit && permissionLevel === 'partial';

    return (
        <>
            <Card id={recipe.id} className="flex flex-col h-full transition-all hover:shadow-lg hover:border-primary/50 overflow-hidden">
                {/* Bild-Bereich: Klick öffnet das Modal für dieses Rezept */}
                {(recipe.image || canEdit) && (
                    <div 
                        className={`relative h-48 w-full ${recipe.image ? 'cursor-pointer' : ''}`}
                        onClick={() => recipe.image && setIsMainModalOpen(true)}
                    >
                        {recipe.image && (
                             <Image src={recipe.image} alt={recipe.name} fill className="object-cover" />
                        )}
                        {/* Edit/Delete Buttons (StopPropagation wichtig!) */}
                        {canEdit && (
                            <div className="absolute top-2 left-2 z-10 flex gap-1 bg-background/50 backdrop-blur-sm p-1 rounded-md" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" onClick={() => onEdit(recipe.id)}><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => onDelete(recipe.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        )}
                        {!canEdit && (
                            <div className="absolute top-2 left-2 z-10 flex gap-1 bg-background/50 backdrop-blur-sm p-1 rounded-md" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMainModalOpen(true)}><ScanSearch className="h-5 w-5" /></Button>
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

                <CardContent className="flex-grow">
                    {!hasPartialAccess && (
                        <Accordion type="single" collapsible>
                            {recipe.components && recipe.components.length > 0 && (
                                <AccordionItem value="ingredients">
                                    <AccordionTrigger>{t('Ingredients')}</AccordionTrigger>
                                    <AccordionContent>
                                        <ul className="space-y-2">
                                            {recipe.components.map((comp, i) => {
                                                const subRecipe = getRecipeById(comp.recipeId);
                                                return (
                                                    <li 
                                                        key={i} 
                                                        className={`flex items-center gap-2 p-1 rounded-sm transition-colors ${subRecipe ? 'cursor-pointer hover:bg-muted' : ''}`}
                                                        onClick={() => subRecipe && setSelectedSubRecipe(subRecipe)}
                                                    >
                                                        <BookCopy className="h-4 w-4 text-primary" />
                                                        <span className={subRecipe ? 'underline decoration-dotted underline-offset-4' : ''}>
                                                            {subRecipe?.name || t('Unknown Ingredient')}
                                                        </span>
                                                        <span className="text-muted-foreground ml-auto">x{comp.quantity}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
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

            {/* MODAL FÜR ZUTATEN (Sub-Rezepte) */}
            <Dialog open={!!selectedSubRecipe} onOpenChange={(open) => !open && setSelectedSubRecipe(null)}>
                <DialogContent className="max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none">
                    {selectedSubRecipe && (
                        <CardSelection 
                            recipe={selectedSubRecipe}
                            grimoire={grimoire}
                            canEdit={false}
                            permissionLevel="full"//???
                            onEdit={() => {}}
                            onDelete={() => {}}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* MODAL FÜR DAS HAUPT-ITEM (Bild/Details-Ansicht) */}
            <Dialog open={isMainModalOpen} onOpenChange={setIsMainModalOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none">
                    <CardSelection 
                        recipe={recipe}
                        grimoire={grimoire}
                        canEdit={false}
                        permissionLevel="full"//???
                        onEdit={() => {}}
                        onDelete={() => {}}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}