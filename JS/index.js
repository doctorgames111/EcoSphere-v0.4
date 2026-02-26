// Hero section button functionality
document.addEventListener('DOMContentLoaded', function() {
  const solutionsBtn = document.querySelector('.hero-btn-solutions');
  const challengesBtn = document.querySelector('.hero-btn-challenges');
  const aiBtn = document.querySelector('.hero-btn-ai');

  // Explore Solutions button - scroll to solutions section
  if (solutionsBtn) {
    solutionsBtn.addEventListener('click', function() {
      const solutionsSection = document.querySelector('.solutions');
      if (solutionsSection) {
        solutionsSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Discover Challenges button - scroll to challenges section
  if (challengesBtn) {
    challengesBtn.addEventListener('click', function() {
      const challengesSection = document.querySelector('.challenges');
      if (challengesSection) {
        challengesSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Ask the Environmental AI button - scroll to AI section
  if (aiBtn) {
    aiBtn.addEventListener('click', function() {
      const aiSection = document.querySelector('.ai-assistant');
      if (aiSection) {
        aiSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
});
