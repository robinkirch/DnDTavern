'use client';

import { useEffect, useState, useRef, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Campaign, Grimoire } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { getGrimoiresByUsername } from '@/lib/data-service';
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
import { Upload } from 'lucide-react';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Separator } from './ui/separator';

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
    onSave: (data: Omit<Campaign, 'id' | 'creatorUsername' | 'sessionNotes' | 'sessionNotesDate' | 'userPermissions' | 'userInventories'>) => void;
    campaign: Campaign | null;
}

export function EditCampaignDialog({ isOpen, onOpenChange, onSave, campaign }: EditCampaignDialogProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [userGrimoires, setUserGrimoires] = useState<Grimoire[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const inventoryType = form.watch('inventoryType');

  useEffect(() => {
    if (user && user.role === 'dm' && isOpen) {
      getGrimoiresByUsername(user.username).then(setUserGrimoires);
    }
  }, [user, isOpen]); 

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
    }
  }, [campaign, isOpen, form]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        form.setValue('image', result);
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  function onSubmit(values: FormData) {
    const invitedUsernames = values.invitedUsernames
      ? values.invitedUsernames.split(',').map(u => u.trim()).filter(Boolean)
      : [];
    
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
    });
  }

  return (
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
              render={() => (
                <FormItem>
                  <FormLabel>{t('Header Image')}</FormLabel>
                   <FormControl>
                     <>
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
                     </>
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

            <FormField
                control={form.control}
                name="inventoryType"
                render={({ field }) => (
                <FormItem className="space-y-3">
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
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
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

            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
                <Button type="submit">{t('Save Changes')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
