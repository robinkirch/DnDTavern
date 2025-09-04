'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { mockGrimoires } from '@/lib/mock-data';
import { useAuth } from '@/context/auth-context';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  name: z.string().min(3, 'Campaign name must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  invitedUsernames: z.string().optional(),
  grimoireId: z.string().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateCampaignDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onCreate: (data: { name: string; description: string; invitedUsernames: string[], grimoireId: string | null }) => void;
}

export function CreateCampaignDialog({ isOpen, onOpenChange, onCreate }: CreateCampaignDialogProps) {
  const { user } = useAuth();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      invitedUsernames: '',
      grimoireId: null
    },
  });

  function onSubmit(values: FormData) {
    const invitedUsernames = values.invitedUsernames
      ? values.invitedUsernames.split(',').map(u => u.trim()).filter(Boolean)
      : [];
    
    onCreate({ ...values, invitedUsernames, grimoireId: values.grimoireId === "null" ? null : values.grimoireId });
    form.reset();
  }

  const userGrimoires = user ? mockGrimoires.filter(g => g.creatorUsername === user.username) : [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) form.reset();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Create New Campaign</DialogTitle>
          <DialogDescription>
            Fill in the details for your new adventure. You can link a grimoire to make its recipes available.
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
                    <Select onValueChange={field.onChange} value={field.value || ""} >
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
                <Button type="submit">Create Campaign</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
