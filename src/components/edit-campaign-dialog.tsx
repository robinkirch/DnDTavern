'use client';

import { useEffect, useState, useRef, ChangeEvent } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Campaign, Grimoire, UserPermissions, WeatherRegion, WeatherCondition } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { getGrimoiresByUsername, getGrimoireById } from '@/lib/data-service';
import { useI18n } from '@/context/i18n-context';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, KeyRound, UserCog, CalendarDays, CloudSun, PlusCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Separator } from './ui/separator';
import { UserPermissionsDialog } from './user-permissions-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

const weatherConditionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Condition name is required.'),
  probability: z.number().min(0).max(100),
});

const weatherRegionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Region name is required.'),
  conditions: z.array(weatherConditionSchema),
});


const formSchema = z.object({
  name: z.string().min(1, 'Campaign name is required.'),
  description: z.string().optional(),
  invitedUsernames: z.string().optional(),
  grimoireId: z.string().nullable(),
  image: z.string().nullable(),
  inventoryType: z.enum(['free', 'limited']),
  defaultInventorySize: z.number().optional(),
  daysPerMonth: z.number().min(1),
  monthsPerYear: z.number().min(1),
  yearName: z.string(),
  weatherRegions: z.array(weatherRegionSchema),
});

type FormData = z.infer<typeof formSchema>;

interface EditCampaignDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSave: (data: Omit<Campaign, 'id' | 'creatorUsername' | 'sessionNotes' | 'sessionNotesDate' | 'tracking'>) => void;
    campaign: Campaign | null;
}

const WeatherRegionFields = ({ control, regionIndex, removeRegion }: { control: any, regionIndex: number, removeRegion: (index: number) => void }) => {
    const { t } = useI18n();
    const { fields: conditionFields, append: appendCondition, remove: removeCondition } = useFieldArray({
        control,
        name: `weatherRegions.${regionIndex}.conditions`
    });

    const totalProb = watch({
        control,
        name: `weatherRegions.${regionIndex}.conditions`
    }).reduce((acc: number, c: any) => acc + (c.probability || 0), 0);

    return (
        <div className="p-3 border rounded-md bg-background/50">
            <FormField control={control} name={`weatherRegions.${regionIndex}.name`} render={({ field }) => (
                <FormItem>
                    <FormLabel>{t("Region Name")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <Label className="mt-2 mb-1 block">{t("Conditions")}</Label>
            {conditionFields.map((condition, conditionIndex) => (
                <div key={condition.id} className="grid grid-cols-[2fr,1fr,auto] gap-2 items-center mb-2">
                    <FormField control={control} name={`weatherRegions.${regionIndex}.conditions.${conditionIndex}.name`} render={({ field }) => (
                        <FormItem><FormControl><Input placeholder={t("e.g. Sunny")} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={control} name={`weatherRegions.${regionIndex}.conditions.${conditionIndex}.probability`} render={({ field }) => (
                        <FormItem><FormControl><Input type="number" placeholder="%" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeCondition(conditionIndex)}><Trash2 className="h-4 w-4" /></Button>
                </div>
            ))}
            <div className="flex justify-between items-center mt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => appendCondition({ id: `cond-${Date.now()}`, name: '', probability: 0 })}><PlusCircle className="mr-2 h-4 w-4" />{t("Add Condition")}</Button>
                <div className={`text-sm ${totalProb !== 100 ? 'text-destructive' : 'text-green-600'}`}>{t("Total")}: {totalProb}%</div>
            </div>
            <Button type="button" variant="destructive" size="sm" className="mt-4 w-full" onClick={() => removeRegion(regionIndex)}>{t("Delete Region")}</Button>
        </div>
    );
};


export function EditCampaignDialog({ isOpen, onOpenChange, onSave, campaign }: EditCampaignDialogProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [userGrimoires, setUserGrimoires] = useState<Grimoire[]>([]);
  const [currentGrimoire, setCurrentGrimoire] = useState<Grimoire | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPermissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [managingUser, setManagingUser] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });
  
  const { watch, setValue, control } = form;
  const inventoryType = watch('inventoryType');
  const grimoireId = watch('grimoireId');
  const { fields: regionFields, append: appendRegion, remove: removeRegion } = useFieldArray({ control, name: 'weatherRegions' });

  useEffect(() => {
    if (user && user.role === 'dm' && isOpen) {
      getGrimoiresByUsername(user.username).then(setUserGrimoires);
    }
  }, [user, isOpen]); 
  
  useEffect(() => {
    if(grimoireId) {
      getGrimoireById(grimoireId).then(setCurrentGrimoire);
    } else {
      setCurrentGrimoire(null);
    }
  }, [grimoireId]);

  useEffect(() => {
    if (campaign && isOpen) {
      form.reset({
        name: campaign.name,
        description: campaign.description,
        invitedUsernames: campaign.invitedUsernames.join(', '),
        grimoireId: campaign.grimoireId,
        image: campaign.image,
        inventoryType: campaign.inventorySettings.type,
        defaultInventorySize: campaign.inventorySettings.defaultSize,
        daysPerMonth: campaign.calendarSettings.daysPerMonth,
        monthsPerYear: campaign.calendarSettings.monthsPerYear,
        yearName: campaign.calendarSettings.yearName,
        weatherRegions: campaign.weatherSettings.regions,
      });
      setImagePreview(campaign.image);
    } else if (!isOpen) {
      form.reset();
      setImagePreview(null);
      setCurrentGrimoire(null);
    }
  }, [campaign, isOpen, form]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setValue('image', result);
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManagePermissions = (username: string) => {
    setManagingUser(username);
    setPermissionsDialogOpen(true);
  }

  const handleSavePermissions = (username: string, permissions: UserPermissions, inventorySize?: number) => {
      if (!campaign) return;
        const updatedCampaign = {
            ...campaign,
            userPermissions: {
                ...campaign.userPermissions,
                [username]: permissions
            },
            userInventories: {
                ...campaign.userInventories,
                [username]: {
                    ...campaign.userInventories[username],
                    items: campaign.userInventories[username]?.items || [],
                    maxSize: inventorySize
                }
            }
        };
        // This is a bit of a hack since we are not submitting the form yet.
        // We directly call onSave to update the state in the parent component.
        // This is necessary because the dialog is complex.
        onSave(updatedCampaign);
        setPermissionsDialogOpen(false);
  };

  function onSubmit(values: FormData) {
    if (!campaign) return;

    const invitedUsernames = values.invitedUsernames
      ? values.invitedUsernames.split(',').map(u => u.trim()).filter(Boolean)
      : [];
    
    // Pass the existing permissions through
    const updatedPermissions = { ...campaign.userPermissions };
    const updatedInventories = { ...campaign.userInventories };

    // Clean up permissions and inventories for users who were removed
    const currentUsers = new Set(invitedUsernames);
    Object.keys(updatedPermissions).forEach(username => {
        if (!currentUsers.has(username)) {
            delete updatedPermissions[username];
        }
    });
    Object.keys(updatedInventories).forEach(username => {
        if (!currentUsers.has(username)) {
            delete updatedInventories[username];
        }
    });


    onSave({ 
        name: values.name,
        description: values.description || '',
        invitedUsernames, 
        grimoireId: values.grimoireId === "null" ? null : values.grimoireId,
        image: values.image,
        inventorySettings: {
            type: values.inventoryType,
            defaultSize: values.inventoryType === 'limited' ? values.defaultInventorySize : undefined,
        },
        userPermissions: updatedPermissions,
        userInventories: updatedInventories, 
        calendarSettings: {
            daysPerMonth: values.daysPerMonth,
            monthsPerYear: values.monthsPerYear,
            yearName: values.yearName,
        },
        weatherSettings: {
            regions: values.weatherRegions,
        }
    });
  }

  const invitedUsernames = watch('invitedUsernames')?.split(',').map(u => u.trim()).filter(Boolean) || [];

  return (
    <>
    {managingUser && (
       <UserPermissionsDialog
          isOpen={isPermissionsDialogOpen}
          onOpenChange={setPermissionsDialogOpen}
          username={managingUser}
          campaign={campaign}
          grimoire={currentGrimoire}
          onSave={handleSavePermissions}
       />
    )}
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            form.reset();
            setImagePreview(null);
        }
        onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{t('Edit Campaign')}</DialogTitle>
          <DialogDescription>
            {t('Update the details for your campaign.')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Campaign Name')}</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., The Lost Mines of Phandelver" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('A short, enticing description of your campaign.')}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Header Image')}</FormLabel>
                   <FormControl>
                     <div>
                      <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleImageChange} 
                          className="hidden" 
                          accept="image/*"
                      />
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="mr-2 h-4 w-4" />
                          {t('Upload Image')}
                      </Button>
                     </div>
                  </FormControl>
                   {imagePreview && (
                    <div className="mt-4 relative w-full aspect-[16/9] rounded-md overflow-hidden">
                        <Image src={imagePreview} alt="Header preview" fill className="object-cover" />
                    </div>
                   )}
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="grimoireId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Link Grimoire')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""} >
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder={t('Select a grimoire to link')} />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="null">{t('None')}</SelectItem>
                          {userGrimoires.map(g => (
                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="invitedUsernames"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Invite Players (Usernames)')}</FormLabel>
                  <FormControl>
                    <Input placeholder="volo, drizzt (comma-separated)" {...field} />
                  </FormControl>
                   <FormDescription>
                    {t('Separate multiple usernames with a comma.')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <Separator />
            <Accordion type="multiple" className="w-full">
                <AccordionItem value="advanced-settings">
                     <AccordionTrigger className="text-lg font-headline hover:no-underline">
                        <div className="flex items-center gap-2 text-base">
                            <UserCog className='h-5 w-5 text-primary' /> {t('Advanced Settings')}
                        </div>
                     </AccordionTrigger>
                     <AccordionContent className="pt-4 space-y-6">
                         <FormField
                            control={form.control}
                            name="inventoryType"
                            render={({ field }) => (
                            <FormItem className="space-y-3 rounded-md border p-4">
                                <FormLabel>{t('Inventory Rules')}</FormLabel>
                                <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-1"
                                >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="free" />
                                        </FormControl>
                                        <FormLabel className="font-normal">{t('Free')}</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="limited" />
                                        </FormControl>
                                        <FormLabel className="font-normal">{t('Limited')}</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        {inventoryType === 'limited' ? (
                            <FormField
                                control={form.control}
                                name="defaultInventorySize"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('Default Inventory Size')}</FormLabel>
                                    <FormControl>
                                    <Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                                    </FormControl>
                                    <FormDescription>
                                        {t('Set a default inventory size for new players.')}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        ) : (
                            <p className='text-sm text-muted-foreground'>{t('Inventory is not restricted.')}</p>
                        )}

                        <div className="space-y-3 rounded-md border p-4">
                            <FormLabel>{t('Player Permissions')}</FormLabel>
                            <FormDescription>
                                {t('Manage what each player can see in the grimoire.')}
                            </FormDescription>
                            {!grimoireId && <p className="text-sm text-amber-500">{t('Link a grimoire to manage permissions.')}</p>}
                            <div className="space-y-2">
                                {invitedUsernames.map(username => (
                                    <div key={username} className="flex justify-between items-center">
                                        <p className="text-sm font-medium">{username}</p>
                                        <Button type="button" variant="outline" size="sm" onClick={() => handleManagePermissions(username)} disabled={!grimoireId}>
                                            <KeyRound className="mr-2 h-4 w-4" />
                                            {t('Permissions')}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="time-weather">
                    <AccordionTrigger className="text-lg font-headline hover:no-underline">
                        <div className="flex items-center gap-2 text-base">
                             <CalendarDays className='h-5 w-5 text-primary' /> {t('Time & Weather')}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-6">
                        <div className="rounded-md border p-4 space-y-4">
                            <h4 className="font-medium">{t("Calendar Settings")}</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={control} name="daysPerMonth" render={({ field }) => (
                                    <FormItem><FormLabel>{t("Days per Month")}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={control} name="monthsPerYear" render={({ field }) => (
                                    <FormItem><FormLabel>{t("Months per Year")}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                             <FormField control={control} name="yearName" render={({ field }) => (
                                <FormItem><FormLabel>{t("Epoch/Year Name")}</FormLabel><FormControl><Input {...field} placeholder={t("e.g. Year of the Phoenix")} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <div className="rounded-md border p-4 space-y-4">
                            <h4 className="font-medium">{t("Weather Settings")}</h4>
                            {regionFields.map((region, regionIndex) => (
                                <WeatherRegionFields 
                                    key={region.id}
                                    control={control} 
                                    regionIndex={regionIndex} 
                                    removeRegion={removeRegion} 
                                />
                            ))}
                            <Button type="button" className="w-full" variant="secondary" onClick={() => appendRegion({ id: `reg-${Date.now()}`, name: '', conditions: [] })}><PlusCircle className="mr-2 h-4 w-4" />{t("Add Region")}</Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>


            <DialogFooter className="mt-6">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
                <Button type="submit">{t('Save Changes')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
}
