/**
 * favorites.js — favorites page (favorites.html).
 * Shows recipes saved in LocalStorage and lets the user remove them.
 */

import { createRecipeCard, getFavorites } from "./utils.js";

const favoritesGrid = document.querySelector("#favorites-grid");
const emptyState = document.querySelector("#favorites-empty");
const countElement = document.querySelector("#favorites-count");

/**
 * Draw the saved recipes, or the empty state if there are none.
 */
function renderFavorites() {
  const favorites = getFavorites();

  favoritesGrid.replaceChildren();
  emptyState.hidden = favorites.length > 0;
  countElement.textContent =
    favorites.length === 1 ? "1 saved recipe" : `${favorites.length} saved recipes`;
  countElement.hidden = favorites.length === 0;

  favorites.forEach((recipe, index) => {
    // When a heart is un-clicked here, the recipe is removed, so redraw the list.
    const card = createRecipeCard(recipe, {
      index,
      onFavoriteChange: (isSaved) => {
        if (!isSaved) {
          renderFavorites();
        }
      },
    });
    favoritesGrid.append(card);
  });
}

renderFavorites();
