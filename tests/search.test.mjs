import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createContext, runInContext } from "node:vm";

// Load the same classic scripts as index.html without starting the browser UI.
const searchStatus = {
  innerHTML: "",
  set textContent(value) {
    this.innerHTML = value;
  },
};
const context = createContext({
  document: {
    getElementById: (id) => (id === "search-status" ? searchStatus : null),
    querySelector: () => null,
    addEventListener: () => {},
  },
});

for (const file of ["src/data/recipes.js", "src/app.js"]) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  runInContext(source, context, { filename: file });
}

const {
  recipes, state, normalize, searchFunctional, searchLoops,
  runFilterPipeline, updateSearchStatus, setEngine,
} = runInContext(`({
    recipes, state, normalize, searchFunctional, searchLoops,
    runFilterPipeline, updateSearchStatus,
    setEngine(engine) { SEARCH_IMPL = engine; },
  })`, context);

function selectFacets({ ingredients = [], appliances = [], ustensils = [] } = {}) {
  return {
    ingredients: new Set(ingredients.map(normalize)),
    appliances: new Set(appliances.map(normalize)),
    ustensils: new Set(ustensils.map(normalize)),
  };
}

function resultIds(engine, query, selected) {
  setEngine(engine);
  return Array.from(runFilterPipeline(recipes, query, selected), (recipe) => recipe.id);
}

const creamIds = [1, 2, 5, 6, 7, 20, 21, 22, 23, 27, 28, 34, 35, 44, 45, 47];
const cocoFacets = {
  ingredients: ["Lait de coco"],
  appliances: ["Blender"],
  ustensils: ["cuillère à soupe"],
};
const cases = [
  ["empty search", "", {}, Array.from(recipes, (recipe) => recipe.id)],
  ["accented query", "crème", {}, creamIds],
  ["unaccented query", "creme", {}, creamIds],
  ["combined terms", "poulet coco", {}, [3]],
  ["combined terms in reverse order", "coco poulet", {}, [3]],
  ["ingredient facet", "coco", { ingredients: cocoFacets.ingredients }, [1, 2, 3]],
  ["appliance facet", "coco", { appliances: cocoFacets.appliances }, [1]],
  ["utensil facet", "coco", { ustensils: cocoFacets.ustensils }, [1]],
  ["all three facets", "coco", cocoFacets, [1]],
  ["empty search with facets", "", cocoFacets, [1]],
  ["no result with facets", "poulet coco", cocoFacets, []],
  ["no matching term", "zzzintrouvable", {}, []],
];

for (const [label, query, facets, expected] of cases) {
  test(`both engines preserve the ordered results for ${label}`, () => {
    const selected = selectFacets(facets);
    assert.deepEqual(resultIds(searchFunctional, query, selected), expected);
    assert.deepEqual(resultIds(searchLoops, query, selected), expected);
  });
}

test("the coco shortcut count reflects the facets it will keep", () => {
  state.query = "poulet coco";
  for (const [facets, expected] of [[{}, [1, 2, 3, 26, 30, 35]], [cocoFacets, [1]]]) {
    state.selected = selectFacets(facets);
    for (const engine of [searchFunctional, searchLoops]) {
      assert.deepEqual(resultIds(engine, "coco", state.selected), expected);
      updateSearchStatus();
      assert.match(searchStatus.innerHTML, new RegExp(`Voir aussi « coco » \\(${expected.length} recettes?\\)`));
    }
  }
});

test("the coco shortcut is hidden when the active facet leaves no matches", () => {
  state.query = "poulet coco";
  state.selected = selectFacets({ appliances: ["Four"] });
  for (const engine of [searchFunctional, searchLoops]) {
    assert.deepEqual(resultIds(engine, "coco", state.selected), []);
    updateSearchStatus();
    assert.doesNotMatch(searchStatus.innerHTML, /Voir aussi/);
  }
});
