'use client';

import { useEffect, useState, useRef, ChangeEvent } from 'react';
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

const formSchema = z.object({
  name: z.string().min(1, 'Campaign name is required.'),
  description: z.string().optional(),
  invitedUsernames: z.string().optional(),
  grimoireId: z.string().nullable(),
  image: z.string().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface EditCampaignDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSave: (data: { 
        name: string; 
        description: string; 
        invitedUsernames: string[]; 
        grimoireId: string | null,
        image: string | null;
     }) => void;
    campaign: Campaign | null;
}

export function EditCampaignDialog({ isOpen, onOpenChange, onSave, campaign }: EditCampaignDialogProps) {
  const { user } = useAuth();
  const [userGrimoires, setUserGrimoires] = useState<Grimoire[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        image: campaign.image,
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
        image: values.image
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
          <DialogTitle className="font-headline">Edit Campaign</DialogTitle>
          <DialogDescription>
            Update the details for your campaign.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
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
              name="image"
              render={() => (
                <FormItem>
                  <FormLabel>Header Image</FormLabel>
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
                          Upload Image
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
                   <FormDescription>
                    Separate multiple usernames with a comma.
                  </FormDescription>
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
