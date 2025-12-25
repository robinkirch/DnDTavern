// InlineUserPermissions.tsx

import { User, KeyRound, ChevronDown, ChevronRight, Package, Wrench, Shield } from 'lucide-react';
import { Control, useWatch } from 'react-hook-form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Campaign, Grimoire, PermissionLevel, Category } from '@/lib/types';
import { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from './ui/form';
import { Input } from '../components/ui/input';
import { Separator } from './ui/separator';
import { Checkbox } from '../components/ui/checkbox';
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
import { useI18n } from '@/context/i18n-context';


interface InlineUserPermissionsProps {
    username: string;
    campaign: Campaign; 
    grimoire: Grimoire | null; 
    control: Control<any>; // Kontrolle vom Hauptformular
}

export const InlineUserPermissions = ({ username, control, campaign, grimoire }: InlineUserPermissionsProps) => {
    
    const { t } = useI18n();
    // Watcht das globale Inventar-Setting des Hauptformulars
    const inventoryType = useWatch({ control, name: 'inventorySettings.type' });
    const [isOpen, setIsOpen] = useState(false);
    
    const permissionLevelLabels = {
        'full': t('Full Access'),
        'partial': t('Partial Access'),
        'none': t('No Access'),
    };
    
    const isCreator = username === campaign.creatorUsername;

    return (
        <Collapsible 
            open={isOpen} 
            onOpenChange={setIsOpen} 
            className={`w-full border rounded-lg p-3 transition-colors ${isCreator ? 'border-primary/50 bg-primary-foreground/5' : ''}`}
        >
            <CollapsibleTrigger className="flex justify-between items-center w-full">
                <div className="flex items-center space-x-2 font-semibold">
                    {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                    <KeyRound className='h-4 w-4 text-primary' />
                    <span>{username} {isCreator && `(${t('Creator')})`}</span>
                </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-6 pt-4 border-t mt-3">
                
                {/* ========================================================= */}
                {/* === Allg. Berechtigungen (Tracking, Bestiary, Inventar) === */}
                {/* ========================================================= */}
                <div className="space-y-2">
                    <h3 className="text-md font-medium flex items-center gap-2"><Shield className='h-4 w-4 text-muted-foreground' /> {t("General Permissions")}</h3>
                    
                    {/* CAN EDIT TRACKING */}
                    <FormField
                        control={control}
                        name={`userPermissions.${username}.canEditTracking`}
                        defaultValue={campaign.userPermissions?.[username]?.canEditTracking ?? false} // Initialwert für RHF
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between space-x-3 rounded-lg border p-3">
                                <FormLabel>{t("Can Edit Campaign Tracking (Date/Weather)")}</FormLabel>
                                <FormControl>
                                    <Checkbox 
                                        checked={field.value} 
                                        onCheckedChange={field.onChange} 
                                        disabled={isCreator} // Creator hat immer volle Rechte
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    
                    {/* CAN EDIT BESTIARY */}
                    <FormField
                        control={control}
                        name={`userPermissions.${username}.canEditBestiary`}
                        defaultValue={campaign.userPermissions?.[username]?.canEditBestiary ?? false} // Initialwert für RHF
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between space-x-3 rounded-lg border p-3">
                                <FormLabel>{t("Can Edit Bestiary & NPCs")}</FormLabel>
                                <FormControl>
                                    <Checkbox 
                                        checked={field.value} 
                                        onCheckedChange={field.onChange} 
                                        disabled={isCreator}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    
                </div>
                
                <Separator />

                {/* ========================================================= */}
                {/* === INVENTORY GRÖSSE === */}
                {/* ========================================================= */}
                {inventoryType === 'limited' && (
                    <div className="space-y-2">
                        <h3 className="text-md font-medium flex items-center gap-2"><Package className='h-4 w-4 text-muted-foreground' /> {t("Inventory Slot Limit")}</h3>
                        <FormDescription>{t("Override campaign's default inventory size for this player.")}</FormDescription>
                        
                        <FormField
                            control={control}
                            name={`userInventories.${username}.maxSize`}
                            // Initialwert: maxSize oder undefined, wenn nicht gesetzt
                            defaultValue={campaign.userInventories?.[username]?.maxSize} 
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("Max Slots for {{username}}", { username })}</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            placeholder={t("Campaign default ({{0}})", { 0: campaign.inventorySettings?.defaultSize || t('Unlimited') })}
                                            {...field} 
                                            // Konvertiert den Input-String zu einer Zahl oder undefined (wenn leer)
                                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)} 
                                            value={field.value === undefined ? '' : field.value} // Leeres Feld, wenn undefined
                                            min={1}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                )}
                
                <Separator />

                {/* ========================================================= */}
                {/* === Grimoire Permissions (Dynamische Kategorien) === */}
                {/* ========================================================= */}
                {grimoire ? (
                    <div className='space-y-4'>
                        <h3 className="text-md font-medium flex items-center gap-2"><Wrench className='h-4 w-4 text-muted-foreground' />{t('Grimoire Category Permissions')}</h3>
                        <FormDescription>{t('Set access levels for each category in the "{{grimoireName}}" grimoire.', { grimoireName: grimoire.name })}</FormDescription>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('Category')}</TableHead>
                                    <TableHead className="w-[190px] text-right">{t('Access Level')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {grimoire.categories.map((category: Category) => (
                                    <TableRow key={category.id}>
                                        <TableCell className="font-medium">{category.name}</TableCell>
                                        <TableCell className="text-right">
                                            <FormField
                                                control={control}
                                                // Name: userPermissions.[username].[categoryId]
                                                name={`userPermissions.${username}.${category.id}`} 
                                                // Initialwert aus Campaign, oder 'full' als Standard
                                                defaultValue={(campaign.userPermissions?.[username] as Record<string, PermissionLevel>)?.[category.id] ?? 'full'}
                                                render={({ field }) => (
                                                    <FormItem className='flex justify-end'>
                                                        <Select 
                                                            onValueChange={field.onChange} 
                                                            value={field.value as PermissionLevel ?? 'full'}
                                                            disabled={isCreator} // Creator hat immer volle Rechte
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="w-[180px]">
                                                                    <SelectValue placeholder={t('Select access level')} />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {(['full', 'partial', 'none'] as PermissionLevel[]).map(level => (
                                                                    <SelectItem key={level} value={level}>
                                                                        {permissionLevelLabels[level]}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <p className="text-sm text-amber-500">{t('Link a grimoire to manage category permissions.')}</p>
                )}

            </CollapsibleContent>
        </Collapsible>
    );
};