'use client';
import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Package, 
  ChevronDown, 
  Backpack, 
  Shield, 
  Hammer, 
  CircleHelp
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
import type { Campaign, InventoryItem, Grimoire, User } from '@/lib/types';
import { InventoryGrid } from './InventoryGrid';
import { addItemToInventory, getInventory, updateItemSlot } from '@/lib/data-service';

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
  const [getInventoryCapacity, setinventoryCapacity] = useState(0);
  const [playerInventory, setPlayerInventory] = useState<InventoryItem[]>(userInventory || []);
  const [playerBackpack, setPlayerBackpack] = useState<InventoryItem[]>([]);
  const [otherInventories, setAllOtherInventories] = useState(campaign.inventorySettings.additionalInventories);
  const otherPlayers = campaign.invitedUsernames.filter(u => u.username != campaign.creatorUsername && u.username != player.username); 
  const [selectedSlot, setSelectedSlot] = useState<{ 
    inventoryName: string | null; 
    slotNumber: number 
  } | null>(null);

  useEffect(() => {
    fetchInventoryData();
    
    setinventoryCapacity(
      campaign.inventorySettings.type === "free" ? 9999 : 
      campaign.inventorySettings.type === "limited" ? (campaign.inventorySettings.defaultSize || 0) : 0
    );
  }, []);

  const fetchInventoryData = async () => {
    console.log("Refreshing inventory data...");
    try {
      const data = await getInventory(grimoire.id, campaign.id);
      setPlayerInventory([...data]); 
      setPlayerBackpack([...data.filter(item => item.isBackpack)]);

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

  const handleMoveItem = async (item: InventoryItem, newSlot: number) => {
    try {
      await updateItemSlot(grimoire.id, campaign.id, item.id, newSlot, "default");
      
      toast({ title: "Item Moved" }); //TODO
    } catch (error) {
      toast({ title: "Fehler beim Verschieben", variant: "destructive" });//TODO
    } finally {
      await fetchInventoryData();
    }
  };

  const handleSendToPlayer = async (item: InventoryItem, targetPlayerName: string) => {
    try {
      console.log("dasda");
      console.log(targetPlayerName);
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

  return (
    <>
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

    <div className="w-full mx-auto p-4">
      
      <Tabs defaultValue="main" className="w-full">
        <TabsList 
        className="grid w-full mb-6"
        style={{ 
          gridTemplateColumns: `repeat(${otherInventories.length + 2}, minmax(0, 1fr))` 
        }}
        >
          <TabsTrigger value="main"><Backpack className="w-4 h-4 mr-2" /> Inventar</TabsTrigger>
          {otherInventories.map((inv: any) => (
            <TabsTrigger key={inv.name} value={inv.name} ><Package className="w-4 h-4 mr-2" />{inv.name}</TabsTrigger>
          ))}
          <TabsTrigger value="crafting"><Hammer className="w-4 h-4 mr-2" /> Crafting</TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="space-y-6">
          {/* Header & Backpack Selection */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Backpack size={10} style={{padding: "10px"}} className="w-16 h-16 rounded-md border-2 border-amber-500/50 bg-slate-700 object-cover"/>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="absolute -bottom-2 -right-2 bg-amber-500 hover:bg-amber-600 p-1 rounded-full transition-colors">
                      <ChevronDown size={14} className="text-slate-900" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-800 border-slate-700 text-slate-100">
                    {playerBackpack.map((bp) => {
                      const meta = typeof bp.metadata === "string" ? JSON.parse(bp.metadata) : bp.metadata;
                      const slots = meta?.slots || 0; 

                      return (
                        <DropdownMenuItem 
                          key={bp.name}
                          className="flex justify-between gap-8 focus:bg-slate-700"
                          onClick={() => console.log("Changed to", bp.name)}>
                          <span>{bp.name}</span>
                          <span className="text-xs text-slate-400">{slots} Plätze</span>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div>
                <h3 className="font-bold text-lg">{"Kein Beutel"}</h3>
                <p className="text-sm text-slate-400">Extraplatz: 0</p>
              </div>
            </div>

            {/* Statistik Anzeige */}
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-amber-500">
                {playerInventory.length} / {getInventoryCapacity}
              </div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Slots belegt</p>
              <div className="text-2xl font-mono font-bold text-amber-500">
               100
              </div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Gold</p>
            </div>
          </div>

          {/* Inventar Gitter im PlayerDashboard */}
          <InventoryGrid 
            capacity={getInventoryCapacity} 
            items={playerInventory.filter(i => i.inventoryName === null || i.inventoryName == "default")} 
            onAddClick={(slot: number) => openAddDialog(null, slot)}
            onMoveItem={handleMoveItem} 
            onSendToPlayer={(item: InventoryItem, targetPlayerName: string) => handleSendToPlayer(item, targetPlayerName)}
            onSendToInventory={(item: InventoryItem, targetInvName: string) => handleMoveToOtherInv(item, targetInvName)}
            otherInventories={otherInventories} 
            campaignPlayers={otherPlayers} 
            grimoire={grimoire}
          />

          <hr className="my-8" />

          {/* Ausrüstungsbereich */}
          <div className="p-4 rounded-xl border">
            <h4 className="text-xs font-bold uppercase mb-4 flex items-center gap-2">
              <Shield size={14} /> Aktive Ausrüstung
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

        {/* Dynamischer Content für zusätzliche Inventare */}
          {otherInventories.map((inv: any) => (
            <TabsContent key={inv.name} value={inv.name}>
              <InventoryGrid 
                capacity={inv.size} 
                items={inv.items ?? []} 
                onAddClick={(slot: number) => openAddDialog(inv.name, slot)} 
                onItemClick={(item: InventoryItem) => console.log("Edit Item:", item)} 
                onMoveItem={handleMoveItem} 
                onSendToPlayer={(item: InventoryItem, targetPlayerName: string) => handleSendToPlayer(item, targetPlayerName)}
                onSendToInventory={(item: InventoryItem, targetInvName: string) => handleMoveToOtherInv(item, targetInvName)}
                otherInventories={otherInventories} 
                campaignPlayers={otherPlayers} 
              />
            </TabsContent>
          ))}

        <TabsContent value="crafting">
          <div className="p-8 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-lg">
            Handwerks-Station: Kombiniere Gegenstände aus deinem Inventar.
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
};

export default PlayerDashboard;