# Simple Recipe Finder

This is my final project for WDD 330 (Web Frontend Development II). It's a small recipe website where you can search for a meal or an ingredient, look at the ingredients and steps, and save the recipes you like so you can find them again later.

It's built with plain HTML, CSS and JavaScript. No frameworks. The recipe data comes from two APIs: TheMealDB (the main one) and Spoonacular (the second one).

## What it does

- Search by meal name or ingredient (try "chicken" or "rice")
- Browse by Breakfast, Lunch, Dinner or Dessert
- Get a random recipe when you can't decide what to cook
- Open a recipe to see the photo, ingredients with amounts, and step-by-step instructions
- Save favorites in the browser (LocalStorage) and see them on the Favorites page
- Works on phone, tablet and desktop
- Shows a loading spinner, a friendly error message if something fails, and a message when nothing is found

## Files

```
simple-recipe-finder/
  index.html         home page (search, categories, results)
  recipe.html        recipe details page
  favorites.html     saved recipes
  css/style.css      all the styling
  js/main.js         home page logic
  js/recipe.js       details page logic
  js/favorites.js    favorites page logic
  js/api.js          the API requests
  js/utils.js        helper functions (favorites, cleaning up API data, building cards)
  data/sample-recipes.json   sample data for testing, the app doesn't load it
  images/            logo and a placeholder image
```

## How the pages follow my wireframes

**Home page:** the header, hero with the search box, category buttons, results grid and footer are in the same order as my wireframe. `main.js` handles the search form, the category buttons and the Random Recipe button, and builds the recipe cards. The cards use CSS Grid: 1 column on phones, 2 on tablets, 3 on desktop and 4 on wide screens.

**Details page:** the back link, big image next to the recipe info, ingredients list and instructions list follow the second wireframe. `recipe.js` reads the recipe id from the URL (for example `recipe.html?id=52772&source=mealdb`) and fills in the page.

## Using two APIs

TheMealDB and Spoonacular send back their data in different shapes. TheMealDB, for example, has `strIngredient1`, `strIngredient2` and so on, while Spoonacular has a list of ingredient objects. To keep the rest of the code simple, `utils.js` has two functions (`normalizeMealDBRecipe` and `normalizeSpoonacularRecipe`) that turn both into the same recipe object. If a recipe is missing something, like cooking time on TheMealDB, the page shows "Not available" instead of breaking.

TheMealDB doesn't have Lunch or Dinner categories, so those two buttons use nearby categories (Pasta and Vegetarian for Lunch, Beef and Chicken for Dinner). You can change that in `CATEGORY_MAP` in `api.js`.

## Adding your Spoonacular key

1. Make a free account at https://spoonacular.com/food-api and copy your API key.
2. Open `js/api.js` and replace `YOUR_SPOONACULAR_API_KEY_HERE` with your key.

If you leave it as is, the site still works, it just only uses TheMealDB.

One thing to know: because this is a frontend-only project, the key sits in the JavaScript and anyone can see it in the browser's dev tools. So only use a free key, and don't put a real key in a public GitHub repo.

## Running it

You can't just double-click `index.html`, because the JavaScript uses modules and browsers block those on `file://`. Use a local server instead:

1. Open the project folder in VS Code.
2. Install the Live Server extension.
3. Right-click `index.html` and pick "Open with Live Server".

## Things I tested

- Searching for a meal and for an ingredient
- Searching with an empty box and with something that has no results
- Each category button, and clicking the selected one again to clear it
- Random recipe
- Opening a recipe and checking the ingredients and steps
- Saving and removing favorites, then refreshing the page
- Putting broken text in LocalStorage to make sure the site doesn't crash
- Turning on "Offline" in dev tools to see the error message and the Try again button
- Opening `recipe.html` with no id
- Phone, tablet and desktop widths
- Tabbing through the page with the keyboard
- Running `npx eslint js` (no errors)

## Checklist against my proposal

| Proposal item | Done | Where |
|---|---|---|
| Search by name or ingredient | Yes | `main.js`, `api.js` |
| Result cards with image, name, category | Yes | `createRecipeCard` in `utils.js` |
| Recipe details page | Yes | `recipe.html`, `recipe.js` |
| Ingredients and measurements | Yes | `createIngredientList` |
| Cooking instructions | Yes | `createInstructionList` |
| Category filtering | Yes | `main.js`, `CATEGORY_MAP` in `api.js` |
| Random recipe | Yes | `main.js`, `api.js` |
| Favorites with LocalStorage | Yes | `utils.js`, `favorites.js` |
| Responsive layout | Yes | bottom of `style.css` |
| Loading, error and empty states | Yes | `utils.js`, `index.html` |
| TheMealDB and Spoonacular | Yes (Spoonacular needs a key) | `api.js` |
| One format for both APIs | Yes | `utils.js` |
| Colors and fonts from the proposal | Yes | top of `style.css` |
| CSS animations | Yes | card fade-in, spinner, hover effects |
| Sample JSON file | Yes | `data/sample-recipes.json` |
