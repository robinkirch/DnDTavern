'use client';
import { useState, useEffect } from 'react';
import type { Campaign, Monster, DamageType } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { deleteMonster, saveMonster, fetchDamageTypes } from '@/lib/data-service';
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
    const [damageTypes, setDamageTypes] = useState<DamageType[]>([]);

    useEffect(() => {
        if (campaign.grimoireId) {
            fetchDamageTypes(campaign.grimoireId)
                .then(setDamageTypes)
                .catch(console.error);
        }
    }, [campaign.grimoireId]);

    const handleOpenForm = (monster?: Monster) => {
        setEditingMonster(monster || null);
        setFormOpen(true);
    };

    const handleSaveMonster = async (monsterData: Omit<Monster, 'id' | 'creatorUsername'>) => {
        if (!user || !campaign.grimoireId) return;

        try {
            const monsterToSave: Monster = editingMonster 
                ? { ...editingMonster, ...monsterData }
                : { 
                    id: `monster-${Date.now()}`, 
                    creatorUsername: user.username, 
                    ...monsterData 
                } as Monster;

            await saveMonster(campaign.grimoireId, campaign.id, monsterToSave);

            const updatedBestiary = editingMonster
                ? (campaign.bestiary || []).map(m => m.id === monsterToSave.id ? monsterToSave : m)
                : [...(campaign.bestiary || []), monsterToSave];

            setCampaign({ ...campaign, bestiary: updatedBestiary });
            setFormOpen(false);
            
            toast({ title: editingMonster ? t('Monster Updated') : t('Monster Added') });
        } catch (error) {
            toast({ title: t('Error'), variant: 'destructive' });
        }
    };

    const handleDeleteMonster = async (monsterId: string) => {
        if (!user || !campaign.grimoireId || !confirm(t('Are you sure?'))) return;
        try {
            await deleteMonster(campaign.grimoireId, monsterId);
            setCampaign({ ...campaign, bestiary: (campaign.bestiary || []).filter(m => m.id !== monsterId) });
            toast({ title: t('Monster Removed') });
        } catch (error) {
            toast({ title: t('Error'), variant: 'destructive' });
        }
    };

    // Hilfsfunktion: Wandelt ID-Arrays in lokalisierte Strings um
    const formatDamageTypes = (ids: number[] = []) => {
        if (!ids || ids.length === 0) return null;
        return ids
            .map(id => {
                const dt = damageTypes.find(d => d.id === id);
                if (!dt) return null;
                const name = t(dt.name as any);
                const category = dt.category !== 'special' ? ` (${t(dt.category as any)})` : '';
                return `${name}${category}`;
            })
            .filter(Boolean)
            .join(', ');
    };

    const getBehaviorVariant = (behavior: Monster['behavior']): 'destructive' | 'secondary' | 'default' => {
        switch (behavior) {
            case 'aggressive': return 'destructive';
            case 'neutral': return 'secondary';
            case 'friendly': return 'default';
            default: return 'secondary';
        }
    }

    return (
        <>
            <MonsterFormDialog 
                isOpen={isFormOpen}
                onOpenChange={setFormOpen}
                onSave={handleSaveMonster}
                monster={editingMonster}
                grimoireId={campaign.grimoireId ?? ""} //sollte nie passieren
            />
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-headline text-2xl">{t('Bestiary')}</h3>
                    <Button onClick={() => handleOpenForm()}>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        {t('Add Creature')}
                    </Button>
                </div>

                {campaign.bestiary?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {campaign.bestiary.map(monster => (
                            <Card key={monster.id} className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
                                {monster.image && (
                                    <div className="relative h-48 w-full">
                                        <Image src={monster.image} alt={monster.name} fill className="object-cover rounded-t-lg" />
                                    </div>
                                )}
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="font-headline text-xl">{monster.name}</CardTitle>
                                        <Badge variant={getBehaviorVariant(monster.behavior)}>{t(monster.behavior as any)}</Badge>
                                    </div>
                                    {monster.hitPoints && (
                                        <CardDescription className="flex items-center text-red-600 font-bold">
                                            ❤️ {monster.hitPoints} {t('HP')}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent className="flex-grow space-y-4">
                                    <p className="text-sm text-muted-foreground line-clamp-3 italic">"{monster.description}"</p>
                                    
                                    <div className="grid grid-cols-1 gap-2 text-xs border-t pt-2">
                                        {[
                                            { label: 'Resistances', ids: monster.resistances },
                                            { label: 'Immunities', ids: monster.immunities },
                                            { label: 'Vulnerabilities', ids: monster.vulnerabilities }
                                        ].map(group => {
                                            const formatted = formatDamageTypes(group.ids);
                                            return formatted ? (
                                                <div key={group.label}>
                                                    <span className="font-bold text-primary block">{t(group.label as any)}:</span>
                                                    <span className="text-muted-foreground">{formatted}</span>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between items-center bg-muted/10 py-2 border-t">
                                    <p className="text-[10px] text-muted-foreground tracking-wider">{t('Added by')} {monster.creatorUsername}</p>
                                    {monster.creatorUsername === user?.username && (
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenForm(monster)}><Pencil className="h-3 w-3" /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteMonster(monster.id)}><Trash2 className="h-3 w-3" /></Button>
                                        </div>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg bg-muted/5">
                        <p className="text-muted-foreground">{t('The bestiary is empty. Add the first creature!')}</p>
                    </div>
                )}
            </div>
        </>
    );
}