'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { mockCampaigns } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlusCircle } from 'lucide-react';
import { Badge } from './ui/badge';

export default function CampaignsDashboard() {
  const { user } = useAuth();

  const userCampaigns = user
    ? mockCampaigns.filter(
        (c) => c.creatorUsername === user.username || c.invitedUsernames.includes(user.username)
      )
    : [];
    
  const handleCreateCampaign = () => {
    alert("This would open a form to create a new campaign.");
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="font-headline text-4xl font-bold mb-2">Your Campaigns</h1>
            <p className="text-muted-foreground">Welcome back, {user?.username}. Here are the campaigns you have access to.</p>
        </div>
        {user?.role === 'dm' && (
            <Button onClick={handleCreateCampaign}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Campaign
            </Button>
        )}
      </div>
      

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
                  <Button asChild className="w-full">
                    <Link href={`/campaigns/${campaign.id}`}>
                      Open Grimoire <ArrowRight className="ml-2 h-4 w-4" />
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
                    <Button onClick={handleCreateCampaign} className="mt-4">
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
    </div>
  );
}
