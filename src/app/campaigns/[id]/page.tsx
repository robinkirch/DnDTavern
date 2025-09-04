'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';


import { useAuth } from '@/context/auth-context';
import { getCampaignById, getGrimoireById, updateCampaign } from '@/lib/data-service';
import type { Campaign, Grimoire } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/context/i18n-context';

import { Header } from '@/components/header';
import { RecipeGrid } from '@/components/recipe-grid';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EditCampaignDialog } from '@/components/edit-campaign-dialog';
import { Pencil, Save, CalendarIcon, Backpack, BookHeart, ScrollText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlayerInventory } from '@/components/player-inventory';
import { CampaignTracker } from '@/components/campaign-tracker';

export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t, language } = useI18n();
  
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
                } else {
                    setGrimoire(null); // Explicitly set grimoire to null if not present
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
    const updatedCampaign = { 
        ...campaign, 
        sessionNotes, 
        sessionNotesDate: new Date().toISOString()
    };
    await updateCampaign(updatedCampaign);
    setCampaign(updatedCampaign); // Update local state
    setIsSavingNotes(false);
    toast({ title: t('Success'), description: t('Session notes have been saved.') });
  };

  const handleUpdateCampaign = (updatedData: Omit<Campaign, 'id' | 'creatorUsername' | 'sessionNotes' | 'sessionNotesDate' | 'tracking'>) => {
    if (!campaign) return;
    
    // Create a fully formed campaign object for updating
    const updatedCampaign = {
        ...campaign,
        ...updatedData,
    };

    updateCampaign(updatedCampaign).then(savedCampaign => {
        setCampaign(savedCampaign);
        if (savedCampaign.grimoireId !== campaign.grimoireId) {
            if (savedCampaign.grimoireId) {
                getGrimoireById(savedCampaign.grimoireId).then(setGrimoire);
            } else {
                setGrimoire(null);
            }
        }
        toast({ title: t("Campaign Updated"), description: t("Your campaign details have been saved.") });
        setEditDialogOpen(false);
     });
  };

  const formatDate = (dateString: string) => {
      const locale = language === 'de' ? de : undefined;
      return format(new Date(dateString), "PP", { locale });
  }

  if (loading || authLoading || !campaign || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
         <main className="flex-grow">
            <div className="w-full h-64 md:h-80 bg-muted animate-pulse" />
            <div className="container -mt-16 md:-mt-24 pb-8">
              <Skeleton className="h-10 w-1/3 mb-2" />
              <Skeleton className="h-6 w-2/3 mb-8" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-10 w-full" />
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Skeleton className="h-96 rounded-lg" />
                        <Skeleton className="h-96 rounded-lg" />
                        <Skeleton className="h-96 rounded-lg" />
                    </div>
                 </div>
                 <div className="lg:col-span-1">
                    <Skeleton className="h-96 rounded-lg" />
                 </div>
              </div>
            </div>
         </main>
      </div>
    );
  }

  const isCreator = campaign.creatorUsername === user.username;

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
        <main className="flex-grow">
            <div className="relative w-full h-64 md:h-80">
                {campaign.image && (
                   <Image 
                     src={campaign.image} 
                     alt={campaign.name} 
                     fill 
                     className="object-cover"
                     priority
                     data-ai-hint="fantasy landscape"
                   />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            </div>

            <div className="container relative -mt-16 md:-mt-24 pb-8 z-10">
              <div className="flex justify-between items-start mb-1">
                  <h1 className="font-headline text-4xl lg:text-5xl font-bold">{campaign.name}</h1>
                  {isCreator && (
                      <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t('Edit Campaign')}
                      </Button>
                  )}
              </div>

              {grimoire && (
                <p className="text-muted-foreground mb-1">
                  {t('From the {{grimoireName}} grimoire', { grimoireName: grimoire.name })}
                </p>
              )}
              <p className="text-muted-foreground mb-8 max-w-3xl">{campaign.description}</p>
              
               {isCreator && <CampaignTracker campaign={campaign} setCampaign={setCampaign} />}

                <Tabs defaultValue="recipes" className="w-full">
                    <TabsList className='mb-6'>
                        <TabsTrigger value="recipes">
                            <BookHeart className='mr-2 h-4 w-4'/>
                            {t('Grimoire')}
                        </TabsTrigger>
                        <TabsTrigger value="dm-log">
                            <ScrollText className='mr-2 h-4 w-4'/>
                            {t("DM's Campaign Log")}
                        </TabsTrigger>
                        {user.role === 'player' && (
                            <TabsTrigger value="inventories">
                                <Backpack className='mr-2 h-4 w-4'/>
                                {t('Inventories')}
                            </TabsTrigger>
                        )}
                    </TabsList>
                    
                    <TabsContent value="recipes">
                        {campaign.grimoireId ? (
                            <RecipeGrid 
                                grimoireId={campaign.grimoireId} 
                                canEdit={isCreator}
                                userPermissions={campaign.userPermissions[user.username]}
                             />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg h-full">
                            <h3 className="font-headline text-2xl">{t('No Grimoire Linked')}</h3>
                            <p className="text-muted-foreground">{t('The Dungeon Master has not linked a recipe book to this campaign yet.')}</p>
                            {isCreator && (
                                <Button variant="secondary" className="mt-4" onClick={() => setEditDialogOpen(true)}>
                                    {t('Link a Grimoire')}
                                </Button>
                            )}
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="dm-log">
                         {isCreator ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="font-headline">{t('Session Notes')}</CardTitle>
                                    <CardDescription>{t('Your private notes for the campaign. Only you can see and edit this.')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Label htmlFor="session-notes" className="sr-only">{t('Session Notes')}</Label>
                                    <Textarea 
                                        id="session-notes"
                                        placeholder={t('What happened in the last session? What clues did the party find? What are your plans for the next session?')}
                                        value={sessionNotes}
                                        onChange={(e) => setSessionNotes(e.target.value)}
                                        className="min-h-[300px] text-base"
                                    />
                                    <Button onClick={handleSaveNotes} disabled={isSavingNotes} className="w-full">
                                        <Save className="mr-2 h-4 w-4" />
                                        {isSavingNotes ? t('Saving...') : t('Save Notes')}
                                    </Button>
                                        {campaign.sessionNotesDate && (
                                            <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
                                                <CalendarIcon className="h-4 w-4" />
                                                <span>{t('Last updated on {{date}}', { date: formatDate(campaign.sessionNotesDate) })}</span>
                                            </div>
                                        )}
                                </CardContent>
                            </Card>
                        ) : campaign.sessionNotes ? (
                            <Card className="bg-card/50 border-dashed">
                                <CardHeader>
                                    <CardTitle className="font-headline">{t("DM's Campaign Log")}</CardTitle>
                                    <CardDescription className="flex items-center gap-2">
                                        {campaign.sessionNotesDate && (
                                            <>
                                                <CalendarIcon className="h-4 w-4" />
                                                <span>{t('Log entry from {{date}}', { date: formatDate(campaign.sessionNotesDate) })}</span>
                                            </>
                                        )}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground whitespace-pre-line">{campaign.sessionNotes}</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="bg-card/50 border-dashed">
                                <CardHeader>
                                    <CardTitle className="font-headline">{t("DM's Campaign Log")}</CardTitle>
                                    <CardDescription>{t('A summary of events from your Dungeon Master.')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground italic">{t('The log is currently empty.')}</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                    {user.role === 'player' && (
                        <TabsContent value="inventories">
                            <PlayerInventory campaign={campaign} setCampaign={setCampaign} grimoire={grimoire} />
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </main>
      </div>
    </>
  );
}
