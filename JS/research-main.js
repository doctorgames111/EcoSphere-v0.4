// placeholder for research cards data; will be populated by loading JSON
let researchData = [];

// helper to fetch JSON file and store data
async function loadResearchData() {
  try {
    const resp = await fetch('../JSON/researches.json');
    if (!resp.ok) throw new Error('Unable to load research JSON');
    researchData = await resp.json();
  } catch (err) {
    console.error('Error loading research data:', err);
  }
}

// map of main categories to their subtopics (used to build dropdowns)
const mainCategories = {
  "Energy": ["Solar","Wind","Hydropower" , "biogas"],
  "Climate Change & Global Warming": ["Greenhouse Gases","Carbon Footprint","Ice Melt"],
  "Pollution": ["Air Pollution","Water Pollution", 'Plastic Pollution', "Noise Pollution"],
  "Waste Management": ["Recycling","Composting","Landfill"],
  "Biodiversity & Conservation": ["extinction","wildlife","Habitat Loss"],
  "Deforestation & Land Use": ["Forest Loss","Urbanization","Desertification", 'Afforestation'],
  "Oceans & Water Systems": ["Marine Heat","Ocean Acidification","Overfishing"],
  "Transportation": ["Electric Vehicles", 'Hydrogen Vehicles',"Public Transit","Bike Lanes"],
  "Environmental Technology": ["Green Tech","Carbon Capture","environmental monitoring systems"],
  "Natural Disasters & Resilience": ["Flooding", "Droughts", "Hurricanes", "Wildfires","Earthquakes"],
  "Renewable Material Development": ["Bioplastics","Biodegradable Packaging","Green Building Materials"],
};

let currentTopic = 'all';
const PAGE_SIZE = 20;
let visibleCount = PAGE_SIZE;
let showMoreBtn = null;

// renderResearch now uses currentTopic variable
function renderResearch() {
  const grid = document.getElementById('researchGrid');
  const filtered = currentTopic === 'all'
                ? researchData
                : researchData.filter(r => r.subtopic === currentTopic);

  // determine slicing for pagination
    const total = filtered.length;
    const display = filtered.slice(0, visibleCount);

  if (display.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">🔍</div>
        <h3>No research items found</h3>
      </div>
    `;
    return;
  }

  grid.innerHTML = display.map(item => `
    <div class="product-card variant-green animate-on-scroll" data-animate="fade-in-up">
      <div class="card-image-container">
        ${item.image ? `<img src="${item.image}" alt="${item.title}">` : `<div class="card-icon-fallback">${item.image}</div>`}
      </div>
      <div class="card-content">
        <div class="card-meta">
          <span class="card-tag">${item.subtopic}</span>
          ${item.date ? `<span class="card-date">${item.date}</span>` : ''}
        </div>
        <h3 class="card-title">${item.title}</h3>
      </div>
      <div class="card-footer">
        <a href="${item.link}" class="card-btn">View Details</a>
      </div>
    </div>
  `).join('');
  if (typeof observeScrollAnimations === 'function') observeScrollAnimations();

  // ensure show-more button exists and update visibility
  if (!showMoreBtn) createShowMoreButton();
  if (total > visibleCount) {
    showMoreBtn.classList.remove('hidden');
    showMoreBtn.classList.add('visible');
  } else {
    showMoreBtn.classList.remove('visible');
    showMoreBtn.classList.add('hidden');
  }
}

// build category dropdown controls inside the product-filters container
function setupCategoryControls() {
  const container = document.getElementById('categoryControls');
  if (!container) return;
  container.innerHTML = '';

  // add a global "Show All" button
  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn active';
  allBtn.textContent = 'Show All';
  allBtn.addEventListener('click', () => {
    currentTopic = 'all';
    // remove active from any topic link
    container.querySelectorAll('.dropdown-content a').forEach(x => x.classList.remove('active'));
    allBtn.classList.add('active');
    visibleCount = PAGE_SIZE;
    renderResearch();
  });
  container.appendChild(allBtn);

  Object.entries(mainCategories).forEach(([main, subs]) => {
    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown';
    dropdown.innerHTML = `
      <button class="filter-btn dropdown-btn">${main}</button>
      <div class="dropdown-content">
        ${subs.map(s => `<a href="#" data-topic="${s}">${s}</a>`).join('')}
      </div>
    `;
    container.appendChild(dropdown);
  });

  // attach topic listeners
  container.querySelectorAll('.dropdown-content a').forEach(a => {
    a.addEventListener('click', function(e) {
      e.preventDefault();
      container.querySelectorAll('.dropdown-content a').forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      allBtn.classList.remove('active');
      currentTopic = this.getAttribute('data-topic');
      visibleCount = PAGE_SIZE;
      renderResearch();
      // close the dropdown
      const parent = this.closest('.dropdown');
      if (parent) parent.classList.remove('open');
    });
  });

  // note: dropdowns now open on hover, no JS toggling needed
  // if you still want click behavior you can re-add handlers here
}

  // create and insert the show more button under the grid (global scope)
  function createShowMoreButton() {
    const grid = document.getElementById('researchGrid');
    if (!grid) return;
    // avoid creating twice
    if (document.getElementById('showMoreWrap')) return;
    const wrap = document.createElement('div');
    wrap.id = 'showMoreWrap';
    wrap.style.textAlign = 'center';
    wrap.style.marginTop = 'var(--show-more-gap, 1.5rem)';

    showMoreBtn = document.createElement('button');
    showMoreBtn.id = 'showMoreBtn';
    showMoreBtn.className = 'hidden';
    showMoreBtn.textContent = 'Show More';
    showMoreBtn.addEventListener('click', () => {
      visibleCount += PAGE_SIZE;
      renderResearch();
      if (typeof observeScrollAnimations === 'function') observeScrollAnimations();
    });

    wrap.appendChild(showMoreBtn);
    grid.parentNode.insertBefore(wrap, grid.nextSibling);
  }

// initialise page: load JSON then render
window.addEventListener('DOMContentLoaded', async function() {
  await loadResearchData();
  setupCategoryControls();
  renderResearch();
});