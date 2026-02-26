let solutionsData = [];
let currentCategory = 'all';
let currentSearch = '';

// advanced filter state
const advancedFilter = {
  mode: 'include', // or 'exclude'
  categories: []
};

function advActive() {
  return advancedFilter.categories.length > 0;
}

async function loadSolutions() {
  try {
    const resp = await fetch('../JSON/solutions-main.json');
    if (!resp.ok) throw new Error('Failed to load solutions-main.json');
    solutionsData = await resp.json();
    renderSolutions(currentCategory, currentSearch);
  } catch (err) {
    console.error('Failed to load solutions data:', err);
  }
}

function clearAdvancedFilter() {
  advancedFilter.categories = [];
  document.querySelectorAll('.modal-cat-btn').forEach(btn => btn.classList.remove('selected'));
  currentCategory = 'all';
  updateFilterUI();
}

let confirmCallback = null;
function showConfirm(callback) {
  confirmCallback = callback;
  document.getElementById('confirmOverlay').classList.add('visible');
  document.getElementById('confirmDialog').classList.add('visible');
}
function hideConfirm() {
  document.getElementById('confirmOverlay').classList.remove('visible');
  document.getElementById('confirmDialog').classList.remove('visible');
  confirmCallback = null;
}

function renderSolutions(filter = 'all', search = '') {
  const grid = document.getElementById('solutionsGrid');
  let list = [...solutionsData];

  if (advActive()) {
    if (advancedFilter.mode === 'include') {
      list = list.filter(s => advancedFilter.categories.includes(s.category));
    } else {
      list = list.filter(s => !advancedFilter.categories.includes(s.category));
    }
  } else if (filter && filter !== 'all') {
    list = list.filter(s => s.category === filter);
  }

  if (search) {
    const term = search.toLowerCase();
    list = list.filter(s =>
      s.title.toLowerCase().includes(term) ||
      s.description.toLowerCase().includes(term)
    );
  }

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">🔍</div>
        <h3>No solutions found</h3>
        <p>Try a different filter or search term to explore more solutions.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map(sol => `
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
        <a href="not-implemented.html" class="card-btn">Explore</a>
      </div>
    </div>
  `).join('');
  if (typeof observeScrollAnimations === 'function') observeScrollAnimations();
}

document.addEventListener('DOMContentLoaded', function() {
  // ensure we only target category buttons; advanced button is handled separately
  const filterBtns = document.querySelectorAll('.filter-categories .filter-btn');
  const searchInput = document.getElementById('solutionSearch');

  loadSolutions();

  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const chosen = this.getAttribute('data-filter');
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
    filterBtns.forEach(b => b.classList.remove('active'));
    const button = Array.from(filterBtns).find(b => b.getAttribute('data-filter') === chosen);
    if (button) button.classList.add('active');
    currentCategory = chosen;
    renderSolutions(currentCategory, currentSearch);
  }

  if (searchInput) {
    searchInput.addEventListener('input', function() {
      currentSearch = this.value.trim();
      renderSolutions(currentCategory, currentSearch);
    });
  }

  const advBtn = document.getElementById('advancedFilterBtn');
  advBtn.addEventListener('click', openAdvancedModal);

  document.getElementById('closeModal').addEventListener('click', closeAdvancedModal);
  document.getElementById('cancelAdvanced').addEventListener('click', closeAdvancedModal);
  document.getElementById('clearAdvanced').addEventListener('click', clearAdvancedFilter);
  document.getElementById('applyAdvanced').addEventListener('click', () => {
    closeAdvancedModal();
    currentCategory = 'all';
    updateFilterUI();
    renderSolutions(currentCategory, currentSearch);
  });

  document.getElementById('includeBtn').addEventListener('click', () => setMode('include'));
  document.getElementById('excludeBtn').addEventListener('click', () => setMode('exclude'));

  document.querySelectorAll('.modal-cat-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      this.classList.toggle('selected');
      const val = this.getAttribute('data-value');
      const idx = advancedFilter.categories.indexOf(val);
      if (idx === -1) advancedFilter.categories.push(val);
      else advancedFilter.categories.splice(idx, 1);
    });
  });

  document.getElementById('confirmOk').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    hideConfirm();
  });
  document.getElementById('confirmCancel').addEventListener('click', hideConfirm);

  updateFilterUI();
});

function openAdvancedModal() {
  document.getElementById('overlay').classList.add('visible');
  document.getElementById('advancedModal').classList.add('visible');
  document.querySelectorAll('.modal-cat-btn').forEach(btn => {
    const val = btn.getAttribute('data-value');
    btn.classList.toggle('selected', advancedFilter.categories.includes(val));
  });
  setMode(advancedFilter.mode);
}

function closeAdvancedModal() {
  document.getElementById('overlay').classList.remove('visible');
  document.getElementById('advancedModal').classList.remove('visible');
}

function setMode(m) {
  advancedFilter.mode = m;
  document.getElementById('includeBtn').classList.toggle('active', m === 'include');
  document.getElementById('excludeBtn').classList.toggle('active', m === 'exclude');
}

function updateFilterUI() {
  const cats = document.querySelector('.filter-categories');
  const advBtn = document.getElementById('advancedFilterBtn');
  if (advActive()) {
    cats.classList.add('disabled');
    cats.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    advBtn.classList.add('active');
  } else {
    cats.classList.remove('disabled');
    advBtn.classList.remove('active');
  }
}
