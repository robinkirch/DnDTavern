'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

import { useAuth } from '@/context/auth-context';
import { createCampaign, getCampaignsForUser, getCampaignById } from '@/lib/data-service';
import type { Campaign } from '@/lib/types';
import { useI18n } from '@/context/i18n-context';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlusCircle, BookHeart, Shield, Users, Copy } from 'lucide-react';
import { Badge } from './ui/badge';
import { CreateCampaignDialog } from './create-campaign-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GrimoireGrid } from './grimoire-grid';
import { Skeleton } from './ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useToast } from '@/hooks/use-toast';

export default function CampaignsDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      getCampaignsForUser(user).then(data => {
        setCampaigns(data);
        setIsLoading(false);
      });
    }
  }, [user]);

  const handleCreateCampaign = async (newCampaignData: Omit<Campaign, 'id' | 'inventorySettings' | 'userPermissions' | 'userInventories'>) => {
    if (!user) return;
    
    const newCampaign = await createCampaign(newCampaignData);

    setCampaigns(prevCampaigns => [...prevCampaigns, newCampaign]);
    setCreateDialogOpen(false);
  };
  
  const handleCopyCampaign = async (campaignId: string) => {
    if (!user) return;
    
    const originalCampaign = await getCampaignById(campaignId);
    if (!originalCampaign) return;

    const newCampaignData = {
        name: `${originalCampaign.name} (${t('Copy')})`,
        description: originalCampaign.description,
        creatorUsername: user.username,
        grimoireId: originalCampaign.grimoireId,
        image: originalCampaign.image,
        invitedUsernames: [], // Players are not copied
        sessionNotes: '',
    };
    
    const newCampaign = await createCampaign(newCampaignData);

    setCampaigns(prevCampaigns => [...prevCampaigns, newCampaign]);
    toast({ title: t('Campaign Copied'), description: t('The campaign was successfully copied.') });
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
      />
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
                        {campaigns.map((campaign) => (
                        <Card key={campaign.id} className="flex flex-col overflow-hidden transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
                             <CardHeader className="relative p-0 h-48 w-full">
                                {campaign.image ? (
                                    <Image
                                        src={campaign.image}
                                        alt={campaign.name}
                                        fill
                                        className="object-cover"
                                        data-ai-hint="fantasy landscape"
                                    />
                                ) : (
                                    <div className='w-full h-full bg-muted'/>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                {campaign.creatorUsername === user.username ? (
                                    <Badge variant="destructive" className="absolute top-4 right-4 bg-accent text-accent-foreground">{t('DM')}</Badge>
                                ) : (
                                    <Badge variant="secondary" className="absolute top-4 right-4">{t('Player')}</Badge>
                                )}
                            </CardHeader>
                            <div className="flex flex-col flex-1 p-6">
                                <CardTitle className="font-headline text-2xl mb-2">{campaign.name}</CardTitle>
                                <CardDescription className="flex-1 line-clamp-3 mb-4">{campaign.description}</CardDescription>
                                
                                <div className='mb-4'>
                                    <div className='flex items-center gap-2 text-sm text-muted-foreground mb-2'>
                                        <Users className='h-4 w-4' />
                                        <span>{t('Players')}</span>
                                    </div>
                                    <div className='flex items-center gap-2'>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Avatar className="h-8 w-8 border-2 border-primary">
                                                    <AvatarFallback>{campaign.creatorUsername.charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{campaign.creatorUsername} ({t('DM')})</p>
                                            </TooltipContent>
                                        </Tooltip>

                                        {campaign.invitedUsernames.map(username => (
                                            <Tooltip key={username}>
                                                <TooltipTrigger>
                                                     <Avatar className="h-8 w-8 border-2 border-muted">
                                                        <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{username}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ))}
                                    </div>
                                </div>

                                <CardFooter className="p-0 pt-6 mt-auto flex justify-between gap-2">
                                     {user.role === 'dm' && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" size="icon" onClick={() => handleCopyCampaign(campaign.id)}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{t('Copy Campaign')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                    <Button asChild className="w-full">
                                        <Link href={`/campaigns/${campaign.id}`}>
                                            {t('Open Campaign')}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </div>
                        </Card>
                        ))}
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

    