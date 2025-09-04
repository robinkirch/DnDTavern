'use client';

import { useEffect, useState, useRef, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Campaign, Grimoire, UserPermissions } from '@/lib/types';
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
import { Upload, KeyRound, UserCog } from 'lucide-react';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Separator } from './ui/separator';
import { UserPermissionsDialog } from './user-permissions-dialog';

const formSchema = z.object({
  name: z.string().min(1, 'Campaign name is required.'),
  description: z.string().optional(),
  invitedUsernames: z.string().optional(),
  grimoireId: z.string().nullable(),
  image: z.string().nullable(),
  inventoryType: z.enum(['free', 'limited']),
  defaultInventorySize: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditCampaignDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSave: (data: Omit<Campaign, 'id' | 'creatorUsername' | 'sessionNotes' | 'sessionNotesDate'>) => void;
    campaign: Campaign | null;
}

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
  
  const { watch, setValue } = form;
  const inventoryType = watch('inventoryType');
  const grimoireId = watch('grimoireId');

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

        // This is a temporary save. The final save happens when the main dialog is submitted.
        // We update the parent's state directly.
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

             <div className="space-y-3">
                 <h4 className="font-headline text-lg flex items-center gap-2"><UserCog className='h-5 w-5 text-primary' /> {t('Advanced Settings')}</h4>
                 
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

            </div>

            <DialogFooter>
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
