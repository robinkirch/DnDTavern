'use client';
import { useState } from 'react';
import type { Campaign, InventoryItem, Grimoire } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { updateCampaign } from '@/lib/data-service';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from './ui/button';
import { PlusCircle, Trash2, LayoutGrid, List } from 'lucide-react';
import { AddInventoryItemDialog } from './add-inventory-item-dialog';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

interface PlayerInventoryProps {
    campaign: Campaign;
    setCampaign: (campaign: Campaign) => void;
    grimoire: Grimoire | null;
}

export function PlayerInventory({ campaign, setCampaign, grimoire }: PlayerInventoryProps) {
    const { user } = useAuth();
    const { t } = useI18n();
    const { toast } = useToast();
    const [isAddOpen, setAddOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

    if (!user) return null;

    const userInventoryData = campaign.userInventories[user.username];
    const userInventory = userInventoryData?.items || [];
    const inventorySize = userInventoryData?.maxSize ?? campaign.inventorySettings.defaultSize;
    const isLimited = campaign.inventorySettings.type === 'limited' && inventorySize !== undefined;
    const isInventoryFull = isLimited && userInventory.length >= inventorySize;

    const handleAddItem = async (newItem: InventoryItem) => {
        if (isInventoryFull) {
            toast({ 
                variant: 'destructive',
                title: t('Inventory Full'), 
                description: t('You cannot add more items to your inventory.') 
            });
            return;
        }

        const updatedInventory = [...userInventory, newItem];
        const updatedCampaign = {
            ...campaign,
            userInventories: {
                ...campaign.userInventories,
                [user.username]: {
                    ...campaign.userInventories[user.username],
                    items: updatedInventory
                }
            }
        };

        const savedCampaign = await updateCampaign(updatedCampaign);
        setCampaign(savedCampaign);
        toast({ title: t('Item Added'), description: t('The item has been added to your inventory.') });
        setAddOpen(false);
    };

    const handleRemoveItem = async (itemId: string) => {
       const updatedInventory = userInventory.filter(item => item.id !== itemId);
       const updatedCampaign = {
            ...campaign,
            userInventories: {
                ...campaign.userInventories,
                [user.username]: {
                    ...campaign.userInventories[user.username],
                    items: updatedInventory
                }
            }
        };

        const savedCampaign = await updateCampaign(updatedCampaign);
        setCampaign(savedCampaign);
        toast({ title: t('Item Removed'), description: t('The item has been removed from your inventory.') });
    };
    
    return (
        <>
            <AddInventoryItemDialog
                isOpen={isAddOpen}
                onOpenChange={setAddOpen}
                onSave={handleAddItem}
                grimoire={grimoire}
            />
            <div>
                <div className='flex justify-between items-center mb-4 flex-wrap gap-4'>
                    <div>
                        <h3 className="font-headline text-2xl">{t('Player Inventory')}</h3>
                        {isLimited && (
                            <div className="text-sm text-muted-foreground mt-1">
                                <p>{t('{{count}} of {{max}} slots used', { count: userInventory.length, max: inventorySize })}</p>
                                <Progress value={(userInventory.length / (inventorySize || 1)) * 100} className="w-48 mt-1 h-2" />
                            </div>
                        )}
                    </div>
                    <div className='flex gap-2 items-center'>
                         <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')}>
                            <List className='h-4 w-4'/>
                        </Button>
                         <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
                            <LayoutGrid className='h-4 w-4'/>
                        </Button>
                        <Button onClick={() => setAddOpen(true)} disabled={isInventoryFull}>
                            <PlusCircle className='mr-2 h-4 w-4' />
                            {t('Add Item')}
                        </Button>
                    </div>
                </div>

                 {viewMode === 'grid' ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {userInventory.length > 0 ? userInventory.map(item => (
                             <Card key={item.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>{item.name}</CardTitle>
                                    <CardDescription>{t('Quantity')}: {item.quantity}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground">{item.description || t('No description provided.')}</p>
                                </CardContent>
                                <CardFooter className="flex justify-between items-center">
                                    <span className="text-sm font-semibold text-amber-500">{item.value || ''}</span>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRemoveItem(item.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        )) : (
                             <div className="col-span-full text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                                 {t("This player's pack is empty.")}
                             </div>
                        )}
                     </div>
                 ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Item')}</TableHead>
                                <TableHead>{t('Quantity')}</TableHead>
                                <TableHead>{t('Value')}</TableHead>
                                <TableHead className="text-right">{t('Actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {userInventory.length > 0 ? userInventory.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <p className="font-medium">{item.name}</p>
                                        {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                                    </TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>{item.value || 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRemoveItem(item.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                        {t("This player's pack is empty.")}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                 )}
            </div>
        </>
    );
}
