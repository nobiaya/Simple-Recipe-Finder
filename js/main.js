/**
 * main.js — home page (index.html).
 * Sets up the search form, category buttons, random recipe button,
 * and displays the recipe results.
 */

import { getRandomRecipe, getRecipesByCategory, searchRecipes } from "./api.js";
import {
  createRecipeCard,
  getErrorMessage,
  hideError,
  hideLoading,
  showError,
  showLoading,
} from "./utils.js";

const DEFAULT_SEARCH = "chicken";

const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const formMessage = document.querySelector("#form-message");
const categoryList = document.querySelector("#category-list");
const randomButton = document.querySelector("#random-button");
const resultsSummary = document.querySelector("#results-summary");
const noticeBox = document.querySelector("#notice");
const loadingBox = document.querySelector("#loading");
const errorBox = document.querySelector("#error");
const emptyState = document.querySelector("#empty-state");
const resultsGrid = document.querySelector("#results-grid");

// Ignore slow responses from older requests (e.g. user clicks two categories quickly).
let latestRequestId = 0;

/**
 * Highlight one category button (or none).
 * @param {string|null} categoryName
 */
function setActiveCategory(categoryName) {
  categoryList.querySelectorAll("button").forEach((button) => {
    const isActive = button.dataset.category === categoryName;
    button.setAttribute("aria-pressed", String(isActive));
    button.classList.toggle("is-active", isActive);
  });
}

/**
 * Put the cards on the page, or show the empty state.
 * @param {object[]} recipes Normalized recipes.
 */
function displayRecipes(recipes) {
  resultsGrid.replaceChildren();
  recipes.forEach((recipe, index) => {
    resultsGrid.append(createRecipeCard(recipe, { index }));
  });
  emptyState.hidden = recipes.length > 0;
}

/**
 * Run a request and show loading, results, warnings or errors.
 * @param {() => Promise<{recipes: object[], warnings: string[]}>} fetchRecipes
 * @param {string} title Short description shown above the cards.
 */
async function loadRecipes(fetchRecipes, title) {
  latestRequestId += 1;
  const requestId = latestRequestId;

  resultsGrid.replaceChildren();
  resultsSummary.textContent = "";
  noticeBox.hidden = true;
  emptyState.hidden = true;
  hideError(errorBox);
  showLoading(loadingBox);

  try {
    const { recipes, warnings } = await fetchRecipes();
    if (requestId !== latestRequestId) {
      return;
    }

    displayRecipes(recipes);
    resultsSummary.textContent = recipes.length > 0 ? `${title} — ${recipes.length} found` : title;

    if (warnings.length > 0) {
      noticeBox.textContent = warnings.join(" ");
      noticeBox.hidden = false;
    }
  } catch (error) {
    if (requestId !== latestRequestId) {
      return;
    }
    showError(errorBox, getErrorMessage(error), () => loadRecipes(fetchRecipes, title));
  } finally {
    if (requestId === latestRequestId) {
      hideLoading(loadingBox);
    }
  }
}

/**
 * Search form submit handler.
 * @param {SubmitEvent} event
 */
function handleSearch(event) {
  event.preventDefault();
  const query = searchInput.value.trim();

  if (!query) {
    formMessage.textContent = "Please enter a recipe name or ingredient.";
    formMessage.hidden = false;
    searchInput.setAttribute("aria-invalid", "true");
    searchInput.focus();
    return;
  }

  formMessage.hidden = true;
  searchInput.removeAttribute("aria-invalid");
  setActiveCategory(null);
  loadRecipes(() => searchRecipes(query), `Results for “${query}”`);
}

/**
 * Category button click handler (event delegation).
 * @param {MouseEvent} event
 */
function handleCategoryClick(event) {
  const button = event.target.closest("button[data-category]");
  if (!button) {
    return;
  }

  const categoryName = button.dataset.category;

  // Clicking the selected category again clears the filter.
  if (button.classList.contains("is-active")) {
    setActiveCategory(null);
    loadRecipes(() => searchRecipes(DEFAULT_SEARCH, { useSpoonacular: false }), "Popular recipes");
    return;
  }

  setActiveCategory(categoryName);
  searchInput.value = "";
  loadRecipes(() => getRecipesByCategory(categoryName), `${categoryName} recipes`);
}

/**
 * Random recipe button handler.
 */
function handleRandom() {
  setActiveCategory(null);
  loadRecipes(getRandomRecipe, "Random recipe");
}

searchForm.addEventListener("submit", handleSearch);
categoryList.addEventListener("click", handleCategoryClick);
randomButton.addEventListener("click", handleRandom);
searchInput.addEventListener("input", () => {
  formMessage.hidden = true;
  searchInput.removeAttribute("aria-invalid");
});

// First visit: show some popular recipes (TheMealDB only, to save Spoonacular quota).
loadRecipes(() => searchRecipes(DEFAULT_SEARCH, { useSpoonacular: false }), "Popular recipes");
