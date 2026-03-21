'use client';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { useAuth } from '@/context/auth-context';
import { getCampaignById, getCampaignsForUser, getGrimoireById, getGrimoireByIdAsPlayer, updateCampaign, updateCampaignSettings } from '@/lib/data-service';
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
import { CampaignUpdateData, EditCampaignDialog } from '@/components/edit-campaign-dialog';
import { Pencil, Save, CalendarIcon, Backpack, BookHeart, ScrollText, Swords, ClipboardCheck, BookMarked } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CampaignTracker } from '@/components/campaign-tracker';
import { Bestiary } from '@/components/bestiary';
import { NotesSection } from '@/components/notes-section';
import PlayerDashboard from '@/components/player-dashboard';
import QuestBoard from '@/components/questboard';

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

	const pathname = usePathname();

  	useEffect(() => {
		const isPublicPage = pathname === '/login' || pathname === '/register';
		if (isPublicPage) return;

		const checkAccess = async () => {
			if (!user) return;

			try {
				const campaigns = await getCampaignsForUser(user);
				if (campaigns === undefined) {
					router.push('/login');
				}
			} catch (error) {
				toast({ 
					title: t('Error'), 
					description: "Session expired. Please log in again.", 
					variant: 'destructive' 
				});
				router.push('/login');
			}
		};

		if (!loading) {
			if (!user) {
				router.push('/login');
			} else {
				checkAccess();
			}
		}
	}, [user, loading, router, pathname]);

	useEffect(() => {
		const campaignId = params.id as string;
		if (user && campaignId) {
			getCampaignById(campaignId).then(foundCampaign => {
				if (foundCampaign) {
					const invitedUsers = foundCampaign.invitedUsernames ?? [];
					const isInvited = invitedUsers.some(u => u.username == user.username);
					const isCreator = foundCampaign.creatorUsername === user.username;

					if (isCreator || isInvited) {
						setCampaign(foundCampaign);
						setSessionNotes(foundCampaign.sessionNotes || '');
						if (foundCampaign.grimoireId) {
							if (isCreator) {
								getGrimoireById(foundCampaign.grimoireId).then(setGrimoire);
							} else if (isInvited) {
								getGrimoireByIdAsPlayer(foundCampaign.grimoireId, foundCampaign.creatorUsername).then(setGrimoire);
							}
						} else {
							setGrimoire(null);
						}
					} else {
						router.push('/');
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
		setCampaign(updatedCampaign);
		setIsSavingNotes(false);
		toast({ title: t('Success'), description: t('Session notes have been saved.') });
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

	const handleSaveCampaignSettings = async (campaignId: string, data: CampaignUpdateData) => {
		const updatedCampaign = await updateCampaignSettings(campaignId, data);
		setCampaign(updatedCampaign);
		return;
	};

	return (
		<>
			<EditCampaignDialog
				isOpen={isEditDialogOpen}
				onOpenChange={setEditDialogOpen}
				onSave={handleSaveCampaignSettings}
				campaign={campaign}
			/>
			<div className="min-h-screen flex flex-col">
				<Header helpText={t('This is the main view for a single campaign. Here you can see all campaign-related information.')} />
				<main className="flex-grow">
					<div className="relative w-full h-64 md:h-80">
						{campaign.image && (
							<Image
								src={campaign.image}
								alt={campaign.name}
								fill
								className="object-cover"
								priority
							/>
						)}
						<div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
					</div>

					{/* Geändert: container durch w-full ersetzt für echtes justify-between an die Ränder */}
					<div className="w-full max-w-7xl mx-auto px-4 md:px-8 relative -mt-16 md:-mt-24 pb-8 z-10">
						<div className="flex justify-between items-start mb-1 w-full">
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
						<p className="text-muted-foreground mb-8" style={{border: "1px solid #8f8f8f36", padding: "10px 20px",  borderRadius: "10px",  margin: "20px 0px"}}>{campaign.description}</p>

						<CampaignTracker campaign={campaign} setCampaign={setCampaign} />

						<Tabs defaultValue="recipes" className="w-full mt-8">
							<TabsList className='w-full'>
								<TabsTrigger value="recipes" className="flex-1">
									<BookHeart className="mr-2 h-4 w-4 shrink-0" />
									<span className="truncate">{t('Grimoires')}</span>
								</TabsTrigger>
								<TabsTrigger value="bestiary" className="flex-1">
									<Swords className="mr-2 h-4 w-4 shrink-0" />
									<span className="truncate">{t('Bestiary')}</span>
								</TabsTrigger>
								<TabsTrigger value="notes" className="flex-1">
									<BookMarked className="mr-2 h-4 w-4 shrink-0" />
									<span className="truncate">{t('Books & Notes')}</span>
								</TabsTrigger>
								<TabsTrigger value="quest" className="flex-1">
									<ClipboardCheck className="mr-2 h-4 w-4 shrink-0" />
									<span className="truncate">{t('Questboards')}</span>
								</TabsTrigger>
								<TabsTrigger value="dm-log" className="flex-1">
									<ScrollText className="mr-2 h-4 w-4 shrink-0" />
									<span className="truncate">{t("DM's Campaign Log")}</span>
								</TabsTrigger>
								{user.role === 'player' && (
									<TabsTrigger value="inventories" className="flex-1">
										<Backpack className="mr-2 h-4 w-4 shrink-0" />
										<span className="truncate">{t('Inventories')}</span>
									</TabsTrigger>
								)}
							</TabsList>

							<TabsContent value="recipes" className="mt-6">
								{campaign.grimoireId ? (
									grimoire ? (
										<RecipeGrid
											grimoire={grimoire}
											grimoireId={campaign.grimoireId}
											canEdit={false}
											userPermissions={campaign.userPermissions?.[user.username]}
										/>
									) : (
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
											<Skeleton className="h-96 rounded-lg" />
											<Skeleton className="h-96 rounded-lg" />
											<Skeleton className="h-96 rounded-lg" />
										</div>
									)
								) : (
									<div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
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

							<TabsContent value="bestiary" className="mt-6">
								<Bestiary campaign={campaign} setCampaign={setCampaign} />
							</TabsContent>

							<TabsContent value="notes" className="mt-6">
								<NotesSection campaign={campaign} setCampaign={setCampaign} />
							</TabsContent>

							<TabsContent value="quest" className="mt-6">
								<QuestBoard campaignId={campaign.id} grimoireId={grimoire?.id}/>
							</TabsContent>

							<TabsContent value="dm-log" className="mt-6">
								{isCreator ? (
									<Card>
										<CardHeader>
											<CardTitle className="font-headline">{t('Session Notes')}</CardTitle>
											<CardDescription>{t('Your private notes for the campaign. Only you can see and edit this.')}</CardDescription>
										</CardHeader>
										<CardContent className="space-y-4">
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
								) : (
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
											{campaign.sessionNotes ? (
												<p className="text-muted-foreground whitespace-pre-line">{campaign.sessionNotes}</p>
											) : (
												<p className="text-muted-foreground italic">{t('The log is currently empty.')}</p>
											)}
										</CardContent>
									</Card>
								)}
							</TabsContent>

							{user.role === 'player' && grimoire != null && (
								<TabsContent value="inventories" className="mt-6">
									<PlayerDashboard 
                                        grimoire={grimoire} 
										campaign={campaign}
                                        player={user}/>
								</TabsContent>
							)}
						</Tabs>
					</div>
				</main>
			</div>
		</>
	);
}