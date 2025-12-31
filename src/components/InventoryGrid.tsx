import { CircleHelp, Plus } from "lucide-react";

interface InventoryGridProps {
  capacity: number;
  usedSlots: number;
  onAddClick: () => void;
}

export function InventoryGrid ({ capacity, usedSlots, onAddClick }: InventoryGridProps) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
      {Array.from({ length: capacity }).map((_, i) => (
        <div 
          key={i} 
          onClick={i >= usedSlots ? onAddClick : undefined}
          className={`aspect-square rounded-md flex items-center justify-center transition-all border-2 border-dashed 
            ${i < usedSlots 
              ? 'border-gray-500 shadow-inner' 
              : 'border-gray-500 hover:border-[#d5d5d5] cursor-pointer group' 
            }`}
        >
          {i < usedSlots ? (
            <div className="w-full h-full p-1">
              <div className="w-full h-full bg-amber-900/20 rounded flex items-center justify-center">
                <CircleHelp size={16} className="text-amber-500/40" />
              </div>
            </div>
          ) : (
            <Plus size={16} className="text-gray-500 group-hover:text-slate-400" />
          )}
        </div>
      ))}
    </div>
  );
}