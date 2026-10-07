// Optional ESLint setup (flat config). Run with:  npx eslint js
const browserGlobals = {
  window: "readonly",
  document: "readonly",
  localStorage: "readonly",
  fetch: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  DOMParser: "readonly",
};

export default [
  {
    files: ["js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: browserGlobals,
    },
    rules: {
      "no-unused-vars": "error",
      "no-undef": "error",
      "no-console": "warn",
      "no-unreachable": "error",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: "error",
      semi: ["error", "always"],
      quotes: ["error", "double", { avoidEscape: true }],
    },
  },
];
