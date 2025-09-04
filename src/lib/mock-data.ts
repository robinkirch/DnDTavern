import type { Campaign, Grimoire } from './types';

export const mockGrimoires: Grimoire[] = [
    {
        id: 'elminsters-eats',
        name: 'Elminster\'s Everyday Eats',
        description: 'A collection of recipes found in a sentient, and very hungry, spellbook.',
        creatorUsername: 'elminster',
        recipes: [
            {
                id: 'health-potion-cocktail',
                name: 'Health Potion Cocktail',
                category: 'Potion',
                rarity: 'Uncommon',
                description: 'A fizzy, red concoction that makes you feel reinvigorated. Tastes of strawberries and hope.',
                ingredients: [
                { item: 'Glimmer-root infusion', quantity: '2 oz' },
                { item: 'Sparkling spring water', quantity: '4 oz' },
                { item: 'A single wild berry', quantity: '1' },
                { item: 'A whisper of encouragement', quantity: '1 pinch' },
                ],
                instructions: 'Mix the infusion and sparkling water in a chilled glass. Drop the wild berry in gently. Whisper your encouragement over the top before serving.',
            },
            {
                id: 'owlbear-omelette',
                name: 'Owlbear Omelette',
                category: 'Meal',
                rarity: 'Rare',
                description: 'A famously large and hearty meal, said to be able to feed a whole party. Ethically sourced, of course.',
                ingredients: [
                { item: 'Owlbear Egg (or 3 dozen chicken eggs)', quantity: '1' },
                { item: 'Cave mushrooms', quantity: '1 cup, sliced' },
                { item: 'Dwarven "strong" cheese', quantity: '1/2 cup, grated' },
                { item: 'Salt and pepper', quantity: 'to taste' },
                ],
                instructions: 'Whisk the egg(s) in a comically large bowl. Pour into a greased, cauldron-sized pan over medium heat. Add mushrooms and cheese as it begins to set. Fold and serve on a platter or shield.',
            },
            {
                id: 'dragonbreath-chili',
                name: 'Dragonbreath Chili',
                category: 'Meal',
                rarity: 'Legendary',
                description: 'A chili so spicy it requires a waiver to consume. Handle with care.',
                ingredients: [
                    { item: 'Minced Hell-Hound meat', quantity: '1 lb' },
                    { item: 'Volcanic Ash Tomatoes', quantity: '1 can' },
                    { item: 'Phoenix Peppers', quantity: '3, finely diced' },
                    { item: 'Asbestos Beans', quantity: '1 can' },
                    { item: 'Lava Salt', quantity: 'to taste' },
                ],
                instructions: 'In a fire-proof pot, brown the meat. Add tomatoes and peppers. Simmer for 4 hours. Add beans. Pray. Serve with a side of healing potions.',
            }
        ]
    },
    {
        id: 'volos-vile-brews',
        name: 'Volo\'s Vile Brews',
        description: 'Drink recipes from a tavern that caters to... unusual clientele.',
        creatorUsername: 'volo',
        recipes: [
            {
              id: 'mindflayer-martini',
              name: 'Mindflayer Martini',
              category: 'Drink',
              rarity: 'Rare',
              description: 'A sophisticated, slightly psychic drink. Do not think too hard while drinking.',
              ingredients: [
                { item: 'Clear Githyanki Gin', quantity: '3 oz' },
                { item: 'A splash of dry vermouth', quantity: '1/4 oz' },
                { item: 'Pickled intellect devourer brain', quantity: '1, for garnish' },
              ],
              instructions: 'Stir gin and vermouth with ice in a mixing glass until very cold. Strain into a chilled coupe glass. Garnish with the pickled brain. Try to think only of pleasant things.',
            },
            {
              id: 'goblin-grog',
              name: 'Goblin Grog',
              category: 'Drink',
              rarity: 'Common',
              description: 'It\'s... green. And it has a kick. Popular in certain circles.',
              ingredients: [
                { item: 'Whatever fermented liquid is available', quantity: '1 flagon' },
                { item: 'Bog water', quantity: 'for color' },
                { item: 'A rusty nail', quantity: 'for flavor (optional)' },
              ],
              instructions: 'Combine ingredients. Let sit for at least an hour. Serve at room temperature. Remove nail before drinking. Or don\'t.',
            },
          ]
    }
];


export const mockCampaigns: Campaign[] = [
  {
    id: 'the-guzzling-grimoire-campaign',
    name: 'The Guzzling Grimoire',
    description: 'An adventure centered around a sentient, and very hungry, spellbook.',
    creatorUsername: 'elminster',
    invitedUsernames: ['volo', 'drizzt'],
    image: 'https://picsum.photos/600/400?random=1',
    grimoireId: 'elminsters-eats',
    recipes: [], // Populated at runtime from grimoire
  },
  {
    id: 'the-tipsy-beholder-campaign',
    name: 'The Tipsy Beholder',
    description: 'A quest that starts in a tavern that caters to... unusual clientele.',
    creatorUsername: 'volo',
    invitedUsernames: ['elminster'],
    image: 'https://picsum.photos/600/400?random=2',
    grimoireId: 'volos-vile-brews',
    recipes: [], // Populated at runtime from grimoire
  },
   {
    id: 'a-new-adventure',
    name: 'A New Adventure',
    description: 'A freshly started campaign, ready for a grimoire to be linked.',
    creatorUsername: 'elminster',
    invitedUsernames: [],
    image: 'https://picsum.photos/600/400?random=3',
    grimoireId: null, // No grimoire linked yet
    recipes: [],
  },
];
