class FooterComponent extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    const currentYear = new Date().getFullYear();
    shadow.innerHTML = `
      <link rel="stylesheet" href="SCSS/footer.css">
      <style>
        :host-context(html.dark-mode) .site-footer {
          background: linear-gradient(180deg, rgba(10, 14, 20, 0.95), rgba(10, 14, 20, 0.9)) !important;
          color: #f3f4f6 !important;
          border-top-color: rgba(255, 255, 255, 0.08) !important;
        }
        :host-context(html.dark-mode) .footer-copy {
          color: #f3f4f6 !important;
        }
        :host-context(html.dark-mode) a {
          color: #f3f4f6 !important;
        }
        :host-context(html.dark-mode) a:hover {
          color: #22c55e !important;
        }
      </style>
      <footer class="site-footer">
        <div class="footer-left">
          <p class="footer-copy">&copy; ${currentYear} Ecosphere. All rights reserved.</p>
        </div>
        <nav class="footer-right">
          <a href="index.html">Home</a>
          <a href="HTML/about.html">About</a>
        </nav>
      </footer>
    `;
  }
}

customElements.define("footer-component", FooterComponent);
