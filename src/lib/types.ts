// Based on the C# data model provided

export interface User {
  id: string; // Changed from number to string for easier use with mock data/auth
  username: string;
  role: 'player' | 'dm'; // Replaces IsAdmin for clarity
  campaignId: string | null;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  creatorUsername: string; // Keep this for easy creator checks
  invitedUsernames: string[];
  image: string;
  grimoireId: string | null; // This links to a "database" of recipes/components
}

export interface Category {
  id: string;
  name: string;
}

// "Component" from C# seems to be what we called "Ingredient" before, but more structured.
// Let's call it Component to match the model.
export interface Component {
  id: string;
  name: string;
  description: string | null;
  secretDescription: string | null; // For the DM
  categoryId: string;
  // image: Buffer | null; // Images are handled via URL for web
}

// A Recipe can be made of several components
export interface RecipeComponent {
  componentId: string;
  quantity: string; // Replacing "Count" with a more descriptive string like "1 cup" or "2 pinches"
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  secretDescription: string | null; // For the DM
  instructions: string;
  categoryId: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary';
  components: RecipeComponent[];
  // image: Buffer | null;
}

// This will represent our "Database" - a collection of all relevant data for a DM.
// In the C# model this is implicit. Here we make it explicit as a "Grimoire".
export interface Grimoire {
  id: string;
  name:string;
  description: string;
  creatorUsername: string;
  categories: Category[];
  components: Component[];
  recipes: Recipe[];
}
