'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { getCampaignById, getGrimoireById } from '@/lib/data-service';
import type { Campaign, Grimoire } from '@/lib/types';

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
    const campaignId = params.id as string;
    if (user && campaignId) {
      getCampaignById(campaignId).then(foundCampaign => {
        if (foundCampaign) {
            const isInvited = foundCampaign.invitedUsernames.includes(user.username);
            const isCreator = foundCampaign.creatorUsername === user.username;
            
            if (isCreator || isInvited) {
                setCampaign(foundCampaign);
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

  const isDM = user?.role === 'dm';
  // A DM can edit the grimoire if they created it.
  const canEditGrimoire = !!(isDM && grimoire && grimoire.creatorUsername === user.username);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container py-8">
        <h1 className="font-headline text-4xl font-bold mb-2">{campaign.name}</h1>
        {grimoire && (
          <p className="text-muted-foreground mb-1">
            From the <span className='font-semibold text-primary'>{grimoire.name}</span> grimoire
          </p>
        )}
        <p className="text-muted-foreground mb-8 max-w-2xl">{campaign.description}</p>
        
        {campaign.grimoireId ? (
          <RecipeGrid grimoireId={campaign.grimoireId} canEdit={canEditGrimoire} />
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="font-headline text-2xl">No Grimoire Linked</h3>
            <p className="text-muted-foreground">The Dungeon Master has not linked a recipe book to this campaign yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
