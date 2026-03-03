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
  return str.replace(
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
const implEl = document.getElementById("impl"); // may be null
const heroBtn = document.querySelector(".hero-btn");
const heroClear = document.querySelector(".hero-clear");

// ---- State ----
const state = {
  selected: {
    ingredients: new Set(),
    appliances: new Set(),
    ustensils: new Set(),
  },
  query: "",
};

// Cache normalized blobs once per recipe id
const BLOBS = new Map(); // id -> blob
function getBlob(r) {
  if (BLOBS.has(r.id)) return BLOBS.get(r.id);
  const blob = buildBlob(r);
  BLOBS.set(r.id, blob);
  return blob;
}

// ---- Rendering ----
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

function createCard(r) {
  const title = escapeHTML(r.name || r.title || "Recette");
  const rawDesc = r.description || "";
  const short = rawDesc.length > 170 ? rawDesc.slice(0, 170) + "…" : rawDesc;
  const desc = escapeHTML(short);
  const imgPath = r.image ? `assets/images/${r.image}` : "";
  const ingredients = (r.ingredients || []).slice(0, 4).map((x) => {
    const name = typeof x === "string" ? x : x.ingredient || "";
    const q = typeof x === "string" ? "" : fmtQty(x.quantity);
    const u = typeof x === "string" ? "" : humanizeUnit(x.unit || x.unite);
    return [name, q, u].filter(Boolean).join(" ");
  });
  const time = r.time ? `${r.time} min` : "";
  const servings = r.servings ? `${r.servings} pers.` : "";

  const el = document.createElement("article");
  el.className = "card";
  el.innerHTML = `
    <img src="${imgPath}" alt="${title}" onerror="this.style.display='none'">
    <div class="content">
      <h3>${title}</h3>
      <div class="meta-row">
        ${time ? `<span>⏱ ${escapeHTML(time)}</span>` : ""}
        ${servings ? `<span>🍽 ${escapeHTML(servings)}</span>` : ""}
      </div>
      <p>${desc}</p>
      <div class="badges">
        ${ingredients
          .map((it) => `<span class="badge">${escapeHTML(it)}</span>`)
          .join("")}
      </div>
    </div>`;
  if (time) {
    const badge = document.createElement("span");
    badge.className = "time-badge";
    badge.textContent = time;
    el.appendChild(badge);
  }
  return el;
}

function render(list) {
  cardsEl.innerHTML = "";
  const frag = document.createDocumentFragment();
  list.forEach((r) => frag.appendChild(createCard(r)));
  cardsEl.appendChild(frag);
  if (countEl)
    countEl.textContent = `${pad2(list.length)} recette${
      list.length > 1 ? "s" : ""
    }`;
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

// ---- Facets + tags ----
function collectFacets(list) {
  const ing = new Map(),
    app = new Map(),
    ust = new Map();
  for (const r of list) {
    (r.ingredients || []).forEach((x) => {
      const label = typeof x === "string" ? x : x.ingredient || "";
      const norm = normalize(label);
      if (norm && !ing.has(norm)) ing.set(norm, label);
    });
    if (r.appliance) {
      const norm = normalize(r.appliance);
      if (norm && !app.has(norm)) app.set(norm, r.appliance);
    }
    (r.ustensils || []).forEach((u) => {
      const norm = normalize(u);
      if (norm && !ust.has(norm)) ust.set(norm, u);
    });
  }
  const sortMap = (m) =>
    [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  return {
    ingredients: sortMap(ing),
    appliances: sortMap(app),
    ustensils: sortMap(ust),
  };
}

function renderActiveTags() {
  const host = document.getElementById("active-tags");
  if (!host) return;
  host.innerHTML = "";

  const baseList =
    state.query && state.query.length >= 3
      ? SEARCH_IMPL(recipes, state.query)
      : recipes;
  const facets = collectFacets(baseList);
  const labelOf = (type, norm) => {
    const arr =
      type === "ingredients"
        ? facets.ingredients
        : type === "appliances"
        ? facets.appliances
        : facets.ustensils;
    const hit = arr.find(([n]) => n === norm);
    return hit ? hit[1] : norm;
  };

  const mk = (type, norm) => {
    const chip = document.createElement("span");
    chip.className = "tag-chip";
    chip.innerHTML = `${escapeHTML(
      labelOf(type, norm)
    )} <button aria-label="remove">×</button>`;
    chip.querySelector("button").addEventListener("click", () => {
      state.selected[type].delete(norm);
      applyAll(recipes);
    });
    host.appendChild(chip);
  };

  for (const v of state.selected.ingredients) mk("ingredients", v);
  for (const v of state.selected.appliances) mk("appliances", v);
  for (const v of state.selected.ustensils) mk("ustensils", v);
}

function renderFacetList(type, entries) {
  const rootId =
    type === "ingredients"
      ? "dd-ingredients"
      : type === "appliances"
      ? "dd-appliances"
      : "dd-ustensils";
  const root = document.getElementById(rootId);
  if (!root) return;

  const input = root.querySelector(".dd-search");
  const list = root.querySelector(".dd-list");
  const sel = state.selected[type];
  const q = normalize(input?.value || "");

  const shown = entries.filter(
    ([norm, label]) =>
      !sel.has(norm) && (q ? normalize(label).includes(q) : true)
  );
  list.innerHTML = shown
    .map(
      ([norm, label]) =>
        `<li data-v="${norm}" role="option" tabindex="0" title="${escapeHTML(
          label
        )}">${escapeHTML(
          label
        )}</li>`
    )
    .join("");

  list.querySelectorAll("li").forEach((li) => {
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

  if (input)
    input.oninput = debounce(() => renderFacetList(type, entries), 200);
}

// ---- Apply all ----
function applyAll(recipesArr) {
  // Query filter (≥ 3 chars)
  const base =
    state.query && state.query.length >= 3
      ? SEARCH_IMPL(recipesArr, state.query)
      : recipesArr;

  // Tag filters (AND)
  const needIng = state.selected.ingredients.size > 0;
  const needApp = state.selected.appliances.size > 0;
  const needUst = state.selected.ustensils.size > 0;

  const filtered = base.filter((r) => {
    const rIng = new Set(
      (r.ingredients || []).map((x) =>
        normalize(typeof x === "string" ? x : x.ingredient || "")
      )
    );
    const rApp = r.appliance ? new Set([normalize(r.appliance)]) : new Set();
    const rUst = new Set((r.ustensils || []).map((u) => normalize(u)));

    if (needIng) {
      for (const t of state.selected.ingredients)
        if (!rIng.has(t)) return false;
    }
    if (needApp) {
      for (const t of state.selected.appliances) if (!rApp.has(t)) return false;
    }
    if (needUst) {
      for (const t of state.selected.ustensils) if (!rUst.has(t)) return false;
    }
    return true;
  });

  render(filtered);

  const facets = collectFacets(filtered);
  renderFacetList("ingredients", facets.ingredients);
  renderFacetList("appliances", facets.appliances);
  renderFacetList("ustensils", facets.ustensils);

  const empty = filtered.length === 0;
  emptyEl.hidden = !empty;
  if (empty) {
    emptyEl.textContent =
      "Aucune recette ne correspond à votre critère… vous pouvez chercher « tarte aux pommes », « poisson », etc.";
  }

  renderActiveTags();
}

// ---- Init ----
function init() {
  if (typeof recipes === "undefined" || !Array.isArray(recipes)) {
    emptyEl.hidden = false;
    emptyEl.textContent = "Les données n’ont pas été chargées.";
    return;
  }

  // prebuild blobs
  recipes.forEach((r) => BLOBS.set(r.id, buildBlob(r)));

  // initial UI
  render(recipes);
  const f0 = collectFacets(recipes);
  renderFacetList("ingredients", f0.ingredients);
  renderFacetList("appliances", f0.appliances);
  renderFacetList("ustensils", f0.ustensils);
  renderActiveTags();

  // algorithm switch (guard if the select isn't present)
  if (implEl) {
    implEl.addEventListener("change", () => {
      SEARCH_IMPL = implEl.value === "loops" ? searchLoops : searchFunctional;
      applyAll(recipes);
    });
  }

  // dropdown clear buttons
  document.querySelectorAll(".dropdown").forEach((dropdown) => {
    const ddInput = dropdown.querySelector(".dd-search");
    const ddClear = dropdown.querySelector(".dd-clear");
    if (!ddInput || !ddClear) return;
    ddClear.addEventListener("click", () => {
      ddInput.value = "";
      ddInput.dispatchEvent(new Event("input", { bubbles: true }));
      ddInput.focus();
    });
  });

  // main search
  if (inputEl) {
    inputEl.addEventListener(
      "input",
      debounce(() => {
        state.query = inputEl.value;
        applyAll(recipes);
      }, 250)
    );

    // Enter key triggers search immediately
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        state.query = inputEl.value;
        applyAll(recipes);
      }
    });

    // --- clear button toggle ---
    const toggleClear = () => {
      if (!heroClear) return;
      heroClear.classList.toggle("show", !!inputEl.value.trim());
    };

    inputEl.addEventListener("input", () => {
      toggleClear();
    });

    // set initial clear state
    toggleClear();
  }

  // clear button click
  if (heroClear && inputEl) {
    heroClear.addEventListener("click", () => {
      inputEl.value = "";
      inputEl.dispatchEvent(new Event("input", { bubbles: true }));
      inputEl.focus();
    });
  }

  // hero button wiring
  if (heroBtn) {
    heroBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (inputEl) inputEl.focus();
      applyAll(recipes);
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
