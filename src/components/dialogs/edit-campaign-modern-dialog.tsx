import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { Settings, CloudSun, Calendar, Box, Users, Info, AlertCircle, AlertTriangle, Save, X, PlusCircle, Trash2, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Campaign, Grimoire, PredefinedWeatherCondition, TimeOfDay, User, UserCampaignInventory, UserPermissions } from '@/lib/types';
import { useI18n } from '@/context/i18n-context';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { InlineUserPermissions } from '../InlineUserPermissions';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { getGrimoireById } from '@/lib/data-service';

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

const additionalInventorySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    size: z.coerce.number().min(1, 'Size must be at least 1'),
    // items: z.array().optional(), //inventoryitemsschema
});

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
    additionalInventories: z.array(additionalInventorySchema).default([]),
    // Kalender-Einstellungen
    daysPerMonth: z.coerce.number().min(1),
    monthsPerYear: z.coerce.number().min(1),
    yearName: z.string(),
    tracking: z.object({
        currentDate:  z.object({
            day: z.coerce.number().min(1),
            month: z.coerce.number().min(1),
            year: z.coerce.number().min(1),
        }),
        currentTimeOfDay: z.string().optional(),
        currentRegionId: z.string().nullable().optional(),
        currentWeather: z.string().nullable().optional(),
    }),
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
    
    inventorySettings: Campaign['inventorySettings'];
    userPermissions: { [key: string]: UserPermissions };
    userInventories: { [key: string]: UserCampaignInventory };
    calendarSettings: Campaign['calendarSettings'];
    weatherSettings: Campaign['weatherSettings'];
    tracking: Campaign['tracking'];
};

interface EditCampaignDialogProps {
    campaign: Campaign | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (id: string, data: any) => Promise<void>;
}

export function EditCampaignModernDialog({ campaign, isOpen, onOpenChange, onSave }: EditCampaignDialogProps) {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState("general");
    const [currentGrimoire, setCurrentGrimoire] = useState<Grimoire | null>(null);
    
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            predefinedConditions: [],
            weatherRegions: [],
            visibility: { showDate: true, showTimeOfDay: true, showWeather: true, showRegion: true },
            tracking: { currentDate: { day: 1, month: 1, year: 1 } }
        }
    });
    
    const { control, watch, setValue, handleSubmit, reset, formState: { errors, dirtyFields } } = form;
    const grimoireId = watch('grimoireId');

    const campaignToFormData = (c: Campaign): Partial<FormData> => {
        return {
            name: c.name || '',
            description: c.description || '',
            invitedUsernames: Array.isArray(c.invitedUsernames) ? c.invitedUsernames.map((u: any) => u.username).join(', ') : '',
            grimoireId: c.grimoireId || "null",
            image: c.image || null,
            userPermissions: c.userPermissions || {},
            userInventories: c.userInventories || {},
            inventoryType: c.inventorySettings?.type || 'free',
            defaultInventorySize: c.inventorySettings?.defaultSize || 0,
            additionalInventories: c.inventorySettings?.additionalInventories || [],
            daysPerMonth: c.calendarSettings?.daysPerMonth || 30,
            monthsPerYear: c.calendarSettings?.monthsPerYear || 12,
            yearName: c.calendarSettings?.yearName || '',
            tracking: {
                currentDate: c.tracking?.currentDate || { day: 1, month: 1, year: 1 },
                currentTimeOfDay: c.tracking?.currentTimeOfDay || 'morning',
                currentRegionId: c.tracking?.currentRegionId || null,
                currentWeather: c.tracking?.currentWeather || null,
            },
            predefinedConditions: c.weatherSettings?.predefinedConditions || [],
            weatherRegions: c.weatherSettings?.regions || [],
            visibility: c.tracking?.visibility || { 
                showDate: true, showTimeOfDay: true, showWeather: true, showRegion: true 
            },
        };
    };

    useEffect(() => {
        if (campaign && isOpen) {
            reset(campaignToFormData(campaign));
        }
    }, [campaign, isOpen, reset]);

    useEffect(() => {
            if(grimoireId) {
                getGrimoireById(grimoireId).then(setCurrentGrimoire);
            } else {
                setCurrentGrimoire(null);
            }
        }, [grimoireId]);

    // Hilfsfunktion zur Statuserkennung in der Sidebar
    const getTabStatus = (fields: string[]) => {
        const hasError = fields.some(field => {
            const error = field.split('.').reduce((o: any, i) => o?.[i], errors);
            return !!error;
        });
        const isDirty = fields.some(field => {
            const dirty = field.split('.').reduce((o: any, i) => o?.[i], dirtyFields);
            return !!dirty;
        });

        if (hasError) return <AlertCircle className="h-4 w-4 text-destructive animate-pulse" />;
        if (isDirty) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        return null;
    };

    const onSubmit = async (values: FormData) => {
        if (!campaign) return;

        const invitedUsernames = values.invitedUsernames ? values.invitedUsernames.split(',').map(u => u.trim()).filter(Boolean) : [];

        const allCurrentUsers = new Set([campaign.creatorUsername, ...invitedUsernames]);
        const formPermissions = values.userPermissions || {};
        const formInventories = values.userInventories || {};

        const updatedPermissions = Object.keys(formPermissions).reduce((acc, username) => {
            if (allCurrentUsers.has(username)) acc[username] = formPermissions[username];
            return acc;
        }, {} as any);

        const updatedInventories = Object.keys(formInventories).reduce((acc, username) => {
            if (allCurrentUsers.has(username)) acc[username] = formInventories[username];
            return acc;
        }, {} as any);

        const updateData: CampaignUpdateData = {
            name: values.name,
            description: values.description || '',
            invitedUsernames,
            grimoireId: values.grimoireId === "null" ? null : values.grimoireId,
            image: values.image,
            userPermissions: updatedPermissions,
            userInventories: updatedInventories,
            inventorySettings: {
                type: values.inventoryType,
                defaultSize: values.inventoryType === 'limited' ? values.defaultInventorySize : undefined,
                additionalInventories: values.additionalInventories,
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
                currentDate: values.tracking.currentDate,
                currentTimeOfDay: (values.tracking.currentTimeOfDay || 'morning') as TimeOfDay,
                currentRegionId: values.tracking.currentRegionId || null,
                currentWeather: values.tracking.currentWeather || null,
                visibility: values.visibility
            }
        };

        try {
            await onSave(campaign.id, updateData);
            onOpenChange(false);
        } catch (error) {
            toast({ 
                title: t('Error'), 
                description: t('Failed to save the campaign settings.'), 
                variant: 'destructive' 
            });
        }
    };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Settings className="h-6 w-6" />
            {t("Edit Campaign")}: {campaign?.name}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-grow overflow-hidden">
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-grow overflow-hidden">
              <TabsList className="flex flex-col h-full w-64 bg-muted/30 rounded-none border-r p-2 justify-start space-y-1">
                <NavTrigger 
                  value="general" 
                  icon={<Info className="h-4 w-4" />} 
                  label={t("General & Appearance")} 
                  status={getTabStatus(['name', 'description', 'image'])} 
                />
                <NavTrigger 
                  value="players" 
                  icon={<Users className="h-4 w-4" />} 
                  label={t("Grimoire & Players")} 
                  status={getTabStatus(['invitedUsernames', 'userPermissions'])} 
                />
                <NavTrigger 
                  value="inventory" 
                  icon={<Box className="h-4 w-4" />} 
                  label={t("Inventory Settings")} 
                  status={getTabStatus(['inventoryType', 'defaultInventorySize'])} 
                />
                <NavTrigger 
                  value="calendar" 
                  icon={<Calendar className="h-4 w-4" />} 
                  label={t("Calendar Settings")} 
                  status={getTabStatus(['daysPerMonth', 'monthsPerYear'])} 
                />
                <NavTrigger 
                  value="weather" 
                  icon={<CloudSun className="h-4 w-4" />} 
                  label={t("Weather Settings")} 
                  status={getTabStatus(['predefinedConditions', 'weatherRegions'])} 
                />
                <NavTrigger 
                  value="visibility" 
                  icon={<Settings className="h-4 w-4" />} 
                  label={t("DM Tracking Visibility")} 
                  status={getTabStatus(['visibility'])} 
                />
              </TabsList>

              <div className="flex-grow overflow-y-auto p-6">
                <TabsContent value="general" className="m-0 mt-0">
                  <GeneralSettings control={control} setValue={setValue} />
                </TabsContent>
                <TabsContent value="players" className="m-0 mt-0">
                  <PlayerPermissions form={form} campaign={campaign} currentGrimoire={currentGrimoire}/>
                </TabsContent>
                <TabsContent value="inventory" className="m-0 mt-0">
                  <InventorySettings control={control} watch={watch} />
                </TabsContent>
                <TabsContent value="calendar" className="m-0 mt-0">
                  <CalendarSettings control={control} />
                </TabsContent>
                <TabsContent value="weather" className="m-0 mt-0">
                  <WeatherSettings form={form} watch={watch} />
                </TabsContent>
                <TabsContent value="visibility" className="m-0 mt-0">
                  <VisibilitySettings control={control} />
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="p-4 border-t bg-background">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="gap-2">
                <X className="h-4 w-4" /> {t("Cancel")}
              </Button>
              <Button type="submit" className="gap-2 bg-primary">
                <Save className="h-4 w-4" /> {t("Save Changes")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Sub-Komponente für die Navigation-Buttons (Modular & sauber)
 */
function NavTrigger({ value, icon, label, status }: { value: string, icon: React.ReactNode, label: string, status: React.ReactNode }) {
  return (
    <TabsTrigger 
      value={value} 
      className={cn(
        "w-full justify-start gap-3 px-3 py-2.5 transition-all",
        "data-[state=active]:bg-background data-[state=active]:shadow-sm"
      )}
    >
      {icon}
      <span className="flex-grow text-left">{label}</span>
      {status}
    </TabsTrigger>
  );
}



export function GeneralSettings({ control, setValue }: { control: any, setValue: any }) {
    const { t } = useI18n();
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    return (
        <div className="space-y-4">
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
                        <FormControl><Textarea {...field} rows={15} /></FormControl>
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
        </div>
    );
}

export function PlayerPermissions({ form, campaign, currentGrimoire }: { form: any, campaign: Campaign | null, currentGrimoire: Grimoire | null }) {
    const { t } = useI18n();
    if(campaign == null) return (<div>Something went horribly wrong</div>);

    const invitedString = form.watch('invitedUsernames') || '';

    const invitedArray = typeof invitedString === 'string' ? invitedString.split(',').map(name => name.trim()).filter(Boolean) : [];
    const allUsernames = [campaign.creatorUsername, ...invitedArray];

    const uniqueUsernames = Array.from(new Set(allUsernames));

    return (
        <div className="space-y-6">
            <FormField
                control={form.control}
                name="invitedUsernames"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t("Invited Players (Usernames, comma-separated)")}</FormLabel>
                        <FormControl><Textarea {...field} value={typeof field.value === 'string' ? field.value : ""} /></FormControl>
                        <FormDescription>{t("List the usernames of players to invite.")}</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div className="space-y-4">
                <Label className="block text-lg font-medium mb-4">{t("Manage Player Permissions")}</Label>
                {uniqueUsernames.map((username) => (
                    <InlineUserPermissions 
                        key={username}
                        username={username}
                        control={form.control}
                        campaign={campaign}
                        grimoire={currentGrimoire}
                    />
                ))}
            </div>
        </div>
    );
}

export function InventorySettings({ control, watch }: { control: any, watch: any }) {
  const { t } = useI18n();
  const inventoryType = watch("inventoryType");

    const { fields: additionalInvFields, append: appendAdditionalInv, remove: removeAdditionalInv } = useFieldArray({ 
        control, 
        name: 'additionalInventories' 
    });

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="inventoryType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("Inventory Type")}</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="free">{t("Free (Unlimited Slots)")}</SelectItem>
                <SelectItem value="limited">{t("Limited (Fixed Slots)")}</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
      {inventoryType !== "free" && (
        <FormField
          control={control}
          name="defaultInventorySize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Default Player Inventory Slots")}</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
              </FormControl>
            </FormItem>
          )}
        />
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <Label>{t("Additional Inventories (e.g. Party Stash)")}</Label>
            <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => appendAdditionalInv({ name: '', size: 10 })}
            >
                <PlusCircle className="h-4 w-4 mr-2" />
                {t("Add Inventory")}
            </Button>
        </div>

        {additionalInvFields.map((field, index) => (
            <div key={field.id} className="flex gap-4 items-end p-3 border rounded-lg bg-muted/30">
                <FormField
                    control={control}
                    name={`additionalInventories.${index}.name`}
                    render={({ field }) => (
                        <FormItem className="flex-grow">
                            <FormLabel className="text-xs">{t("Inventory Name")}</FormLabel>
                            <FormControl><Input placeholder={t("e.g. Party Chest")} {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name={`additionalInventories.${index}.size`}
                    render={({ field }) => (
                        <FormItem className="w-24">
                            <FormLabel className="text-xs">{t("Slots")}</FormLabel>
                            <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}/></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive" 
                    onClick={() => removeAdditionalInv(index)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        ))}
        {additionalInvFields.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2 italic">
                {t("No shared inventories defined.")}
            </p>
        )}
    </div>
    </div>
  );
}

export function CalendarSettings({ control }: { control: any }) {
    const { t } = useI18n();
    return (
        <div className="grid grid-cols-2 gap-6">
            <FormField
                control={control}
                name="daysPerMonth"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t("Days per Month")}</FormLabel>
                        <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} /></FormControl>
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
                    </FormItem>
                )}
            />
            <div className="col-span-2">
                <FormField
                    control={control}
                    name="yearName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("Year")}</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
}

export function WeatherSettings({ form, watch }: { form: any, watch: any }) {
  const { t } = useI18n();

  const { fields: conditions, append: addCond, remove: remCond } = useFieldArray({
    control: form.control,
    name: "predefinedConditions"
  });
  const { fields: regions, append: addReg, remove: remReg } = useFieldArray({
    control: form.control,
    name: "weatherRegions"
  });

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

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label>{t("Predefined Weather Conditions")}</Label>
        {conditions.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <FormField
              control={form.control}
              name={`predefinedConditions.${index}.name`}
              render={({ field }) => (
                <FormControl className="flex-grow"><Input {...field} /></FormControl>
              )}
            />
            <Button variant="destructive" size="icon" onClick={() => remCond(index)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => addCond({ id: crypto.randomUUID(), name: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" /> {t("Add Condition")}
        </Button>
      </div>

      <div className="space-y-4 border-t pt-6">
        <Label>{t("Weather Regions")}</Label>
        {regions.map((field, index) => (
          <WeatherRegionFields 
            key={field.id} 
            control={form.control} 
            watch={watch}
            regionIndex={index} 
            removeRegion={remReg} 
            predefinedConditions={form.watch("predefinedConditions")}
          />
        ))}
        <Button variant="outline" onClick={() => addReg({ id: crypto.randomUUID(), name: '', conditions: [] })}>
          <PlusCircle className="mr-2 h-4 w-4" /> {t("Add Region")}
        </Button>
      </div>
    </div>
  );
}

export function VisibilitySettings({ control }: { control: any }) {
  const { t } = useI18n();
  
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

  return (
    <div className="space-y-4">
      {visibilityKeys.map((key, index) => (
        <FormField
          key={key}
          control={control}
          name={`visibility.${key.replace(/ /g, '').replace('Show', 'show')}` as 'visibility.showDate'}
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>{t(key)}</FormLabel>
                <FormDescription>{t(descriptionKeys[index])}</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}