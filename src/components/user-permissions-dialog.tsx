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
import { KeyRound } from 'lucide-react';


interface UserPermissionsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (username: string, permissions: UserPermissions) => void;
  username: string;
  campaign: Campaign | null;
  grimoire: Grimoire | null;
}

export function UserPermissionsDialog({ isOpen, onOpenChange, onSave, username, campaign, grimoire }: UserPermissionsDialogProps) {
  const { t } = useI18n();
  const [permissions, setPermissions] = useState<UserPermissions>({});
  
  useEffect(() => {
    if (campaign && username && isOpen) {
      setPermissions(campaign.userPermissions[username] || {});
    }
  }, [campaign, username, isOpen]);

  const handlePermissionChange = (categoryId: string, level: PermissionLevel) => {
    setPermissions(prev => ({ ...prev, [categoryId]: level }));
  };

  const handleSave = () => {
    onSave(username, permissions);
    onOpenChange(false);
  };

  if (!grimoire) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            {t('Manage Permissions for {{username}}', { username })}
          </DialogTitle>
          <DialogDescription>
            {t('Set access levels for each category in the "{{grimoireName}}" grimoire.', { grimoireName: grimoire.name })}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 max-h-[60vh] overflow-y-auto pr-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('Category')}</TableHead>
                        <TableHead className="text-right">{t('Access Level')}</TableHead>
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

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
          <Button onClick={handleSave}>{t('Save Permissions')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
