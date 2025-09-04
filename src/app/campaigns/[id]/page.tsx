'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { getCampaignById, getGrimoireById, updateCampaign } from '@/lib/data-service';
import type { Campaign, Grimoire } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

import { Header } from '@/components/header';
import { RecipeGrid } from '@/components/recipe-grid';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EditCampaignDialog } from '@/components/edit-campaign-dialog';
import { Pencil, Save } from 'lucide-react';

export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [grimoire, setGrimoire] = useState<Grimoire | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionNotes, setSessionNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  
  useEffect(() => {
    const campaignId = params.id as string;
    if (user && campaignId) {
      getCampaignById(campaignId).then(foundCampaign => {
        if (foundCampaign) {
            const isInvited = foundCampaign.invitedUsernames.includes(user.username);
            const isCreator = foundCampaign.creatorUsername === user.username;
            
            if (isCreator || isInvited) {
                setCampaign(foundCampaign);
                setSessionNotes(foundCampaign.sessionNotes || '');
                if (foundCampaign.grimoireId) {
                    getGrimoireById(foundCampaign.grimoireId).then(setGrimoire);
                }
            } else {
                router.push('/'); // Not authorized for this campaign
            }
        }
        setLoading(false);
      });
    } else if (!authLoading) {
        setLoading(false);
    }
  }, [params.id, router, user, authLoading]);

  const handleSaveNotes = async () => {
    if (!campaign) return;
    setIsSavingNotes(true);
    const updatedCampaign = { ...campaign, sessionNotes };
    await updateCampaign(updatedCampaign);
    setCampaign(updatedCampaign); // Update local state
    setIsSavingNotes(false);
    toast({ title: 'Success', description: 'Session notes have been saved.' });
  };

  const handleUpdateCampaign = (updatedData: Omit<Campaign, 'id' | 'creatorUsername' | 'image' | 'grimoireId' | 'sessionNotes'>) => {
    if (!campaign) return;
    const updatedCampaign = { ...campaign, ...updatedData };
     updateCampaign(updatedCampaign).then(savedCampaign => {
        setCampaign(savedCampaign);
        toast({ title: "Campaign Updated", description: "Your campaign details have been saved." });
        setEditDialogOpen(false);
     });
  };

  if (loading || authLoading || !campaign) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container py-8">
            <Skeleton className="h-10 w-1/3 mb-2" />
            <Skeleton className="h-6 w-2/3 mb-8" />
            <Skeleton className="h-10 w-full mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-96 rounded-lg" />
                <Skeleton className="h-96 rounded-lg" />
                <Skeleton className="h-96 rounded-lg" />
            </div>
        </main>
      </div>
    );
  }

  const isCreator = campaign.creatorUsername === user?.username;

  return (
    <>
    <EditCampaignDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleUpdateCampaign}
        campaign={campaign}
    />
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container py-8">
        <div className="flex justify-between items-start mb-1">
            <h1 className="font-headline text-4xl font-bold">{campaign.name}</h1>
            {isCreator && (
                <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Campaign
                </Button>
            )}
        </div>

        {grimoire && (
          <p className="text-muted-foreground mb-1">
            From the <span className='font-semibold text-primary'>{grimoire.name}</span> grimoire
          </p>
        )}
        <p className="text-muted-foreground mb-8 max-w-3xl">{campaign.description}</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {campaign.grimoireId ? (
              <RecipeGrid grimoireId={campaign.grimoireId} canEdit={isCreator} />
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg h-full">
                <h3 className="font-headline text-2xl">No Grimoire Linked</h3>
                <p className="text-muted-foreground">The Dungeon Master has not linked a recipe book to this campaign yet.</p>
              </div>
            )}
          </div>
          <div className="lg:col-span-1">
            {isCreator ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Session Notes</CardTitle>
                        <CardDescription>Your private notes for the campaign. Only you can see and edit this.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Label htmlFor="session-notes" className="sr-only">Session Notes</Label>
                        <Textarea 
                            id="session-notes"
                            placeholder="What happened in the last session? What clues did the party find? What are your plans for the next session?"
                            value={sessionNotes}
                            onChange={(e) => setSessionNotes(e.target.value)}
                            className="min-h-[300px] text-base"
                        />
                        <Button onClick={handleSaveNotes} disabled={isSavingNotes} className="w-full">
                            <Save className="mr-2 h-4 w-4" />
                            {isSavingNotes ? 'Saving...' : 'Save Notes'}
                        </Button>
                    </CardContent>
                </Card>
            ) : campaign.sessionNotes && (
                 <Card className="bg-card/50 border-dashed">
                    <CardHeader>
                        <CardTitle className="font-headline">DM's Campaign Log</CardTitle>
                         <CardDescription>A summary of events from your Dungeon Master.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground whitespace-pre-line">{campaign.sessionNotes}</p>
                    </CardContent>
                </Card>
            )}
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
