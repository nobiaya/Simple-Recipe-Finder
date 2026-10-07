# Simple Recipe Finder — WDD 330 Final Project

Vanilla HTML5 / CSS3 / JavaScript (ES modules) app using **TheMealDB** (primary) and **Spoonacular** (secondary).

## Project structure
```
simple-recipe-finder/
├── index.html  recipe.html  favorites.html
├── css/style.css
├── js/  main.js  recipe.js  favorites.js  api.js  utils.js
├── data/sample-recipes.json      (test/dev data only, not loaded by the app)
├── images/  logo.svg  placeholder.svg
└── eslint.config.js              (optional, for ESLint)
```

## Wireframe → code mapping
**Home page (index.html)**
| Wireframe section | HTML | JavaScript (main.js) | CSS |
|---|---|---|---|
| Header: logo, Home, Favorites | `header.site-header` + `nav` | none | `.site-header`, `.nav-list` |
| Hero: Find Your Recipe + search | `section.hero`, `form#search-form` | `handleSearch()` validates, shows loading, calls `searchRecipes()` | `.hero`, `.search-form` |
| Browse Categories | `#category-list` buttons (`data-category`) | `handleCategoryClick()` → `getRecipesByCategory()` | `.chip`, `.chip.is-active` |
| Recipes + Random Recipe | `.results-header`, `#random-button` | `handleRandom()` → `getRandomRecipe()` | `.results-header`, `.btn--outline` |
| Recipe cards grid | `#results-grid` | `displayRecipes()` + `createRecipeCard()` (utils.js) | `.recipe-grid` (1/2/3/4 columns), `.recipe-card` |
| Loading / error / empty | `#loading`, `#error`, `#empty-state` | `showLoading()`, `showError()` | `.spinner`, `.message`, `.empty-state` |
| Footer | `footer.site-footer` | none | `.site-footer` |

**Recipe details (recipe.html)**
| Wireframe section | HTML | JavaScript (recipe.js) | CSS |
|---|---|---|---|
| Header: ← Back, Recipe Finder, Favorites | `header` with `.back-link` | none | `.back-link`, `.brand--center` |
| Large image + name/category/time/servings/Favorite | `.detail-top` | `displayRecipe()`, `createFavoriteButton()` | `.detail-top` (2 columns ≥768px) |
| Ingredients | `#ingredients-slot` | `createIngredientList()` | `.ingredient-list` (✓ via `::before`) |
| Cooking instructions | `#instructions-slot` | `createInstructionList()` | `.instruction-list` (numbered) |
| ← Back to Recipes (bottom) | `a.back-button` | none | `.btn--outline` |

## API setup (Spoonacular key)
1. Create a free account at https://spoonacular.com/food-api and copy your API key.
2. Open `js/api.js` and replace `YOUR_SPOONACULAR_API_KEY_HERE` in `SPOONACULAR_API_KEY`.
3. Without a key the app still works using TheMealDB only (Spoonacular is skipped).

**Limitation:** a key in frontend JavaScript is visible to anyone using DevTools. Use only a free/development key, don't commit it to a public repo, and rotate it if exposed. A real production app would call Spoonacular through a server.
Spoonacular is used for: typed searches, category buttons (when a key is set), and detail pages of Spoonacular recipes. The first page load and Random Recipe use TheMealDB only to save your daily quota.
TheMealDB "Lunch" and "Dinner" don't exist as categories, so they map to related categories (see `CATEGORY_MAP` in api.js).

## How to run (VS Code)
1. Open the `simple-recipe-finder` folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html` → **Open with Live Server**. (ES modules need a server; double-clicking the file will not work.)

## Testing checklist
- [ ] Search: "chicken", "pasta", a name and an ingredient return cards
- [ ] Empty search shows "Please enter a recipe name or ingredient."
- [ ] Nonsense search ("zzzzqq") shows "No recipes found. Try another search."
- [ ] Category: Breakfast, Lunch, Dinner, Dessert load; clicking the active one clears it
- [ ] Random Recipe shows one card
- [ ] View Recipe opens `recipe.html?id=…&source=…`
- [ ] Ingredients show as "Name — amount" with no empty rows
- [ ] Instructions are numbered steps
- [ ] Favorite: save, refresh, appears on Favorites page; remove works; no duplicates
- [ ] LocalStorage: in DevTools set `recipe-favorites` to `{bad` → page still works
- [ ] API errors: turn on DevTools "Offline" → friendly error + "Try again"; `recipe.html` with no id shows a message
- [ ] Loading spinner appears during requests
- [ ] Mobile (375px) 1 column, Tablet (768px) 2 columns, Desktop 3–4 columns, no horizontal scroll
- [ ] Accessibility: Tab through everything, visible focus, labels, alt text, Lighthouse accessibility check
- [ ] ESLint: `npx eslint js` shows no errors

## Requirement check
| Proposal requirement | Implemented? | Where |
|---|---|---|
| Search by meal name or ingredient | Yes | `main.js` `handleSearch`, `api.js` `searchRecipes` |
| Dynamic result cards (name, image, category) | Yes | `utils.js` `createRecipeCard` |
| Dedicated recipe detail page | Yes | `recipe.html`, `recipe.js` |
| Ingredients + measurements | Yes | `createIngredientList`, normalizers |
| Cooking instructions | Yes | `createInstructionList`, `splitInstructions` |
| Category filtering | Yes | `main.js` `handleCategoryClick`, `api.js` `CATEGORY_MAP` |
| Random recipe | Yes | `handleRandom`, `getRandomMealDBRecipe` |
| Favorites (browser storage) | Yes | `utils.js` favorites helpers, `favorites.html/js` |
| Responsive layout (phone/tablet/desktop) | Yes | `style.css` section 12 |
| Loading & error handling, empty state | Yes | `showLoading`, `showError`, `#empty-state` |
| TheMealDB primary API | Yes | `api.js` |
| Spoonacular secondary API | Yes (needs your key) | `api.js` |
| Normalize both APIs | Yes | `normalizeMealDBRecipe`, `normalizeSpoonacularRecipe` |
| Fallbacks for missing data | Yes | "Not available", placeholder image |
| LocalStorage validation | Yes | `getFavorites` |
| Colors / Poppins + Inter fonts | Yes | `style.css` variables, Google Fonts links |
| CSS animations | Yes | `@keyframes card-enter`, `spin`, transitions |
| Modular file organization | Yes | `js/` modules |
| ESLint-ready | Yes | `eslint.config.js` (passes cleanly) |
| Accessibility | Yes | semantic HTML, labels, focus styles, skip link |
| sample-recipes.json | Yes | `data/` |
