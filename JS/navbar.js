class NavbarComponent extends HTMLElement {
  connectedCallback() {
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = `
        <link rel="stylesheet" href="../SCSS/navbar.css">
            <nav class="navbar">
              <div class="navbar-links">
                <ul>
                <li><a href="../HTML/index.html" class="active">Home</a></li>
                <li><a href="../HTML/challenges-main.html">Challenges</a></li>
                <li><a href="../HTML/solutions-main.html">Solutions</a></li>
                <li><a href="../HTML/ai.html">Eco AI</a></li>
                <li><a href="../HTML/research-main.html">Researches & Data</a></li>
                <li><a href="../HTML/news-main.html">News</a></li>
                <li><a href="../HTML/about.html">About</a></li>
                </ul>
              </div>
              <div class="navbar-login">
                <ul id="auth-section">
                  <li><a href="../HTML/login.html">Login</a></li>
                  <li><a href="../HTML/signup.html">Sign Up</a></li>
                </ul>
              </div>
            </nav>
        `;

    // Handle active state on page load
    this.setActiveLink();

    // Scroll behaviour: solid background after a bit of scrolling
    const nav = shadowRoot.querySelector('.navbar');
    const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '';
    function updateNavBackground() {
      if (!isIndex) {
        nav.classList.add('navbar-solid');
        return;
      }
      if (window.scrollY > 60) {
        nav.classList.add('navbar-solid');
      } else {
        nav.classList.remove('navbar-solid');
      }
    }
    window.addEventListener('scroll', updateNavBackground);
    // initial state
    updateNavBackground();

    // Add click handlers
    const links = shadowRoot.querySelectorAll("a");
    links.forEach((link) => {
      link.addEventListener("click", (e) => {
        links.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
      });
    });
    
    // Check for logged in user
    this.updateAuthSection(shadowRoot);
    
    // Listen for login event
    window.addEventListener('userLoggedIn', (e) => {
      this.updateAuthSection(shadowRoot);
    });
  }

  updateAuthSection(shadowRoot) {
    const authSection = shadowRoot.getElementById('auth-section');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (user) {
      // User is logged in
      const firstName = user.first_name || 'User';
      authSection.innerHTML = `
        <li class="profile-item">
          <button class="profile-btn">
            <img src="../MultiMedia/Images/default-user-icon.webp" alt="Profile" class="profile-avatar" />
            <span class="profile-name">${firstName}</span>
          </button>
          <div class="profile-dropdown">
            <a href="../HTML/not-implemented.html" class="dropdown-link">Dashboard</a>
            <a href="../HTML/not-implemented.html" class="dropdown-link">Account Settings</a>
            <a href="#" class="dropdown-link logout-btn">Logout</a>
          </div>
        </li>
      `;
      
      // Add logout handler
      const logoutBtn = authSection.querySelector('.logout-btn');
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('user');
        window.location.href = '../HTML/index.html';
      });
      
      // Add dropdown toggle
      const profileBtn = authSection.querySelector('.profile-btn');
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = authSection.querySelector('.profile-dropdown');
        dropdown.classList.toggle('show');
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        const dropdown = authSection.querySelector('.profile-dropdown');
        if (dropdown) {
          dropdown.classList.remove('show');
        }
      });
    }
  }

  setActiveLink() {
    const shadowRoot = this.shadowRoot;
    const links = shadowRoot.querySelectorAll(".navbar a");
    const currentUrl = window.location.pathname;

    links.forEach((link) => {
      if (link.href.includes(currentUrl)) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }
}

customElements.define("navbar-component", NavbarComponent);

