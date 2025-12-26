'use client';
import { useState, useMemo } from 'react';
import type { Campaign, Note } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { deleteNote, saveNote, updateCampaign } from '@/lib/data-service';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { PlusCircle, Trash2, Pencil, Search, MapPin, Tag, ScanSearch } from 'lucide-react';
import { NoteFormDialog } from './note-form-dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import Image from 'next/image';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';

interface NotesSectionProps {
    campaign: Campaign;
    setCampaign: (campaign: Campaign) => void;
}

export function NotesSection({ campaign, setCampaign }: NotesSectionProps) {
    const { user } = useAuth();
    const { t } = useI18n();
    const { toast } = useToast();
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleOpenForm = (note?: Note) => {
        setEditingNote(note || null);
        setFormOpen(true);
    };

    const handleSaveNote = async (noteData: Omit<Note, 'id' | 'creatorUsername'>) => {
        if (!user || !campaign.grimoireId) return;
        console.log("call a");
        try {
            const noteToSave: Note = editingNote 
                ? { ...editingNote, ...noteData }
                : { 
                    id: `note-${Date.now()}`, 
                    creatorUsername: user.username, 
                    ...noteData 
                };

            await saveNote(campaign.grimoireId, campaign.id, noteToSave);

            const updatedNotes = editingNote
                ? (campaign.notes || []).map(n => n.id === noteToSave.id ? noteToSave : n)
                : [...(campaign.notes || []), noteToSave];

            setCampaign({ ...campaign, notes: updatedNotes });
            setFormOpen(false);
            toast({ title: t('Success') });
        } catch (error) {
            toast({ title: t('Error'), variant: 'destructive' });
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!user || !campaign.grimoireId || !confirm(t('Are you sure?'))) return;

        try {
            await deleteNote(campaign.grimoireId, noteId);
            const updatedNotes = campaign.notes.filter(n => n.id !== noteId);
            setCampaign({ ...campaign, notes: updatedNotes });
            toast({ title: t('Note Removed') });
        } catch (error) {
            toast({ title: t('Error'), variant: 'destructive' });
        }
    };

    const filteredNotes = useMemo(() => {
        if (!campaign.notes) return [];
        const lowercasedTerm = searchTerm.toLowerCase();
        
        return campaign.notes.filter(note => 
            note.title.toLowerCase().includes(lowercasedTerm) ||
            note.content.toLowerCase().includes(lowercasedTerm) ||
            note.location.toLowerCase().includes(lowercasedTerm) ||
            note.tags.some(tag => tag.toLowerCase().includes(lowercasedTerm))
        );
    }, [campaign.notes, searchTerm]);


    return (
        <>
            <NoteFormDialog 
                isOpen={isFormOpen}
                onOpenChange={setFormOpen}
                onSave={handleSaveNote}
                note={editingNote}
            />
            <div>
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder={t('Search by title, content, location, or tag...')}
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => handleOpenForm()} className='w-full mt-2 md:mt-0 md:w-auto flex-shrink-0'>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        {t('Add Note')}
                    </Button>
                </div>

                {filteredNotes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredNotes.map(note => (
                            <Card key={note.id} className="flex flex-col">
                                {note.image && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <button className="relative h-48 w-full cursor-pointer overflow-hidden rounded-t-lg group">
                                                <Image 
                                                    src={note.image} 
                                                    alt={note.title} 
                                                    fill 
                                                    className="object-cover transition-transform duration-300 group-hover:scale-105" 
                                                    data-ai-hint="old parchment paper" 
                                                />
                                                <ScanSearch className='h-7 w-7' style={{zIndex: "99", position: "absolute", marginLeft: "395px", marginTop: "65px", color: "#000"}}/>
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl h-auto p-2">
                                            <div className="relative w-full h-[80vh]">
                                                <Image src={note.image} alt={note.title} fill className="object-contain rounded-md" />
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                )}
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="font-headline text-2xl">{note.title}</CardTitle>
                                    </div>
                                    <CardDescription className="flex items-center gap-2 pt-1 text-xs">
                                        <MapPin className="h-4 w-4" />
                                        <span>{note.location}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground whitespace-pre-line">{note.content}</p>
                                </CardContent>
                                <CardFooter className="flex-col items-start gap-4 mt-4">
                                     <div className="flex flex-wrap gap-2">
                                        {note.tags.map(tag => (
                                            <Badge key={tag} variant="secondary">{tag}</Badge>
                                        ))}
                                     </div>
                                     <div className="flex justify-between items-center w-full">
                                        <p className="text-xs text-muted-foreground">{t('Added by')}: {note.creatorUsername}</p>
                                        {note.creatorUsername === user?.username && (
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenForm(note)}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteNote(note.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        )}
                                     </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">{searchTerm ? t('No notes match your search.') : t('No notes have been added yet. Add the first one!')}</p>
                    </div>
                )}
            </div>
        </>
    );
}
