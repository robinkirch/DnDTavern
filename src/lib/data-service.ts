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

import type { Campaign, Grimoire, User, Recipe, Category, Component } from './types';

// --- MOCK DATA ---
// This data simulates what would be returned from a database.
// It is used to make the UI work without a real backend.
// In a real scenario, this array would be empty and functions
// would perform async database calls.

const FAKE_DB_CAMPAIGNS: Campaign[] = [
  {
    id: 'the-guzzling-grimoire-campaign',
    name: 'The Guzzling Grimoire',
    description: 'An adventure centered around a sentient, and very hungry, spellbook.',
    creatorUsername: 'elminster',
    invitedUsernames: ['volo', 'drizzt'],
    image: 'https://picsum.photos/1200/400?random=1',
    grimoireId: 'elminsters-eats',
    sessionNotes: 'The party successfully deciphered the first three pages of the grimoire, revealing a recipe for a potent truth serum. They are now heading towards the Whispering Caves to find Glimmer-root, a key ingredient. A group of goblins is tailing them, hired by a mysterious figure who also wants the grimoire.'
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
  },
];

const FAKE_DB_GRIMOIRES: Grimoire[] = [
    {
        id: 'elminsters-eats',
        creatorUsername: 'elminster',
        name: 'Elminster\'s Everyday Eats',
        description: 'A collection of recipes found in a sentient, and very hungry, spellbook.',
        categories: [
          { id: 'cat-potion', name: 'Potions' },
          { id: 'cat-meal', name: 'Meals' },
          { id: 'cat-snack', name: 'Snacks' },
          { id: 'cat-drink', name: 'Drinks' },
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
                  { componentId: 'comp-glimmer-root', quantity: '2 oz infusion', type: 'component' },
                  { componentId: 'comp-spring-water', quantity: '4 oz', type: 'component' },
                  { componentId: 'comp-wild-berry', quantity: '1', type: 'component' },
                ],
                instructions: 'Mix the Glimmer-root infusion and sparkling water in a chilled glass. Drop the wild berry in gently. Serve immediately.',
                image: 'https://picsum.photos/400/300?random=10'
            },
            {
                id: 'owlbear-omelette',
                name: 'Owlbear Omelette',
                categoryId: 'cat-meal',
                rarity: 'Rare',
                description: 'A famously large and hearty meal, said to be able to feed a whole party. Ethically sourced, of course.',
                secretDescription: null,
                components: [
                  { componentId: 'comp-owlbear-egg', quantity: '1', type: 'component' },
                  { componentId: 'comp-cave-mushroom', quantity: '1 cup, sliced', type: 'component' },
                  { componentId: 'comp-dwarven-cheese', quantity: '1/2 cup, grated', type: 'component' },
                ],
                instructions: 'Whisk the egg in a comically large bowl. Pour into a greased, cauldron-sized pan over medium heat. Add mushrooms and cheese as it begins to set. Fold and serve on a platter or shield.',
            },
        ],
    },
    {
        id: 'volos-vile-brews',
        creatorUsername: 'volo',
        name: 'Volo\'s Vile Brews',
        description: 'Brews and concoctions from the famed (and often embellished) world traveler, Volothamp Geddarm.',
        categories: [
          { id: 'cat-drink', name: 'Drinks' },
          { id: 'cat-snack', name: 'Snacks' },
        ],
        components: [
          { id: 'comp-grog', name: 'Basic Grog', description: 'Every pirate\'s favorite.', secretDescription: 'Just use rum.', categoryId: 'cat-drink' },
          { id: 'comp-kobold-spice', name: 'Kobold Spice', description: 'A surprisingly zesty seasoning.', secretDescription: 'It\'s just paprika.', categoryId: 'cat-spice' },
          { id: 'comp-dried-meat', name: 'Dried Meat Strip', description: 'Of indeterminate origin.', secretDescription: null, categoryId: 'cat-monster-part' },
        ],
        recipes: [
            {
                id: 'spicy-grog',
                name: 'Volo\'s Spicy Grog',
                categoryId: 'cat-drink',
                rarity: 'Common',
                description: 'A classic grog with a spicy kick that clears the sinuses.',
                secretDescription: null,
                components: [
                    { componentId: 'comp-grog', quantity: '1 mug', type: 'component' },
                    { componentId: 'comp-kobold-spice', quantity: '1 pinch', type: 'component' },
                ],
                instructions: 'Pour grog into mug. Add spice. Stir once. Drink before you reconsider.',
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

export async function createGrimoire(id: string, creatorUsername: string): Promise<Grimoire> {
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
        name: `Grimoire of ${id}`,
        description: `A newly discovered collection of recipes from the source '${id}'.`,
        categories: [],
        components: [],
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

export async function saveComponent(grimoireId: string, component: Component): Promise<Component> {
    console.log(`Saving component to grimoire ${grimoireId}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const grimoire = FAKE_DB_GRIMOIRES.find(g => g.id === grimoireId);
    if (!grimoire) throw new Error("Grimoire not found");

    const componentIndex = grimoire.components.findIndex(c => c.id === component.id);
    if (componentIndex !== -1) {
        grimoire.components[componentIndex] = component;
    } else {
        grimoire.components.push(component);
    }
    return component;
}
