/**
 * utils.js — reusable helper functions for Simple Recipe Finder.
 *
 * Contains:
 *  1. URL helpers
 *  2. LocalStorage favorites helpers
 *  3. Data normalization (TheMealDB + Spoonacular -> one recipe format)
 *  4. DOM / UI helpers (loading, errors, recipe cards, lists)
 *
 * Normalized recipe object used everywhere in the app:
 * {
 *   id, name, image, category, cuisine, summary, cookingTime,
 *   servings, ingredients: [{ name, measure }], instructions: [string],
 *   source, sourceApi: "mealdb" | "spoonacular"
 * }
 */

const FAVORITES_KEY = "recipe-favorites";

export const NOT_AVAILABLE = "Not available";
export const NO_RECIPE_INFO = "Recipe information not available.";
export const FALLBACK_IMAGE = "images/placeholder.svg";

/**
 * Error type used for friendly, user-facing API messages.
 */
export class ApiError extends Error {
  /**
   * @param {string} message Friendly message shown to the user.
   * @param {number} [status] Optional HTTP status code.
   */
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Turn any thrown value into a message that is safe to show to a user.
 * @param {unknown} error
 * @returns {string}
 */
export function getErrorMessage(error) {
  if (error instanceof ApiError) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

/* ==========================================================
   1. URL HELPERS
   ========================================================== */

/**
 * Read one query-string parameter, e.g. recipe.html?id=123
 * @param {string} name
 * @param {string} [search] Defaults to the current page's query string.
 * @returns {string|null}
 */
export function getUrlParam(name, search = window.location.search) {
  return new URLSearchParams(search).get(name);
}

/**
 * Build the link to the details page for a recipe.
 * @param {{id: string, sourceApi: string}} recipe
 * @returns {string}
 */
export function getRecipePageUrl(recipe) {
  const params = new URLSearchParams({ id: recipe.id, source: recipe.sourceApi });
  return `recipe.html?${params.toString()}`;
}

/**
 * Only allow http(s) links so a bad API value can never become a javascript: link.
 * @param {string} value
 * @returns {boolean}
 */
export function isSafeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/* ==========================================================
   2. FAVORITES (LocalStorage)
   ========================================================== */

/**
 * A saved favorite must at least have an id, name and source API.
 * @param {unknown} item
 * @returns {boolean}
 */
function isValidRecipe(item) {
  return (
    item !== null &&
    typeof item === "object" &&
    typeof item.id === "string" &&
    item.id !== "" &&
    typeof item.name === "string" &&
    typeof item.sourceApi === "string"
  );
}

/**
 * Read favorites from LocalStorage. Invalid or corrupted data returns [].
 * @returns {Array<object>}
 */
export function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidRecipe) : [];
  } catch {
    return [];
  }
}

/**
 * Write the favorites list to LocalStorage.
 * @param {Array<object>} favorites
 * @returns {boolean} true if it was saved.
 */
export function saveFavorites(favorites) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} id
 * @param {string} sourceApi
 * @returns {boolean}
 */
export function isFavorite(id, sourceApi) {
  return getFavorites().some((item) => item.id === id && item.sourceApi === sourceApi);
}

/**
 * Save a recipe (duplicates are ignored).
 * @param {object} recipe Normalized recipe.
 * @returns {boolean} true if the recipe is now saved.
 */
export function addFavorite(recipe) {
  if (isFavorite(recipe.id, recipe.sourceApi)) {
    return true;
  }
  return saveFavorites([...getFavorites(), recipe]);
}

/**
 * @param {string} id
 * @param {string} sourceApi
 * @returns {boolean} true if the change was saved.
 */
export function removeFavorite(id, sourceApi) {
  const remaining = getFavorites().filter(
    (item) => !(item.id === id && item.sourceApi === sourceApi)
  );
  return saveFavorites(remaining);
}

/**
 * Add the recipe if it is not saved, otherwise remove it.
 * @param {object} recipe
 * @returns {boolean} true if the recipe is a favorite after the toggle.
 */
export function toggleFavorite(recipe) {
  if (isFavorite(recipe.id, recipe.sourceApi)) {
    removeFavorite(recipe.id, recipe.sourceApi);
  } else {
    addFavorite(recipe);
  }
  return isFavorite(recipe.id, recipe.sourceApi);
}

/* ==========================================================
   3. NORMALIZATION
   ========================================================== */

/**
 * @param {unknown} value
 * @returns {string} Trimmed string, or "" if the value is not a string.
 */
function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Capitalize the first letter of a string.
 * @param {string} text
 * @returns {string}
 */
function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

/**
 * Remove HTML tags (Spoonacular summaries contain HTML).
 * @param {string} html
 * @returns {string}
 */
export function stripHtml(html) {
  if (typeof html !== "string" || !html) {
    return "";
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
}

/**
 * Shorten long text without cutting a word in half.
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncateText(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }
  const cut = text.slice(0, maxLength);
  return `${cut.slice(0, cut.lastIndexOf(" ")).trim()}…`;
}

/**
 * TheMealDB gives instructions as one long string. Break it into steps.
 * @param {string} text
 * @returns {string[]}
 */
export function splitInstructions(text) {
  if (typeof text !== "string" || !text.trim()) {
    return [];
  }

  let steps = text
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    // drop lines that only say "STEP 1" or "1"
    .filter((line) => !/^step\s*\d+\s*[:.)-]?$/i.test(line) && !/^\d+\s*[.)]?$/.test(line))
    // drop "Step 1:" or "1. " at the start of a line
    .map((line) => line.replace(/^(step\s*\d+\s*[:.)-]?\s*|\d+\s*[.)]\s+)/i, ""));

  // One big paragraph? Split it into sentences so it reads like steps.
  if (steps.length === 1 && steps[0].length > 250) {
    steps = steps[0].split(/(?<=[.!?])\s+(?=[A-Z])/);
  }

  return steps.filter(Boolean);
}

/**
 * Convert a TheMealDB meal into the app's recipe format.
 * @param {object} meal Raw TheMealDB meal.
 * @param {{category?: string}} [overrides] Used by category lists, which don't include a category.
 * @returns {object} Normalized recipe.
 */
export function normalizeMealDBRecipe(meal, overrides = {}) {
  const ingredients = [];

  // TheMealDB stores ingredients as strIngredient1..20 and strMeasure1..20.
  for (let index = 1; index <= 20; index += 1) {
    const name = cleanText(meal[`strIngredient${index}`]);
    const measure = cleanText(meal[`strMeasure${index}`]);
    if (name) {
      ingredients.push({ name, measure });
    }
  }

  const category = overrides.category || cleanText(meal.strCategory) || NOT_AVAILABLE;
  const cuisine = cleanText(meal.strArea) || NOT_AVAILABLE;
  const hasDetails = category !== NOT_AVAILABLE && cuisine !== NOT_AVAILABLE;

  return {
    id: String(meal.idMeal),
    name: cleanText(meal.strMeal) || "Untitled recipe",
    image: cleanText(meal.strMealThumb) || FALLBACK_IMAGE,
    category,
    cuisine,
    summary: hasDetails ? `A ${cuisine} ${category.toLowerCase()} recipe.` : NO_RECIPE_INFO,
    cookingTime: NOT_AVAILABLE, // TheMealDB does not provide cooking time
    servings: NOT_AVAILABLE, // TheMealDB does not provide servings
    ingredients,
    instructions: splitInstructions(meal.strInstructions),
    source: cleanText(meal.strSource) || cleanText(meal.strYoutube),
    sourceApi: "mealdb",
  };
}

/**
 * Convert a Spoonacular recipe into the app's recipe format.
 * @param {object} recipe Raw Spoonacular recipe (from complexSearch or /information).
 * @returns {object} Normalized recipe.
 */
export function normalizeSpoonacularRecipe(recipe) {
  const rawIngredients = Array.isArray(recipe.extendedIngredients) ? recipe.extendedIngredients : [];

  const ingredients = rawIngredients
    .map((item) => {
      const amount = typeof item.amount === "number" ? Math.round(item.amount * 100) / 100 : "";
      const measure = `${amount} ${cleanText(item.unit)}`.trim();
      return { name: capitalize(cleanText(item.name)), measure };
    })
    .filter((item) => item.name);

  // Prefer the numbered steps; fall back to the plain instructions text.
  let instructions = [];
  if (Array.isArray(recipe.analyzedInstructions)) {
    instructions = recipe.analyzedInstructions
      .flatMap((group) => (Array.isArray(group.steps) ? group.steps : []))
      .map((step) => cleanText(step.step))
      .filter(Boolean);
  }
  if (instructions.length === 0) {
    instructions = splitInstructions(stripHtml(recipe.instructions));
  }

  const dishType = Array.isArray(recipe.dishTypes) ? cleanText(recipe.dishTypes[0]) : "";
  const cuisine = Array.isArray(recipe.cuisines) ? cleanText(recipe.cuisines[0]) : "";
  const summary = stripHtml(recipe.summary);

  return {
    id: String(recipe.id),
    name: cleanText(recipe.title) || "Untitled recipe",
    image: cleanText(recipe.image) || FALLBACK_IMAGE,
    category: capitalize(dishType) || NOT_AVAILABLE,
    cuisine: cuisine || NOT_AVAILABLE,
    summary: summary ? truncateText(summary, 320) : NO_RECIPE_INFO,
    cookingTime: recipe.readyInMinutes ? `${recipe.readyInMinutes} minutes` : NOT_AVAILABLE,
    servings: recipe.servings ? String(recipe.servings) : NOT_AVAILABLE,
    ingredients,
    instructions,
    source: cleanText(recipe.sourceUrl) || cleanText(recipe.spoonacularSourceUrl),
    sourceApi: "spoonacular",
  };
}

/* ==========================================================
   4. DOM / UI HELPERS
   ========================================================== */

/**
 * Create an element. Text is set with textContent, so API data can never inject HTML.
 * @param {string} tag
 * @param {{className?: string, text?: string, attrs?: Record<string, string>}} [options]
 * @returns {HTMLElement}
 */
export function createElement(tag, { className, text, attrs } = {}) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  if (attrs) {
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  }
  return element;
}

/**
 * Show a loading element (spinner + text).
 * @param {HTMLElement} element
 */
export function showLoading(element) {
  element.hidden = false;
}

/**
 * @param {HTMLElement} element
 */
export function hideLoading(element) {
  element.hidden = true;
}

/**
 * Show an error message with an optional "Try again" button.
 * @param {HTMLElement} container
 * @param {string} message
 * @param {() => void} [onRetry]
 */
export function showError(container, message, onRetry) {
  container.replaceChildren(createElement("p", { className: "message__text", text: message }));

  if (onRetry) {
    const retryButton = createElement("button", {
      className: "btn btn--primary",
      text: "Try again",
      attrs: { type: "button" },
    });
    retryButton.addEventListener("click", onRetry);
    container.append(retryButton);
  }

  container.hidden = false;
}

/**
 * @param {HTMLElement} container
 */
export function hideError(container) {
  container.hidden = true;
  container.replaceChildren();
}

/**
 * Use a local placeholder if the image is missing or fails to load.
 * @param {HTMLImageElement} image
 * @param {string} source
 * @param {string} altText
 */
export function setImageWithFallback(image, source, altText) {
  image.alt = altText;
  image.addEventListener(
    "error",
    () => {
      if (!image.src.endsWith(FALLBACK_IMAGE)) {
        image.src = FALLBACK_IMAGE;
      }
    },
    { once: true }
  );
  image.src = source || FALLBACK_IMAGE;
}

/**
 * Build the ingredient list: "Chicken — 500g".
 * @param {Array<{name: string, measure: string}>} ingredients
 * @returns {HTMLElement}
 */
export function createIngredientList(ingredients) {
  if (!ingredients || ingredients.length === 0) {
    return createElement("p", { className: "empty-note", text: "Ingredients not available." });
  }

  const list = createElement("ul", { className: "ingredient-list" });
  ingredients.forEach((item) => {
    const text = item.measure ? `${item.name} — ${item.measure}` : item.name;
    list.append(createElement("li", { text }));
  });
  return list;
}

/**
 * Build the numbered cooking instructions.
 * @param {string[]} instructions
 * @returns {HTMLElement}
 */
export function createInstructionList(instructions) {
  if (!instructions || instructions.length === 0) {
    return createElement("p", { className: "empty-note", text: "Instructions not available." });
  }

  const list = createElement("ol", { className: "instruction-list" });
  instructions.forEach((step) => list.append(createElement("li", { text: step })));
  return list;
}

/**
 * Create the favorite (heart) button for a recipe.
 * @param {object} recipe Normalized recipe.
 * @param {{withLabel?: boolean, onChange?: (isSaved: boolean) => void}} [options]
 * @returns {HTMLButtonElement}
 */
export function createFavoriteButton(recipe, { withLabel = false, onChange } = {}) {
  const button = createElement("button", {
    className: withLabel ? "btn btn--favorite" : "icon-btn",
    attrs: { type: "button" },
  });

  if (!withLabel) {
    button.setAttribute("aria-label", `Save ${recipe.name} to favorites`);
  }

  const render = () => {
    const saved = isFavorite(recipe.id, recipe.sourceApi);
    button.setAttribute("aria-pressed", String(saved));
    button.classList.toggle("is-active", saved);
    if (withLabel) {
      button.textContent = saved ? "♥ Saved" : "♡ Favorite";
    } else {
      button.textContent = saved ? "♥" : "♡";
    }
  };

  button.addEventListener("click", () => {
    const saved = toggleFavorite(recipe);
    render();
    if (onChange) {
      onChange(saved);
    }
  });

  render();
  return button;
}

/**
 * Create one recipe card (image, name, category, View Recipe, Favorite).
 * @param {object} recipe Normalized recipe.
 * @param {{index?: number, onFavoriteChange?: (isSaved: boolean) => void}} [options]
 * @returns {HTMLElement}
 */
export function createRecipeCard(recipe, { index = 0, onFavoriteChange } = {}) {
  const card = createElement("article", { className: "recipe-card" });
  // CSS uses --card-index to stagger the entrance animation.
  card.style.setProperty("--card-index", String(Math.min(index, 12)));

  const imageWrap = createElement("div", { className: "recipe-card__image-wrap" });
  const image = createElement("img", {
    className: "recipe-card__image",
    attrs: { loading: "lazy", width: "400", height: "300" },
  });
  setImageWithFallback(image, recipe.image, `Photo of ${recipe.name}`);
  imageWrap.append(image);

  const body = createElement("div", { className: "recipe-card__body" });
  const title = createElement("h3", { className: "recipe-card__title", text: recipe.name });

  const meta = createElement("p", { className: "recipe-card__meta" });
  meta.append(createElement("span", { className: "tag", text: recipe.category }));
  if (recipe.cuisine !== NOT_AVAILABLE) {
    meta.append(createElement("span", { className: "recipe-card__cuisine", text: recipe.cuisine }));
  }
  const sourceLabel = recipe.sourceApi === "spoonacular" ? "Spoonacular" : "TheMealDB";
  const sourceNote = createElement("p", { className: "recipe-card__source", text: `via ${sourceLabel}` });

  const actions = createElement("div", { className: "recipe-card__actions" });
  const viewLink = createElement("a", {
    className: "btn btn--primary",
    text: "View Recipe",
    attrs: { href: getRecipePageUrl(recipe), "aria-label": `View recipe: ${recipe.name}` },
  });
  actions.append(viewLink, createFavoriteButton(recipe, { onChange: onFavoriteChange }));

  body.append(title, meta, sourceNote, actions);
  card.append(imageWrap, body);
  return card;
}
