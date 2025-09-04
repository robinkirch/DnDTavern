'use client';
import { useState } from 'react';
import type { Grimoire, Recipe } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { mockGrimoires } from '@/lib/mock-data';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { RecipeGrid } from './recipe-grid';
import { GrimoireFormDialog } from './grimoire-form-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


export function GrimoireGrid() {
  const { user } = useAuth();
  const [grimoires, setGrimoires] = useState<Grimoire[]>(() => {
    if (!user) return [];
    return mockGrimoires.filter(g => g.creatorUsername === user.username);
  });
  
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingGrimoire, setEditingGrimoire] = useState<Grimoire | null>(null);

  const handleCreate = () => {
    setEditingGrimoire(null);
    setFormOpen(true);
  };

  const handleEdit = (grimoire: Grimoire) => {
    setEditingGrimoire(grimoire);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this grimoire and all its recipes? This cannot be undone.')) {
      const updatedGrimoires = grimoires.filter(g => g.id !== id);
      setGrimoires(updatedGrimoires);
      // Also update mock data source
      const index = mockGrimoires.findIndex(g => g.id === id);
      if (index !== -1) mockGrimoires.splice(index, 1);
    }
  };

  const handleSave = (savedGrimoire: Omit<Grimoire, 'id' | 'creatorUsername' | 'recipes'>) => {
    if (!user) return;
    
    if (editingGrimoire) {
      // Update
      const updatedGrimoires = grimoires.map(g => 
        g.id === editingGrimoire.id ? { ...g, ...savedGrimoire } : g
      );
      setGrimoires(updatedGrimoires);
      // Update mock data source
      const index = mockGrimoires.findIndex(g => g.id === editingGrimoire.id);
      if (index !== -1) {
        mockGrimoires[index] = { ...mockGrimoires[index], ...savedGrimoire };
      }
    } else {
      // Create
      const newGrimoire: Grimoire = {
        id: savedGrimoire.name.toLowerCase().replace(/\s+/g, '-'),
        ...savedGrimoire,
        creatorUsername: user.username,
        recipes: [],
      };
      setGrimoires([...grimoires, newGrimoire]);
      // Update mock data source
      mockGrimoires.push(newGrimoire);
    }
  };

  return (
    <>
      <GrimoireFormDialog
        isOpen={isFormOpen}
        onOpenChange={setFormOpen}
        onSave={handleSave}
        grimoire={editingGrimoire}
      />

      <div className="flex justify-end items-center mb-6">
          <Button onClick={handleCreate}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Grimoire
          </Button>
      </div>
      
      {grimoires.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {grimoires.map(grimoire => (
                  <Card key={grimoire.id} className="flex flex-col">
                      <CardHeader>
                          <div className='flex justify-between items-start'>
                            <div>
                               <CardTitle className="font-headline text-2xl mb-2">{grimoire.name}</CardTitle>
                                <CardDescription>{grimoire.description}</CardDescription>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(grimoire)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(grimoire.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                          </div>
                      </CardHeader>
                      <CardContent className="flex-grow">
                         <RecipeGrid 
                            grimoireId={grimoire.id}
                            initialRecipes={grimoire.recipes}
                            canEdit={true}
                          />
                      </CardContent>
                  </Card>
              ))}
          </div>
      ) : (
          <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
              <p className="text-lg text-muted-foreground">You haven't created any grimoires yet.</p>
              <Button onClick={handleCreate} className="mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Grimoire
              </Button>
          </div>
      )}
    </>
  );
}
