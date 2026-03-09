'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { 
  Plus, 
  Package, 
  ChevronDown, 
  Backpack, 
  Shield, 
  Hammer, 
  Check,
  X,
  Circle,
  Send
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "./ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

import { useAuth } from '../context/auth-context';
import { LogOut, User as UserIcon, Languages, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useI18n } from '../context/i18n-context';
import { AddInventoryItemDialog } from './add-inventory-item-dialog';
import { useToast } from '@/hooks/use-toast';
import type { Campaign, InventoryItem, Grimoire, User, RecipeComponent } from '@/lib/types';
import { InventoryGrid } from './InventoryGrid';
import { addItemToInventory, deleteCampaign, deleteInventoryItem, getInventory, splitInventoryItem, updateBackPack, updateItemSlot } from '@/lib/data-service';
import { Button } from './ui/button';
import { SplitItemDialog } from './split-item-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';

interface PlayerDashboardProps {
  grimoire: Grimoire;
  campaign: Campaign;
  player: User;
  userInventory?: InventoryItem[];
}


export function PlayerDashboard ({ grimoire, campaign, player, userInventory }: PlayerDashboardProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [isAddOpen, setAddOpen] = useState(false);
  const [isSplitOpen, setSplitOpen] = useState(false);
  const [getInventoryCapacity, setinventoryCapacity] = useState(0);
  const [playerInventory, setPlayerInventory] = useState<InventoryItem[]>(userInventory || []);
  const [playerBackpack, setPlayerBackpack] = useState<InventoryItem[]>([]);
  const [otherInventories, setAllOtherInventories] = useState(campaign.inventorySettings.additionalInventories);
  const otherPlayers = campaign.invitedUsernames.filter(u => u.username != campaign.creatorUsername && u.username != player.username); 
  const [selectedSlot, setSelectedSlot] = useState<{ inventoryName: string | null; slotNumber: number } | null>(null);
  const [itemToSplit, setItemToSplit] = useState<{item: InventoryItem, inventoryName: string} | null>(null);

   const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmDialogTitle, setConfirmDialogTitle] = useState('');
  const [confirmDialogDescription, setConfirmDialogDescription] = useState('');
  const showConfirmDialog = (title: string, description: string, action: () => void) => {
        setConfirmDialogTitle(title);
        setConfirmDialogDescription(description);
        setConfirmAction(() => action);
        setIsConfirmDialogOpen(true);
    };

  useEffect(() => {
    fetchInventoryData();
    ResetInventoryCapacity();
  }, []);

   useEffect(() => {   
    ResetInventoryCapacity();
  }, [playerBackpack]);

  const ResetInventoryCapacity = () => {
    setinventoryCapacity(
      campaign.inventorySettings.type === "free" ? 9999 : 
      (campaign.inventorySettings.type === "limited" ? (campaign.inventorySettings.defaultSize || 0) : 0) + calculateBackpackSize()
    );
  }

  const calculateBackpackSize = (bp?: InventoryItem): number => {
    const itemToProcess = bp || playerBackpack.find(it => it.isCurrentBackpack);

    if (!itemToProcess || itemToProcess.id === "0") return 0;

    try {
      const meta = typeof itemToProcess.metadata === "string" ? JSON.parse(itemToProcess.metadata) : itemToProcess.metadata;
        
      return Number(meta?.slots) || 0;
    } catch (error) {
      console.error("Error parsing backpack metadata", error);
      return 0;
    }
  };

  const fetchInventoryData = async () => {
    try {
      const data = await getInventory(grimoire.id, campaign.id);
      const hasBackpack = data.some(item => item.isCurrentBackpack);
      setPlayerInventory([...data]); 
      setPlayerBackpack([...data.filter(item => item.isBackpack), {id: "0", name: "No Backpack", isBackpack: true, isCurrentBackpack: !hasBackpack, image: null, metadata: '{"slots":0}', originalRecipeId: "", recipeIds: [], description: "",quantity: "0", value: "0", isCustom: true, inventoryName: "default", slotNumber:9999, isLocked:true,isTemporary:true, isFood: false }]);        

      const newOtherInventories = [];
      for (const inv of campaign.inventorySettings.additionalInventories) {
        const invData = await getInventory(grimoire.id, campaign.id, inv.name);
        newOtherInventories.push({ ...inv, items: invData });
      }
      setAllOtherInventories(newOtherInventories);
    } catch (error) {
      console.error("Fehler beim Refreshen", error);
    }
  };

  const handleAddItem = async (newItem: InventoryItem) => {
    try {
      await addItemToInventory(grimoire.id, campaign.id, newItem);
      setAddOpen(false); 
      
      toast({ title: t('Item Added') });

      await fetchInventoryData(); 
    } catch (error) {
      toast({ title: t('Error'), variant: "destructive" });
    }
  };

  const openAddDialog = (inventoryName: string | null, slotNumber: number) => {
    setSelectedSlot({ inventoryName, slotNumber });
    setAddOpen(true);
  };

  const openSplitUI = (item: InventoryItem, inventoryName: string) => {
    setItemToSplit({ item, inventoryName });
    setSplitOpen(true);
  };

  const handleMoveItem = async (item: InventoryItem, newSlot: number, inventoryName: string) => {
    try {
      await updateItemSlot(grimoire.id, campaign.id, item.id, newSlot, inventoryName);
      
      toast({ title: "Item Moved" }); //TODO
    } catch (error) {
      toast({ title: "Fehler beim Verschieben", variant: "destructive" });//TODO
    } finally {
      await fetchInventoryData();
    }
  };

  const handleSendToPlayer = async (item: InventoryItem, targetPlayerName: string) => {
    try {
      await updateItemSlot(grimoire.id, campaign.id, item.id, null, undefined, targetPlayerName);
      
      toast({ title: `${item.name} an ${targetPlayerName} gesendet!` });//TODO
    } catch (error) {
      toast({ title: "Fehler beim Verschieben", variant: "destructive" });//TODO
    } finally {
      await fetchInventoryData();
    }
  };

  const handleMoveToOtherInv = async (item: InventoryItem, targetInvName: string) => {
    try {
      await updateItemSlot(grimoire.id, campaign.id, item.id, null, targetInvName, undefined);
      
      toast({ title: `${item.name} an ${targetInvName} gesendet!` });//TODO
    } catch (error) {
      toast({ title: "Fehler beim Verschieben", variant: "destructive" });//TODO
    } finally {
      await fetchInventoryData();
    }
  };

  const executeSplit = async (amount: number) => {
  if (!itemToSplit) return;

    await handleSplitItem(
      itemToSplit.item, 
      amount, 
      itemToSplit.inventoryName
    );
  };

  const handleSplitItem = async (item: InventoryItem, splitAmount: number, inventoryName: string | null) => {
    try {
      if (!itemToSplit || !inventoryName) return;
      const playerName = inventoryName === "default" ? player.username : "nobody"; 
      
      await splitInventoryItem(
        grimoire.id, 
        campaign.id, 
        inventoryName, 
        playerName, 
        item.id, 
        splitAmount,
      );

      toast({ title: "Stack geteilt", description: `${splitAmount}x ${item.name} wurde verschoben.` });//TODO
    } catch (error) {
      toast({ title: "Fehler beim Teilen", description: (error as any).message, variant: "destructive" });//TODO
    } finally {
      await fetchInventoryData();
    }
  };

  const handleBackPack = async (item: InventoryItem) => {
    try {
      await updateBackPack(grimoire.id, campaign.id, item.id, player.username);
      
      toast({ title: "Backpack aktualisiert", description: `${item.name} wurde angewendet.` });//TODO
    } catch (error) {
      toast({ title: "Fehler beim aktualisieren", variant: "destructive" });//TODO
    } finally {
      await fetchInventoryData();
    }
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    showConfirmDialog(
        t('Delete Item'),
        t('Are you sure you want to throw this item away?'),
        async () => {
          try {
            await deleteInventoryItem(grimoire.id, campaign.id, item.id);
            
            toast({ title: "Item gelöscht", description: `${item.name} wurde entfernt.` });//TODO
          } catch (error) {
            toast({ title: "Fehler beim Löschen", variant: "destructive" });//TODO
          } finally {
            await fetchInventoryData();
            setIsConfirmDialogOpen(false);
          }
        }
    );    
  };

  const availableRecipes = useMemo(() => {
    if (!grimoire?.recipes || !playerInventory) return [];

    const recipeIdsInInventory = new Set<string>();

    playerInventory.filter(pi => !pi.isCustom).forEach(item => {     
      grimoire.recipes.filter(recipe => {
        if (!recipe.components || recipe.components.length === 0) return false;
        recipe.components.forEach(comp =>{
          if(comp.recipeId == item.originalRecipeId) {
            recipeIdsInInventory.add(recipe.id);
          }

        });
      });
    });

    return grimoire.recipes.filter(recipe => recipeIdsInInventory.has(recipe.id));
  }, [grimoire.recipes, playerInventory]);

  const getComponentName = (recipeId: string): string => {
    if (!grimoire?.recipes) return "";
    const foundRecipe = grimoire.recipes.find(r => r.id === recipeId);
    return foundRecipe?.name || "Unbekannt";
  };

  const COINS = [
    { key: "gold",   label: "Gold",   short: "G", color: "#F5A623" },
    { key: "silver", label: "Silber", short: "S", color: "#C0C0C0" },
    { key: "copper", label: "Kupfer", short: "K", color: "#B87333" },
  ];

  return (
    <>
    <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialogTitle}</DialogTitle>
            <DialogDescription>{confirmDialogDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>{t('Cancel')}</Button>
            <Button variant="destructive" onClick={() => confirmAction?.()}>{t('Confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    <AddInventoryItemDialog
        isOpen={isAddOpen}
        onOpenChange={setAddOpen}
        onSave={(itemData) => handleAddItem({
          ...itemData,
          inventoryName: selectedSlot?.inventoryName || null,
          slotNumber: selectedSlot?.slotNumber ?? 0
        })}
        grimoire={grimoire}
    />

    <SplitItemDialog 
      isOpen={isSplitOpen} 
      onOpenChange={setSplitOpen}
      item={itemToSplit?.item || null}
      onConfirm={executeSplit}
    />

    <div className="w-full mx-auto p-4">
      
      <Tabs defaultValue="main" className="w-full">
        <TabsList 
        className="grid w-full mb-6"
        style={{ 
          gridTemplateColumns: `repeat(${otherInventories.length + 2}, minmax(0, 1fr))` 
        }}
        >
          <TabsTrigger value="main"><Backpack className="w-4 h-4 mr-2" /> {t('Inventory')}</TabsTrigger>
          {otherInventories.map((inv: any) => (
            <TabsTrigger key={inv.name} value={inv.name} ><Package className="w-4 h-4 mr-2" />{inv.name}</TabsTrigger>
          ))}
          <TabsTrigger value="crafting"><Hammer className="w-4 h-4 mr-2" /> {t('Crafting')}</TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="space-y-6">
          <div className="grid grid-cols-4 items-center gap-4 p-4 rounded-lg  border">
            <div className="flex items-center gap-4 border-r border-slate-700 pr-4">
              {playerBackpack && (
                <>
                  <div className="relative group flex-shrink-0">
                    {playerBackpack.find((bp: any) => bp.isCurrentBackpack)?.image ? (
                      <img 
                        src={playerBackpack.find((bp: any) => bp.isCurrentBackpack)!.image!} 
                        alt="Backpack"
                        className="w-14 h-14 rounded-md border-2 border-amber-500/50 bg-slate-800 object-contain"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-md border-2 border-amber-500/50 flex items-center justify-center">
                        <Backpack size={28} className="text-amber-500/50" />
                      </div>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="absolute -bottom-1 -right-1 bg-amber-500 hover:bg-amber-600 p-1 rounded-full shadow-lg">
                          <ChevronDown size={12} className="text-slate-900" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-700 text-slate-100">
                        {playerBackpack
                          .filter((bp: any) => bp.id !== playerBackpack.find((b: any) => b.isCurrentBackpack)?.id)
                          .map((bp: any) => (
                            <DropdownMenuItem 
                              key={bp.id || bp.name}
                              className="flex justify-between gap-4 focus:bg-slate-700 cursor-pointer"
                              onClick={() => handleBackPack(bp)}
                            >
                              <span>{bp.name}</span>
                              {bp.id !== 0 && <span className="text-xs text-slate-400">{calculateBackpackSize(bp)} {t('Spaces')}</span>}
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-100 truncate">
                      {playerBackpack.find((bp: any) => bp.isCurrentBackpack)?.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      +{calculateBackpackSize()} {t('Slots')}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* 2. Bereich: Slots besetzt */}
            <div className="text-center border-r border-slate-700">
              <div className="text-xl font-mono font-bold text-amber-500">
                {playerInventory.length - (playerBackpack.find(bp => bp.isCurrentBackpack)?.id !== "0" ? 1 : 0)} / {getInventoryCapacity}
              </div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">{t('Slots occupied')}</p>
            </div>

            {/* 3. Bereich: Gold */}
            <div className="flex flex-col items-center justify-center border-r border-slate-700 px-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Münzen</p>
              <div className="flex items-center gap-1 mb-1">
                {COINS.map(({ key, label, color }) => (
                  <div key={key} className="flex flex-col items-center rounded border border-slate-700 overflow-hidden"style={{ borderColor: `${color}33` }}>
                    <button className="w-full text-[10px] text-slate-500 hover:text-white transition-colors"onClick={() => undefined}>+</button>
                    
                    <div className="flex items-center px-1.5 gap-0.5">
                      <input type="number"
                        className="w-7 bg-transparent text-right text-sm font-mono font-bold outline-none text-slate-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        style={{ color }}
                        value={0}
                        onChange={() => undefined}/>
                      <span className="inline-block text-[10px] font-black pl-2" style={{ color }}> {label[0]} </span>
                    </div>

                    <button className="w-full text-[10px] text-slate-500 hover:text-white transition-colors"onClick={() => undefined}>−</button>
                  </div>
                ))}
              </div>

              <button
                className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded text-[10px] text-amber-500 transition-all uppercase tracking-tighter"
                onClick={() => undefined}>
                <Send size={10} /> Senden
              </button>
            </div>

            {/* 4. Bereich: Versorgung */}
            <div className="text-center">
              <div className="text-xl font-mono font-bold text-amber-500">
                6000 <span className="text-sm text-amber-500/70">(20)</span>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Nahrung (Lange Rasten)</p>
            </div>
          </div>
          <InventoryGrid 
            capacity={getInventoryCapacity} 
            items={playerInventory.filter(i => i.inventoryName === null || i.inventoryName == "default")} 
            onAddClick={(slot: number) => openAddDialog(null, slot)}
            onSplitClick={(item: InventoryItem, inventoryName: string) => openSplitUI(item, inventoryName)}
            onMoveItem={handleMoveItem} 
            onDeleteItem={handleDeleteItem}
            onSendToPlayer={(item: InventoryItem, targetPlayerName: string) => handleSendToPlayer(item, targetPlayerName)}
            onSendToInventory={(item: InventoryItem, targetInvName: string | null) => handleMoveToOtherInv(item, targetInvName ?? "")}
            otherInventories={otherInventories} 
            campaignPlayers={otherPlayers} 
            grimoire={grimoire}
          />

          <hr className="my-8" />

          <div className="p-4 rounded-xl border">
            <h4 className="text-xs font-bold uppercase mb-4 flex items-center gap-2">
              <Shield size={14} /> {t('Active Equipment')}
            </h4>
            <div className="flex flex-wrap gap-4 justify-center">
              {['Ring L', 'Ring R', 'Helm', 'Brust', 'Waffe L', 'Waffe R', 'Spezial'].map((slot) => (
                <div key={slot} className="flex flex-col items-center gap-1">
                  <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center hover:border-blue-500 transition-colors cursor-pointer">
                    <Shield size={20} />
                  </div>
                  <span className="text-[10px] font-medium">{slot}</span>
                </div>
              ))}
            </div>
            <h3 className="text-xs font-bold uppercase mb-4 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bow-arrow-icon lucide-bow-arrow"><path d="M17 3h4v4"/><path d="M18.575 11.082a13 13 0 0 1 1.048 9.027 1.17 1.17 0 0 1-1.914.597L14 17"/><path d="M7 10 3.29 6.29a1.17 1.17 0 0 1 .6-1.91 13 13 0 0 1 9.03 1.05"/><path d="M7 14a1.7 1.7 0 0 0-1.207.5l-2.646 2.646A.5.5 0 0 0 3.5 18H5a1 1 0 0 1 1 1v1.5a.5.5 0 0 0 .854.354L9.5 18.207A1.7 1.7 0 0 0 10 17v-2a1 1 0 0 0-1-1z"/><path d="M9.707 14.293 21 3"/></svg> Köcher</h3>
            <div className="flex flex-wrap gap-4 justify-center">
              {['Feuerpfeil', 'Wasserpfeil'].map((slot) => (
                  <div key={slot} className="flex flex-col items-center gap-1">
                    <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center hover:border-blue-500 transition-colors cursor-pointer">
                      <Shield size={20} />
                    </div>
                    <span className="text-[10px] font-medium">{slot}</span>
                  </div>
              ))}
            </div>
          </div>
        </TabsContent>
          {otherInventories.map((inv: any) => (
            <TabsContent key={inv.name} value={inv.name}>
              <InventoryGrid 
                capacity={inv.size} 
                items={inv.items ?? []} 
                onAddClick={(slot: number) => openAddDialog(inv.name, slot)} 
                onSplitClick={(item: InventoryItem, inventoryName: string) => openSplitUI(item, inventoryName)}
                onMoveItem={handleMoveItem} 
                onDeleteItem={handleDeleteItem}
                onSendToPlayer={(item: InventoryItem, targetPlayerName: string) => handleSendToPlayer(item, targetPlayerName)}
                onSendToInventory={(item: InventoryItem, targetInvName: string | null) => handleMoveToOtherInv(item, targetInvName ?? "")}
                otherInventories={otherInventories} 
                campaignPlayers={[player, ...otherPlayers]} 
                currentInventory={inv.name}
                grimoire={grimoire}
              />
            </TabsContent>
          ))}

        <TabsContent value="crafting">
          <div className="p-8 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-lg mb-4">
            {t('Crafting-station')}: {t('Combine items from your inventory.')} {t('Bookmark section')} 
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {availableRecipes.length > 0 ? (
              availableRecipes.map(recipe => {
                const isCraftable = recipe.components.every((comp: RecipeComponent) => {
                  const invItem = playerInventory.find(i => 
                    !i.isCustom && comp.recipeId.includes(i.originalRecipeId)
                  );

                  const currentQtyStr = String(invItem?.quantity || "0");
                  const requiredQtyStr = String(comp.quantity || "0");

                  if (!currentQtyStr.includes('/') && !requiredQtyStr.includes('/')) {
                    const currentNum = parseFloat(currentQtyStr);
                    const requiredNum = parseFloat(requiredQtyStr);
                    if (!isNaN(currentNum) && !isNaN(requiredNum)) {
                      return currentNum >= requiredNum;
                    }
                  }
                  return true; 
                });

                return (
                  <div key={recipe.id} className="w-full bg-slate-900/80 border border-slate-700 rounded-xl overflow-hidden flex flex-col md:flex-row shadow-lg">
                    <div className="w-full md:w-1/3 bg-slate-800/40 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-700">
                      <div className="w-24 h-24 bg-amber-900/20 rounded-full flex items-center justify-center mb-4 border border-amber-500/30 shadow-inner">
                        {recipe.image ? (
                          <img src={recipe.image} alt={recipe.name} className="w-16 h-16 object-contain" style={{borderRadius: "100%"}}/>
                        ) : (
                          <Hammer className="text-amber-500/50" size={40} />
                        )}
                      </div>
                      <h4 className="font-headline text-xl text-amber-400 text-center mb-4">{recipe.name}</h4>
                      <Button 
                        disabled={!isCraftable}
                        className={`w-full font-bold transition-all transform active:scale-95 ${
                          isCraftable 
                            ? "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20" 
                            : "bg-slate-700 text-slate-400 cursor-not-allowed opacity-50"
                        }`}
                      >
                        {isCraftable ? "Craft Item" : "Missing Materials"}
                      </Button>
                    </div>

                    <div className="w-full md:w-2/3 p-6 bg-slate-900/40">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">{t('Required Materials')} </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {recipe.components.map((comp: RecipeComponent) => {
                          const invItem = playerInventory.find(i => 
                            !i.isCustom && comp.recipeId.includes(i.originalRecipeId)
                          );

                          const currentQtyStr = String(invItem?.quantity || "0");
                          const requiredQtyStr = String(comp.quantity || "0");
                          const currentNum = parseFloat(currentQtyStr);
                          const requiredNum = parseFloat(requiredQtyStr);

                          let status: 'success' | 'fail' | 'unknown' = 'unknown';
                          if (!currentQtyStr.includes('/') && !requiredQtyStr.includes('/')) {
                            if (!isNaN(currentNum) && !isNaN(requiredNum)) {
                              status = currentNum >= requiredNum ? 'success' : 'fail';
                            }
                          }

                          const config = {
                            success: { border: 'border-emerald-500/20 bg-emerald-500/5', text: 'text-emerald-400', icon: <Check size={16} className="text-emerald-500" /> },
                            fail: { border: 'border-red-500/20 bg-red-500/5', text: 'text-red-400', icon: <X size={16} className="text-red-500" /> },
                            unknown: { border: 'border-slate-700/50 bg-slate-800/20', text: 'text-slate-400', icon: <Circle size={16} className="text-slate-500" /> }
                          }[status];

                          return (
                            <div 
                              key={recipe.id + "-" + comp.recipeId}
                              className={`flex items-center justify-between p-3 rounded-lg border ${config.border}`}
                            >
                              <div className="flex items-center gap-3">
                                {config.icon}
                                <span className={`text-sm ${status === 'fail' ? 'text-slate-500' : 'text-slate-200'}`}>
                                  {getComponentName(comp.recipeId)}
                                </span>
                              </div>
                              <span className={`text-xs font-mono font-bold ${config.text}`}>
                                {invItem?.quantity || 0} / {comp.quantity}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                <Hammer className="mx-auto mb-4 opacity-20" size={48} />
                <p>{t('No items in your inventory match any known recipes.')} </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
};

export default PlayerDashboard;