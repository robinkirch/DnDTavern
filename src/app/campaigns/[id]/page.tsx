'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { mockCampaigns, mockGrimoires } from '@/lib/mock-data';
import type { Campaign, Grimoire, Recipe } from '@/lib/types';

import { Header } from '@/components/header';
import { RecipeGrid } from '@/components/recipe-grid';
import { Skeleton } from '@/components/ui/skeleton';

export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [grimoire, setGrimoire] = useState<Grimoire | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  
  useEffect(() => {
    const campaignId = params.id;
    const foundCampaign = mockCampaigns.find(c => c.id === campaignId);

    if (foundCampaign) {
        const isInvited = foundCampaign.invitedUsernames.includes(user?.username || '');
        const isCreator = foundCampaign.creatorUsername === user?.username;
        
        if (user && (isCreator || isInvited)) {
            setCampaign(foundCampaign);
            if (foundCampaign.grimoireId) {
                const foundGrimoire = mockGrimoires.find(g => g.id === foundCampaign.grimoireId);
                setGrimoire(foundGrimoire || null);
            }
        } else if (user) {
            router.push('/'); // Not authorized for this campaign
        }
    }
    
    if(!authLoading) {
        setLoading(false);
    }
  }, [params.id, router, user, authLoading]);

  if (loading || authLoading || !campaign || !grimoire) {
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

  const isDM = user?.role === 'dm';
  const canEditGrimoire = isDM && grimoire.creatorUsername === user.username;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container py-8">
        <h1 className="font-headline text-4xl font-bold mb-2">{campaign.name}</h1>
        <p className="text-muted-foreground mb-1">
          From the <span className='font-semibold text-primary'>{grimoire.name}</span> grimoire
        </p>
        <p className="text-muted-foreground mb-8 max-w-2xl">{campaign.description}</p>
        <RecipeGrid grimoireId={grimoire.id} initialRecipes={grimoire.recipes} canEdit={canEditGrimoire} />
      </main>
    </div>
  );
}
