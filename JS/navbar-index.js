class NavbarComponent extends HTMLElement {
  connectedCallback() {
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = `
        <link rel="stylesheet" href="SCSS/navbar.css">
            <nav class="navbar">
              <div class="navbar-links">
                <ul>
                <li><a href="index.html" class="active">Home</a></li>
                <li><a href="HTML/challenges-main.html">Challenges</a></li>
                <li><a href="HTML/solutions-main.html">Solutions</a></li>
                <li><a href="HTML/ai.html">Eco AI</a></li>
                <li><a href="HTML/research-main.html">Research & Data</a></li>
                <li><a href="HTML/news-main.html">News</a></li>
                <li><a href="HTML/about.html">About</a></li>
                </ul>
              </div>
              <div class="navbar-login">
                <ul id="auth-section">
                  <li class="theme-toggle-li">
                    <button id="themeToggleBtn" class="theme-toggle-btn" title="Toggle dark mode">
                      <i class="fas fa-moon"></i>
                    </button>
                  </li>
                  <li><a href="HTML/login.html">Login</a></li>
                  <li><a href="HTML/signup.html">Sign Up</a></li>
                </ul>
              </div>
            </nav>
        `;

    // Apply initial theme
    this.applyTheme();

    // Theme toggle button listener
    const themeBtn = shadowRoot.getElementById("themeToggleBtn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        this.toggleTheme();
      });
    }

    // Handle active state on page load
    this.setActiveLink();

    // Scroll behaviour: solid background after a bit of scrolling
    const nav = shadowRoot.querySelector(".navbar");
    const isIndex =
      window.location.pathname.endsWith("index.html") ||
      window.location.pathname === "/" ||
      window.location.pathname === "";
    function updateNavBackground() {
      if (!isIndex) {
        nav.classList.add("navbar-solid");
        return;
      }
      if (window.scrollY > 60) {
        nav.classList.add("navbar-solid");
      } else {
        nav.classList.remove("navbar-solid");
      }
    }
    window.addEventListener("scroll", updateNavBackground);
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
    window.addEventListener("userLoggedIn", (e) => {
      this.updateAuthSection(shadowRoot);
    });

    // Listen for theme changes from other tabs
    window.addEventListener("storage", (e) => {
      if (e.key === "theme") {
        this.applyTheme();
      }
    });
  }

  applyTheme() {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = savedTheme ? savedTheme : prefersDark ? "dark" : "light";

    if (theme === "dark") {
      document.documentElement.classList.add("dark-mode");
      // inject dark mode stylesheet if not already present
      if (!document.getElementById("dark-mode-css")) {
        const themeLink = document.createElement("link");
        themeLink.rel = "stylesheet";
        themeLink.id = "dark-mode-css";
        themeLink.href = "../SCSS/dark-mode.css";
        document.head.appendChild(themeLink);
      }
    } else {
      document.documentElement.classList.remove("dark-mode");
      // remove dark mode stylesheet
      const darkLink = document.getElementById("dark-mode-css");
      if (darkLink) {
        darkLink.remove();
      }
    }

    // Update icon
    const themeBtn = this.shadowRoot?.getElementById("themeToggleBtn");
    if (themeBtn) {
      const icon = themeBtn.querySelector("i");
      if (icon) {
        if (theme === "dark") {
          icon.className = "fas fa-sun";
        } else {
          icon.className = "fas fa-moon";
        }
      }
    }

    document.body.setAttribute("data-theme", theme);
  }

  toggleTheme() {
    const currentTheme =
      localStorage.getItem("theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    this.applyTheme();
    // Dispatch event so other components know about theme change
    window.dispatchEvent(
      new CustomEvent("themeChanged", { detail: { theme: newTheme } }),
    );
  }

  updateAuthSection(shadowRoot) {
    const authSection = shadowRoot.getElementById("auth-section");
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
      // User is logged in
      const firstName = user.first_name || "User";
      const profileImage =
        user.profile_image || "../MultiMedia/Images/default-user-icon.webp";
      authSection.innerHTML = `
        <li class="profile-item">
          <button class="profile-btn">
            <img src="${profileImage}" alt="Profile" class="profile-avatar" />
            <span class="profile-name">${firstName}</span>
          </button>
          <div class="profile-dropdown">
            <a href="../HTML/account.html" class="dropdown-link">Your Account</a>
            <a href="#" class="dropdown-link logout-btn">Logout</a>
          </div>
        </li>
      `;

      // Add logout handler
      const logoutBtn = authSection.querySelector(".logout-btn");
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        window.location.href = "../HTML/index.html";
      });

      // Add dropdown toggle
      const profileBtn = authSection.querySelector(".profile-btn");
      profileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const dropdown = authSection.querySelector(".profile-dropdown");
        dropdown.classList.toggle("show");
      });

      // Close dropdown when clicking outside
      document.addEventListener("click", () => {
        const dropdown = authSection.querySelector(".profile-dropdown");
        if (dropdown) {
          dropdown.classList.remove("show");
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
