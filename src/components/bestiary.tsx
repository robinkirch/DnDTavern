'use client';
import { useState } from 'react';
import type { Campaign, Monster } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { updateCampaign } from '@/lib/data-service';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { PlusCircle, Trash2, Pencil } from 'lucide-react';
import { MonsterFormDialog } from './monster-form-dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import Image from 'next/image';
import { Badge } from './ui/badge';

interface BestiaryProps {
    campaign: Campaign;
    setCampaign: (campaign: Campaign) => void;
}

export function Bestiary({ campaign, setCampaign }: BestiaryProps) {
    const { user } = useAuth();
    const { t } = useI18n();
    const { toast } = useToast();
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingMonster, setEditingMonster] = useState<Monster | null>(null);

    const handleOpenForm = (monster?: Monster) => {
        setEditingMonster(monster || null);
        setFormOpen(true);
    };

    const handleSaveMonster = async (monsterData: Omit<Monster, 'id' | 'creatorUsername'>) => {
        if (!user) return;
        
        let updatedBestiary: Monster[];

        if (editingMonster) {
             // Update existing monster
             const updatedMonster = { ...editingMonster, ...monsterData };
             updatedBestiary = campaign.bestiary.map(m => m.id === updatedMonster.id ? updatedMonster : m);
             toast({ title: t('Monster Updated'), description: t('The creature\'s details have been updated.')});
        } else {
            // Add new monster
            const newMonster: Monster = {
                id: `monster-${Date.now()}`,
                creatorUsername: user.username,
                ...monsterData
            };
            updatedBestiary = [...campaign.bestiary, newMonster];
            toast({ title: t('Monster Added'), description: t('A new creature has been added to the bestiary.') });
        }
        
        const updatedCampaign = { ...campaign, bestiary: updatedBestiary };
        const savedCampaign = await updateCampaign(updatedCampaign);
        setCampaign(savedCampaign);
        setFormOpen(false);
    };
    
    const handleDeleteMonster = async (monsterId: string) => {
        if (!confirm(t('Are you sure you want to remove this creature from the bestiary?'))) return;

        const updatedBestiary = campaign.bestiary.filter(m => m.id !== monsterId);
        const updatedCampaign = { ...campaign, bestiary: updatedBestiary };
        const savedCampaign = await updateCampaign(updatedCampaign);
        setCampaign(savedCampaign);
        toast({ title: t('Monster Removed'), description: t('The creature has been removed from the bestiary.')});
    };

    const getBehaviorVariant = (behavior: Monster['behavior']): 'destructive' | 'secondary' | 'default' => {
        switch (behavior) {
            case 'aggressive': return 'destructive';
            case 'neutral': return 'secondary';
            case 'friendly': return 'default';
        }
    }


    return (
        <>
            <MonsterFormDialog 
                isOpen={isFormOpen}
                onOpenChange={setFormOpen}
                onSave={handleSaveMonster}
                monster={editingMonster}
            />
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-headline text-2xl">{t('Bestiary')}</h3>
                    <Button onClick={() => handleOpenForm()}>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        {t('Add Creature')}
                    </Button>
                </div>

                {campaign.bestiary.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {campaign.bestiary.map(monster => (
                            <Card key={monster.id} className="flex flex-col">
                                {monster.image && (
                                     <div className="relative h-48 w-full">
                                        <Image src={monster.image} alt={monster.name} fill className="object-cover rounded-t-lg" data-ai-hint="fantasy monster" />
                                    </div>
                                )}
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="font-headline text-2xl">{monster.name}</CardTitle>
                                         <Badge variant={getBehaviorVariant(monster.behavior)}>{t(monster.behavior)}</Badge>
                                    </div>
                                    {monster.hitPoints && <CardDescription>{t('HP')}: {monster.hitPoints}</CardDescription>}
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground mb-4">{monster.description}</p>
                                     <div className="space-y-2 text-xs">
                                        {monster.resistances.length > 0 && (
                                            <div>
                                                <h5 className="font-semibold">{t('Resistances')}</h5>
                                                <p className="text-muted-foreground">{monster.resistances.join(', ')}</p>
                                            </div>
                                        )}
                                        {monster.damageTypes.length > 0 && (
                                            <div>
                                                <h5 className="font-semibold">{t('Damage Types')}</h5>
                                                <p className="text-muted-foreground">{monster.damageTypes.join(', ')}</p>
                                            </div>
                                        )}
                                     </div>
                                </CardContent>
                                <CardFooter className="flex justify-between items-center mt-4">
                                    <p className="text-xs text-muted-foreground">{t('Added by')}: {monster.creatorUsername}</p>
                                     {monster.creatorUsername === user?.username && (
                                         <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenForm(monster)}><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteMonster(monster.id)}><Trash2 className="h-4 w-4" /></Button>
                                         </div>
                                     )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">{t('The bestiary is empty. Add the first creature!')}</p>
                    </div>
                )}

            </div>
        </>
    );
}
