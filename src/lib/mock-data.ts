import type { Campaign, Grimoire, Recipe, Category, Component } from './types';

// --- Re-structured Mock Data based on the new types ---

const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-potion', name: 'Potions' },
  { id: 'cat-meal', name: 'Meals' },
  { id: 'cat-drink', name: 'Drinks' },
  { id: 'cat-snack', name: 'Snacks' },
  { id: 'cat-herb', name: 'Herbs' },
  { id: 'cat-monster-part', name: 'Monster Parts' },
  { id: 'cat-spice', name: 'Spices' },
  { id: 'cat-dairy', name: 'Dairy & Eggs' },
];

const MOCK_COMPONENTS: Component[] = [
  // Potion Ingredients
  { id: 'comp-glimmer-root', name: 'Glimmer-root', description: 'A root that faintly glows.', secretDescription: 'Actually just a glow-worm-infested carrot.', categoryId: 'cat-herb' },
  { id: 'comp-spring-water', name: 'Sparkling Spring Water', description: 'Effervescent water from a mountain spring.', secretDescription: null, categoryId: 'cat-drink' },
  { id: 'comp-wild-berry', name: 'A Single Wild Berry', description: 'A perfectly ripe berry.', secretDescription: null, categoryId: 'cat-herb' },

  // Omelette Ingredients
  { id: 'comp-owlbear-egg', name: 'Owlbear Egg', description: 'A very, very large egg.', secretDescription: 'Chicken eggs work just fine if you use enough of them.', categoryId: 'cat-monster-part' },
  { id: 'comp-cave-mushroom', name: 'Cave Mushroom', description: 'An edible fungus found in damp caves.', secretDescription: null, categoryId: 'cat-herb' },
  { id: 'comp-dwarven-cheese', name: 'Dwarven "Strong" Cheese', description: 'A pungent, hard cheese.', secretDescription: 'Its strength comes from the smell, not the taste.', categoryId: 'cat-dairy' },
  
  // Chili Ingredients
  { id: 'comp-hell-hound-meat', name: 'Minced Hell-Hound Meat', description: 'Spicy, lean meat.', secretDescription: 'Spicy ground pork is a decent substitute.', categoryId: 'cat-monster-part' },
  { id: 'comp-volcanic-tomatoes', name: 'Volcanic Ash Tomatoes', description: 'Tomatoes grown in volcanic soil.', secretDescription: null, categoryId: 'cat-herb' },
  { id: 'comp-phoenix-peppers', name: 'Phoenix Peppers', description: 'Extremely hot peppers that regrow from their own ashes.', secretDescription: 'Handle with fireproof gloves.', categoryId: 'cat-herb' },
  { id: 'comp-asbestos-beans', name: 'Asbestos Beans', description: 'Remarkably heat-resistant beans.', secretDescription: null, categoryId: 'cat-herb' },

  // Martini Ingredients
  { id: 'comp-gith-gin', name: 'Clear Githyanki Gin', description: 'An astringent, otherworldly spirit.', secretDescription: null, categoryId: 'cat-drink' },
  { id: 'comp-vermouth', name: 'Dry Vermouth', description: 'A fortified wine.', secretDescription: null, categoryId: 'cat-drink' },
  { id: 'comp-intellect-devourer-brain', name: 'Pickled Intellect Devourer Brain', description: 'A gruesome but supposedly tasty garnish.', secretDescription: 'A cocktail onion with a food-safe dye works too.', categoryId: 'cat-monster-part' },

  // Grog Ingredients
  { id: 'comp-fermented-liquid', name: 'Whatever fermented liquid is available', description: 'The base of the grog. Quality may vary.', secretDescription: null, categoryId: 'cat-drink' },
  { id: 'comp-bog-water', name: 'Bog Water', description: 'Used for authentic color and texture.', secretDescription: 'Green food coloring is more hygienic.', categoryId: 'cat-drink' },
];

const MOCK_RECIPES_ELMINSTER: Recipe[] = [
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
    {
        id: 'dragonbreath-chili',
        name: 'Dragonbreath Chili',
        categoryId: 'cat-meal',
        rarity: 'Legendary',
        description: 'A chili so spicy it requires a waiver to consume. Handle with care.',
        secretDescription: 'The secret ingredient is an actual drop of dragon blood.',
        components: [
            { componentId: 'comp-hell-hound-meat', quantity: '1 lb' },
            { componentId: 'comp-volcanic-tomatoes', quantity: '1 can' },
            { componentId: 'comp-phoenix-peppers', quantity: '3, finely diced' },
            { componentId: 'comp-asbestos-beans', quantity: '1 can' },
        ],
        instructions: 'In a fire-proof pot, brown the meat. Add tomatoes and peppers. Simmer for 4 hours. Add beans. Pray. Serve with a side of healing potions.',
    }
];

const MOCK_RECIPES_VOLO: Recipe[] = [
    {
      id: 'mindflayer-martini',
      name: 'Mindflayer Martini',
      categoryId: 'cat-drink',
      rarity: 'Rare',
      description: 'A sophisticated, slightly psychic drink. Do not think too hard while drinking.',
      secretDescription: null,
      components: [
        { componentId: 'comp-gith-gin', quantity: '3 oz' },
        { componentId: 'comp-vermouth', quantity: '1/4 oz' },
        { componentId: 'comp-intellect-devourer-brain', quantity: '1, for garnish' },
      ],
      instructions: 'Stir gin and vermouth with ice in a mixing glass until very cold. Strain into a chilled coupe glass. Garnish with the pickled brain. Try to think only of pleasant things.',
    },
    {
      id: 'goblin-grog',
      name: 'Goblin Grog',
      categoryId: 'cat-drink',
      rarity: 'Common',
      description: 'It\'s... green. And it has a kick. Popular in certain circles.',
      secretDescription: 'It\'s mostly just bad moonshine.',
      components: [
        { componentId: 'comp-fermented-liquid', quantity: '1 flagon' },
        { componentId: 'comp-bog-water', quantity: 'for color' },
      ],
      instructions: 'Combine ingredients. Let sit for at least an hour. Serve at room temperature.',
    },
];

export const mockGrimoires: Grimoire[] = [
    {
        id: 'elminsters-eats',
        name: 'Elminster\'s Everyday Eats',
        description: 'A collection of recipes found in a sentient, and very hungry, spellbook.',
        creatorUsername: 'elminster',
        categories: MOCK_CATEGORIES,
        components: MOCK_COMPONENTS,
        recipes: MOCK_RECIPES_ELMINSTER,
    },
    {
        id: 'volos-vile-brews',
        name: 'Volo\'s Vile Brews',
        description: 'Drink recipes from a tavern that caters to... unusual clientele.',
        creatorUsername: 'volo',
        categories: MOCK_CATEGORIES,
        components: MOCK_COMPONENTS,
        recipes: MOCK_RECIPES_VOLO,
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
    grimoireId: null, // No grimoire linked yet
  },
];
