'use client';

import { useEffect, useState, useRef, ChangeEvent } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Campaign, Grimoire, UserPermissions, PredefinedWeatherCondition, RegionWeatherCondition, UserCampaignInventory } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { getGrimoiresByUsername, getGrimoireById } from '@/lib/data-service';
import { useI18n } from '@/context/i18n-context';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, KeyRound, UserCog, CalendarDays, CloudSun, PlusCircle, Trash2, Settings } from 'lucide-react';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Separator } from './ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Label } from './ui/label';
import { Switch } from '../components/ui/switch';
import { InlineUserPermissions } from './InlineUserPermissions';
import { toast } from '@/hooks/use-toast';


const regionWeatherConditionSchema = z.object({
    conditionId: z.string().min(1, 'Please select a condition'),
    probability: z.number().min(0).max(100),
});

const predefinedWeatherConditionSchema = z.object({
    id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
    name: z.string().min(1, 'Condition name is required.'),
});

const weatherRegionSchema = z.object({
    id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
    name: z.string().min(1, 'Region name is required.'),
    conditions: z.array(regionWeatherConditionSchema),
});

const PermissionLevelSchema = z.enum(['full', 'partial', 'none']);

const UserPermissionDetailsSchema = z.object({
    canEditTracking: z.boolean().optional(),
    canEditBestiary: z.boolean().optional(),
})
.partial() 
.catchall(PermissionLevelSchema);

const UserInventoryDetailsSchema = z.object({
    maxSize: z.coerce.number().int().min(0).optional().nullable(),
}).optional();

const formSchema = z.object({
    name: z.string().min(1, 'Campaign name is required.'),
    description: z.string().optional(),
    invitedUsernames: z.string().optional(),
    grimoireId: z.string().nullable(),
    image: z.string().nullable(),
    userPermissions: z.record(z.string(), UserPermissionDetailsSchema).optional(),
    userInventories: z.record(z.string(), UserInventoryDetailsSchema).optional(),
    // Inventar-Einstellungen
    inventoryType: z.enum(['free', 'limited']),
    defaultInventorySize: z.coerce.number().min(0).optional(),
    // Kalender-Einstellungen
    daysPerMonth: z.coerce.number().min(1),
    monthsPerYear: z.coerce.number().min(1),
    yearName: z.string(),
    // Wetter-Einstellungen
    predefinedConditions: z.array(predefinedWeatherConditionSchema),
    weatherRegions: z.array(weatherRegionSchema),
    // Tracking-Sichtbarkeit
    visibility: z.object({
        showDate: z.boolean(),
        showTimeOfDay: z.boolean(),
        showWeather: z.boolean(),
        showRegion: z.boolean(),
    }),
});

type FormData = z.infer<typeof formSchema>;

export type CampaignUpdateData = {
    name: string;
    description: string | undefined;
    invitedUsernames: string[];
    grimoireId: string | null;
    image: string | null;
    
    // Vollständige Konfigurationsobjekte für die Grimoire-DB
    inventorySettings: Campaign['inventorySettings'];
    userPermissions: { [key: string]: UserPermissions }; // Expliziter Typ
    userInventories: { [key: string]: UserCampaignInventory }; // Expliziter Typ
    calendarSettings: Campaign['calendarSettings'];
    weatherSettings: Campaign['weatherSettings'];
    tracking: Campaign['tracking'];
};

interface EditCampaignDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSave: (campaignId: string, data: CampaignUpdateData) => Promise<void>; 
    campaign: Campaign | null;
}

// Die WeatherRegionFields Komponente verwendet jetzt FormField und ist vollständig
const WeatherRegionFields = ({ control, watch, regionIndex, removeRegion, predefinedConditions }: { control: any, watch: any, regionIndex: number, removeRegion: (index: number) => void, predefinedConditions: PredefinedWeatherCondition[] }) => {
    const { t } = useI18n();
    const { fields: conditionFields, append: appendCondition, remove: removeCondition } = useFieldArray({
        control,
        name: `weatherRegions.${regionIndex}.conditions`
    });

    // Verwende useWatch für die Conditions, um React-Rendering zu triggern
    const conditions = useWatch({
        control,
        name: `weatherRegions.${regionIndex}.conditions`,
        defaultValue: []
    });

    const totalProb = (conditions || []).reduce((acc: number, c: any) => acc + (c.probability || 0), 0);

    return (
        <div className="p-3 border rounded-md bg-background/50">
            <div className='flex justify-between items-start'>
                <FormField control={control} name={`weatherRegions.${regionIndex}.name`} render={({ field }) => (
                    <FormItem className='flex-grow pr-4'>
                        <FormLabel>{t("Region Name")}</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="button" variant="destructive" size="sm" className="mt-8" onClick={() => removeRegion(regionIndex)}><Trash2 className='h-4 w-4' /></Button>
            </div>

            <Label className="mt-4 mb-2 block">{t("Conditions")}</Label>
            {conditionFields.map((condition, conditionIndex) => (
                <div key={condition.id} className="grid grid-cols-[2fr,1fr,auto] gap-2 items-center mb-2">
                    <FormField control={control} name={`weatherRegions.${regionIndex}.conditions.${conditionIndex}.conditionId`} render={({ field }) => (
                       <FormItem>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder={t("Select...")} /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {predefinedConditions.map((pc) => (
                                        <SelectItem key={pc.id} value={pc.id}>{pc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={control} name={`weatherRegions.${regionIndex}.conditions.${conditionIndex}.probability`} render={({ field }) => (
                        <FormItem><FormControl><Input type="number" placeholder="%" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeCondition(conditionIndex)}><Trash2 className="h-4 w-4" /></Button>
                </div>
            ))}
            <div className="flex justify-between items-center mt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => appendCondition({ conditionId: predefinedConditions[0]?.id || '', probability: 0 })}><PlusCircle className="mr-2 h-4 w-4" />{t("Add Condition")}</Button>
                <div className={`text-sm ${totalProb !== 100 ? 'text-destructive' : 'text-green-600'}`}>{t("Total")}: {totalProb}%</div>
            </div>
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

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
    });
    
    const { watch, setValue, control } = form;
    const inventoryType = watch('inventoryType');
    const grimoireId = watch('grimoireId');
    const { fields: regionFields, append: appendRegion, remove: removeRegion } = useFieldArray({ control, name: 'weatherRegions' });
    const { fields: predefinedConditionFields, append: appendPredefinedCondition, remove: removePredefinedCondition } = useFieldArray({ control, name: 'predefinedConditions' });

    const predefinedConditions = watch('predefinedConditions');

    const visibilityKeys = [
      'Show Date',
      'Show Time Of Day',
      'Show Weather',
      'Show Region',
    ] as const;

    const descriptionKeys = [
      'Control whether players see the date.',
      'Control whether players see the time of day.',
      'Control whether players see the weather.',
      'Control whether players see the region.',
    ] as const;

    useEffect(() => {
        if (user && user.role === 'dm' && isOpen) {
            getGrimoiresByUsername().then(setUserGrimoires);
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
                invitedUsernames: (campaign.invitedUsernames ?? []).join(', '),
                grimoireId: campaign.grimoireId,
                image: campaign.image,
                inventoryType: campaign.inventorySettings?.type ?? 'free',
                defaultInventorySize: campaign.inventorySettings?.defaultSize ?? 0,
                daysPerMonth: campaign.calendarSettings?.daysPerMonth ?? 30,
                monthsPerYear: campaign.calendarSettings?.monthsPerYear ?? 12,
                yearName: campaign.calendarSettings?.yearName ?? '',
                predefinedConditions: campaign.weatherSettings?.predefinedConditions || [],
                weatherRegions: campaign.weatherSettings?.regions || [],
                visibility: campaign.tracking?.visibility || { showDate: true, showTimeOfDay: true, showWeather: true, showRegion: true },
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

    // function onSubmit(values: FormData)
    const onSubmit = async (values: FormData) => {
      if (!campaign) return;

      // 1. Eingeladene Usernamen normalisieren
      const invitedUsernames = values.invitedUsernames
          ? values.invitedUsernames.split(',').map(u => u.trim()).filter(Boolean)
          : [];

      // Alle relevanten User (Creator + Eingeladene)
      const allCurrentUsers = new Set([campaign.creatorUsername, ...invitedUsernames]);
      
      // Die aktuellen Permissions und Inventaries direkt aus dem RHF-Formular-Werten übernehmen
      const formPermissions = values.userPermissions || {};
      const formInventories = values.userInventories || {};

      // 2. Bereinigung: Nur die Permissions/Inventories der aktuell eingeladenen Nutzer behalten
      //    (Entfernt Einträge von Usern, die nicht mehr eingeladen sind)
      const updatedPermissions = Object.keys(formPermissions).reduce((acc, username) => {
          if (allCurrentUsers.has(username)) {
              acc[username] = formPermissions[username];
          }
          return acc;
      }, {} as typeof formPermissions);

      const updatedInventories = Object.keys(formInventories).reduce((acc, username) => {
          if (allCurrentUsers.has(username)) {
              // WICHTIG: Inventories, die RHF als 'undefined' liefert (leeres Feld), sollten im Backend
              // oft als `null` oder ganz weggelassen werden. Hier behalten wir das Objekt.
              acc[username] = formInventories[username]; 
          }
          return acc;
      }, {} as typeof formInventories);


      const updateData: CampaignUpdateData = {
          name: values.name,
          description: values.description || '',
          invitedUsernames, 
          grimoireId: values.grimoireId === "null" ? null : values.grimoireId,
          image: values.image,
          
          // Verwende die korrigierten Daten aus dem RHF-Formular
          userPermissions: updatedPermissions as CampaignUpdateData['userPermissions'], 
          userInventories: updatedInventories as CampaignUpdateData['userInventories'],
          
          // ... Rest der Konfigurationen
          inventorySettings: {
              type: values.inventoryType,
              defaultSize: values.inventoryType === 'limited' ? values.defaultInventorySize : undefined,
          },
          calendarSettings: {
              daysPerMonth: values.daysPerMonth,
              monthsPerYear: values.monthsPerYear,
              yearName: values.yearName,
          },
          weatherSettings: {
              predefinedConditions: values.predefinedConditions,
              regions: values.weatherRegions,
          },
          tracking: {
              ...campaign.tracking,
              visibility: values.visibility
          }
      }
      try {
        await onSave(campaign.id, updateData);
        
        onOpenChange(false); 
        
    } catch (error) {
        console.error(t('Failed to save the campaign settings.'), error);
        toast({ 
            title: t('Error'), 
            description: t('Failed to save the campaign settings.'), 
            variant: 'destructive' ,
        });
    }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t("Edit Campaign")}: {campaign?.name}</DialogTitle>
                    <DialogDescription>{t("Adjust the basic information and various settings for your campaign.")}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* === General Settings === */}
                        <Accordion type="single" defaultValue="general" collapsible className="w-full">
                            <AccordionItem value="general">
                                <AccordionTrigger><Settings className="h-5 w-5 mr-2" />{t("General & Appearance")}</AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                    <FormField
                                        control={control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("Campaign Name")}</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("Description")}</FormLabel>
                                                <FormControl><Textarea {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name="image"
                                        render={() => (
                                            <FormItem>
                                                <FormLabel>{t("Cover Image")}</FormLabel>
                                                <div className="flex items-center space-x-4">
                                                    {imagePreview && (
                                                        <Image 
                                                            src={imagePreview} 
                                                            alt="Campaign Cover" 
                                                            width={100} 
                                                            height={100} 
                                                            className="rounded-lg object-cover w-[100px] h-[100px]"
                                                        />
                                                    )}
                                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="flex items-center">
                                                        <Upload className="h-4 w-4 mr-2" /> {t("Upload Image")}
                                                    </Button>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        accept="image/*"
                                                        onChange={handleImageChange}
                                                        className="hidden"
                                                    />
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </AccordionContent>
                            </AccordionItem>

                           {/* === Grimoire and Player Management === */}
                            <AccordionItem value="management">
                                <AccordionTrigger><UserCog className="h-5 w-5 mr-2" />{t("Grimoire & Players")}</AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                    
                                      <FormField
                                        control={control}
                                        name="grimoireId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("Grimoire")}</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value ?? 'null'}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={t("Select a Grimoire...")} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="null">{t("No Grimoire (for testing)")}</SelectItem>
                                                        {userGrimoires.map(grimoire => (
                                                            <SelectItem key={grimoire.id} value={grimoire.id}>
                                                                {grimoire.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    {currentGrimoire
                                                      ? t("Grimoire Database: {0}", { 0: currentGrimoire.name })
                                                      : t("The core database for all campaign notes and content.")}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Separator />
                                    <FormField
                                        control={control}
                                        name="invitedUsernames"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("Invited Players (Usernames, comma-separated)")}</FormLabel>
                                                <FormControl><Textarea {...field} /></FormControl>
                                                <FormDescription>{t("List the usernames of players to invite.")}</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Separator /> 
                                    {campaign && (
                                        <div className="space-y-4">
                                            <Label className="block text-lg font-medium mb-4">{t("Manage Player Permissions")}</Label>
                                            {[campaign.creatorUsername, ...(form.getValues('invitedUsernames')?.split(',').map(u => u.trim()).filter(Boolean) || [])]
                                                .filter((v, i, a) => a.indexOf(v) === i)
                                                .map((username) => (
                                                    <InlineUserPermissions 
                                                        key={username}
                                                        username={username}
                                                        control={control}
                                                        campaign={campaign}
                                                        grimoire={currentGrimoire}
                                                    />
                                                ))}
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>

                            {/* === Inventory Settings === */}
                            <AccordionItem value="inventory">
                                <AccordionTrigger><Settings className="h-5 w-5 mr-2" />{t("Inventory Settings")}</AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                    <FormField
                                        control={control}
                                        name="inventoryType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("Inventory Type")}</FormLabel>
                                                <FormControl>
                                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                            <FormControl><RadioGroupItem value="free" /></FormControl>
                                                            <FormLabel className="font-normal">{t("Free (Unlimited Slots)")}</FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                            <FormControl><RadioGroupItem value="limited" /></FormControl>
                                                            <FormLabel className="font-normal">{t("Limited (Fixed Slots)")}</FormLabel>
                                                        </FormItem>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {inventoryType === 'limited' && (
                                        <FormField
                                            control={control}
                                            name="defaultInventorySize"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t("Default Inventory Slots")}</FormLabel>
                                                    <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl>
                                                    <FormDescription>{t("The default number of slots for new players.")}</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </AccordionContent>
                            </AccordionItem>

                            {/* === Calendar Settings === */}
                            <AccordionItem value="calendar">
                                <AccordionTrigger><CalendarDays className="h-5 w-5 mr-2" />{t("Calendar Settings")}</AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                    <FormField
                                        control={control}
                                        name="yearName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("Year Name")}</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormDescription>{t("e.g. 'The Year of the Phoenix'")}</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={control}
                                            name="daysPerMonth"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t("Days per Month")}</FormLabel>
                                                    <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={control}
                                            name="monthsPerYear"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t("Months per Year")}</FormLabel>
                                                    <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            
                            {/* === Weather Settings === */}
                            <AccordionItem value="weather">
                                <AccordionTrigger><CloudSun className="h-5 w-5 mr-2" />{t("Weather Settings")}</AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                    {/* Predefined Conditions */}
                                    <div className='p-3 border rounded-md bg-background/50'>
                                        <Label className="mb-2 block">{t("Predefined Weather Conditions")}</Label>
                                        {predefinedConditionFields.map((field, index) => (
                                            <div key={field.id} className="flex space-x-2 mb-2">
                                                <FormField control={control} name={`predefinedConditions.${index}.name`} render={({ field: nameField }) => (
                                                    <FormItem className='flex-grow'>
                                                        <FormControl><Input {...nameField} placeholder={t("e.g. Sunny, Heavy Rain, Snow")} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                <Button type="button" variant="destructive" size="icon" className="h-9 w-9" onClick={() => removePredefinedCondition(index)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" size="sm" onClick={() => appendPredefinedCondition({ id: Math.random().toString(36).substring(2, 9), name: '' })}><PlusCircle className="mr-2 h-4 w-4" />{t("Add Condition")}</Button>
                                    </div>

                                    <Separator />

                                    {/* Weather Regions */}
                                    <Label className="mb-2 block">{t("Weather Regions")}</Label>
                                    <div className='space-y-4'>
                                        {regionFields.map((field, index) => (
                                            <WeatherRegionFields 
                                                key={field.id}
                                                control={control}
                                                watch={watch}
                                                regionIndex={index}
                                                removeRegion={removeRegion}
                                                predefinedConditions={predefinedConditions}
                                            />
                                        ))}
                                        <Button type="button" variant="outline" onClick={() => appendRegion({ id: Math.random().toString(36).substring(2, 9), name: '', conditions: [] })}><PlusCircle className="mr-2 h-4 w-4" />{t("Add Region")}</Button>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* === Tracking Visibility === */}
                            <AccordionItem value="visibility">
                                <AccordionTrigger><Settings className="h-5 w-5 mr-2" />{t("DM Tracking Visibility")}</AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                    {visibilityKeys.map((key, index) => (
                                      <FormField
                                          key={key} 
                                          control={control}
                                          name={`visibility.${key.replace(/ /g, '').replace('Show', 'show')}` as 'visibility.showDate'}
                                          render={({ field }) => (
                                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                  <div className="space-y-0.5">
                                                      <FormLabel>{t(key)}</FormLabel>
                                                      <FormDescription>
                                                          {t(descriptionKeys[index])}
                                                      </FormDescription>
                                                  </div>
                                                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                              </FormItem>
                                          )}
                                      />
                                  ))}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                        
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("Cancel")}</Button>
                            <Button type="submit">{t("Save Changes")}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
