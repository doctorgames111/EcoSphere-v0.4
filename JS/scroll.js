// Scroll-triggered animations using IntersectionObserver

// create observer once
const scrollObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const elt = entry.target;
      const anim = elt.getAttribute('data-animate');
      if (anim) {
        elt.classList.add(`animate-${anim}`);
      }
      elt.classList.add('visible');
      obs.unobserve(elt);
    }
  });
}, { threshold: 0.1 });

function observeScrollAnimations() {
  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    // avoid observing twice
    if (!el.__scrollObserved) {
      scrollObserver.observe(el);
      el.__scrollObserved = true;
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  observeScrollAnimations();
});