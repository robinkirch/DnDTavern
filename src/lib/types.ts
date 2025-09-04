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
  id: string; // Represents the data source identifier (e.g., connection string name, database ID)
  creatorUsername: string;
  // name and description are now part of the data source itself
  // and would be fetched dynamically.
  // For UI purposes, we can keep them here, but they are read-only from the source.
  name: string;
  description: string;
  categories: Category[];
  components: Component[];
  recipes: Recipe[];
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  creatorUsername: string;
  invitedUsernames: string[];
  image: string | null;
  grimoireId: string | null; // This links to a Grimoire (data source)
  sessionNotes?: string | null;
}

export interface Category {
  id: string;
  name: string;
}

export interface Component {
  id:string;
  name: string;
  description: string | null;
  secretDescription: string | null; // For the DM
  categoryId: string;
}

export interface RecipeComponent {
  componentId: string; // can be a component OR a recipe id
  quantity: string; 
  type: 'component' | 'recipe';
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  secretDescription: string | null; // For the DM
  instructions: string | null;
  categoryId: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary';
  components: RecipeComponent[];
  image?: string | null;
}
