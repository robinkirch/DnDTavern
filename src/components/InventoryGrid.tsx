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
import { InventoryItem } from '@/lib/types';
import { Archive, CircleHelp, Plus, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CardSelection } from './recipe-card';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogDescription 
} from "./ui/dialog";

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
function DraggableItem({ item }: { item: InventoryItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: item
  });

  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="w-full h-full p-1 relative group cursor-grab active:cursor-grabbing">
       {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-contain rounded" />
        ) : (
          <div className="w-full h-full bg-amber-900/20 rounded flex items-center justify-center">
            <CircleHelp size={20} className="text-amber-500/40" />
          </div>
        )}
        <span className="absolute bottom-1.5 left-1.5 bg-background/80 px-1 rounded text-[10px] font-bold border truncate max-w-[80%]">
          {item.name}
        </span>
        <span className="absolute top-1.5 right-1.5 bg-background/80 px-1 rounded text-[10px] font-bold border">
          x{item.quantity}
        </span>
    </div>
  );
}

// --- Grid Komponente ---
export function InventoryGrid({ capacity, items, onAddClick, onMoveItem, onSendToPlayer, onSendToInventory, otherInventories, campaignPlayers, grimoire}: any) {
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);
  const [activeDetailItem, setActiveDetailItem] = useState<InventoryItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveItem(event.active.data.current as InventoryItem);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null); // Zonen wieder ausblenden

    if (!over) return;

    const item = active.data.current as InventoryItem;
    const overId = over.id.toString();
    if (overId.startsWith('target-player-')) {
      onSendToPlayer(item, overId.replace('target-player-', ''));
    } else if (overId.startsWith('target-inv-')) {
      const invName = overId.replace('target-inv-', '');
      onSendToInventory(item, invName === 'default' ? null : invName); //change
    } else {
      onMoveItem(item, parseInt(overId));
    }
  };

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
            <DialogDescription>Item Details</DialogDescription>
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
                id={`target-player-${p.id}`} 
                label={`Give to ${p.username}`} 
                icon={User} 
              />
            ))}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {Array.from({ length: capacity }).map((_, i) => (
              <GridCell 
                key={i} 
                index={i} 
                item={items.find((it: any) => it.slotNumber === i)} 
                campaignPlayers={campaignPlayers} 
                otherInventories={otherInventories} 
                onAddClick={onAddClick}
                onModalOpen={setIsItemModalOpen}
                onDetailItem={setActiveDetailItem} />
            ))}
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

function GridCell({ index, item, onAddClick, onSendToPlayer, onSendToInventory, campaignPlayers, otherInventories , onModalOpen, onDetailItem}: any) {
  const { setNodeRef, isOver } = useDroppable({ id: index.toString() });

  return (
    <>
      
      <ContextMenu>
        <ContextMenuTrigger disabled={!item}>
          <div
            ref={setNodeRef}
            onClick={() => !item && onAddClick(index)}
            className={`aspect-square rounded-md flex items-center justify-center border-2 border-dashed transition-all
              ${item ? 'border-amber-900/40 bg-amber-900/5' : 'border-gray-500 hover:border-gray-300'}
              ${isOver ? 'bg-amber-500/20 border-amber-500' : ''}`}
          >
            {item ? <DraggableItem item={item} /> : <Plus size={16} className="text-gray-500" />}
          </div>
        </ContextMenuTrigger>

        {item && (
          <ContextMenuContent className="w-56 bg-slate-900 text-slate-100 border-slate-700">
            <ContextMenuItem className="focus:bg-slate-800 focus:text-amber-400" onClick={() => {onDetailItem(item); onModalOpen(true);}}>
              Details ansehen
            </ContextMenuItem>
            <ContextMenuSeparator className="bg-slate-700" />
            
            <ContextMenuSub>
              <ContextMenuSubTrigger className="focus:bg-slate-800">An Spieler senden</ContextMenuSubTrigger>
              <ContextMenuSubContent className="bg-slate-900 border-slate-700">
                {campaignPlayers?.map((p: any) => (
                  <ContextMenuItem onClick={() => onSendToPlayer(item, p.username)}>{p.username}</ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSub>
              <ContextMenuSubTrigger className="focus:bg-slate-800">In Beutel verschieben</ContextMenuSubTrigger>
              <ContextMenuSubContent className="bg-slate-900 border-slate-700">
                {otherInventories?.map((p: any) => (
                  <ContextMenuItem onClick={() => onSendToInventory(item, p.name)}>{p.name}</ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSeparator className="bg-slate-700" />
            <ContextMenuItem className="text-red-400 focus:bg-red-950">Wegwerfen</ContextMenuItem>
          </ContextMenuContent>
        )}
      </ContextMenu>
    </>
  );
}