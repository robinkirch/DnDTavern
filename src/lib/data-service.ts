// This is a placeholder for a real data access layer.
// In a real application, this would connect to a database
// (e.g., Firebase Firestore, Supabase, a custom API)
// and fetch the data. The connection string or data source ID
// from the Grimoire object would be used here to determine
// which database/table/collection to query.
//
// FOR THE DEVELOPER: To connect to your real database, you would
// replace the mock data and logic in this file with your actual
// data access code.

import type { Campaign, Grimoire, User, Recipe, Category, Rarity } from './types';

// --- MOCK DATA ---
// This data simulates what would be returned from a database.
// It is used to make the UI work without a real backend.
// In a real scenario, this array would be empty and functions
// would perform async database calls.

const STANDARD_RARITIES: Rarity[] = [
    { id: 'rarity-common', name: 'Common', color: '#6b7280' },
    { id: 'rarity-uncommon', name: 'Uncommon', color: '#16a34a' },
    { id: 'rarity-rare', name: 'Rare', color: '#2563eb' },
    { id: 'rarity-epic', name: 'Epic', color: '#9333ea' },
    { id: 'rarity-legendary', name: 'Legendary', color: '#c026d3' },
    { id: 'rarity-mythical', name: 'Mythical', color: '#db2777' },
    { id: 'rarity-godly', name: 'Godly', color: '#ca8a04' },
];

const STANDARD_CATEGORIES: Category[] = [
    { id: 'cat-component', name: 'Component' },
    { id: 'cat-recipe', name: 'Recipe' },
    { id: 'cat-plant', name: 'Plant' },
    { id: 'cat-food', name: 'Food' },
    { id: 'cat-scroll', name: 'Scroll' },
    { id: 'cat-ore', name: 'Ore' },
    { id: 'cat-potion', name: 'Potion' },
    { id: 'cat-arrow', name: 'Arrow' },
    { id: 'cat-alchemie', name: 'Alchemie' },
];


const FAKE_DB_CAMPAIGNS: Campaign[] = [
  {
    id: 'the-guzzling-grimoire-campaign',
    name: 'The Guzzling Grimoire',
    description: 'An adventure centered around a sentient, and very hungry, spellbook.',
    creatorUsername: 'elminster',
    invitedUsernames: ['volo', 'drizzt'],
    image: 'https://picsum.photos/1200/400?random=1',
    grimoireId: 'elminsters-eats',
    sessionNotes: 'The party successfully deciphered the first three pages of the grimoire, revealing a recipe for a potent truth serum. They are now heading towards the Whispering Caves to find Glimmer-root, a key ingredient. A group of goblins is tailing them, hired by a mysterious figure who also wants the grimoire.',
    sessionNotesDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
  },
  {
    id: 'the-tipsy-beholder-campaign',
    name: 'The Tipsy Beholder',
    description: 'A quest that starts in a tavern that caters to... unusual clientele.',
    creatorUsername: 'volo',
    invitedUsernames: ['elminster'],
    image: 'https://picsum.photos/1200/400?random=2',
    grimoireId: 'volos-vile-brews',
    sessionNotes: null,
    sessionNotesDate: null
  },
   {
    id: 'a-new-adventure',
    name: 'A New Adventure',
    description: 'A freshly started campaign, ready for a grimoire to be linked.',
    creatorUsername: 'elminster',
    invitedUsernames: [],
    image: 'https://picsum.photos/1200/400?random=3',
    grimoireId: null,
    sessionNotes: '',
    sessionNotesDate: null,
  },
];

const FAKE_DB_GRIMOIRES: Grimoire[] = [
    {
        id: 'elminsters-eats',
        creatorUsername: 'elminster',
        name: 'Elminster\'s Everyday Eats',
        description: 'A collection of recipes found in a sentient, and very hungry, spellbook.',
        categories: STANDARD_CATEGORIES,
        rarities: STANDARD_RARITIES,
        recipes: [
             // Base ingredients are now recipes without components
            { id: 'comp-glimmer-root', name: 'Glimmer-root', categoryIds: ['cat-plant', 'cat-component'], rarityId: 'rarity-common', description: 'A root that faintly glows.', secretDescription: 'Actually just a glow-worm-infested carrot.', components: [], image: 'https://picsum.photos/400/300?random=20' },
            { id: 'comp-owlbear-egg', name: 'Owlbear Egg', categoryIds: ['cat-food', 'cat-component'], rarityId: 'rarity-uncommon', description: 'A very, very large egg.', secretDescription: 'Chicken eggs work just fine if you use enough of them.', components: [], image: 'https://picsum.photos/400/300?random=21' },
            { id: 'comp-spring-water', name: 'Sparkling Spring Water', categoryIds: ['cat-component'], rarityId: 'rarity-common', description: 'Effervescent water from a mountain spring.', secretDescription: null, components: [], image: 'https://picsum.photos/400/300?random=22' },
            { id: 'comp-wild-berry', name: 'A Single Wild Berry', categoryIds: ['cat-plant', 'cat-component'], rarityId: 'rarity-common', description: 'A perfectly ripe berry.', secretDescription: null, components: [], image: 'https://picsum.photos/400/300?random=23' },
            { id: 'comp-cave-mushroom', name: 'Cave Mushroom', categoryIds: ['cat-plant', 'cat-component'], rarityId: 'rarity-common', description: 'An edible fungus found in damp caves.', secretDescription: null, components: [], image: 'https://picsum.photos/400/300?random=24' },
            { id: 'comp-dwarven-cheese', name: 'Dwarven "Strong" Cheese', categoryIds: ['cat-food', 'cat-component'], rarityId: 'rarity-uncommon', description: 'A pungent, hard cheese.', secretDescription: 'Its strength comes from the smell, not the taste.', components: [], image: 'https://picsum.photos/400/300?random=25' },

            // Actual recipes
            {
                id: 'health-potion-cocktail',
                name: 'Health Potion Cocktail',
                categoryIds: ['cat-potion', 'cat-recipe'],
                rarityId: 'rarity-uncommon',
                description: 'A fizzy, red concoction that makes you feel reinvigorated. Tastes of strawberries and hope.',
                secretDescription: 'The "hope" is mostly placebo.',
                components: [
                  { recipeId: 'comp-glimmer-root', quantity: '2 oz infusion' },
                  { recipeId: 'comp-spring-water', quantity: '4 oz' },
                  { recipeId: 'comp-wild-berry', quantity: '1' },
                ],
                image: 'https://picsum.photos/400/300?random=10'
            },
            {
                id: 'owlbear-omelette',
                name: 'Owlbear Omelette',
                categoryIds: ['cat-food', 'cat-recipe'],
                rarityId: 'rarity-rare',
                description: 'A famously large and hearty meal, said to be able to feed a whole party. Ethically sourced, of course.',
                secretDescription: null,
                components: [
                  { recipeId: 'comp-owlbear-egg', quantity: '1' },
                  { recipeId: 'comp-cave-mushroom', quantity: '1 cup, sliced' },
                  { recipeId: 'comp-dwarven-cheese', quantity: '1/2 cup, grated' },
                ],
                image: 'https://picsum.photos/400/300?random=11'
            },
        ],
    },
    {
        id: 'volos-vile-brews',
        creatorUsername: 'volo',
        name: 'Volo\'s Vile Brews',
        description: 'Brews and concoctions from the famed (and often embellished) world traveler, Volothamp Geddarm.',
        categories: STANDARD_CATEGORIES,
        rarities: STANDARD_RARITIES,
        recipes: [
            { id: 'comp-grog', name: 'Basic Grog', categoryIds: ['cat-component'], rarityId: 'rarity-common', description: 'Every pirate\'s favorite.', secretDescription: 'Just use rum.', components: [] },
            { id: 'comp-kobold-spice', name: 'Kobold Spice', categoryIds: ['cat-component'], rarityId: 'rarity-common', description: 'A surprisingly zesty seasoning.', secretDescription: 'It\'s just paprika.', components: [] },

            {
                id: 'spicy-grog',
                name: 'Volo\'s Spicy Grog',
                categoryIds: ['cat-recipe'],
                rarityId: 'rarity-common',
                description: 'A classic grog with a spicy kick that clears the sinuses.',
                secretDescription: null,
                components: [
                    { recipeId: 'comp-grog', quantity: '1 mug' },
                    { recipeId: 'comp-kobold-spice', quantity: '1 pinch' },
                ],
                 image: 'https://picsum.photos/400/300?random=12'
            },
        ],
    }
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

export async function createCampaign(campaignData: Omit<Campaign, 'id'>): Promise<Campaign> {
    console.log(`Creating campaign "${campaignData.name}"...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const newCampaign: Campaign = {
        ...campaignData,
        id: campaignData.name.toLowerCase().replace(/\s+/g, '-'),
        sessionNotesDate: null
    };
     if (!newCampaign.image) {
        newCampaign.image = `https://picsum.photos/1200/400?random=${Math.floor(Math.random() * 1000)}`;
    }
    FAKE_DB_CAMPAIGNS.push(newCampaign);
    return newCampaign;
}

export async function updateCampaign(campaignData: Campaign): Promise<Campaign> {
    console.log(`Updating campaign "${campaignData.name}"...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = FAKE_DB_CAMPAIGNS.findIndex(c => c.id === campaignData.id);
    if (index !== -1) {
        FAKE_DB_CAMPAIGNS[index] = campaignData;
    } else {
        throw new Error("Campaign not found");
    }
    return campaignData;
}


// --- GRIMOIRE / RECIPE SERVICE ---

export async function getGrimoiresByUsername(username: string): Promise<Grimoire[]> {
    console.log(`Fetching grimoires for ${username}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return FAKE_DB_GRIMOIRES.filter(g => g.creatorUsername === username);
}

export async function getGrimoireById(id: string): Promise<Grimoire | null> {
    console.log(`Fetching grimoire ${id}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const grimoire = FAKE_DB_GRIMOIRES.find(g => g.id === id) || null;
    
    if (!grimoire) {
       console.error(`Grimoire with id "${id}" not found. In a real app, this would be an error.`);
       // To prevent crashes, we can return a "default" or empty grimoire structure.
       // However, the calling code should handle `null` gracefully.
    }
    return grimoire;
}

export async function createGrimoire(id: string, name: string, creatorUsername: string): Promise<Grimoire> {
    console.log(`Attempting to add grimoire with source "${id}"...`);
    
    // DEVELOPER: This is the critical point for connecting to a real data source.
    // The AI environment cannot perform actual database connections.
    // In a real application, you would replace the logic below with your
    // database connection and data fetching code.

    // 1. Check if the grimoire is already "connected" (in our mock DB)
    const existing = FAKE_DB_GRIMOIRES.find(g => g.id === id);
    if (existing) {
        console.log(`Grimoire with id "${id}" already exists.`);
        return existing;
    }

    // 2. Since this is a simulation, we now explicitly create a NEW mock grimoire
    // instead of throwing an error. This acknowledges the user wants to add a new
    // data source and provides a starting point.
    console.log(`Simulating connection to new data source: ${id}`);
    const newGrimoire: Grimoire = {
        id: id,
        creatorUsername: creatorUsername,
        name: name,
        description: `A newly discovered collection of recipes from the source '${id}'.`,
        categories: [...STANDARD_CATEGORIES],
        rarities: [...STANDARD_RARITIES],
        recipes: []
    };
    FAKE_DB_GRIMOIRES.push(newGrimoire);
    return newGrimoire;
}


export async function deleteGrimoire(id: string): Promise<void> {
    console.log(`Deleting grimoire ${id}...`);
    // This would remove the reference from your application's list of connected grimoires.
    // It would NOT delete the underlying database.
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = FAKE_DB_GRIMOIRES.findIndex(g => g.id === id);
    if (index !== -1) {
        // Note: For this mock service, we'll allow deleting the "pre-wired" grimoires.
        FAKE_DB_GRIMOIRES.splice(index, 1);
    }
}

// All recipe/component modifications would happen through the Grimoire service
// as they belong to a specific data source.

export async function saveRecipe(grimoireId: string, recipe: Recipe): Promise<Recipe> {
    console.log(`Saving recipe to grimoire ${grimoireId}...`);
    // DEVELOPER: This would be a 'write' operation to the database identified by grimoireId.
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
    // DEVELOPER: This would be a 'delete' operation to the database identified by grimoireId.
    await new Promise(resolve => setTimeout(resolve, 500));
    const grimoire = FAKE_DB_GRIMOIRES.find(g => g.id === grimoireId);
    if (!grimoire) throw new Error("Grimoire not found");

    const recipeIndex = grimoire.recipes.findIndex(r => r.id === recipeId);
    if (recipeIndex !== -1) {
        grimoire.recipes.splice(recipeIndex, 1);
    }
}

export async function saveCategory(grimoireId: string, category: Category): Promise<Category> {
    console.log(`Saving category to grimoire ${grimoireId}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const grimoire = FAKE_DB_GRIMOIRES.find(g => g.id === grimoireId);
    if (!grimoire) throw new Error("Grimoire not found");

    const categoryIndex = grimoire.categories.findIndex(c => c.id === category.id);
    if (categoryIndex !== -1) {
        grimoire.categories[categoryIndex] = category;
    } else {
        grimoire.categories.push(category);
    }
    return category;
}

export async function deleteCategory(grimoireId: string, categoryId: string): Promise<void> {
    console.log(`Deleting category ${categoryId} from grimoire ${grimoireId}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const grimoire = FAKE_DB_GRIMOIRES.find(g => g.id === grimoireId);
    if (!grimoire) throw new Error("Grimoire not found");

    const categoryIndex = grimoire.categories.findIndex(c => c.id === categoryId);
    if (categoryIndex !== -1) {
        grimoire.categories.splice(categoryIndex, 1);
    }
}

export async function clearCategories(grimoireId: string): Promise<void> {
    console.log(`Clearing all categories from grimoire ${grimoireId}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const grimoire = FAKE_DB_GRIMOIRES.find(g => g.id === grimoireId);
    if (!grimoire) throw new Error("Grimoire not found");
    grimoire.categories = [];
}

export async function saveRarity(grimoireId: string, rarity: Rarity): Promise<Rarity> {
    console.log(`Saving rarity to grimoire ${grimoireId}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const grimoire = FAKE_DB_GRIMOIRES.find(g => g.id === grimoireId);
    if (!grimoire) throw new Error("Grimoire not found");

    const rarityIndex = grimoire.rarities.findIndex(c => c.id === rarity.id);
    if (rarityIndex !== -1) {
        grimoire.rarities[rarityIndex] = rarity;
    } else {
        grimoire.rarities.push(rarity);
    }
    return rarity;
}

export async function deleteRarity(grimoireId: string, rarityId: string): Promise<void> {
    console.log(`Deleting rarity ${rarityId} from grimoire ${grimoireId}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const grimoire = FAKE_DB_GRIMOIRES.find(g => g.id === grimoireId);
    if (!grimoire) throw new Error("Grimoire not found");

    const rarityIndex = grimoire.rarities.findIndex(c => c.id === rarityId);
    if (rarityIndex !== -1) {
        grimoire.rarities.splice(rarityIndex, 1);
    }
}

export async function clearRarities(grimoireId: string): Promise<void> {
    console.log(`Clearing all rarities from grimoire ${grimoireId}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const grimoire = FAKE_DB_GRIMOIRES.find(g => g.id === grimoireId);
    if (!grimoire) throw new Error("Grimoire not found");
    grimoire.rarities = [];
}
