import { InventoryItem } from "@/lib/types";
import { CircleHelp, Plus } from "lucide-react";


interface InventoryGridProps {
  capacity: number;
  items: InventoryItem[]; // Das gefilterte Array für dieses Inventar
  onAddClick: (slot: number) => void;
  onItemClick?: (item: InventoryItem) => void; // Optional: Zum Bearbeiten/Löschen
}

export function InventoryGrid({ capacity, items, onAddClick, onItemClick }: InventoryGridProps) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
      {Array.from({ length: capacity }).map((_, i) => {
        const itemOnSlot = items.find((it) => it.slotNumber === i);

        return (
          <div
            key={i}
            onClick={() => (itemOnSlot ? onItemClick?.(itemOnSlot) : onAddClick(i))}
            className={`aspect-square rounded-md flex items-center justify-center transition-all border-2 border-dashed overflow-hidden
              ${itemOnSlot 
                ? 'border-amber-900/40 bg-amber-900/5 shadow-inner cursor-pointer hover:border-amber-700' 
                : 'border-gray-500 hover:border-[#d5d5d5] cursor-pointer group' 
              }`}
          >
            {itemOnSlot ? (
              <div className="w-full h-full p-1 relative group">
                {itemOnSlot.image ? (
                  <img 
                    src={itemOnSlot.image} 
                    alt={itemOnSlot.name} 
                    className="w-full h-full object-contain rounded"
                  />
                ) : (
                  <div className="w-full h-full bg-amber-900/20 rounded flex items-center justify-center">
                    <CircleHelp size={20} className="text-amber-500/40" />
                  </div>
                )}
                <span className="absolute bottom-1.5 left-1.5 bg-background/80 px-1 rounded text-[12px] font-bold border border-border" style={{maxWidth: "92%"}}>
                  {itemOnSlot.name}
                </span>
                <span className="absolute top-1.5 right-1.5 bg-background/80 px-1 rounded text-[12px] font-bold border border-border">
                  x{itemOnSlot.quantity}
                </span>
              </div>
            ) : (
              <Plus size={16} className="text-gray-500 group-hover:text-slate-400" />
            )}
          </div>
        );
      })}
    </div>
  );
}