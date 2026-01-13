// src/components/CampaignsDashboard.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

import { useAuth } from '@/context/auth-context';
import { createCampaign, getCampaignsForUser, getCampaignById, getGrimoiresByUsername, copyCampaign, deleteCampaign } from '@/lib/data-service';
import type { Campaign, Grimoire, User } from '@/lib/types';
import { useI18n } from '@/context/i18n-context';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlusCircle, BookHeart, Shield, Users, Copy, CalendarIcon, Trash2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { CreateCampaignDialog } from './create-campaign-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GrimoireGrid } from './grimoire-grid';
import { Skeleton } from './ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';

export default function CampaignsDashboard() {
    const { user } = useAuth();
    const { t } = useI18n();
    const { toast } = useToast();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [grimoires, setGrimoires] = useState<Grimoire[]>([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

    // State for the custom confirmation dialog
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
    const [confirmDialogTitle, setConfirmDialogTitle] = useState('');
    const [confirmDialogDescription, setConfirmDialogDescription] = useState('');

    const showConfirmDialog = (title: string, description: string, action: () => void) => {
        setConfirmDialogTitle(title);
        setConfirmDialogDescription(description);
        setConfirmAction(() => action);
        setIsConfirmDialogOpen(true);
    };

    useEffect(() => {
        const fetchAllData = async () => {
            if (user) {
                try {
                    const [campaignsData, grimoiresData] = await Promise.all([
                        getCampaignsForUser(user),
                        getGrimoiresByUsername()
                    ]);
                    setCampaigns(campaignsData);
                    setGrimoires(grimoiresData);
                } catch (error) {
                    console.error('Failed to fetch initial data:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        if (user) {
            setIsLoading(true);
            fetchAllData();
        }
    }, [user]);

    const handleCreateCampaign = async (formData: { 
        name: string; 
        description: string; 
        invitedUsernames: string[], 
        grimoireId: string | null, 
        image: string | null, 
        creatorUsername: string; 
        sessionNotes: string | null; 
    }) => {
        if (!user) return;
        try {
            const campaignDataToSend = {
                ...formData,
                bestiary: [],
                notes: [],
            };
            
            const newCampaign = await createCampaign(campaignDataToSend);
            
            setCampaigns(prevCampaigns => [...prevCampaigns, newCampaign]);
            setCreateDialogOpen(false);
            toast({ title: t('Campaign Created'), description: t('The new campaign has been successfully created.') });
        } catch (error) {
            console.error('Failed to create campaign:', error);
            toast({ 
                title: t('Error'), 
                description: t('Failed to create the campaign.'), 
                variant: 'destructive' 
            });
        }
    };
  
  const handleCopyCampaign = async (campaignId: string) => {
    if (!user) return;
    
    try {
        const newCampaign = await copyCampaign(campaignId);
        setCampaigns(prevCampaigns => [...prevCampaigns, newCampaign]);
        toast({ title: t('Campaign Copied'), description: t('The campaign was successfully copied.') });
    } catch (error) {
        console.error('Failed to copy campaign:', error);
        toast({ 
            title: t('Error'),
            description: t('Failed to copy the campaign.'),
            variant: 'destructive'
        });
    }
  };

    const handleDeleteCampaign = async (campaignId: string) => {
        console.log("hallo");
        if (!user) return;

        console.log("hallo1");
        showConfirmDialog(
            t('Remove Campaign'),
            t('Are you sure you want to remove this campaign? This does delete the data itself, but doesnt remove the grimoire.'),
            async () => {
                try {
                    await deleteCampaign(campaignId);
                    setCampaigns(prev => prev.filter(g => g.id !== campaignId));
                    toast({ title: t('Campaign deleted'), description: t('The campaign was successfully deleted.') });
                } catch (error) {
                    console.error('Failed to delete campaign:', error);
                    toast({ title: t('Error'), description: t('Failed to delete the campaign.'), variant: 'destructive'});
                } finally {
                    setIsConfirmDialogOpen(false);
                }
            }
        );
    };


  if (isLoading || !user) {
    return (
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-10 w-72 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-10 w-[400px] mb-6" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-80 w-full rounded-lg" />
          <Skeleton className="h-80 w-full rounded-lg" />
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <>
      <CreateCampaignDialog 
        isOpen={isCreateDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreateCampaign}
        grimoires={grimoires}
      />

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialogTitle}</DialogTitle>
            <DialogDescription>{confirmDialogDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>{t('Cancel')}</Button>
            <Button variant="destructive" onClick={() => confirmAction?.()}>{t('Confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
              <h1 className="font-headline text-4xl font-bold mb-2">{t('Your Dashboard')}</h1>
              <p className="text-muted-foreground">{t('Welcome back, {{username}}. Manage your campaigns and grimoires.', { username: user.username || '' })}</p>
          </div>
            {user.role === 'dm' && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('Create Campaign')}
              </Button>
          )}
        </div>
        
        <Tabs defaultValue="campaigns" className="w-full">
            <TabsList className={`grid w-full ${user.role === 'dm' ? 'grid-cols-2 md:w-[400px]' : 'grid-cols-1 md:w-[200px]'}`}>
                <TabsTrigger value="campaigns">
                    <Shield className='mr-2 h-4 w-4' />
                    {t('Campaigns')}
                </TabsTrigger>
                {user.role === 'dm' && (
                    <TabsTrigger value="grimoires">
                        <BookHeart className='mr-2 h-4 w-4'/>
                        {t('Grimoires')}
                    </TabsTrigger>
                )}
            </TabsList>
            <TabsContent value="campaigns" className='py-6'>
                 <TooltipProvider>
                    {campaigns.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {campaigns.map((campaign) => {
                            //kommt ungünstig vom backend
                            const rawData: any = campaign.tracking; 
                            let trackingData;

                            if (rawData && typeof rawData.tracking === 'string') {
                                trackingData = JSON.parse(rawData.tracking);
                            } else if (typeof rawData === 'string') {
                                trackingData = JSON.parse(rawData);
                            } else {
                                trackingData = rawData;
                            }

                            const day = trackingData?.currentDate?.day ?? 1;
                            const month = trackingData?.currentDate?.month ?? 1;
                            const year = trackingData?.currentDate?.year ?? 1000;

                            const dateString = `${t('Day')} ${day}, ${t('Month')} ${month}, ${year}`;
                          return (
                            <Card key={campaign.id} className="flex flex-col overflow-hidden transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
                                <CardHeader className="relative p-0 h-48 w-full">
                                    {campaign.creatorUsername === user.username && (
                                        <>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="outline" 
                                                        size="icon" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCopyCampaign(campaign.id);
                                                        }}
                                                        style={{position: "absolute", zIndex: "2", margin: "5px 5px"}}
                                                        >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{t('Copy Campaign')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="outline" 
                                                        size="icon" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            handleDeleteCampaign(campaign.id);
                                                        }}
                                                        style={{position: "absolute", zIndex: "2", margin: "5px 52px"}}
                                                        >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{t('Copy Campaign')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </>
                                    )}
                                    {campaign.image ? (
                                        <Image
                                            src={campaign.image}
                                            alt={campaign.name}
                                            fill
                                            className="object-cover"
                                            data-ai-hint="fantasy landscape"
                                            style={{marginTop: "0px"}}
                                        />
                                    ) : (
                                        <div className='w-full h-full bg-muted'/>
                                    )}
                                    
                                    {campaign.creatorUsername === user.username ? (
                                        <Badge variant="destructive" className="absolute top-4 right-4 bg-accent text-accent-foreground">{t('DM')}</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="absolute top-4 right-4">{t('Player')}</Badge>
                                    )}
                                </CardHeader>
                                <div className="flex flex-col flex-1 p-6">
                                    <CardTitle className="font-headline text-2xl mb-2">{campaign.name}</CardTitle>
                                    <CardDescription className="flex-1 line-clamp-3 mb-4">{campaign.description}</CardDescription>
                                    
                                    <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4" />
                                            <span>{dateString}</span>
                                        </div>
                                    </div>
                                    
                                    <div className='mb-4'>
                                        <div className='flex items-center gap-2 text-sm text-muted-foreground mb-2'>
                                            <Users className='h-4 w-4' />
                                            <span>{t('Players')}</span>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            {(campaign.invitedUsernames ?? []).sort((a, b) => (a.role === 'dm' ? -1 : b.role === 'dm' ? 1 : 0)).map(username => (
                                                <Tooltip key={username.username}>
                                                    <TooltipTrigger>
                                                        <Avatar className={`h-14 w-14 border-2 ${username.role === 'dm' ? 'border-primary' : 'border-muted'}`}>
                                                            {username.avatar && <AvatarImage src={username.avatar} alt={username.username} />}
                                                            <AvatarFallback>{username.username.charAt(0).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{username.username} {username.role === 'dm' ? `- ${t("DM")}` : ""}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            ))}
                                        </div>
                                    </div>

                                    <CardFooter className="p-0 pt-6 mt-auto flex justify-between gap-2">
                                        <Button asChild className="w-full">
                                            <Link href={`/campaigns/${campaign.id}`}>
                                                {t('Open Campaign')}
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </div>
                            </Card>
                          )
                        })}
                    </div>
                    ) : (
                    <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
                        {user.role === 'dm' ? (
                            <>
                                <p className="text-lg text-muted-foreground">{t("You haven't created any campaigns yet.")}</p>
                                <Button onClick={() => setCreateDialogOpen(true)} className="mt-4">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    {t('Create Your First Campaign')}
                                </Button>
                            </>
                        ) : (
                            <>
                                <p className="text-lg text-muted-foreground">{t('No campaigns found.')}</p>
                                <p className="text-sm text-muted-foreground">{t('Ask your Dungeon Master for an invitation!')}</p>
                            </>
                        )}
                    </div>
                    )}
                </TooltipProvider>
            </TabsContent>
            {user.role === 'dm' && (
                <TabsContent value="grimoires" className='py-6'>
                    <GrimoireGrid />
                </TabsContent>
            )}
        </Tabs>
      </div>
    </>
  );
}