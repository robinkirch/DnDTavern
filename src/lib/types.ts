export interface User {
  username: string;
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

export interface Campaign {
  id: string;
  name: string;
  description: string;
  creatorUsername: string;
  invitedUsernames: string[];
  recipes: Recipe[];
  image: string;
}
