'use client';
import { useState, useEffect, useMemo } from 'react';
import type { Campaign, Monster, DamageType } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { deleteMonster, saveMonster, fetchDamageTypes, getMonsters } from '@/lib/data-service';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { PlusCircle, Trash2, Pencil, Filter, Search } from 'lucide-react';
import { MonsterFormDialog } from './dialogs/monster-form-dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import Image from 'next/image';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import monsterplaceholder from '../images/monster_placeholder.png'
import { ActionConfirmDialog, ConfirmDialogData } from './dialogs/ConfirmDialog';

interface BestiaryProps {
    campaign: Campaign;
}

export function Bestiary({ campaign }: BestiaryProps) {
    const { user } = useAuth();
    const { t } = useI18n();
    const { toast } = useToast();

    const [isFormOpen, setFormOpen] = useState(false);
    const [bestiary, setBestiary] = useState<Monster[] | null>(null);
    const [editingMonster, setEditingMonster] = useState<Monster | null>(null);
    const [damageTypes, setDamageTypes] = useState<DamageType[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'monster' | 'npc'>('all');

    useEffect(() => {
        if (campaign.grimoireId) {
            fetchDamageTypes(campaign.grimoireId).then(setDamageTypes).catch(console.error);
            getMonsters(campaign.grimoireId).then(setBestiary).catch(console.error);
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

            const updatedBestiary = editingMonster ? (bestiary || []).map(m => m.id === monsterToSave.id ? monsterToSave : m): [...(bestiary || []), monsterToSave];

            setBestiary(updatedBestiary);
            setFormOpen(false);
            
            toast({ title: editingMonster ? t('Monster Updated') : t('Monster Added') });
        } catch (error) {
            toast({ title: t('Error'), variant: 'destructive' });
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

    const handleDeleteMonster = async (monsterId: string) => {
        if (!user || !campaign.grimoireId) return;
        showConfirm(
            t('Delete Monster'),
            t('Are you sure you want to remove this creature from the bestiary?'),
            t('Monster Removed'),
            async () => {
                await deleteMonster(campaign.grimoireId!, monsterId);
                const updatedBestiary = (bestiary || []).filter(m => m.id != monsterId);
                setBestiary(updatedBestiary);
            }
        );
    }

    const formatDamageTypes = (ids: number[] = []) => {
        if (!ids || ids.length === 0) return null;

        if (!Array.isArray(ids)) {
            console.warn("Expected array for damage types, but got:", ids);
            return "";
        }

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

    const filteredBestiary = useMemo(() => {
        if (!bestiary) return [];
        
        const lowerTerm = searchTerm.toLowerCase();

        return bestiary.filter(monster => {
            // 1. Text-Filter (Name, Beschreibung, Ort)
            const matchesSearch = 
                monster.name.toLowerCase().includes(lowerTerm) ||
                monster.description.toLowerCase().includes(lowerTerm) ||
                (monster.location && monster.location.toLowerCase().includes(lowerTerm));

            // 2. Typ-Filter (NPC vs Monster)
            const matchesType = 
                typeFilter === 'all' || 
                (typeFilter === 'npc' && monster.isNPC) || 
                (typeFilter === 'monster' && !monster.isNPC);

            return matchesSearch && matchesType;
        });
    }, [bestiary, searchTerm, typeFilter]);

    return (
        <>
            <ActionConfirmDialog  data={confirmData} />
            <MonsterFormDialog 
                isOpen={isFormOpen}
                onOpenChange={setFormOpen}
                onSave={handleSaveMonster}
                monster={editingMonster}
                grimoireId={campaign.grimoireId ?? ""}
            />

            <div>
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex justify-between items-center">
                        <h3 className="font-headline text-2xl">{t('Bestiary')}</h3>
                        <Button onClick={() => handleOpenForm()}>
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            {t('Add Creature')}
                        </Button>
                    </div>

                    {/* Such- und Filterleiste */}
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('Search by name, description or location...')}
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <div className="w-full md:w-[200px]">
                            <Select 
                                value={typeFilter} 
                                onValueChange={(val: any) => setTypeFilter(val)}
                            >
                                <SelectTrigger>
                                    <Filter className="mr-2 h-4 w-4 opacity-50" />
                                    <SelectValue placeholder={t('Filter by type')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('All Entries')}</SelectItem>
                                    <SelectItem value="monster">{t('Monsters Only')}</SelectItem>
                                    <SelectItem value="npc">{t('NPCs Only')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {filteredBestiary.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredBestiary.map(monster => (
                            <Card key={monster.id} className="flex flex-col shadow-sm hover:shadow-md transition-shadow relative">
                                <div className="relative h-48 w-full">
                                    <Image src={monster.image ?? monsterplaceholder} alt={monster.name} fill className="object-cover rounded-t-lg" />
                                    <Badge variant="secondary" className="absolute top-2 left-2"style={{ backgroundColor: "hsla(196.8, 100%, 25.9%, 0.97)", color: 'white' }}>
                                        {monster.isNPC ? t('NPC') : t('Monster')}
                                    </Badge>
                                </div>
                                
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="font-headline text-xl">{monster.name}</CardTitle>
                                        <div>
                                        <Badge variant={getBehaviorVariant(monster.behavior)}>{t(monster.behavior as any)}</Badge>
                                        {monster.location && (
                                            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                                                {monster.location}
                                            </Badge>
                                        )}
                                        </div>
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
                                    {(monster.creatorUsername === user?.username || user?.role == "dm") && (
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
                        <p className="text-muted-foreground">
                            {searchTerm || typeFilter !== 'all' ? t('No creatures found matching your filters.') : t('The bestiary is empty. Add the first creature!')}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}