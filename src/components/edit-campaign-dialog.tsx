'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Campaign, Grimoire } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { getGrimoiresByUsername } from '@/lib/data-service';

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  name: z.string().min(1, 'Campaign name is required.'),
  description: z.string(),
  invitedUsernames: z.string().optional(),
  grimoireId: z.string().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface EditCampaignDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSave: (data: { name: string; description: string; invitedUsernames: string[]; grimoireId: string | null }) => void;
    campaign: Campaign | null;
}

export function EditCampaignDialog({ isOpen, onOpenChange, onSave, campaign }: EditCampaignDialogProps) {
  const { user } = useAuth();
  const [userGrimoires, setUserGrimoires] = useState<Grimoire[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

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
      });
    }
  }, [campaign, isOpen, form]);

  function onSubmit(values: FormData) {
    const invitedUsernames = values.invitedUsernames
      ? values.invitedUsernames.split(',').map(u => u.trim()).filter(Boolean)
      : [];
    
    onSave({ ...values, invitedUsernames, grimoireId: values.grimoireId === "null" ? null : values.grimoireId });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Edit Campaign</DialogTitle>
          <DialogDescription>
            Update the details for your campaign.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A short, enticing description of your campaign."
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
              name="grimoireId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link Grimoire</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""} >
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a grimoire to link" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="null">None</SelectItem>
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
                  <FormLabel>Invite Players (Usernames)</FormLabel>
                  <FormControl>
                    <Input placeholder="volo, drizzt (comma-separated)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
