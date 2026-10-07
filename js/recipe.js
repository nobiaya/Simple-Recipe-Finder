/**
 * recipe.js — recipe details page (recipe.html).
 * Reads ?id=...&source=... from the URL, loads the recipe and displays it.
 */

import { getRecipeById } from "./api.js";
import {
  createFavoriteButton,
  createIngredientList,
  createInstructionList,
  getErrorMessage,
  getUrlParam,
  hideError,
  hideLoading,
  isSafeUrl,
  setImageWithFallback,
  showError,
  showLoading,
} from "./utils.js";

const loadingBox = document.querySelector("#loading");
const errorBox = document.querySelector("#error");
const content = document.querySelector("#recipe-content");

const imageElement = document.querySelector("#recipe-image");
const nameElement = document.querySelector("#recipe-name");
const categoryElement = document.querySelector("#recipe-category");
const cuisineElement = document.querySelector("#recipe-cuisine");
const timeElement = document.querySelector("#recipe-time");
const servingsElement = document.querySelector("#recipe-servings");
const summaryElement = document.querySelector("#recipe-summary");
const favoriteSlot = document.querySelector("#favorite-slot");
const ingredientsSlot = document.querySelector("#ingredients-slot");
const instructionsSlot = document.querySelector("#instructions-slot");
const sourceElement = document.querySelector("#recipe-source");

/**
 * Fill the page with one normalized recipe.
 * @param {object} recipe
 */
function displayRecipe(recipe) {
  document.title = `${recipe.name} | Simple Recipe Finder`;

  setImageWithFallback(imageElement, recipe.image, `Photo of ${recipe.name}`);
  nameElement.textContent = recipe.name;
  categoryElement.textContent = recipe.category;
  cuisineElement.textContent = recipe.cuisine;
  timeElement.textContent = recipe.cookingTime;
  servingsElement.textContent = recipe.servings;
  summaryElement.textContent = recipe.summary;

  favoriteSlot.replaceChildren(createFavoriteButton(recipe, { withLabel: true }));
  ingredientsSlot.replaceChildren(createIngredientList(recipe.ingredients));
  instructionsSlot.replaceChildren(createInstructionList(recipe.instructions));

  const apiName = recipe.sourceApi === "spoonacular" ? "Spoonacular" : "TheMealDB";
  sourceElement.replaceChildren(document.createTextNode(`Recipe data from ${apiName}.`));

  if (recipe.source && isSafeUrl(recipe.source)) {
    const link = document.createElement("a");
    link.href = recipe.source;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View original source";
    sourceElement.append(" ", link);
  }

  content.hidden = false;
}

/**
 * Validate the URL, request the recipe, and show it (or an error).
 */
async function loadRecipe() {
  const id = getUrlParam("id");
  const source = getUrlParam("source") === "spoonacular" ? "spoonacular" : "mealdb";

  if (!id || !id.trim()) {
    hideLoading(loadingBox);
    showError(errorBox, "No recipe was selected. Go back and choose a recipe.");
    return;
  }

  hideError(errorBox);
  content.hidden = true;
  showLoading(loadingBox);

  try {
    const recipe = await getRecipeById(id.trim(), source);
    displayRecipe(recipe);
  } catch (error) {
    showError(errorBox, getErrorMessage(error), loadRecipe);
  } finally {
    hideLoading(loadingBox);
  }
}

loadRecipe();
