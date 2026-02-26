class FooterComponent extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    const currentYear = new Date().getFullYear();
    shadow.innerHTML = `
      <link rel="stylesheet" href="../SCSS/footer.css">
      <footer class="site-footer">
        <div class="footer-left">
          <p class="footer-copy">&copy; ${currentYear} Ecosphere. All rights reserved.</p>
        </div>
        <nav class="footer-right">
          <a href="../HTML/index.html">Home</a>
          <a href="../HTML/about.html">About</a>
        </nav>
      </footer>
    `;
  }
}

customElements.define('footer-component', FooterComponent);