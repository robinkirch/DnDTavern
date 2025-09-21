import type { Campaign, Grimoire, User, Recipe, Category, Rarity, InventoryItem, Monster, Note } from './types';
import api from './api';

// --- FAKE MOCK DATA & FUNCTIONS ---
// These will be replaced one by one as the backend is implemented.
// For now, they provide the data needed to keep the UI working.

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

// FAKE_DB_CAMPAIGNS and FAKE_DB_GRIMOIRES are no longer needed
// for the new campaign functions, but they are kept for the
// remaining mock functions below.
const FAKE_DB_CAMPAIGNS: Campaign[] = [/* ... your mock data here ... */];
const FAKE_DB_GRIMOIRES: Grimoire[] = [/* ... your mock data here ... */];


// --- CAMPAIGN SERVICE (Backend Calls) ---

export async function getCampaignsForUser(user: User): Promise<Campaign[]> {
    try {
        const response = await api.get(`/campaigns/users/${user.username}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Failed to fetch campaigns.');
    }
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
    try {
        const response = await api.get(`/campaigns/${id}`);
        return response.data;
    } catch (error) {
        if (error.response?.status === 404) {
            return null;
        }
        throw error.response?.data || new Error('Failed to fetch campaign.');
    }
}

export async function createCampaign(campaignData: Omit<Campaign, 'id' | 'inventorySettings' | 'userPermissions' | 'userInventories' | 'calendarSettings' | 'weatherSettings' | 'tracking' | 'bestiary' | 'notes'>): Promise<Campaign> {
    try {
        const response = await api.post('/campaigns', campaignData);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Failed to create campaign.');
    }
}

export async function updateCampaign(campaignData: Campaign): Promise<Campaign> {
    try {
        const response = await api.put(`/campaigns/${campaignData.id}`, campaignData);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Failed to update campaign.');
    }
}

export async function copyCampaign(campaignId: string): Promise<Campaign> {
    try {
        const response = await api.post(`/campaigns/copy/${campaignId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Failed to copy campaign.');
    }
}

// --- GRIMOIRE SERVICE (Backend Calls) ---

export async function getGrimoiresByUsername(): Promise<Grimoire[]> {
    try {
        const response = await api.get(`/grimoires/user/all`);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Failed to fetch grimoire.');
    }
};

export async function getGrimoireById(id: string): Promise<Grimoire | null> {
    try {
        const response = await api.get(`/grimoires/single/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error(`Failed to fetch grimoire with id "${id}"`);
    }
}

export async function createGrimoire(id: string, name: string, creatorUsername: string): Promise<Grimoire> {
    try {
        const response = await api.post('/grimoires', { id, name, creatorUsername });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Failed to create grimoire.');
    }
}

export async function deleteGrimoire(id: string): Promise<void> {
    try {
        await api.delete(`/grimoires/${id}`);
    } catch (error) {
        throw error.response?.data || new Error(`Failed to delete grimoire with id "${id}"`);
    }
}


// --- GRIMOIRE / RECIPE SERVICE (Still Mocked) ---

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

export async function saveInventory(campaignId: string, username: string, items: InventoryItem[]): Promise<void> {
    console.log(`Saving inventory for ${username} in campaign ${campaignId}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const campaign = FAKE_DB_CAMPAIGNS.find(c => c.id === campaignId);
    if (!campaign) throw new Error("Campaign not found");
    
    if (!campaign.userInventories[username]) {
        campaign.userInventories[username] = { items: [] };
    }

    campaign.userInventories[username].items = items;
}