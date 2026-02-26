let solutionsData = [];
let currentCategory = "all";
let currentSearch = "";

// advanced filter state
const advancedFilter = {
  mode: "include", // or 'exclude'
  categories: [],
};

function advActive() {
  return advancedFilter.categories.length > 0;
}

async function loadSolutions() {
  try {
    const resp = await fetch("../JSON/solutions-main.json");
    if (!resp.ok) throw new Error("Failed to load solutions-main.json");
    solutionsData = await resp.json();
    renderSolutions(currentCategory, currentSearch);
  } catch (err) {
    console.error("Failed to load solutions data:", err);
  }
}

function clearAdvancedFilter() {
  advancedFilter.categories = [];
  document
    .querySelectorAll(".modal-cat-btn")
    .forEach((btn) => btn.classList.remove("selected"));
  currentCategory = "all";
  updateFilterUI();
}

let confirmCallback = null;
function showConfirm(callback) {
  confirmCallback = callback;
  document.getElementById("confirmOverlay").classList.add("visible");
  document.getElementById("confirmDialog").classList.add("visible");
}
function hideConfirm() {
  document.getElementById("confirmOverlay").classList.remove("visible");
  document.getElementById("confirmDialog").classList.remove("visible");
  confirmCallback = null;
}

function renderSolutions(filter = "all", search = "") {
  const container = document.getElementById("solutionsContainer");
  let list = [...solutionsData];

  // apply filtering logic (same as before)
  if (advActive()) {
    if (advancedFilter.mode === "include") {
      list = list.filter((s) => advancedFilter.categories.includes(s.category));
    } else {
      list = list.filter(
        (s) => !advancedFilter.categories.includes(s.category),
      );
    }
  } else if (filter && filter !== "all") {
    list = list.filter((s) => s.category === filter);
  }

  if (search) {
    const term = search.toLowerCase();
    list = list.filter(
      (s) =>
        s.title.toLowerCase().includes(term) ||
        s.description.toLowerCase().includes(term),
    );
  }

  // separate states
  const availableCards = list.filter((s) => s.state === "available");
  const unavailableCards = list.filter((s) => s.state === "unavailable");

  // nothing at all
  if (availableCards.length === 0 && unavailableCards.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="width:100%; text-align:center;">
        <div class="empty-icon">🔍</div>
        <h3>No solutions found</h3>
        <p>Try a different filter or search term to explore more solutions.</p>
      </div>
    `;
    return;
  }

  // helper to render a group of cards
  const cardHtml = (items) =>
    items
      .map((sol) => {
        const href =
          sol && sol.state === "available" && sol.link && sol.link !== "#"
            ? sol.link
            : "not-implemented.html";
        const label =
          sol && sol.state === "available" ? "Explore" : "Coming Soon";
        return `
        <div class="product-card variant-green animate-on-scroll" data-animate="fade-in-up">
          <div class="card-image-container">
            ${sol.image ? `<img src="${sol.image}" alt="${sol.title}">` : `<div class="card-icon-fallback">${sol.image}</div>`}
          </div>
          <div class="card-content">
            <span class="card-tag">${sol.category.charAt(0).toUpperCase() + sol.category.slice(1)}</span>
            <h3 class="card-title">${sol.title}</h3>
            <p class="card-description">${sol.description}</p>
          </div>
          <div class="card-footer">
            <a href="${href}" class="card-btn">${label}</a>
          </div>
        </div>
      `;
      })
      .join("");

  // compose final html using separate grids
  let html = "";

  if (availableCards.length > 0) {
    html += `
      <div class="section-divider">
        <span class="divider-label">Available Topics</span>
      </div>
      <div class="product-grid">${cardHtml(availableCards)}</div>
    `;
  }

  if (unavailableCards.length > 0) {
    html += `
      <div class="section-divider">
        <span class="divider-label">Coming Soon</span>
      </div>
      <div class="product-grid">${cardHtml(unavailableCards, true)}</div>
    `;
  }

  container.innerHTML = html;
  if (typeof observeScrollAnimations === "function") observeScrollAnimations();
}

document.addEventListener("DOMContentLoaded", function () {
  // ensure we only target category buttons; advanced button is handled separately
  const filterBtns = document.querySelectorAll(
    ".filter-categories .filter-btn",
  );
  const searchInput = document.getElementById("solutionSearch");

  loadSolutions();

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const chosen = this.getAttribute("data-filter");
      if (advActive()) {
        showConfirm(() => {
          clearAdvancedFilter();
          applyCategory(chosen);
        });
        return;
      }
      applyCategory(chosen);
    });
  });

  function applyCategory(chosen) {
    filterBtns.forEach((b) => b.classList.remove("active"));
    const button = Array.from(filterBtns).find(
      (b) => b.getAttribute("data-filter") === chosen,
    );
    if (button) button.classList.add("active");
    currentCategory = chosen;
    renderSolutions(currentCategory, currentSearch);
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      currentSearch = this.value.trim();
      renderSolutions(currentCategory, currentSearch);
    });
  }

  // advanced modal controls with safety checks
  const advBtn = document.getElementById("advancedFilterBtn");
  if (advBtn) {
    advBtn.addEventListener("click", openAdvancedModal);
  } else {
    console.warn("Advanced filter button (#advancedFilterBtn) not found");
  }

  const bindIf = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", fn);
    else console.warn(`Element #${id} not found`);
  };

  bindIf("closeModal", closeAdvancedModal);
  bindIf("cancelAdvanced", closeAdvancedModal);
  bindIf("clearAdvanced", clearAdvancedFilter);
  bindIf("applyAdvanced", () => {
    closeAdvancedModal();
    currentCategory = "all";
    updateFilterUI();
    renderSolutions(currentCategory, currentSearch);
  });

  bindIf("includeBtn", () => setMode("include"));
  bindIf("excludeBtn", () => setMode("exclude"));

  const catBtns = document.querySelectorAll(".modal-cat-btn");
  if (catBtns.length === 0) {
    console.warn("No category buttons found inside advanced modal");
  }
  catBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      this.classList.toggle("selected");
      const val = this.getAttribute("data-value");
      const idx = advancedFilter.categories.indexOf(val);
      if (idx === -1) advancedFilter.categories.push(val);
      else advancedFilter.categories.splice(idx, 1);
    });
  });

  bindIf("confirmOk", () => {
    if (confirmCallback) confirmCallback();
    hideConfirm();
  });
  bindIf("confirmCancel", hideConfirm);

  updateFilterUI();
});

function openAdvancedModal() {
  document.getElementById("overlay").classList.add("visible");
  document.getElementById("advancedModal").classList.add("visible");
  document.querySelectorAll(".modal-cat-btn").forEach((btn) => {
    const val = btn.getAttribute("data-value");
    btn.classList.toggle("selected", advancedFilter.categories.includes(val));
  });
  setMode(advancedFilter.mode);
}

function closeAdvancedModal() {
  document.getElementById("overlay").classList.remove("visible");
  document.getElementById("advancedModal").classList.remove("visible");
}

function setMode(m) {
  advancedFilter.mode = m;
  document
    .getElementById("includeBtn")
    .classList.toggle("active", m === "include");
  document
    .getElementById("excludeBtn")
    .classList.toggle("active", m === "exclude");
}

function updateFilterUI() {
  const cats = document.querySelector(".filter-categories");
  const advBtn = document.getElementById("advancedFilterBtn");
  if (advActive()) {
    cats.classList.add("disabled");
    cats
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("active"));
    advBtn.classList.add("active");
  } else {
    cats.classList.remove("disabled");
    advBtn.classList.remove("active");
  }
}
