/**
 * api.js — all network requests for Simple Recipe Finder.
 *
 * PRIMARY API:   TheMealDB   (free, no key needed with the "1" development key)
 * SECONDARY API: Spoonacular (needs your own API key — see the config below)
 *
 * The rest of the app never sees the raw API formats. Every function that is
 * exported from here returns recipes already normalized by utils.js.
 */

import {
  ApiError,
  normalizeMealDBRecipe,
  normalizeSpoonacularRecipe,
} from "./utils.js";

/* ==========================================================
   CONFIGURATION  (the ONLY part you need to edit)
   ========================================================== */

/**
 * >>> PUT YOUR OWN SPOONACULAR API KEY BETWEEN THE QUOTES BELOW <<<
 * Get a free key at https://spoonacular.com/food-api (create an account,
 * then open "Profile" -> "API Key").
 *
 * IMPORTANT LIMITATION: this is a frontend-only project, so any key written in
 * this file is visible to anyone who opens the browser's developer tools.
 * Only use a free/development key, never a paid or secret key, do not commit
 * it to a public GitHub repo, and in a real production app the key would be
 * kept on a server. While the placeholder text is left as-is, the app simply
 * skips Spoonacular and keeps working with TheMealDB.
 */
const SPOONACULAR_API_KEY = "YOUR_SPOONACULAR_API_KEY_HERE";

// TheMealDB's free development key is the number 1 (it is meant to be public).
const MEALDB_BASE_URL = "https://www.themealdb.com/api/json/v1/1";
const SPOONACULAR_BASE_URL = "https://api.spoonacular.com";

/** Maximum recipes shown at once. */
const MAX_RESULTS = 24;
const SPOONACULAR_RESULT_COUNT = 8;

/**
 * Category buttons on the home page.
 * TheMealDB has real "Breakfast" and "Dessert" categories but no "Lunch" or "Dinner",
 * so those two are mapped to related TheMealDB categories and Spoonacular dish types.
 */
const CATEGORY_MAP = {
  Breakfast: { mealdb: ["Breakfast"], spoonacular: "breakfast" },
  Lunch: { mealdb: ["Pasta", "Vegetarian"], spoonacular: "salad" },
  Dinner: { mealdb: ["Beef", "Chicken"], spoonacular: "main course" },
  Dessert: { mealdb: ["Dessert"], spoonacular: "dessert" },
};

/* ==========================================================
   GENERIC FETCH HELPER
   ========================================================== */

/**
 * Fetch JSON and turn every failure into a friendly ApiError.
 * @param {string} url
 * @param {string} apiName Name used in error messages.
 * @returns {Promise<object>}
 */
async function fetchJson(url, apiName) {
  let response;

  try {
    response = await fetch(url);
  } catch {
    throw new ApiError(`Could not reach ${apiName}. Please check your internet connection.`);
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new ApiError(`${apiName} rejected the API key. Check the key in js/api.js.`, response.status);
    }
    if (response.status === 402 || response.status === 429) {
      throw new ApiError(`${apiName} request limit reached. Please try again later.`, response.status);
    }
    throw new ApiError(`${apiName} returned an error (${response.status}).`, response.status);
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError(`${apiName} sent a response the app could not read.`);
  }
}

/**
 * TheMealDB returns { meals: null } or { meals: "None Found" } when nothing matches.
 * @param {object} data
 * @returns {object[]}
 */
function getMeals(data) {
  return data && Array.isArray(data.meals) ? data.meals : [];
}

/* ==========================================================
   THEMEALDB
   ========================================================== */

/**
 * Search TheMealDB by meal name.
 * @param {string} query
 * @returns {Promise<object[]>} Normalized recipes.
 */
export async function searchMealDB(query) {
  const data = await fetchJson(`${MEALDB_BASE_URL}/search.php?s=${encodeURIComponent(query)}`, "TheMealDB");
  return getMeals(data).map((meal) => normalizeMealDBRecipe(meal));
}

/**
 * Search TheMealDB by main ingredient (e.g. "chicken breast").
 * @param {string} ingredient
 * @returns {Promise<object[]>} Normalized recipes (basic info only).
 */
export async function searchMealDBByIngredient(ingredient) {
  const formatted = ingredient.trim().replace(/\s+/g, "_");
  const data = await fetchJson(`${MEALDB_BASE_URL}/filter.php?i=${encodeURIComponent(formatted)}`, "TheMealDB");
  return getMeals(data).map((meal) => normalizeMealDBRecipe(meal));
}

/**
 * Get one full recipe from TheMealDB.
 * @param {string} id
 * @returns {Promise<object>} Normalized recipe.
 */
export async function getMealDBRecipeById(id) {
  const data = await fetchJson(`${MEALDB_BASE_URL}/lookup.php?i=${encodeURIComponent(id)}`, "TheMealDB");
  const meals = getMeals(data);
  if (meals.length === 0) {
    throw new ApiError("That recipe could not be found.");
  }
  return normalizeMealDBRecipe(meals[0]);
}

/**
 * Get one random recipe from TheMealDB.
 * @returns {Promise<object>} Normalized recipe.
 */
export async function getRandomMealDBRecipe() {
  const data = await fetchJson(`${MEALDB_BASE_URL}/random.php`, "TheMealDB");
  const meals = getMeals(data);
  if (meals.length === 0) {
    throw new ApiError("No random recipe was returned. Please try again.");
  }
  return normalizeMealDBRecipe(meals[0]);
}

/**
 * Get recipes in one TheMealDB category (e.g. "Dessert").
 * @param {string} category
 * @returns {Promise<object[]>} Normalized recipes (basic info only).
 */
export async function getMealDBByCategory(category) {
  const data = await fetchJson(`${MEALDB_BASE_URL}/filter.php?c=${encodeURIComponent(category)}`, "TheMealDB");
  return getMeals(data).map((meal) => normalizeMealDBRecipe(meal, { category }));
}

/* ==========================================================
   SPOONACULAR
   ========================================================== */

/**
 * @returns {boolean} true once a real key has replaced the placeholder.
 */
export function isSpoonacularConfigured() {
  return SPOONACULAR_API_KEY !== "" && SPOONACULAR_API_KEY !== "YOUR_SPOONACULAR_API_KEY_HERE";
}

/**
 * Throw a helpful error when no key is set.
 */
function requireSpoonacularKey() {
  if (!isSpoonacularConfigured()) {
    throw new ApiError("Spoonacular is not set up yet. Add your API key in js/api.js.");
  }
}

/**
 * Search Spoonacular. Full recipe info is requested so no second request is needed.
 * @param {string} [query] Meal name or ingredient. Can be empty if a type is given.
 * @param {{type?: string}} [options] Spoonacular dish type, e.g. "dessert".
 * @returns {Promise<object[]>} Normalized recipes.
 */
export async function searchSpoonacular(query = "", { type = "" } = {}) {
  requireSpoonacularKey();

  const params = new URLSearchParams({
    number: String(SPOONACULAR_RESULT_COUNT),
    addRecipeInformation: "true",
    fillIngredients: "true",
    apiKey: SPOONACULAR_API_KEY,
  });
  if (query) {
    params.set("query", query);
  }
  if (type) {
    params.set("type", type);
  }

  const data = await fetchJson(`${SPOONACULAR_BASE_URL}/recipes/complexSearch?${params}`, "Spoonacular");
  if (!data || !Array.isArray(data.results)) {
    throw new ApiError("Spoonacular sent a response the app could not read.");
  }
  return data.results.map((recipe) => normalizeSpoonacularRecipe(recipe));
}

/**
 * Get one full recipe from Spoonacular.
 * @param {string} id
 * @returns {Promise<object>} Normalized recipe.
 */
export async function getSpoonacularRecipeById(id) {
  requireSpoonacularKey();

  const params = new URLSearchParams({ includeNutrition: "false", apiKey: SPOONACULAR_API_KEY });
  const data = await fetchJson(
    `${SPOONACULAR_BASE_URL}/recipes/${encodeURIComponent(id)}/information?${params}`,
    "Spoonacular"
  );
  if (!data || data.id === undefined) {
    throw new ApiError("That recipe could not be found.");
  }
  return normalizeSpoonacularRecipe(data);
}

/* ==========================================================
   COMBINED FUNCTIONS USED BY THE PAGES
   ========================================================== */

/**
 * Run several sources at once. One failing source only produces a warning,
 * unless every source failed — then the first error is thrown.
 * @param {Array<{label: string, run: () => Promise<object[]>}>} sources
 * @returns {Promise<{recipes: object[], warnings: string[]}>}
 */
async function collectFromSources(sources) {
  const results = await Promise.allSettled(sources.map((source) => source.run()));

  const recipes = [];
  const seenKeys = new Set();
  const warnings = new Set();
  let firstError = null;
  let succeeded = 0;

  results.forEach((result) => {
    if (result.status === "rejected") {
      firstError = firstError || result.reason;
      warnings.add(result.reason instanceof ApiError ? result.reason.message : "One recipe source failed.");
      return;
    }
    succeeded += 1;
    result.value.forEach((recipe) => {
      const key = `${recipe.sourceApi}-${recipe.id}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        recipes.push(recipe);
      }
    });
  });

  if (succeeded === 0 && firstError) {
    throw firstError;
  }

  return { recipes: recipes.slice(0, MAX_RESULTS), warnings: [...warnings] };
}

/**
 * Search both APIs by meal name or ingredient.
 * @param {string} query
 * @param {{useSpoonacular?: boolean}} [options]
 * @returns {Promise<{recipes: object[], warnings: string[]}>}
 */
export function searchRecipes(query, { useSpoonacular = true } = {}) {
  const sources = [
    { label: "TheMealDB name", run: () => searchMealDB(query) },
    { label: "TheMealDB ingredient", run: () => searchMealDBByIngredient(query) },
  ];

  if (useSpoonacular && isSpoonacularConfigured()) {
    sources.push({ label: "Spoonacular", run: () => searchSpoonacular(query) });
  }

  return collectFromSources(sources);
}

/**
 * Get recipes for one of the category buttons (Breakfast, Lunch, Dinner, Dessert).
 * @param {string} categoryName
 * @returns {Promise<{recipes: object[], warnings: string[]}>}
 */
export function getRecipesByCategory(categoryName) {
  const mapping = CATEGORY_MAP[categoryName];
  if (!mapping) {
    return Promise.resolve({ recipes: [], warnings: [] });
  }

  const sources = mapping.mealdb.map((category) => ({
    label: `TheMealDB ${category}`,
    run: async () => {
      const recipes = await getMealDBByCategory(category);
      // Show the button name the user clicked (e.g. "Dinner") on the card.
      return recipes.slice(0, 12).map((recipe) => ({ ...recipe, category: categoryName }));
    },
  }));

  if (isSpoonacularConfigured()) {
    sources.push({
      label: "Spoonacular",
      run: () => searchSpoonacular("", { type: mapping.spoonacular }),
    });
  }

  return collectFromSources(sources);
}

/**
 * Get one random recipe.
 * @returns {Promise<{recipes: object[], warnings: string[]}>}
 */
export async function getRandomRecipe() {
  const recipe = await getRandomMealDBRecipe();
  return { recipes: [recipe], warnings: [] };
}

/**
 * Load one full recipe from whichever API it came from.
 * @param {string} id
 * @param {string} source "mealdb" or "spoonacular"
 * @returns {Promise<object>} Normalized recipe.
 */
export function getRecipeById(id, source) {
  if (source === "spoonacular") {
    return getSpoonacularRecipeById(id);
  }
  return getMealDBRecipeById(id);
}
