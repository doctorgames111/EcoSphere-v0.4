let challengesData = [];
let currentCategory = 'all';
let currentSearch = '';

// advanced filter state
const advancedFilter = {
  mode: 'include', // or 'exclude'
  categories: []
};

// convenience
function advActive() {
  return advancedFilter.categories.length > 0;
}

// Load data from JSON file
async function loadChallenges() {
  try {
    const resp = await fetch('../JSON/challenges-main.json');
    challengesData = await resp.json();
    renderChallenges(currentCategory, currentSearch);
  } catch (err) {
    console.error('Failed to load challenges data:', err);
  }
}

// clear advanced filter and update UI
function clearAdvancedFilter() {
  advancedFilter.categories = [];
  // update modal selections if open
  document.querySelectorAll('.modal-cat-btn').forEach(btn => btn.classList.remove('selected'));
  currentCategory = 'all';
  updateFilterUI();
}

// show confirmation dialog with callback on OK
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


// Render challenge cards
function renderChallenges(filter = 'all', search = '') {
  const grid = document.getElementById('challengesGrid');
  let list = [...challengesData];

  // apply advanced filter first
  if (advActive()) {
    if (advancedFilter.mode === 'include') {
      list = list.filter(c => advancedFilter.categories.includes(c.category));
    } else {
      list = list.filter(c => !advancedFilter.categories.includes(c.category));
    }
  } else if (filter && filter !== 'all') {
    // only apply simple category when no advanced filter
    list = list.filter(c => c.category === filter);
  }

  if (search) {
    const term = search.toLowerCase();
    list = list.filter(c =>
      c.title.toLowerCase().includes(term) ||
      c.description.toLowerCase().includes(term)
    );
  }
  let filtered = list;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">🔍</div>
        <h3>No challenges found</h3>
        <p>Try a different filter or search term to explore more challenges.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(challenge => `
    <div class="product-card variant-green animate-on-scroll" data-animate="fade-in-up">
      <div class="card-image-container">
        <img src="${challenge.image}" alt="${challenge.title}" />
      </div>
      <div class="card-content">
        <span class="card-tag">${challenge.category.charAt(0).toUpperCase() + challenge.category.slice(1)}</span>
        <h3 class="card-title">${challenge.title}</h3>
        <p class="card-description">${challenge.description}</p>
        <div class="card-meta">
          <div class="meta-item">
            <span>📊</span>
            <span>${challenge.impact}</span>
          </div>
        </div>
      </div>
      <div class="card-footer">
        <a href="${(challenge.link && challenge.link !== '#') ? challenge.link : 'not-implemented.html'}" class="card-btn">Learn More</a>
      </div>
    </div>
  `).join('');
  if (typeof observeScrollAnimations === 'function') observeScrollAnimations();
}


// Filter functionality
document.addEventListener('DOMContentLoaded', function() {
  // only category buttons, so advanced control isn't treated as a filter
  const filterBtns = document.querySelectorAll('.filter-categories .filter-btn');
  const searchInput = document.getElementById('challengeSearch');

  // load data then render
  loadChallenges();

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
    renderChallenges(currentCategory, currentSearch);
  }

  if (searchInput) {
    searchInput.addEventListener('input', function() {
      currentSearch = this.value.trim();
      renderChallenges(currentCategory, currentSearch);
    });
  }

  // advanced filter button
  const advBtn = document.getElementById('advancedFilterBtn');
  advBtn.addEventListener('click', openAdvancedModal);

  // modal controls
  document.getElementById('closeModal').addEventListener('click', closeAdvancedModal);
  document.getElementById('cancelAdvanced').addEventListener('click', closeAdvancedModal);
  document.getElementById('clearAdvanced').addEventListener('click', clearAdvancedFilter);
  document.getElementById('applyAdvanced').addEventListener('click', () => {
    closeAdvancedModal();
    // when advanced filter takes over, clear category selection
    currentCategory = 'all';
    updateFilterUI();
    renderChallenges(currentCategory, currentSearch);
  });

  // mode toggle
  document.getElementById('includeBtn').addEventListener('click', () => setMode('include'));
  document.getElementById('excludeBtn').addEventListener('click', () => setMode('exclude'));

  // category buttons inside modal
  document.querySelectorAll('.modal-cat-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      this.classList.toggle('selected');
      const val = this.getAttribute('data-value');
      const idx = advancedFilter.categories.indexOf(val);
      if (idx === -1) advancedFilter.categories.push(val);
      else advancedFilter.categories.splice(idx, 1);
    });
  });

  // confirm dialog listeners
  document.getElementById('confirmOk').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    hideConfirm();
  });
  document.getElementById('confirmCancel').addEventListener('click', hideConfirm);

  // ensure UI reflects no advanced at start
  updateFilterUI();
});

// helper functions for modal
function openAdvancedModal() {
  document.getElementById('overlay').classList.add('visible');
  document.getElementById('advancedModal').classList.add('visible');
  // initialize selection state inside modal
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
    // clear any simple-category highlight
    cats.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    advBtn.classList.add('active');
  } else {
    cats.classList.remove('disabled');
    advBtn.classList.remove('active');
  }
}

