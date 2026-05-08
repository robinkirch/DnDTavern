'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserIcon, Upload } from 'lucide-react';
import { useI18n } from '@/context/i18n-context';
import type { UserDTO } from '@/lib/types';
import { resizeImage } from '../../lib/utils'

const profileSchema = z.object({
  oldUsername:  z.string(),
  newUsername: z.string().min(1, 'Username too short'),
  avatar: z.string().nullable().optional(),
  oldPassword: z.string().min(8, 'Current password is required for verification'),
  newPassword: z.string().optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
  characterData: z.record(z.string(), z.object({
    campaignName: z.string(),
    characterName: z.string()
  }))
}).superRefine(({ newPassword, confirmPassword }, ctx) => {
  if (newPassword && newPassword !== confirmPassword) {
    ctx.addIssue({
      code: 'custom',
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    });
  }
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function UserProfileDialog({ user, isOpen, onOpenChange, onSave }: any) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, setIsPending] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { oldUsername: user.username, newUsername: '', avatar: '', oldPassword: '', newPassword: '', confirmPassword: '', characterData: {} },
  });

  useEffect(() => {
    if (isOpen && user) {
      form.reset({ oldUsername: user.username, newUsername: user.username, avatar: user.avatar || '', oldPassword: '', newPassword: '', confirmPassword: '', characterData: user.characterData || {} });
      setAvatarPreview(user.avatar || null);
    }
  }, [isOpen, user, form]);

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resized = await resizeImage(file, 128, 128);
        setAvatarPreview(resized);
        form.setValue('avatar', resized, { shouldDirty: true });
      } catch (err) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setAvatarPreview(result);
          form.setValue('avatar', result, { shouldDirty: true });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setIsPending(true);

    const dto: UserDTO = {
      oldUsername: values.oldUsername,
      newUsername: values.newUsername,
      avatar: values.avatar,
      oldPassword: values.oldPassword,
      newPassword: values.newPassword || null,
      characterData: values.characterData,
    };
    try {
      await onSave(dto);
      onOpenChange(false);
    } catch (error) {
      form.setError('oldPassword', { message: 'Verification failed' });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{t('Edit Profile')}</DialogTitle>
          <DialogDescription>{t('Verify your identity to save changes.')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col items-center gap-4 py-2">
              <Avatar className="h-20 w-20 border">
                <AvatarImage src={avatarPreview ?? undefined} />
                <AvatarFallback><UserIcon className="h-10 w-10" /></AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> {t('Change Avatar')}
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
            </div>

            <FormField control={form.control} name="oldUsername" render={({ field }) => (
              <FormItem><FormControl><Input type="hidden" {...field} readOnly={true} /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="newUsername" render={({ field }) => (
              <FormItem><FormLabel>{t('Username')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="space-y-3 py-2 border-t border-b py-4">
              <p className="text-xs font-medium text-muted-foreground uppercase">{t('Your Characters')}</p>
              
              {Object.keys(form.getValues('characterData') || {}).length > 0 ? (
                Object.keys(form.getValues('characterData')).map((campaignId) => (
                  <div key={campaignId} className="flex items-center gap-3">
                    <div className="flex-1 text-sm font-medium truncate">
                      {form.watch(`characterData.${campaignId}.campaignName`)}
                    </div>

                    <FormField
                      control={form.control}
                      name={`characterData.${campaignId}.characterName`}
                      render={({ field }) => (
                        <FormItem className="flex-[1.5] space-y-0">
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder={t('Character Name')} 
                              className="h-8 text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">{t('No active characters found.')}</p>
              )}
            </div>

            <div className="p-3 bg-muted/30 rounded-lg space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase">{t('Change Password')}</p>
              <FormField control={form.control} name="newPassword" render={({ field }) => (
                <FormItem><FormControl><Input type="password" placeholder={t('New Password (Optional)')} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                <FormItem><FormControl><Input type="password" placeholder={t('Confirm New Password')} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="oldPassword" render={({ field }) => (
              <FormItem className="pt-2 border-t">
                <FormLabel className="text-primary font-bold">{t('Current Password')}</FormLabel>
                <FormControl><Input type="password" placeholder={t('Required to save any changes')} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? t('Updating...') : t('Save Settings')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}