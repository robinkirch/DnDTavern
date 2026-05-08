import type { Campaign, Grimoire, User, Recipe, Category, Rarity, InventoryItem, Monster, Note, DamageType, CreateCampaign, UserDTO, Questboard, Quest, SessionLog, Session, SessionWithLogs } from './types';
import api from './api';
import { CampaignUpdateData } from '@/components/dialogs/edit-campaign-dialog';

// --- CAMPAIGN SERVICE (Backend Calls) ---

export async function getCampaignsForUser(user: User): Promise<Campaign[]> {
    try {
        const response = await api.get(`/campaigns/users/${user.username}`);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to fetch campaigns.');
    }
}

export async function getCampaignById(id: string): Promise<Campaign | null | undefined> {
    try {
        const response = await api.get(`/campaigns/${id}`);
        return response.data;
    } catch (error) {
        if ((error as any).response?.status === 404) {
            return null;
        }
        if ((error as any).response?.status === 403) {
            return undefined;
        }
        throw (error as any).response?.data || new Error('Failed to fetch campaign.');
    }
}

export async function createCampaign(campaignData: Omit<CreateCampaign, 'id' | 'inventorySettings' | 'userPermissions' | 'calendarSettings' | 'weatherSettings' | 'tracking' | 'bestiary' | 'notes'>): Promise<Campaign> {
    try {
        const response = await api.post('/campaigns', campaignData);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to create campaign.');
    }
}

export async function updateCampaignSettings(campaignId: string, data: CampaignUpdateData): Promise<Campaign> {
    try {
        const response = await api.put(`/campaigns/${campaignId}/settings`, data);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to update campaign settings.');
    }
}

export async function updateCampaign(campaignData: Campaign): Promise<Campaign> {
    try {
        const response = await api.put(`/campaigns/${campaignData.id}`, campaignData);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to update campaign.');
    }
}

export async function copyCampaign(campaignId: string): Promise<Campaign> {
    try {
        const response = await api.post(`/campaigns/copy/${campaignId}`);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to copy campaign.');
    }
}

export async function deleteCampaign(id: string): Promise<void> {
    try {
        await api.delete(`/campaigns/${id}`);
    } catch (error) {
        throw (error as any).response?.data || new Error(`Failed to delete campaign with id "${id}"`);
    }
}

export const updateCampaignTracking = async (campaignId: string, tracking: any) => {
    try {
        const response = await api.patch(`/campaigns/${campaignId}/tracking`, { tracking });
        return response.data.tracking; 
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to patch tracking.');
    }
};

// --- GRIMOIRE SERVICE (Backend Calls) ---

export async function getGrimoiresByUsername(): Promise<Grimoire[]> {
    try {
        const response = await api.get(`/grimoires/user/all`);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to fetch grimoire.');
    }
};

export async function getGrimoireById(id: string): Promise<Grimoire | null> {
    try {
        const response = await api.get(`/grimoires/single/${id}`);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error(`Failed to fetch grimoire with id "${id}"`);
    }
}

export async function getGrimoireByIdAsPlayer(id: string, dm: string): Promise<Grimoire | null> {
    try {
        const response = await api.get(`/grimoires/single/${id}/${dm}`);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error(`Failed to fetch grimoire with id "${id}"`);
    }
}

export async function createGrimoire(id: string, name: string, creatorUsername: string): Promise<Grimoire> {
    try {
        const response = await api.post('/grimoires', { id, name, creatorUsername });
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to create grimoire.');
    }
}

export async function deleteGrimoire(id: string): Promise<void> {
    try {
        await api.delete(`/grimoires/${id}`);
    } catch (error) {
        throw (error as any).response?.data || new Error(`Failed to delete grimoire with id "${id}"`);
    }
}

export async function updateGrimoire(grimoireData: Grimoire): Promise<Grimoire> {
    try {
        const response = await api.put(`/grimoires/${grimoireData.id}`, grimoireData);
        return response.data;
    } catch (error) {
         throw (error as any).response?.data || new Error('Failed to update grimoire.');
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


// --- MONSTER SERVICE ---

export async function getMonsters(grimoireId: string): Promise<Monster[]> {
    try {
        const response = await api.get(`/monsters/${grimoireId}`);
        return response.data;
    } catch (err) {
        throw err;
    }
}

export async function saveMonster(grimoireId: string, campaignId: string, monster: Monster): Promise<Monster> {
    try {
        const response = await api.post(`/monsters/${grimoireId}/${campaignId}`, monster);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to save monster.');
    }
}

export async function deleteMonster(grimoireId: string, monsterId: string): Promise<void> {
    try {
        await api.delete(`/monsters/${grimoireId}/${monsterId}`);
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to delete monster.');
    }
}

// --- NOTE SERVICE ---

export async function getNotes(grimoireId: string, campaignId: string): Promise<Note[]> {
    try {
        const response = await api.get(`/notes/${grimoireId}/${campaignId}`);
        return response.data;
    } catch (err) {
        throw err;
    }
}

export async function saveNote(grimoireId: string, campaignId: string, note: Note): Promise<Note> {
    try {
        const response = await api.post(`/notes/${grimoireId}/${campaignId}`, note);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to save note.');
    }
}

export async function deleteNote(grimoireId: string, noteId: string, campaignId: string): Promise<void> {
    try {
        await api.delete(`/notes/${grimoireId}/${noteId}/${campaignId}`);
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to delete note.');
    }
}

// --- DAMAGETYPES SERVICE ---
export async function fetchDamageTypes(grimoireId: string): Promise<DamageType[]> {
    try {
        const response = await api.get(`/grimoires/${grimoireId}/all/damagetypes`);
        return response.data;
    } catch (err) {
        throw err;
    }
}

// --- QUEST SERVICE

export async function getAllQuestBoards(grimoireId: string, campaignId: string): Promise<Questboard[]> {
    try {
        const response = await api.get(`/quests/${grimoireId}/${campaignId}`);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to get Questboards.');
    }
}

export async function addQuestBoard(grimoireId: string, campaignId: string, board: Questboard): Promise<void> {
    try {
        const response = await api.post(`/quests/${grimoireId}/${campaignId}`, board);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to add Questboard.');
    }
}

export async function deleteQuestboard(grimoireId: string,campaignId: string, boardId: string): Promise<void> {
    try {
        await api.delete(`/quests/${grimoireId}/${campaignId}/${boardId}`);
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to delete questboard.');
    }
}

export async function addQuest(grimoireId: string, boardId: string, quest: Quest): Promise<void> {
    try {
        const response = await api.post(`/quests/quest/${grimoireId}/${boardId}`, quest);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to add quest.');
    }
}

export async function deleteQuest(grimoireId: string, boardId: string, questid: string): Promise<void> {
    try {
        await api.delete(`/quests/quest/${grimoireId}/${boardId}/${questid}`);
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to delete quest.');
    }
}

export async function updateQuest(grimoireId: string, boardId: string, quest: Quest): Promise<void> {
    try {
        const response = await api.put(`/quests/quest/${grimoireId}/${boardId}`, quest);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to update quest.');
    }
}

// --- INVENTORY SERVICE

export async function addItemToInventory(grimoireId: string, campaignId: string, item: InventoryItem): Promise<void> {
    try {
        item.image = null;
        const response = await api.post(`/inventories/${grimoireId}/${campaignId}`, item);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to save item.');
    }
}

export async function addItemToInventoryToPlayer(grimoireId: string, campaignId: string, item: InventoryItem, targetPlayer: string): Promise<void> {
    try {
        item.image = null;
        const response = await api.post(`/inventories/${grimoireId}/${campaignId}/${targetPlayer}`, item);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to save item.');
    }
}

export async function updateItemInInventory(grimoireId: string, campaignId: string, item: InventoryItem): Promise<void> {
    try {
        item.image = null;
        const response = await api.put(`/inventories/${grimoireId}/${campaignId}/update`, item);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to update item.');
    }
}

function mapInventoryData(data: any) : any {
    return data.map((item: any) => {
        const safeParse = (val: any) => {
            if (!val) return {};
            if (typeof val === 'object') return val;
            try { 
                return JSON.parse(val); 
            } catch (e) { 
                return {}; 
            }
        };

        const baseMeta = safeParse(item.metadata);
        const customMeta = safeParse(item.customMetadata);

        const mergedMeta = { ...baseMeta, ...customMeta };

        return {
            ...item,
            metadata: mergedMeta, 
            isFood: Boolean(mergedMeta.isFood || item.isFood), 
            foodValue: mergedMeta.food || mergedMeta.foodValue || null,
            isQuestItem: Boolean(mergedMeta.isQuestItem)
        };
    });
}

export async function getInventory(grimoireId: string, campaignId: string, inventoryName: string = "default"): Promise<InventoryItem[]> {
    try {
        const response = await api.get(`/inventories/${grimoireId}/${campaignId}/${inventoryName}`);
        return mapInventoryData(response.data);
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to fetch inventory.');
    }
}

export async function getPlayerInventory(grimoireId: string, campaignId: string, playerName: string): Promise<InventoryItem[]> {
    try {
        const response = await api.get(`/inventories/${grimoireId}/${campaignId}/playerInventory/${playerName}`);
        return mapInventoryData(response.data);
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to fetch inventory.');
    }
}

export const updateItemSlot = async (grimoireId: string, campaignId: string, itemId: string, newSlot: number | null, inventoryName: string = "none", playerName: string = "nobody") => {
    try {
        const response = await api.put(`/inventories/${grimoireId}/${campaignId}/${inventoryName}/${playerName}/move`, [itemId, newSlot]);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to move item.');
    }
};

export const updateBackPack = async (grimoireId: string, campaignId: string, itemId: string, playerName: string) => {
    try {
        const response = await api.put(`/inventories/${grimoireId}/${campaignId}/${playerName}/backpack`, [itemId]);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to update backpack.');
    }
};


export async function splitInventoryItem(grimoireId: string, campaignId: string, inventoryName: string, playerName: string, itemId: string, splitAmount: number): Promise<{ message: string, newItemId: string }> {
    try {
        const response = await api.put(`/inventories/${grimoireId}/${campaignId}/${inventoryName}/${playerName}/split`, { itemId, splitAmount });
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to split item.');
    }
}

export async function addMoreInventoryItem(grimoireId: string, campaignId: string, playerName: string, itemId: string, addAmount: number): Promise<{ message: string }> {
    try {
        const response = await api.put(`/inventories/${grimoireId}/${campaignId}/${playerName}/addToItem`, { itemId, addAmount });
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to add more to item.');
    }
}


export async function deleteInventoryItem(grimoireId: string, campaignId: string, itemId: string): Promise<void> {
    try {
        await api.delete(`/inventories/${grimoireId}/${campaignId}/${itemId}`);
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to delete item.');
    }
}


export async function getPlayerMoney(grimoireId: string, campaignId: string): Promise<InventoryItem | null> {
    try {
        const response = await api.get(`/inventories/money/${grimoireId}/${campaignId}`);
        const data = response.data;

        if (Array.isArray(data) && data.length > 0) {
            const mappedItems = mapInventoryData(data);
            return mappedItems[0]; 
        }

        return null;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to fetch inventory.');
    }
}

export const updatePlayerMoney = async (grimoireId: string, campaignId: string, item: InventoryItem): Promise<void>  => {
    try {
        const response = await api.put(`/inventories/money/${grimoireId}/${campaignId}`, item);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to move item.');
    }
};



export async function craftItem(grimoireId: string, campaignId: string, recipeid: string): Promise<void> {
    try {
        const response = await api.put(`/inventories/crafting/${grimoireId}/${campaignId}`, { recipeid });
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to craft item.');
    }
}

// --- USER SERVICE

export async function updateUser(userData: UserDTO): Promise<User> {
    try {
        const response = await api.put(`/users/${userData.oldUsername}`, userData);
        return response.data;
    } catch (error) {
         throw (error as any).response?.data || new Error('Failed to update user.');
    }
}

export async function getCharacterData(username: string): Promise<Record<string, { campaignName: string; characterName: string }>> {
    try {
        const response = await api.get(`/users/character/${username}`);
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to fetch user data.');
    }
}

// --- SESSION SERVICE

export async function getSessionLogs(grimoireId: string, sessionId: string): Promise<SessionLog[]> {
    try {
        const response = await api.get(`/sessions/${sessionId}/${grimoireId}`);
        return response.data.map((log: any) => ({
            ...log,
            time: new Date(log.time)
        }));
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to fetch session logs.');
    }
}

export async function getOtherLogs(grimoireId: string, campaignId: string): Promise<SessionLog[]> {
    try {
        const response = await api.get(`/sessions/logs/${grimoireId}/${campaignId}`);
        return response.data.map((log: any) => ({
            ...log,
            time: new Date(log.time)
        }));
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to fetch session logs.');
    }
}


export async function saveSession(grimoireId: string, campaignId: string, session: Session): Promise<Session> {
    try {
        const response = await api.post(`/sessions/${campaignId}/${grimoireId}`, session);
        return {
            ...response.data,
            date: new Date(response.data.date)
        };
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to save session.');
    }
}

export async function updateSession(grimoireId: string, sessionId: string, session: Partial<Session>): Promise<Session> {
    try {
        const response = await api.put(`/sessions/${sessionId}/${grimoireId}`, session);
        return {
            ...response.data,
            date: new Date(response.data.date)
        };
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to update session.');
    }
}

export async function deleteSession(grimoireId: string, sessionId: string): Promise<void> {
    try {
        await api.delete(`/sessions/${sessionId}/${grimoireId}`);
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to delete session.');
    }
}

export async function getFullSessions(grimoireId: string, campaignId: string): Promise<SessionWithLogs[]> {
    try {
        const response = await api.get(`/sessions/all-with-details/${campaignId}/${grimoireId}`);

        return response.data.map((s: any) => ({
            ...s,
            date: new Date(s.date),
            logs: s.logs.map((l: any) => ({ ...l, time: new Date(l.time) })),
            note: s.note
        }));
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to load sessions.');
    }
}

export async function updateSessionNote(grimoireId: string, sessionId: string, noteData: { id?: string; note: string }): Promise<{ id: string }> {
    try {
        const response = await api.put(`/sessions/note/${sessionId}/${grimoireId}`, {id: noteData.id || null, note: noteData.note, sessionId: sessionId});
        
        return response.data;
    } catch (error) {
        throw (error as any).response?.data || new Error('Failed to update session note.');
    }
}