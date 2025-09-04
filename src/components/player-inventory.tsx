'use client';
import { useState, useMemo } from 'react';
import type { Campaign, InventoryItem, Recipe, Grimoire } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from './ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';

interface PlayerInventoryProps {
    campaign: Campaign;
    setCampaign: (campaign: Campaign) => void;
}


export function PlayerInventory({ campaign, setCampaign }: PlayerInventoryProps) {
    const { user } = useAuth();
    const { t } = useI18n();

    if (!user) return null;

    const userInventory = campaign.userInventories[user.username]?.items || [];

    const handleAddItem = () => {
        // This would open a dialog to add an item
        console.log("Add item clicked");
    };

    const handleRemoveItem = (itemId: string) => {
        // Logic to remove item
    };
    
    return (
        <div>
            <div className='flex justify-between items-center mb-4'>
                <h3 className="font-headline text-2xl">{t('Player Inventory')}</h3>
                <Button onClick={handleAddItem}>
                    <PlusCircle className='mr-2 h-4 w-4' />
                    {t('Add Item')}
                </Button>
            </div>
            
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
                            <TableCell className="font-medium">{item.name}</TableCell>
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
        </div>
    );
}
