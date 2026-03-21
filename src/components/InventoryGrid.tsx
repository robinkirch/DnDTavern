import { useDroppable, DndContext, DragOverlay, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { 
  ContextMenu, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger
} from "./ui/context-menu";
import { InventoryItem, Recipe, Grimoire, User, Rarity } from '@/lib/types';
import { Archive, CircleHelp, Plus, User as UserIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CardSelection } from './recipe-card';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogDescription 
} from "./ui/dialog";
import { useI18n } from '@/context/i18n-context';

function InventoryDropZone({ id, label, icon: Icon }: { id: string, label: string, icon: any }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-3 p-3 rounded-lg border-2 border-dashed transition-all
        ${isOver 
          ? 'border-amber-500 bg-amber-500/20 scale-105 shadow-lg' 
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'}`}
    >
      <Icon size={18} className={isOver ? 'text-amber-500' : 'text-slate-400'} />
      <span className={`text-sm font-medium ${isOver ? 'text-amber-500' : 'text-slate-200'}`}>
        {label}
      </span>
    </div>
  );
}

// --- Draggable Item Komponente ---
function DraggableItem({ item, recipe, rarities, showFoodInfo }: { item: InventoryItem, recipe: Recipe, rarities: Rarity[], showFoodInfo: boolean }) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: item
  });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 };
  
  const meta = typeof item.metadata === "string" && item.metadata.trim() !== "" ? JSON.parse(item.metadata) : (item.metadata || {});
  const isQuestItem = Boolean(meta?.isQuestItem) || false;
  const foodLevel: string = (showFoodInfo || item.id == "-9999") ? meta.food ?? 0 : "";

  const color = rarities?.find(r => r.id == recipe?.rarityId)?.color ?? "none";
  const title = rarities?.find(r => r.id == recipe?.rarityId)?.name ?? "-";

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="w-full h-full p-1 relative group cursor-grab active:cursor-grabbing">
       {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-contain rounded" style={{border: isQuestItem ? "1px solid gold": "none"}}/>
        ) : (
          <div className="w-full h-full bg-amber-900/20 rounded flex items-center justify-center" style={{border: isQuestItem ? "1px solid gold": "none"}}>
            <CircleHelp size={20} className="text-amber-500/40" />
          </div>
        )}
        <span className="absolute bottom-1.5 left-1.5 bg-background/80 px-1 rounded text-[10px] font-bold border truncate max-w-[80%]">
          {item.name}
        </span>
        <span className="absolute top-1.5 right-1.5 bg-background/80 px-1 rounded text-[10px] font-bold border">
          {item.id == "-9999" ? (<>{foodLevel} {t("Food")}</>) : (<>x{item.quantity}</>)}
        </span>
        {showFoodInfo &&
          <span className="absolute right-1.5 bg-background/80 px-1 rounded text-[10px] font-bold border" style={{top: "25px"}}>
            pro {foodLevel}
          </span>
        }
        <span 
          className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
          title={title}
        />
    </div>
  );
}

interface InventoryGridProps {
  capacity: number;
  items: InventoryItem[];
  onAddClick: (slot: number) => void;
  onSplitClick: (item: InventoryItem, inventoryName: string) => void;
  onMoveItem: (item: InventoryItem, newSlot: number, inventoryName: string) => void;
  onSendToPlayer: (item: InventoryItem, targetPlayerName: string) => void;
  onSendToInventory: (item: InventoryItem, targetInvName: string | null) => void;
  onDeleteItem: (item: InventoryItem) => void;
  otherInventories: any;
  campaignPlayers: User[];
  grimoire: Grimoire;
  currentInventory?: string;
  inventoryType?: 'normal' | 'food' | 'currentEquipment' | 'key'
}


// --- Grid Komponente ---
export function InventoryGrid({ capacity, items, onAddClick, onSplitClick, onMoveItem, onSendToPlayer, onSendToInventory, onDeleteItem, otherInventories, campaignPlayers, grimoire, currentInventory = "default", inventoryType = "normal"}: InventoryGridProps) {
  const { t } = useI18n();
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);
  const [activeDetailItem, setActiveDetailItem] = useState<InventoryItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  const filledSlotsCount = items.filter(it => !it.isTemporary).length;
  
  const displaySize = useMemo(() => {
    if (capacity < 15) 
      return capacity;
    return Math.min(Math.max(15, filledSlotsCount + 1), capacity);
  }, [filledSlotsCount, capacity]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveItem(event.active.data.current as InventoryItem);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null); 

    if (!over) return;

    const item = active.data.current as InventoryItem;
    const overId = over.id.toString();

    if (overId.startsWith('target-player-')) {
      onSendToPlayer(item, overId.replace('target-player-', ''));
    } 

    else if (overId.startsWith('target-inv-')) {
      const invName = overId.replace('target-inv-', '');
      onSendToInventory(item, invName === 'default' ? null : invName);
    } 

    else {
      const targetSlot = parseInt(overId);
      if (!isNaN(targetSlot)) {
        onMoveItem(item, targetSlot, currentInventory);
      }
    }
  };

  if(inventoryType == 'food' || inventoryType == 'key') {
    var newSlotNumber = 0;
    items.forEach(i => {
      i.slotNumber = newSlotNumber;
      newSlotNumber++;
    });
  }

  return (
    <>
      <Dialog open={isItemModalOpen && activeDetailItem != null} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none bg-slate-900 shadow-2xl"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            document.body.style.pointerEvents = 'auto';
          }}
          onInteractOutside={(e) => {
            document.body.style.pointerEvents = 'auto';
          }}>
          <div className="sr-only">
            <DialogTitle>{activeDetailItem?.name}</DialogTitle>
            <DialogDescription>{t('Item Details')}</DialogDescription>
          </div>

          {activeDetailItem && (
            <CardSelection
              item={activeDetailItem}
              grimoire={grimoire}
              permissionLevel="full"
              canOpenMore={false}
            />
          )}
        </DialogContent>
      </Dialog>
    
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="space-y-4">
          
          {/* Drop-Zonen: Nur sichtbar wenn activeItem existiert */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 transition-all duration-300 ease-in-out overflow-hidden ${
            activeItem ? 'opacity-100 max-h-40 mb-6' : 'opacity-0 max-h-0 mb-0 pointer-events-none'
          }`}>
            {otherInventories.map((inv: any) => (
              <InventoryDropZone 
                key={inv.name} 
                id={`target-inv-${inv.name}`} 
                label={`Move to ${inv.name}`} 
                icon={Archive} 
              />
            ))}
            {campaignPlayers?.map((p: any) => (
              <InventoryDropZone 
                key={p.id} 
                id={`target-player-${p.username}`} 
                label={`Give to ${p.username}`} 
                icon={UserIcon} 
              />
            ))}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {Array.from({ length: displaySize }).map((_, i) => (
              <GridCell 
                key={i} 
                index={i} 
                item={items.find((it: any) => it.slotNumber === i && !it.isTemporary)} 
                campaignPlayers={campaignPlayers} 
                otherInventories={otherInventories} 
                onSendToPlayer={onSendToPlayer} 
                onSendToInventory={onSendToInventory}
                onDeleteItem={onDeleteItem}
                onSplitClick={onSplitClick}
                onAddClick={(inventoryType == 'food' || inventoryType == 'key') ? null : onAddClick}
                onModalOpen={setIsItemModalOpen}
                onDetailItem={setActiveDetailItem}
                currentInventory={currentInventory} 
                recipe={
                  grimoire.recipes.find((r: any) => 
                    r.id === items.find((it: any) => it.slotNumber === i && !it.isTemporary)?.originalRecipeId
                  )
                }
                rarities={grimoire.rarities}
                showFoodInfo={inventoryType == 'food'} />
            ))}
             {(inventoryType == 'food' || inventoryType == 'key') &&
              <GridCell 
                key={`add-field-${inventoryType}`}
                index={99999} 
                item={null}
                onSendToPlayer={null} 
                onSendToInventory={null}
                onDeleteItem={null}
                onSplitClick={null}
                onAddClick={onAddClick}
                onModalOpen={setIsItemModalOpen}
                onDetailItem={setActiveDetailItem}
                currentInventory={currentInventory} 
                rarities={grimoire.rarities} />
            }
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {items.filter((it: any) => it.isTemporary === 1 || it.isTemporary === true || it.slotNumber >= capacity).map((item: any) => (
              <GridCell 
                key={item.id} 
                index={item.slotNumber} 
                item={item}
                campaignPlayers={campaignPlayers} 
                otherInventories={otherInventories} 
                onSendToPlayer={onSendToPlayer} 
                onSendToInventory={onSendToInventory}
                onDeleteItem={onDeleteItem}
                onSplitClick={onSplitClick}
                onAddClick={onAddClick}
                onModalOpen={setIsItemModalOpen}
                onDetailItem={setActiveDetailItem}
                currentInventory={currentInventory}
                recipe={grimoire.recipes.find((g: any) => g.id === item.originalRecipeId)}
                rarities={grimoire.rarities}
                isTemporary={true} />
            ))
          }
          </div>
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="w-16 h-16 bg-amber-900/40 border-2 border-amber-500 rounded-md p-1 opacity-80 cursor-grabbing">
              <img src={activeItem.image ?? ""} className="w-full h-full object-contain" />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}

function GridCell({ index, item, onAddClick, onSplitClick, onSendToPlayer, onSendToInventory, onDeleteItem, campaignPlayers, otherInventories, onModalOpen, onDetailItem, currentInventory, recipe, rarities, isTemporary = false, showFoodInfo=  false }: any) {
  const { t } = useI18n();
  const { setNodeRef, isOver } = useDroppable({ 
    id: index.toString(),
    disabled: isTemporary 
  });

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger disabled={!item || item.id < -100 }>
          <div ref={setNodeRef} className={`aspect-square rounded-md flex items-center justify-center border-2 transition-all relative overflow-hidden
            ${item ? 'border-amber-900/40 bg-amber-900/5' : onAddClick != null ? 'border-gray-500 border-dashed cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5' : 'border-gray-500 border-dashed hover:border-amber-500/50 hover:bg-amber-500/5'}
            ${isOver && !isTemporary ? 'bg-amber-500/20 border-amber-500' : ''}
            ${isTemporary ? 'border-gray-600 bg-slate-950/50' : ''}`}
            onClick={() => (!item && !isTemporary) && onAddClick(index)}>

            {item ? (
              <div className="relative z-0 w-full h-full"> 
                <DraggableItem item={item} recipe={recipe} rarities={rarities} showFoodInfo={showFoodInfo} />
              </div> ) : 
              ( !isTemporary && onAddClick != null && <Plus size={16} className="text-gray-500" />)}

                {isTemporary && (
                  <>
                    <div 
                      className="absolute inset-0 pointer-events-none z-[50] m-1 rounded-sm border-2 border-gray-500/40 border-dashed"
                      style={{ 
                        background: 'repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.5) 5px, rgba(100, 100, 100, 0.65) 5px, rgba(100, 100, 100, 0.32) 10px)',
                        mixBlendMode: 'multiply' 
                      }} 
                    />
                  </>
                )}
          </div>
        </ContextMenuTrigger>

        {item && (
          <ContextMenuContent className="w-56 bg-slate-900 text-slate-100 border-slate-700">
            <ContextMenuItem className="focus:bg-slate-800 focus:text-amber-400" onClick={() => {onDetailItem(item); onModalOpen(true);}}>
              {t('View Details')}
            </ContextMenuItem>
            <ContextMenuSeparator className="bg-slate-700" />
            
            {item.quantity > 1 && (
              <ContextMenuItem 
                className="focus:bg-slate-800 focus:text-amber-400" 
                onClick={() => {onSplitClick(item,currentInventory);}}
              >
                <div className="flex items-center justify-between w-full">
                  {t('Split stack')}
                  <span className="text-xs opacity-50">{item.quantity}x</span>
                </div>
              </ContextMenuItem>
            )}

            <ContextMenuSub>
              <ContextMenuSubTrigger className="focus:bg-slate-800">{t('Send to Player')}</ContextMenuSubTrigger>
              <ContextMenuSubContent className="bg-slate-900 border-slate-700">
                {campaignPlayers?.map((p: any) => (
                  <ContextMenuItem key={p.id} onClick={() => onSendToPlayer(item, p.username)}>{p.username}</ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSub>
              <ContextMenuSubTrigger className="focus:bg-slate-800">{t('Move to Inventory')}</ContextMenuSubTrigger>
              <ContextMenuSubContent className="bg-slate-900 border-slate-700">
                {otherInventories?.map((p: any) => (
                  <ContextMenuItem key={p.id} onClick={() => onSendToInventory(item, p.name)}>{p.name}</ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSeparator className="bg-slate-700" />
            <ContextMenuItem className="text-red-400 focus:bg-red-950" onClick={() => onDeleteItem(item)}>{t('Delete')}</ContextMenuItem>
          </ContextMenuContent>
        )}
      </ContextMenu>
    </>
  );
}