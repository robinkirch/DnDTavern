'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { mockCampaigns as initialCampaigns } from '@/lib/mock-data';
import type { Campaign, Recipe } from '@/lib/types';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlusCircle, BookHeart, Shield } from 'lucide-react';
import { Badge } from './ui/badge';
import { CreateCampaignDialog } from './create-campaign-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GrimoireGrid } from './grimoire-grid';

export default function CampaignsDashboard() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    if (!user) return [];
    // This will be replaced by a real data fetch
    return initialCampaigns.filter(
      (c) => c.creatorUsername === user.username || c.invitedUsernames.includes(user.username)
    );
  });
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  const handleCreateCampaign = (newCampaignData: Omit<Campaign, 'id' | 'creatorUsername' | 'recipes' | 'image' | 'grimoireId'>) => {
    if (!user) return;
    
    const newCampaign: Campaign = {
      id: newCampaignData.name.toLowerCase().replace(/\s+/g, '-'),
      ...newCampaignData,
      creatorUsername: user.username,
      recipes: [], // Recipes will come from the linked grimoire
      grimoireId: null, // Initially no grimoire linked
      image: `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 1000)}`,
    };

    setCampaigns(prevCampaigns => [...prevCampaigns, newCampaign]);
    setCreateDialogOpen(false);
  };

  const userCampaigns = user
    ? campaigns.filter(
        (c) => c.creatorUsername === user.username || c.invitedUsernames.includes(user.username)
      )
    : [];

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
              <h1 className="font-headline text-4xl font-bold mb-2">Your Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user?.username}. Manage your campaigns and grimoires.</p>
          </div>
           {user?.role === 'dm' && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Campaign
              </Button>
          )}
        </div>
        
        <Tabs defaultValue="campaigns" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                <TabsTrigger value="campaigns">
                    <Shield className='mr-2' />
                    Campaigns
                </TabsTrigger>
                <TabsTrigger value="grimoires">
                    <BookHeart className='mr-2'/>
                    Grimoires
                </TabsTrigger>
            </TabsList>
            <TabsContent value="campaigns" className='py-6'>
                {userCampaigns.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {userCampaigns.map((campaign) => (
                    <Card key={campaign.id} className="flex flex-col overflow-hidden transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
                        <CardHeader className="relative p-0 h-48 w-full">
                        <Image
                            src={campaign.image}
                            alt={campaign.name}
                            fill
                            className="object-cover"
                            data-ai-hint="fantasy landscape"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        {campaign.creatorUsername === user?.username && (
                            <Badge variant="destructive" className="absolute top-4 right-4 bg-accent text-accent-foreground">DM</Badge>
                        )}
                        </CardHeader>
                        <div className="flex flex-col flex-1 p-6">
                          <CardTitle className="font-headline text-2xl mb-2">{campaign.name}</CardTitle>
                          <CardDescription className="flex-1">{campaign.description}</CardDescription>
                          <CardFooter className="p-0 pt-6">
                              <Button asChild className="w-full" disabled={!campaign.grimoireId}>
                                  <Link href={`/campaigns/${campaign.id}`}>
                                  {campaign.grimoireId ? 'Open Campaign' : 'No Grimoire Linked'}
                                  {campaign.grimoireId && <ArrowRight className="ml-2 h-4 w-4" />}
                                  </Link>
                              </Button>
                          </CardFooter>
                        </div>
                    </Card>
                    ))}
                </div>
                ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
                    {user?.role === 'dm' ? (
                        <>
                            <p className="text-lg text-muted-foreground">You haven't created any campaigns yet.</p>
                            <Button onClick={() => setCreateDialogOpen(true)} className="mt-4">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Your First Campaign
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-lg text-muted-foreground">No campaigns found.</p>
                            <p className="text-sm text-muted-foreground">Ask your Dungeon Master for an invitation!</p>
                        </>

                    )}
                </div>
                )}
            </TabsContent>
            <TabsContent value="grimoires" className='py-6'>
              {user?.role === 'dm' ? (
                <GrimoireGrid />
              ) : (
                 <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
                      <p className="text-lg text-muted-foreground">Only Dungeon Masters can manage Grimoires.</p>
                      <p className="text-sm text-muted-foreground">This is where your DM creates and curates recipe collections.</p>
                  </div>
              )}
            </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
