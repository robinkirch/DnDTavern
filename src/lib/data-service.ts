// This is a placeholder for a real data access layer.
// In a real application, this would connect to a database
// (e.g., Firebase Firestore, Supabase, a custom API)
// and fetch the data. The connection string or data source ID
// from the Grimoire object would be used here to determine
// which database/table/collection to query.

import type { Campaign, Grimoire, User, Recipe } from './types';

// --- MOCK DATA (to be replaced by a real database) ---
// This data simulates what would be returned from a database.
// We keep it here to make the UI work without a real backend.
// In a real scenario, this array would be empty and functions
// would perform async database calls.

const FAKE_DB_CAMPAIGNS: Campaign[] = [
  {
    id: 'the-guzzling-grimoire-campaign',
    name: 'The Guzzling Grimoire',
    description: 'An adventure centered around a sentient, and very hungry, spellbook.',
    creatorUsername: 'elminster',
    invitedUsernames: ['volo', 'drizzt'],
    image: 'https://picsum.photos/600/400?random=1',
    grimoireId: 'elminsters-eats',
  },
  {
    id: 'the-tipsy-beholder-campaign',
    name: 'The Tipsy Beholder',
    description: 'A quest that starts in a tavern that caters to... unusual clientele.',
    creatorUsername: 'volo',
    invitedUsernames: ['elminster'],
    image: 'https://picsum.photos/600/400?random=2',
    grimoireId: 'volos-vile-brews',
  },
   {
    id: 'a-new-adventure',
    name: 'A New Adventure',
    description: 'A freshly started campaign, ready for a grimoire to be linked.',
    creatorUsername: 'elminster',
    invitedUsernames: [],
    image: 'https://picsum.photos/600/400?random=3',
    grimoireId: null,
  },
];

const FAKE_DB_GRIMOIRES: Grimoire[] = [
    {
        id: 'elminsters-eats',
        creatorUsername: 'elminster',
        // --- The following properties would be fetched from the data source ---
        name: 'Elminster\'s Everyday Eats',
        description: 'A collection of recipes found in a sentient, and very hungry, spellbook.',
        categories: [
          { id: 'cat-potion', name: 'Potions' },
          { id: 'cat-meal', name: 'Meals' },
        ],
        components: [
          { id: 'comp-glimmer-root', name: 'Glimmer-root', description: 'A root that faintly glows.', secretDescription: 'Actually just a glow-worm-infested carrot.', categoryId: 'cat-herb' },
          { id: 'comp-owlbear-egg', name: 'Owlbear Egg', description: 'A very, very large egg.', secretDescription: 'Chicken eggs work just fine if you use enough of them.', categoryId: 'cat-monster-part' },
          { id: 'comp-spring-water', name: 'Sparkling Spring Water', description: 'Effervescent water from a mountain spring.', secretDescription: null, categoryId: 'cat-drink' },
          { id: 'comp-wild-berry', name: 'A Single Wild Berry', description: 'A perfectly ripe berry.', secretDescription: null, categoryId: 'cat-herb' },
          { id: 'comp-cave-mushroom', name: 'Cave Mushroom', description: 'An edible fungus found in damp caves.', secretDescription: null, categoryId: 'cat-herb' },
          { id: 'comp-dwarven-cheese', name: 'Dwarven "Strong" Cheese', description: 'A pungent, hard cheese.', secretDescription: 'Its strength comes from the smell, not the taste.', categoryId: 'cat-dairy' },
        ],
        recipes: [
            {
                id: 'health-potion-cocktail',
                name: 'Health Potion Cocktail',
                categoryId: 'cat-potion',
                rarity: 'Uncommon',
                description: 'A fizzy, red concoction that makes you feel reinvigorated. Tastes of strawberries and hope.',
                secretDescription: 'The "hope" is mostly placebo.',
                components: [
                  { componentId: 'comp-glimmer-root', quantity: '2 oz infusion' },
                  { componentId: 'comp-spring-water', quantity: '4 oz' },
                  { componentId: 'comp-wild-berry', quantity: '1' },
                ],
                instructions: 'Mix the Glimmer-root infusion and sparkling water in a chilled glass. Drop the wild berry in gently. Serve immediately.',
            },
            {
                id: 'owlbear-omelette',
                name: 'Owlbear Omelette',
                categoryId: 'cat-meal',
                rarity: 'Rare',
                description: 'A famously large and hearty meal, said to be able to feed a whole party. Ethically sourced, of course.',
                secretDescription: null,
                components: [
                  { componentId: 'comp-owlbear-egg', quantity: '1' },
                  { componentId: 'comp-cave-mushroom', quantity: '1 cup, sliced' },
                  { componentId: 'comp-dwarven-cheese', quantity: '1/2 cup, grated' },
                ],
                instructions: 'Whisk the egg in a comically large bowl. Pour into a greased, cauldron-sized pan over medium heat. Add mushrooms and cheese as it begins to set. Fold and serve on a platter or shield.',
            },
        ],
    },
];

// --- CAMPAIGN SERVICE ---

export async function getCampaignsForUser(user: User): Promise<Campaign[]> {
  console.log(`Fetching campaigns for ${user.username}...`);
  // In a real app, you'd filter by user ID/permissions in your database query.
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  return FAKE_DB_CAMPAIGNS.filter(
    c => c.creatorUsername === user.username || c.invitedUsernames.includes(user.username)
  );
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
    console.log(`Fetching campaign ${id}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return FAKE_DB_CAMPAIGNS.find(c => c.id === id) || null;
}

export async function createCampaign(campaignData: Omit<Campaign, 'id' | 'image'>): Promise<Campaign> {
    console.log(`Creating campaign "${campaignData.name}"...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const newCampaign: Campaign = {
        ...campaignData,
        id: campaignData.name.toLowerCase().replace(/\s+/g, '-'),
        image: `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 1000)}`,
    };
    FAKE_DB_CAMPAIGNS.push(newCampaign);
    return newCampaign;
}


// --- GRIMOIRE / RECIPE SERVICE ---

export async function getGrimoiresByUsername(username: string): Promise<Grimoire[]> {
    console.log(`Fetching grimoires for ${username}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return FAKE_DB_GRIMOIRES.filter(g => g.creatorUsername === username);
}

export async function getGrimoireById(id: string): Promise<Grimoire | null> {
    console.log(`Fetching grimoire ${id}...`);
    // This is the key function. In a real app, `id` would be the connection
    // string or identifier for a database. You would use it here to connect
    // and fetch the grimoire's data.
    await new Promise(resolve => setTimeout(resolve, 500));
    return FAKE_DB_GRIMOIRES.find(g => g.id === id) || null;
}

export async function createGrimoire(id: string, creatorUsername: string): Promise<Grimoire> {
    console.log(`Creating grimoire with source "${id}"...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real app, you would connect to the data source `id` here,
    // fetch its name/description, and confirm it's valid.
    // For now, we'll just create a placeholder.
    const newGrimoire: Grimoire = {
        id: id,
        creatorUsername: creatorUsername,
        name: `Grimoire: ${id}`, // Placeholder name
        description: `Data sourced from "${id}"`, // Placeholder desc
        categories: [],
        components: [],
        recipes: [],
    };
    FAKE_DB_GRIMOIRES.push(newGrimoire);
    return newGrimoire;
}

export async function deleteGrimoire(id: string): Promise<void> {
    console.log(`Deleting grimoire ${id}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = FAKE_DB_GRIMOIRES.findIndex(g => g.id === id);
    if (index !== -1) {
        FAKE_DB_GRIMOIRES.splice(index, 1);
    }
}

// All recipe/component modifications would happen through the Grimoire service
// as they belong to a specific data source.

export async function saveRecipe(grimoireId: string, recipe: Recipe): Promise<Recipe> {
    console.log(`Saving recipe to grimoire ${grimoireId}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const grimoire = FAKE_DB_GRIMOIRES.find(g => g.id === grimoireId);
    if (!grimoire) throw new Error("Grimoire not found");

    const recipeIndex = grimoire.recipes.findIndex(r => r.id === recipe.id);
    if (recipeIndex !== -1) {
        grimoire.recipes[recipeIndex] = recipe;
    } else {
        grimoire.recipes.push(recipe);
    }
    return recipe;
}

export async function deleteRecipe(grimoireId: string, recipeId: string): Promise<void> {
    console.log(`Deleting recipe ${recipeId} from grimoire ${grimoireId}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const grimoire = FAKE_DB_GRIMOIRES.find(g => g.id === grimoireId);
    if (!grimoire) throw new Error("Grimoire not found");

    const recipeIndex = grimoire.recipes.findIndex(r => r.id === recipeId);
    if (recipeIndex !== -1) {
        grimoire.recipes.splice(recipeIndex, 1);
    }
}
