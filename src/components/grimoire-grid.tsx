'use client';
import { useState, useEffect } from 'react';
import type { Grimoire, Category, Component } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { getGrimoiresByUsername, createGrimoire, deleteGrimoire, saveCategory, saveComponent } from '@/lib/data-service';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, DatabaseZap, Settings, Tags, Package } from 'lucide-react';
import { RecipeGrid } from './recipe-grid';
import { GrimoireFormDialog } from './grimoire-form-dialog';
import { Skeleton } from './ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


export function GrimoireGrid() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [grimoires, setGrimoires] = useState<Grimoire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFormOpen, setFormOpen] = useState(false);
  const [isManageOpen, setManageOpen] = useState(false);
  const [managingGrimoire, setManagingGrimoire] = useState<Grimoire | null>(null);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newComponentName, setNewComponentName] = useState('');


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
  
  const handleOpenManageDialog = (grimoire: Grimoire) => {
    setManagingGrimoire(grimoire);
    setManageOpen(true);
  }

  const handleAddCategory = async () => {
    if (!managingGrimoire || !newCategoryName.trim()) return;
    
    const newCategory: Category = {
        id: `cat-${newCategoryName.trim().toLowerCase().replace(/\s+/g, '-')}`,
        name: newCategoryName.trim()
    };

    const updatedCategories = [...managingGrimoire.categories, newCategory];
    const updatedGrimoire = { ...managingGrimoire, categories: updatedCategories };
    
    await saveCategory(managingGrimoire.id, newCategory);
    
    setManagingGrimoire(updatedGrimoire);
    setGrimoires(grimoires.map(g => g.id === updatedGrimoire.id ? updatedGrimoire : g));
    setNewCategoryName('');
    toast({title: "Category Added", description: `"${newCategory.name}" has been added.`});
  };

  const handleAddComponent = async () => {
    if (!managingGrimoire || !newComponentName.trim()) return;

    const newComponent: Component = {
        id: `comp-${newComponentName.trim().toLowerCase().replace(/\s+/g, '-')}`,
        name: newComponentName.trim(),
        description: '',
        secretDescription: '',
        categoryId: 'default' // This could be improved with a selector
    };
    
    const updatedComponents = [...managingGrimoire.components, newComponent];
    const updatedGrimoire = { ...managingGrimoire, components: updatedComponents };
    
    await saveComponent(managingGrimoire.id, newComponent);

    setManagingGrimoire(updatedGrimoire);
    setGrimoires(grimoires.map(g => g.id === updatedGrimoire.id ? updatedGrimoire : g));
    setNewComponentName('');
    toast({title: "Component Added", description: `"${newComponent.name}" has been added.`});
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
      
       <Dialog open={isManageOpen} onOpenChange={setManageOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="font-headline">Manage: {managingGrimoire?.name}</DialogTitle>
                    <DialogDescription>
                       Add new categories and components to this grimoire.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-8 max-h-[60vh] overflow-y-auto pr-4">
                  {/* Category Management */}
                  <div className='space-y-4'>
                    <h4 className='font-headline text-lg flex items-center gap-2'><Tags className='h-5 w-5 text-primary'/> Categories</h4>
                    <div className='space-y-2'>
                        <Label htmlFor='new-category'>Add New Category</Label>
                        <div className='flex gap-2'>
                            <Input id="new-category" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="e.g. Potions, Herbs"/>
                            <Button onClick={handleAddCategory}>Add</Button>
                        </div>
                    </div>
                     <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>ID</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {managingGrimoire?.categories.map(cat => (
                                <TableRow key={cat.id}>
                                    <TableCell className="font-medium">{cat.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{cat.id}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                  </div>
                  {/* Component Management */}
                   <div className='space-y-4'>
                    <h4 className='font-headline text-lg flex items-center gap-2'><Package className='h-5 w-5 text-primary'/> Components</h4>
                    <div className='space-y-2'>
                        <Label htmlFor='new-component'>Add New Component</Label>
                        <div className='flex gap-2'>
                            <Input id="new-component" value={newComponentName} onChange={(e) => setNewComponentName(e.target.value)} placeholder="e.g. Owlbear Egg, Glimmer-root"/>
                            <Button onClick={handleAddComponent}>Add</Button>
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>ID</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {managingGrimoire?.components.map(comp => (
                                <TableRow key={comp.id}>
                                    <TableCell className="font-medium">{comp.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{comp.id}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                  </div>
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => setManageOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      <div className="flex justify-end items-center mb-6">
          <Button onClick={() => setFormOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Grimoire
          </Button>
      </div>
      
      {grimoires.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {grimoires.map(grimoire => (
                  <Card key={grimoire.id} className="flex flex-col h-full">
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
                                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenManageDialog(grimoire)}>
                                    <Settings className="h-4 w-4" />
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
