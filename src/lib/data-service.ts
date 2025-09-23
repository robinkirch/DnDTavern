import type { Campaign, Grimoire, User, Recipe, Category, Rarity, InventoryItem, Monster, Note } from './types';
import api from './api';

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
        console.log(error);
        throw error.response?.data || new Error('Failed to fetch grimoire.');
    }
};

export async function getGrimoireById(id: string): Promise<Grimoire | null> {
    try {
        const response = await api.get(`/grimoires/single/${id}`);
        return response.data;
    } catch (error) {
        console.log(error);
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


// --- GRIMOIRE / RECIPE SERVICE ---

export async function saveRecipe(grimoireId: string, recipe: Recipe): Promise<Recipe> {
    try {
        const response = await api.post(`/recipes/${grimoireId}`, recipe);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to save recipe.');
    }
}

export async function deleteRecipe(grimoireId: string, recipeId: string): Promise<void> {
    try {
        await api.delete(`/recipes/${grimoireId}/${recipeId}`);
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to delete recipe.');
    }
}

export async function saveCategory(grimoireId: string, category: Category): Promise<Category> {
    try {
        const response = await api.post(`/categories/${grimoireId}`, category);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to save category.');
    }
}

export async function deleteCategory(grimoireId: string, categoryId: string): Promise<void> {
    try {
        await api.delete(`/categories/${grimoireId}/${categoryId}`);
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to delete category.');
    }
}

export async function clearCategories(grimoireId: string): Promise<void> {
    try {
        await api.delete(`/categories/${grimoireId}/clear`);
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to clear categories.');
    }
}

export async function saveRarity(grimoireId: string, rarity: Rarity): Promise<Rarity> {
    try {
        const response = await api.post(`/rarities/${grimoireId}`, rarity);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to save rarity.');
    }
}

export async function deleteRarity(grimoireId: string, rarityId: string): Promise<void> {
    try {
        await api.delete(`/rarities/${grimoireId}/${rarityId}`);
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to delete rarity.');
    }
}

export async function clearRarities(grimoireId: string): Promise<void> {
    try {
        await api.delete(`/rarities/${grimoireId}/clear`);
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to clear rarities.');
    }
}


// --- INVENTORY SERVICE --- Still Mocked

export async function saveInventory(campaignId: string, username: string, items: InventoryItem[]): Promise<void> {
    // console.log(`Saving inventory for ${username} in campaign ${campaignId}...`);
    // await new Promise(resolve => setTimeout(resolve, 500));
    // const campaign = FAKE_DB_CAMPAIGNS.find(c => c.id === campaignId);
    // if (!campaign) throw new Error("Campaign not found");
    
    // if (!campaign.userInventories[username]) {
    //     campaign.userInventories[username] = { items: [] };
    // }

    // campaign.userInventories[username].items = items;
}