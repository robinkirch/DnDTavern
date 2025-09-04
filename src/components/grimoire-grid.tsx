'use client';
import { useState, useEffect } from 'react';
import type { Grimoire } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { getGrimoiresByUsername, createGrimoire, deleteGrimoire } from '@/lib/data-service';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, DatabaseZap } from 'lucide-react';
import { RecipeGrid } from './recipe-grid';
import { GrimoireFormDialog } from './grimoire-form-dialog';
import { Skeleton } from './ui/skeleton';


export function GrimoireGrid() {
  const { user } = useAuth();
  const [grimoires, setGrimoires] = useState<Grimoire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFormOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (user) {
      getGrimoiresByUsername(user.username).then(data => {
        setGrimoires(data);
        setIsLoading(false);
      });
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this data source? This does not delete the data itself.')) {
      await deleteGrimoire(id);
      setGrimoires(grimoires.filter(g => g.id !== id));
    }
  };

  const handleSave = async (id: string) => {
    if (!user) return;
    const newGrimoire = await createGrimoire(id, user.username);
    setGrimoires([...grimoires, newGrimoire]);
  };

  if (isLoading) {
    return (
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Skeleton className="h-96 w-full" />
         <Skeleton className="h-96 w-full" />
       </div>
    )
  }

  return (
    <>
      <GrimoireFormDialog
        isOpen={isFormOpen}
        onOpenChange={setFormOpen}
        onSave={handleSave}
      />

      <div className="flex justify-end items-center mb-6">
          <Button onClick={() => setFormOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Grimoire
          </Button>
      </div>
      
      {grimoires.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {grimoires.map(grimoire => (
                  <Card key={grimoire.id} className="flex flex-col">
                      <CardHeader>
                          <div className='flex justify-between items-start'>
                            <div>
                               <CardTitle className="font-headline text-2xl mb-2 flex items-center gap-3">
                                <DatabaseZap className="h-6 w-6 text-primary" />
                                {grimoire.name}
                               </CardTitle>
                                <CardDescription>{grimoire.description}</CardDescription>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(grimoire.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                          </div>
                      </CardHeader>
                      <CardContent className="flex-grow">
                         <RecipeGrid 
                            grimoireId={grimoire.id}
                            canEdit={true}
                          />
                      </CardContent>
                  </Card>
              ))}
          </div>
      ) : (
          <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
              <p className="text-lg text-muted-foreground">You haven't added any grimoires yet.</p>
              <Button onClick={() => setFormOpen(true)} className="mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Your First Grimoire
              </Button>
          </div>
      )}
    </>
  );
}
