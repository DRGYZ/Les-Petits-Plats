// ---- Utilities ----
function normalize(str = "") {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(str) {
  const n = normalize(str);
  return n ? n.split(" ") : [];
}

function debounce(fn, ms = 200) {
  let id;
  return (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
}

function escapeHTML(str = "") {
  return String(str).replace(
    /[&<>"'\/]/g,
    (s) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "/": "&#47;",
      }[s])
  );
}

const pad2 = (n) => String(n).padStart(2, "0");

// ---- DOM ----
const cardsEl = document.getElementById("cards");
const emptyEl = document.getElementById("empty");
const countEl = document.getElementById("results-count");
const inputEl = document.getElementById("main-search");
const implEl = document.getElementById("impl");
const perfEl = document.getElementById("search-perf");
const statusEl = document.getElementById("search-status");
const quickPantryEl = document.getElementById("quick-pantry");
const activeTagsRowEl = document.getElementById("active-tags-row");
const resetAllBtn = document.getElementById("reset-all-btn");
const compareToggleBtn = document.getElementById("compare-toggle-btn");
const comparePanelEl = document.getElementById("compare-panel");
const compareDockEl = document.getElementById("compare-dock");
const compareDockLabelEl = document.getElementById("compare-dock-label");
const compareDockOpenBtn = document.getElementById("compare-dock-open");
const compareDockClearBtn = document.getElementById("compare-dock-clear");
const logoEl = document.querySelector(".logo");
const heroBtn = document.querySelector(".hero-btn");
const heroClear = document.querySelector(".hero-clear");

const QUICK_INGREDIENTS = [
  "Poulet",
  "Lait de coco",
  "Tomate",
  "Oeuf",
  "Crème fraîche",
  "Jus de citron",
  "Oignon",
  "Chocolat",
];

// ---- State ----
const state = {
  selected: {
    ingredients: new Set(),
    appliances: new Set(),
    ustensils: new Set(),
  },
  query: "",
  compareIds: new Set(),
  compareOpen: false,
  expandedIds: new Set(),
};

// Cache normalized blobs and normalized facet sets once per recipe id
const BLOBS = new Map();
const FACET_SETS = new Map();
const FACET_LABELS = {
  ingredients: new Map(),
  appliances: new Map(),
  ustensils: new Map(),
};

function getBlob(r) {
  if (BLOBS.has(r.id)) return BLOBS.get(r.id);
  const blob = buildBlob(r);
  BLOBS.set(r.id, blob);
  return blob;
}

function getRecipeFacetSets(r) {
  if (FACET_SETS.has(r.id)) return FACET_SETS.get(r.id);
  const sets = {
    ingredients: new Set(
      (r.ingredients || []).map((x) =>
        normalize(typeof x === "string" ? x : x.ingredient || "")
      )
    ),
    appliances: r.appliance ? new Set([normalize(r.appliance)]) : new Set(),
    ustensils: new Set((r.ustensils || []).map((u) => normalize(u))),
  };
  FACET_SETS.set(r.id, sets);
  return sets;
}

function getFacetLabel(type, norm) {
  return FACET_LABELS[type].get(norm) || norm;
}

// ---- Formatting helpers ----
function humanizeUnit(unit) {
  if (!unit) return "";
  const u = normalize(unit);
  const map = {
    grammes: "g",
    gramme: "g",
    g: "g",
    kg: "kg",
    ml: "ml",
    cl: "cl",
    litres: "L",
    litre: "L",
    "cuilleres a soupe": "c. à s.",
    "cuillere a soupe": "c. à s.",
    "cuilleres a cafe": "c. à c.",
    "cuillere a cafe": "c. à c.",
    sachets: "sachet(s)",
    tranches: "tranche(s)",
    tiges: "tige(s)",
    verres: "verre(s)",
    boites: "boîte(s)",
  };
  return map[u] || unit;
}

function fmtQty(q) {
  return q === undefined || q === null ? "" : String(q);
}

function formatIngredientAmount(item) {
  if (!item || typeof item === "string") return "";

  const qty = fmtQty(item.quantity);
  const unit = humanizeUnit(item.unit || item.unite);
  if (!qty && !unit) return "";
  if (!qty) return unit;
  if (!unit) return qty;

  return ["g", "kg", "ml", "cl", "L"].includes(unit)
    ? `${qty}${unit}`
    : `${qty} ${unit}`;
}

function isIngredientMatched(ingredientName) {
  const normIng = normalize(ingredientName);
  if (!normIng) return false;
  if (state.selected.ingredients.has(normIng)) return true;

  const trimmed = state.query.trim();
  if (trimmed.length < 3) return false;
  const tokens = tokenize(trimmed);
  return tokens.some((t) => normIng.includes(t));
}

// ---- Rendering: Cards ----
function createCard(r, index) {
  const title = escapeHTML(r.name || r.title || "Recette");
  const desc = escapeHTML(r.description || "");
  const imgPath = r.image ? `public/assets/images/${escapeHTML(r.image)}` : "";
  const rawIngredients = r.ingredients || [];

  const matched = [];
  const unmatched = [];
  for (const item of rawIngredients) {
    const name = typeof item === "string" ? item : (item && item.ingredient) || "";
    if (isIngredientMatched(name)) matched.push(item);
    else unmatched.push(item);
  }
  const orderedIngredients = [...matched, ...unmatched];

  const ingredientsHTML = orderedIngredients
    .map((item) => {
      const name = typeof item === "string" ? item : (item && item.ingredient) || "";
      const amount = formatIngredientAmount(item);
      const hit = isIngredientMatched(name);
      return `
        <div class="ingredient-item${hit ? " is-hit" : ""}">
          <div class="ingredient-name">${hit ? "✓ " : ""}${escapeHTML(name)}</div>
          <div class="ingredient-qty">${amount ? escapeHTML(amount) : "—"}</div>
        </div>`;
    })
    .join("");

  const isCompared = state.compareIds.has(r.id);
  const isExpanded = state.expandedIds.has(r.id);
  const loadingAttr = index < 3 ? "eager" : "lazy";
  const timeText = r.time ? `${r.time} min` : "";
  const servingsText = `${r.servings || 1} pers.`;
  const ustensilsText = Array.isArray(r.ustensils) && r.ustensils.length
    ? r.ustensils.join(", ")
    : "—";

  const el = document.createElement("article");
  el.className = `card${isCompared ? " is-compared" : ""}`;
  el.innerHTML = `
    <div class="card-media">
      <img
        src="${imgPath}"
        alt="${title}"
        width="800"
        height="533"
        loading="${loadingAttr}"
        decoding="async"
        onerror="this.style.display='none'"
      />
      <div class="card-media-badges">
        ${timeText ? `<span class="time-badge">${escapeHTML(timeText)}</span>` : ""}
        ${
          r.appliance
            ? `<span class="appliance-badge">${escapeHTML(r.appliance)}</span>`
            : ""
        }
      </div>
      <button
        type="button"
        class="card-compare-btn${isCompared ? " is-active" : ""}"
        data-compare-id="${r.id}"
        aria-pressed="${isCompared ? "true" : "false"}"
      >
        ${isCompared ? "✓ Comparé" : "+ Comparer"}
      </button>
    </div>

    <div class="card-body">
      <div class="card-head">
        <h2 class="card-title">${title}</h2>
        <span class="card-servings">${escapeHTML(servingsText)}</span>
      </div>

      ${
        matched.length > 0
          ? `<div class="match-badge">✓ ${matched.length} ingrédient${
              matched.length > 1 ? "s" : ""
            } repéré${matched.length > 1 ? "s" : ""}</div>`
          : ""
      }

      <p class="card-description${isExpanded ? " is-expanded" : ""}">${desc}</p>

      <div class="card-section">
        <div class="card-meta-row">
          <p class="card-label">Ingrédients (${rawIngredients.length})</p>
          <span class="card-ustensils">Ustensiles : ${escapeHTML(ustensilsText)}</span>
        </div>
        <div class="ingredients-grid">${ingredientsHTML}</div>
      </div>

      <div class="card-footer">
        <button
          type="button"
          class="card-expand-btn"
          data-expand-id="${r.id}"
          aria-expanded="${isExpanded ? "true" : "false"}"
        >
          ${isExpanded ? "Réduire" : "Lire toute la recette"}
        </button>
        <span class="card-id">#${pad2(r.id)}</span>
      </div>
    </div>`;
  return el;
}

function render(list) {
  cardsEl.innerHTML = "";
  const frag = document.createDocumentFragment();
  list.forEach((r, idx) => frag.appendChild(createCard(r, idx)));
  cardsEl.appendChild(frag);
  if (countEl) {
    countEl.textContent = `${pad2(list.length)} recette${
      list.length > 1 ? "s" : ""
    }`;
  }
}

// ---- Search implementations ----
function buildBlob(r) {
  const name = r.name || r.title || "";
  const desc = r.description || "";
  const ingreds = (r.ingredients || [])
    .map((x) => (typeof x === "string" ? x : x.ingredient || ""))
    .join(" ");
  const appliance = r.appliance || "";
  const ustensils = Array.isArray(r.ustensils) ? r.ustensils.join(" ") : "";
  return normalize(`${name} ${desc} ${ingreds} ${appliance} ${ustensils}`);
}

function searchFunctional(arr, q) {
  const tokens = tokenize(q);
  if (tokens.length < 1) return arr;
  return arr.filter((r) => tokens.every((t) => getBlob(r).includes(t)));
}

function searchLoops(arr, q) {
  const tokens = tokenize(q);
  if (tokens.length < 1) return arr;
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const r = arr[i];
    const blob = getBlob(r);
    let ok = true;
    for (let j = 0; j < tokens.length; j++) {
      if (!blob.includes(tokens[j])) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(r);
  }
  return out;
}

let SEARCH_IMPL = searchFunctional;

// ---- Tag Filtering (shared by applyAll + empty-state recovery) ----
function matchesTagSelection(r, selectedObj) {
  const sets = getRecipeFacetSets(r);
  for (const type of ["ingredients", "appliances", "ustensils"]) {
    const wanted = selectedObj[type];
    if (wanted.size === 0) continue;
    for (const token of wanted) {
      if (!sets[type].has(token)) return false;
    }
  }
  return true;
}

function runFilterPipeline(recipesArr, query, selectedObj) {
  const trimmed = (query || "").trim();
  const base = trimmed.length >= 3 ? SEARCH_IMPL(recipesArr, trimmed) : recipesArr;
  return base.filter((r) => matchesTagSelection(r, selectedObj));
}

// ---- Facets + tags ----
function collectFacets(list) {
  const ing = new Map();
  const app = new Map();
  const ust = new Map();
  const counts = {
    ingredients: new Map(),
    appliances: new Map(),
    ustensils: new Map(),
  };

  for (const r of list) {
    const seenIng = new Set();
    (r.ingredients || []).forEach((x) => {
      const label = typeof x === "string" ? x : x.ingredient || "";
      const norm = normalize(label);
      if (norm) {
        if (!ing.has(norm)) ing.set(norm, label);
        if (!seenIng.has(norm)) {
          seenIng.add(norm);
          counts.ingredients.set(norm, (counts.ingredients.get(norm) || 0) + 1);
        }
      }
    });

    if (r.appliance) {
      const norm = normalize(r.appliance);
      if (norm) {
        if (!app.has(norm)) app.set(norm, r.appliance);
        counts.appliances.set(norm, (counts.appliances.get(norm) || 0) + 1);
      }
    }

    const seenUst = new Set();
    (r.ustensils || []).forEach((u) => {
      const norm = normalize(u);
      if (norm) {
        if (!ust.has(norm)) ust.set(norm, u);
        if (!seenUst.has(norm)) {
          seenUst.add(norm);
          counts.ustensils.set(norm, (counts.ustensils.get(norm) || 0) + 1);
        }
      }
    });
  }

  const sortMap = (m, countMap) =>
    [...m.entries()]
      .sort((a, b) => a[1].localeCompare(b[1], "fr"))
      .map(([norm, label]) => [norm, label, countMap.get(norm) || 0]);

  return {
    ingredients: sortMap(ing, counts.ingredients),
    appliances: sortMap(app, counts.appliances),
    ustensils: sortMap(ust, counts.ustensils),
  };
}

function renderQuickPantry() {
  if (!quickPantryEl) return;
  quickPantryEl.innerHTML = QUICK_INGREDIENTS.map((label) => {
    const norm = normalize(label);
    const active = state.selected.ingredients.has(norm);
    return `
      <button
        type="button"
        class="pantry-pill${active ? " is-active" : ""}"
        data-pantry-norm="${escapeHTML(norm)}"
        aria-pressed="${active ? "true" : "false"}"
      >
        ${active ? "✓ " : "+ "}${escapeHTML(label)}
      </button>`;
  }).join("");
}

function renderActiveTags() {
  const host = document.getElementById("active-tags");
  if (!host) return;
  host.innerHTML = "";

  const trimmed = state.query.trim();
  let totalChips = 0;

  if (trimmed.length >= 3) {
    const qChip = document.createElement("span");
    qChip.className = "tag-chip tag-chip--query";
    qChip.innerHTML = `<span class="tag-kind">Recherche</span> « ${escapeHTML(
      trimmed
    )} » <button type="button" aria-label="Effacer la recherche">×</button>`;
    qChip.querySelector("button").addEventListener("click", () => {
      setSearchQuery("");
    });
    host.appendChild(qChip);
    totalChips++;
  }

  const kindNames = {
    ingredients: "Ingrédient",
    appliances: "Appareil",
    ustensils: "Ustensile",
  };

  for (const type of ["ingredients", "appliances", "ustensils"]) {
    for (const norm of state.selected[type]) {
      const label = getFacetLabel(type, norm);
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.innerHTML = `<span class="tag-kind">${kindNames[type]}</span> ${escapeHTML(
        label
      )} <button type="button" aria-label="Retirer ${escapeHTML(label)}">×</button>`;
      chip.querySelector("button").addEventListener("click", () => {
        state.selected[type].delete(norm);
        applyAll(recipes);
      });
      host.appendChild(chip);
      totalChips++;
    }
  }

  if (activeTagsRowEl) {
    activeTagsRowEl.hidden = totalChips === 0;
  }
}

function renderFacetList(type, entries) {
  const rootId =
    type === "ingredients"
      ? "dd-ingredients"
      : type === "appliances"
      ? "dd-appliances"
      : "dd-ustensils";
  const countBadgeId =
    type === "ingredients"
      ? "count-ingredients"
      : type === "appliances"
      ? "count-appliances"
      : "count-ustensils";

  const root = document.getElementById(rootId);
  if (!root) return;

  const input = root.querySelector(".dd-search");
  const list = root.querySelector(".dd-list");
  const badgeEl = document.getElementById(countBadgeId);
  const sel = state.selected[type];
  const q = normalize(input?.value || "");

  const available = entries.filter(([norm]) => !sel.has(norm));
  if (badgeEl) badgeEl.textContent = String(available.length);

  const shown = available.filter(([, label]) =>
    q ? normalize(label).includes(q) : true
  );

  list.innerHTML = shown.length
    ? shown
        .map(
          ([norm, label, count]) =>
            `<li data-v="${escapeHTML(norm)}" role="option" tabindex="0" title="${escapeHTML(
              label
            )}"><span>${escapeHTML(label)}</span><span class="dd-item-count">${count}</span></li>`
        )
        .join("")
    : `<li class="dd-empty">Aucune option restante</li>`;

  list.querySelectorAll("li[data-v]").forEach((li) => {
    li.addEventListener("click", () => {
      const norm = li.getAttribute("data-v");
      sel.add(norm);
      if (input) input.value = "";
      root.removeAttribute("open");
      applyAll(recipes);
    });
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        li.click();
      }
    });
  });

  if (input) {
    input.oninput = debounce(() => renderFacetList(type, entries), 150);
  }
}

// ---- Search status + Empty recovery + Compare ----
function updateSearchStatus() {
  if (!statusEl) return;
  const trimmed = state.query.trim();

  if (trimmed.length > 0 && trimmed.length < 3) {
    const missing = 3 - trimmed.length;
    statusEl.className = "search-status search-status--warn";
    statusEl.innerHTML = `<span>Tapez encore ${missing} caractère${
      missing > 1 ? "s" : ""
    } (seuil 3 car.).</span>`;
    return;
  }

  statusEl.className = "search-status";
  const tokens = tokenize(trimmed);
  const cocoCount = tokens.length > 1 && tokens.includes("coco")
    ? runFilterPipeline(recipes, "coco", state.selected).length
    : 0;
  if (cocoCount > 0) {
    statusEl.innerHTML = `<span>Recherche active dès 3 caractères, sans accents.</span><button type="button" class="broaden-btn" id="broaden-coco-btn">Voir aussi « coco » (${cocoCount} recette${cocoCount > 1 ? "s" : ""})</button>`;
    const broadenBtn = document.getElementById("broaden-coco-btn");
    if (broadenBtn) {
      broadenBtn.addEventListener("click", () => setSearchQuery("coco"));
    }
    return;
  }

  statusEl.textContent = "Recherche active dès 3 caractères, sans accents.";
}

function renderComparison() {
  const compareRecipes = recipes.filter((r) => state.compareIds.has(r.id));
  const count = compareRecipes.length;

  if (compareToggleBtn) {
    compareToggleBtn.hidden = count === 0;
    compareToggleBtn.textContent = state.compareOpen
      ? `Masquer comparatif (${count}/3)`
      : `Comparer (${count}/3)`;
  }

  if (compareDockEl && compareDockLabelEl) {
    compareDockEl.hidden = count === 0 || state.compareOpen;
    compareDockLabelEl.textContent = `${count} recette${
      count > 1 ? "s" : ""
    } prête${count > 1 ? "s" : ""} à comparer`;
  }

  if (!comparePanelEl) return;
  if (!state.compareOpen || count === 0) {
    comparePanelEl.hidden = true;
    comparePanelEl.innerHTML = "";
    return;
  }

  comparePanelEl.hidden = false;
  comparePanelEl.innerHTML = `
    <div class="compare-panel-header">
      <div>
        <span class="compare-pill">Comparatif (${count}/3)</span>
        <h2 class="compare-heading">Temps, matériel et ingrédients côte à côte</h2>
      </div>
      <button type="button" class="compare-close-btn" data-compare-action="close">
        Fermer ×
      </button>
    </div>
    <div class="compare-grid">
      ${compareRecipes
        .map((r) => {
          const ings = r.ingredients || [];
          const isExp = state.expandedIds.has(r.id);
          return `
            <div class="compare-col">
              <div>
                <div class="compare-col-head">
                  <img
                    class="compare-thumb"
                    src="public/assets/images/${escapeHTML(r.image)}"
                    alt="${escapeHTML(r.name)}"
                    width="128"
                    height="112"
                  />
                  <div>
                    <h3 class="compare-col-title">${escapeHTML(r.name)}</h3>
                    <div class="compare-specs">
                      <span class="compare-time">${r.time} min</span>
                      <span class="compare-servings">${r.servings || 1} pers.</span>
                    </div>
                  </div>
                </div>
                <div class="compare-equip">
                  <div>
                    <span class="compare-equip-label">Appareil</span>
                    <span class="compare-equip-val">${escapeHTML(
                      r.appliance || "—"
                    )}</span>
                  </div>
                  <div>
                    <span class="compare-equip-label">Ustensiles</span>
                    <span class="compare-equip-val">${escapeHTML(
                      (r.ustensils || []).join(", ") || "—"
                    )}</span>
                  </div>
                </div>
                <ul class="compare-ings">
                  ${ings
                    .map((item) => {
                      const n = typeof item === "string" ? item : item.ingredient || "";
                      const a = formatIngredientAmount(item);
                      const hit = isIngredientMatched(n);
                      return `<li class="${hit ? "is-hit" : ""}"><span>${
                        hit ? "✓ " : ""
                      }${escapeHTML(n)}</span><span class="mono-num">${escapeHTML(
                        a || "—"
                      )}</span></li>`;
                    })
                    .join("")}
                </ul>
                ${
                  isExp
                    ? `<p class="card-description is-expanded">${escapeHTML(
                        r.description || ""
                      )}</p>`
                    : ""
                }
              </div>
              <div class="compare-col-foot">
                <button
                  type="button"
                  class="card-expand-btn"
                  data-compare-expand="${r.id}"
                >
                  ${isExp ? "Masquer étapes" : "Lire la recette"}
                </button>
                <button
                  type="button"
                  class="compare-remove-btn"
                  data-compare-remove="${r.id}"
                >
                  Retirer
                </button>
              </div>
            </div>`;
        })
        .join("")}
    </div>`;
}

function buildRecoveryOptions() {
  const options = [];
  const trimmed = state.query.trim();
  const tokens = tokenize(trimmed);

  // 1) Drop trailing token from multiword query
  if (tokens.length > 1) {
    const shorter = tokens.slice(0, -1).join(" ");
    const hits = runFilterPipeline(recipes, shorter, state.selected);
    if (hits.length > 0) {
      options.push({
        label: `Essayer « ${shorter} » (${hits.length})`,
        run: () => setSearchQuery(shorter),
      });
    }
  }

  // 2) Drop an incompatible active tag
  for (const type of ["appliances", "ustensils", "ingredients"]) {
    for (const norm of state.selected[type]) {
      const nextSelected = {
        ingredients: new Set(state.selected.ingredients),
        appliances: new Set(state.selected.appliances),
        ustensils: new Set(state.selected.ustensils),
      };
      nextSelected[type].delete(norm);
      const hits = runFilterPipeline(recipes, trimmed, nextSelected);
      if (hits.length > 0) {
        options.push({
          label: `Retirer « ${getFacetLabel(type, norm)} » (${hits.length})`,
          run: () => {
            state.selected[type].delete(norm);
            applyAll(recipes);
          },
        });
      }
    }
  }

  // 3) If "coco" query has narrower variant, offer widening before reset
  if (tokens.includes("coco") && trimmed !== "coco") {
    const cocoHits = SEARCH_IMPL(recipes, "coco");
    if (cocoHits.length > 0) {
      options.push({
        label: `Toutes les recettes « coco » (${cocoHits.length})`,
        run: () => {
          resetAllFilters({ keepQuery: "coco" });
        },
      });
    }
  }

  // 4) Full reset (becomes primary action when no narrower query/tag adjustment applies)
  options.push({
    label: `Tout afficher (${recipes.length})`,
    run: () => resetAllFilters(),
  });

  // 5) Optional starter discovery suggestion for unrelated zero-hit searches
  if (!tokens.includes("coco")) {
    const pouletCocoHits = SEARCH_IMPL(recipes, "poulet coco");
    if (pouletCocoHits.length > 0) {
      options.push({
        label: `Essayer « poulet coco » (${pouletCocoHits.length})`,
        run: () => {
          resetAllFilters({ keepQuery: "poulet coco" });
        },
      });
    }
  }

  return options.slice(0, 4);
}

function renderEmptyState() {
  if (!emptyEl) return;
  const trimmed = state.query.trim();
  const titleText = trimmed
    ? `Aucune recette pour « ${trimmed} »`
    : "Aucune recette ne correspond à ces filtres";
  const options = buildRecoveryOptions();

  emptyEl.innerHTML = `
    <div class="empty-badge" aria-hidden="true">0</div>
    <h2 class="empty-title">${escapeHTML(titleText)}</h2>
    <p class="empty-desc">
      Retirez un ingrédient ou élargissez la recherche pour retrouver des idées.
    </p>
    <div class="empty-actions">
      ${options
        .map(
          (opt, idx) => `
          <button
            type="button"
            class="recovery-btn${idx === 0 ? " recovery-btn--primary" : ""}"
            data-recovery-idx="${idx}"
          >
            ${escapeHTML(opt.label)}
          </button>`
        )
        .join("")}
    </div>`;

  emptyEl.querySelectorAll("[data-recovery-idx]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-recovery-idx"));
      if (options[idx]) options[idx].run();
    });
  });
}

// ---- Apply all ----
function setSearchQuery(nextQuery) {
  state.query = nextQuery;
  if (inputEl) {
    inputEl.value = nextQuery;
    if (heroClear) heroClear.classList.toggle("show", !!nextQuery.trim());
  }
  applyAll(recipes);
}

function resetAllFilters(opts = {}) {
  state.selected.ingredients.clear();
  state.selected.appliances.clear();
  state.selected.ustensils.clear();
  setSearchQuery(opts.keepQuery || "");
}

function applyAll(recipesArr) {
  const t0 = performance.now();
  const filtered = runFilterPipeline(recipesArr, state.query, state.selected);
  const elapsed = performance.now() - t0;

  if (perfEl) perfEl.textContent = `Filtrage · ${elapsed.toFixed(2)} ms`;
  updateSearchStatus();
  renderQuickPantry();
  renderComparison();
  render(filtered);

  const facets = collectFacets(filtered);
  renderFacetList("ingredients", facets.ingredients);
  renderFacetList("appliances", facets.appliances);
  renderFacetList("ustensils", facets.ustensils);

  const empty = filtered.length === 0;
  emptyEl.hidden = !empty;
  if (empty) {
    renderEmptyState();
  } else {
    emptyEl.innerHTML = "";
  }

  renderActiveTags();
}

// ---- Init ----
function init() {
  if (typeof recipes === "undefined" || !Array.isArray(recipes)) {
    if (emptyEl) {
      emptyEl.hidden = false;
      emptyEl.textContent = "Les données n’ont pas été chargées.";
    }
    return;
  }

  // Prebuild search blobs and permanent facet label index
  recipes.forEach((r) => {
    BLOBS.set(r.id, buildBlob(r));
    getRecipeFacetSets(r);
  });

  const allFacets = collectFacets(recipes);
  allFacets.ingredients.forEach(([n, l]) => FACET_LABELS.ingredients.set(n, l));
  allFacets.appliances.forEach(([n, l]) => FACET_LABELS.appliances.set(n, l));
  allFacets.ustensils.forEach(([n, l]) => FACET_LABELS.ustensils.set(n, l));

  applyAll(recipes);

  // Algorithm switch
  if (implEl) {
    implEl.addEventListener("change", () => {
      SEARCH_IMPL = implEl.value === "loops" ? searchLoops : searchFunctional;
      applyAll(recipes);
    });
  }

  // Only one filter dropdown open at a time; close on outside click or Escape
  const dropdowns = [...document.querySelectorAll(".dropdown")];
  dropdowns.forEach((dropdown) => {
    dropdown.addEventListener("toggle", () => {
      if (dropdown.open) {
        dropdowns.forEach((other) => {
          if (other !== dropdown) other.removeAttribute("open");
        });
      }
    });

    const ddInput = dropdown.querySelector(".dd-search");
    const ddClear = dropdown.querySelector(".dd-clear");
    if (ddInput && ddClear) {
      ddClear.addEventListener("click", () => {
        ddInput.value = "";
        ddInput.dispatchEvent(new Event("input", { bubbles: true }));
        ddInput.focus();
      });
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown")) {
      dropdowns.forEach((d) => d.removeAttribute("open"));
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      dropdowns.forEach((d) => d.removeAttribute("open"));
    }
  });

  // Main search wiring
  if (inputEl) {
    inputEl.addEventListener(
      "input",
      debounce(() => {
        state.query = inputEl.value;
        applyAll(recipes);
      }, 200)
    );

    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        state.query = inputEl.value;
        applyAll(recipes);
      }
    });

    const toggleClear = () => {
      if (!heroClear) return;
      heroClear.classList.toggle("show", !!inputEl.value.trim());
    };
    inputEl.addEventListener("input", toggleClear);
    toggleClear();
  }

  if (heroClear && inputEl) {
    heroClear.addEventListener("click", () => {
      setSearchQuery("");
      inputEl.focus();
    });
  }

  if (heroBtn) {
    heroBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (inputEl) {
        state.query = inputEl.value;
        inputEl.focus();
      }
      applyAll(recipes);
    });
  }

  if (logoEl) {
    logoEl.addEventListener("click", (e) => {
      e.preventDefault();
      resetAllFilters();
    });
  }

  if (resetAllBtn) {
    resetAllBtn.addEventListener("click", () => resetAllFilters());
  }

  // Quick pantry chips (event delegation)
  if (quickPantryEl) {
    quickPantryEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-pantry-norm]");
      if (!btn) return;
      const norm = btn.getAttribute("data-pantry-norm");
      if (state.selected.ingredients.has(norm)) {
        state.selected.ingredients.delete(norm);
      } else {
        state.selected.ingredients.add(norm);
      }
      applyAll(recipes);
    });
  }

  // Card compare & expand (event delegation)
  if (cardsEl) {
    cardsEl.addEventListener("click", (e) => {
      const compareBtn = e.target.closest("[data-compare-id]");
      if (compareBtn) {
        const id = Number(compareBtn.getAttribute("data-compare-id"));
        if (state.compareIds.has(id)) {
          state.compareIds.delete(id);
          if (state.compareIds.size === 0) state.compareOpen = false;
        } else {
          if (state.compareIds.size >= 3) {
            const first = state.compareIds.values().next().value;
            state.compareIds.delete(first);
          }
          state.compareIds.add(id);
        }
        applyAll(recipes);
        return;
      }

      const expandBtn = e.target.closest("[data-expand-id]");
      if (expandBtn) {
        const id = Number(expandBtn.getAttribute("data-expand-id"));
        if (state.expandedIds.has(id)) state.expandedIds.delete(id);
        else state.expandedIds.add(id);
        applyAll(recipes);
      }
    });
  }

  // Comparison toggle & panel actions
  if (compareToggleBtn) {
    compareToggleBtn.addEventListener("click", () => {
      state.compareOpen = !state.compareOpen;
      renderComparison();
    });
  }

  if (compareDockOpenBtn) {
    compareDockOpenBtn.addEventListener("click", () => {
      state.compareOpen = true;
      renderComparison();
      comparePanelEl?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (compareDockClearBtn) {
    compareDockClearBtn.addEventListener("click", () => {
      state.compareIds.clear();
      state.compareOpen = false;
      applyAll(recipes);
    });
  }

  if (comparePanelEl) {
    comparePanelEl.addEventListener("click", (e) => {
      const closeBtn = e.target.closest('[data-compare-action="close"]');
      if (closeBtn) {
        state.compareOpen = false;
        renderComparison();
        return;
      }
      const remBtn = e.target.closest("[data-compare-remove]");
      if (remBtn) {
        const id = Number(remBtn.getAttribute("data-compare-remove"));
        state.compareIds.delete(id);
        if (state.compareIds.size === 0) state.compareOpen = false;
        applyAll(recipes);
        return;
      }
      const expBtn = e.target.closest("[data-compare-expand]");
      if (expBtn) {
        const id = Number(expBtn.getAttribute("data-compare-expand"));
        if (state.expandedIds.has(id)) state.expandedIds.delete(id);
        else state.expandedIds.add(id);
        applyAll(recipes);
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
