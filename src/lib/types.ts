'use client';

export interface User {
  username: string;
  role: 'player' | 'dm'; 
  avatar?: string | null;
}

export interface UserDTO {
  oldUsername: string;
  newUsername: string;
  avatar?: string | null;
  oldPassword: string; // for verification
  newPassword?: string | null;
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
    location: string | undefined;
    isNPC: boolean;
    resistances: number[];
    immunities: number[];
    vulnerabilities: number[];
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
    id: string;
    originalRecipeId: string;
    recipeIds: string[];
    name: string;
    description: string | null;
    quantity: string;
    value: string | null;
    isCustom: boolean;
    inventoryName: string | null;
    slotNumber: number | null;
    isLocked: boolean;
    isTemporary: boolean;
    image: string | null;
    isBackpack: boolean;
    isCurrentBackpack: boolean;
    isFood: boolean;
    metadata: string | null;
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
  invitedUsernames: User[];
  image: string | null;
  grimoireId: string | null; // This links to a Grimoire (data source)
  sessionNotes?: string | null;
  sessionNotesDate?: string | null;
  bestiary: Monster[];
  notes: Note[];
  userInventories: InventoryItem[] | undefined;
  
  // New properties for advanced settings
  inventorySettings: {
    type: 'free' | 'limited';
    defaultSize?: number;
    additionalInventories: {
      name: string;
      size: number;
      items?: InventoryItem[];
    }[];
  };
   userPermissions: {
    [username: string]: UserPermissions;
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

export interface CreateCampaign {
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
  order: number;
}

export interface Rarity {
    id: string;
    name: string;
    color: string; // hex color string
    order: number;
}

export interface RecipeComponent {
  // Recipes are now the base components
  recipeId: string;
  name: string | null;
  quantity: string; 
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  secretDescription: string | null;
  categoryIds: string[];
  rarityId: string;
  components: RecipeComponent[];
  image?: string | null;
  value: string | null;
  aliases: string | null;
  isFood: boolean;
  isBackpack: boolean;
  metadata: Record<string, any> | null;
}

export interface UserCampaignInventory {
    items: InventoryItem[];
    maxSize?: number; // Overrides campaign default if set
}

export interface DamageType {
  id: number;
  name: string;
  category: string;
}

export interface Questboard {
    id: string;
    campaignId: string;
    cityName: string;
    quests: Quest[];
}

export interface Quest {
    id: string;
    questBoardId: string;
    name: string;
    description: string | null;
    type: 'guild' |'personal' | 'main' | 'other';
    reward: string;
    status: 'accepted' | 'done' | 'declined' | 'none';
}