'use client';
import { useEffect, useState } from 'react';
import type { Campaign, Grimoire, PermissionLevel, UserPermissions } from '@/lib/types';
import { useI18n } from '@/context/i18n-context';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from './ui/button';
import { KeyRound, Package } from 'lucide-react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Separator } from './ui/separator';


interface UserPermissionsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (username: string, permissions: UserPermissions, inventorySize?: number) => void;
  username: string;
  campaign: Campaign | null;
  grimoire: Grimoire | null;
}

export function UserPermissionsDialog({ isOpen, onOpenChange, onSave, username, campaign, grimoire }: UserPermissionsDialogProps) {
  const { t } = useI18n();
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [inventorySize, setInventorySize] = useState<number | undefined>();
  
  useEffect(() => {
    if (campaign && username && isOpen) {
      setPermissions(campaign.userPermissions[username] || {});
      setInventorySize(campaign.userInventories[username]?.maxSize);
    }
  }, [campaign, username, isOpen]);

  const handlePermissionChange = (categoryId: string, level: PermissionLevel) => {
    setPermissions(prev => ({ ...prev, [categoryId]: level }));
  };

  const handleSave = () => {
    onSave(username, permissions, inventorySize);
    onOpenChange(false);
  };

  if (!campaign) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            {t('Manage Permissions for {{username}}', { username })}
          </DialogTitle>
          <DialogDescription>
            {t('Set access levels and inventory size for this player.')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
             {grimoire ? (
                 <div>
                    <h4 className="font-medium mb-2">{t('Grimoire Permissions')}</h4>
                    <p className='text-sm text-muted-foreground mb-4'>{t('Set access levels for each category in the "{{grimoireName}}" grimoire.', { grimoireName: grimoire.name })}</p>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Category')}</TableHead>
                                <TableHead className="w-[190px] text-right">{t('Access Level')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {grimoire.categories.map(category => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">{category.name}</TableCell>
                                    <TableCell className="text-right">
                                    <Select 
                                        onValueChange={(value: PermissionLevel) => handlePermissionChange(category.id, value)} 
                                        value={permissions[category.id] || 'full'}
                                    >
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder={t('Select access level')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="full">{t('Full Access')}</SelectItem>
                                                <SelectItem value="partial">{t('Partial Access')}</SelectItem>
                                                <SelectItem value="none">{t('No Access')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
             ) : (
                <p className="text-sm text-amber-500">{t('Link a grimoire to manage permissions.')}</p>
             )}

            <Separator />

             <div>
                <h4 className="font-medium mb-2 flex items-center gap-2"><Package className='h-4 w-4' /> {t('Inventory Settings')}</h4>
                 <p className='text-sm text-muted-foreground mb-4'>{t("Override campaign's default inventory size for this player.")}</p>
                 <div className="space-y-2">
                    <Label htmlFor="inventory-size">{t("Player's Inventory Size")}</Label>
                    <Input
                        id="inventory-size"
                        type="number"
                        placeholder={t("Campaign default ({{size}})", { size: campaign.inventorySettings.defaultSize || t('Unlimited') })}
                        value={inventorySize ?? ''}
                        onChange={(e) => setInventorySize(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        disabled={campaign.inventorySettings.type === 'free'}
                    />
                    {campaign.inventorySettings.type === 'free' && (
                        <p className="text-xs text-muted-foreground">{t('Inventory size cannot be set when campaign rule is "Free".')}</p>
                    )}
                </div>
             </div>

        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
          <Button onClick={handleSave}>{t('Save Permissions')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
