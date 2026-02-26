// fetch latest environmental news from backend with filters, pagination
let newsData = [];
let totalResults = 0;             // total available from server
let currentPage = 1;
let currentTerm = '';
let currentCategory = 'all';
let isLoading = false;

function showLoader(on) {
  const o = document.getElementById('loadingOverlay');
  if (!o) return;
  if (on) o.classList.remove('hidden');
  else o.classList.add('hidden');
}

async function loadNews(page = 1, append = false) {
  if (isLoading) return;
  isLoading = true;
  showLoader(true);
  try {
    const params = new URLSearchParams();
    if (currentTerm) params.set('q', currentTerm);
    if (currentCategory && currentCategory !== 'all') params.set('category', currentCategory);
    params.set('page', page);
    const resp = await fetch('/api/news?' + params.toString());
    if (!resp.ok) throw new Error('Failed to retrieve news');
    const json = await resp.json();
    if (json.error) {
      // propagate any message the server returned so we can surface it
      throw new Error(json.error);
    }
    totalResults = json.totalResults || 0;
    const articles = json.articles || [];
    if (append) {
      newsData = newsData.concat(articles);
    } else {
      newsData = articles;
    }
    renderNews();
  } catch (err) {
    console.error('News load error:', err);
    const grid = document.getElementById('newsGrid');
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><h3>Unable to load news</h3><p>${err.message}</p></div>`;
  } finally {
    showLoader(false);
    isLoading = false;
  }
}

function renderNews() {
  const grid = document.getElementById('newsGrid');
  const showMoreBtn = document.getElementById('showMoreBtn');
  if (newsData.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">📰</div>
        <h3>No articles found</h3>
        <p>Try again later.</p>
      </div>
    `;
    showMoreBtn.style.display = 'none';
    return;
  }

  grid.innerHTML = newsData.map(item => `
    <div class="product-card variant-green animate-on-scroll" data-animate="fade-in-up">
      <div class="card-image-container">
        ${item.thumbnail ? `<img src="${item.thumbnail}" alt="${item.title}">` : `<div class="card-icon-fallback">📰</div>`}
      </div>
      <div class="card-content">
        <span class="card-tag">${item.section || 'News'}</span>
        <h3 class="card-title">${item.title}</h3>
        <p class="card-description">${(item.snippet||'').length>120 ? item.snippet.slice(0,120)+'...' : item.snippet}</p>
      </div>
      <div class="card-footer">
        <a href="${item.url}" target="_blank" class="card-btn">Read More</a>
      </div>
    </div>
  `).join('');

  if (typeof observeScrollAnimations === 'function') observeScrollAnimations();
  if (newsData.length < currentPage * 20) {
    showMoreBtn.style.display = 'none';
  } else {
    showMoreBtn.style.display = 'inline-block';
  }
}



// initialization and event listeners
window.addEventListener('DOMContentLoaded', function() {
  const filterBtns = document.querySelectorAll('.filter-categories .filter-btn');
  const searchInput = document.getElementById('newsSearch');
  const searchBtn = document.getElementById('searchBtn');
  const showMoreBtn = document.getElementById('showMoreBtn');

  // category clicks
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentCategory = this.getAttribute('data-filter');
      // if user selected "all", clear any search term so that it really shows everything
      if (currentCategory === 'all') {
        currentTerm = '';
        if (searchInput) searchInput.value = '';
      }
      currentPage = 1;
      loadNews(currentPage, false);
    });
  });

  // search
  function doSearch() {
    currentTerm = searchInput.value.trim();
    currentPage = 1;
    loadNews(currentPage, false);
  }
  searchBtn.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doSearch();
  });

  // show more
  showMoreBtn.addEventListener('click', function() {
    currentPage += 1;
    loadNews(currentPage, true);
  });

  loadNews();
});
