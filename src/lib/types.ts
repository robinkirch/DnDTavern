'use client';
// Based on the C# data model provided

export interface User {
  username: string;
  role: 'player' | 'dm'; 
  avatar?: string | null;
}

// A Grimoire is now just a pointer to a data source.
// The name and description will be fetched from that source.
export interface Grimoire {
  id: string;
  creatorUsername: string;
  name: string;
  description: string;
  connection_string: string;
  categories: Category[];
  rarities: Rarity[];
  recipes: Recipe[];
}

export interface Monster {
    id: string;
    name: string;
    image: string | null;
    behavior: 'aggressive' | 'neutral' | 'friendly';
    hitPoints: number | null;
    description: string;
    resistances: string[];
    damageTypes: string[];
    creatorUsername: string;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    image: string | null;
    location: string;
    tags: string[];
    creatorUsername: string;
}

export interface InventoryItem {
    id: string; // Unique ID for the inventory item instance
    recipeId: string | null; // Link to the recipe if it's from a grimoire
    name: string;
    description: string | null;
    quantity: number;
    value: string | null;
    isCustom: boolean; // True if it's a user-defined item
}

export type PermissionLevel = 'full' | 'partial' | 'none';

export interface UserPermissions {
    [categoryId: string]: PermissionLevel;
}

export interface PredefinedWeatherCondition {
    id: string;
    name: string;
}

export interface RegionWeatherCondition {
    conditionId: string; // Links to PredefinedWeatherCondition
    probability: number; // Percentage
}

export interface WeatherRegion {
    id: string;
    name: string;
    conditions: RegionWeatherCondition[];
}

export type TimeOfDay = 'morning' | 'noon' | 'evening' | 'night';


export interface Campaign {
  id: string;
  name: string;
  description: string;
  creatorUsername: string;
  invitedUsernames: string[];
  image: string | null;
  grimoireId: string | null; // This links to a Grimoire (data source)
  sessionNotes?: string | null;
  sessionNotesDate?: string | null;
  bestiary: Monster[];
  notes: Note[];
  
  // New properties for advanced settings
  inventorySettings: {
    type: 'free' | 'limited';
    defaultSize?: number;
  };
   userPermissions: {
    [username: string]: UserPermissions;
  };
   userInventories: {
    // Key is username
    [username: string]: {
        items: InventoryItem[];
        maxSize?: number; // Overrides campaign default if set
    }
  };

  // Time and Weather Tracking
  calendarSettings: {
    daysPerMonth: number;
    monthsPerYear: number;
    yearName: string;
  };
  weatherSettings: {
    predefinedConditions: PredefinedWeatherCondition[];
    regions: WeatherRegion[];
  };
  tracking: {
    currentDate: {
        day: number;
        month: number;
        year: number;
    };
    currentTimeOfDay: TimeOfDay;
    currentRegionId: string | null;
    currentWeather: string | null; // Name of the current weather condition
    visibility: {
        showDate: boolean;
        showTimeOfDay: boolean;
        showWeather: boolean;
        showRegion: boolean;
    }
  };
}

export interface Category {
  id: string;
  name: string;
}

export interface Rarity {
    id: string;
    name: string;
    color: string; // hex color string
}

export interface RecipeComponent {
  // Recipes are now the base components
  recipeId: string;
  quantity: string; 
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  secretDescription: string | null; // For the DM
  categoryIds: string[];
  rarityId: string;
  components: RecipeComponent[];
  image?: string | null;
  value: string | null; // Optional value (e.g., gold pieces)
}

    