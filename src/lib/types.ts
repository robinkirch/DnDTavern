export interface User {
  username: string;
  role: 'player' | 'dm';
}

export interface Recipe {
  id: string;
  name: string;
  category: 'Potion' | 'Meal' | 'Drink' | 'Snack';
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary';
  ingredients: { item: string; quantity: string }[];
  instructions: string;
  description: string;
}

export interface Grimoire {
  id: string;
  name: string;
  description: string;
  creatorUsername: string;
  recipes: Recipe[];
}


export interface Campaign {
  id:string;
  name: string;
  description: string;
  creatorUsername: string;
  invitedUsernames: string[];
  grimoireId: string | null; // Link to a grimoire
  recipes: Recipe[]; // This will now be populated from the linked grimoire
  image: string;
}
