// Team member data (will be loaded from JSON)
let teamMembers = [];

// Load team members from JSON
async function loadTeamMembers() {
  try {
    const response = await fetch('../JSON/team-members.json');
    teamMembers = await response.json();
    renderTeamCards();
  } catch (err) {
    console.error('Error loading team members:', err);
    renderTeamCards();
  }
}

// Profanity list
const profanityList = [
  'shit', 'fuck', 'pussy', 'ass', 'asshole', 'damn', 'nigga', 'fucker'
];

// ===== TEAM CARDS FUNCTIONALITY =====
function renderTeamCards() {
  const teamGrid = document.getElementById('teamGrid');
  const cardHint = document.getElementById('cardHint');

  teamGrid.innerHTML = teamMembers.map(member => `
    <div class="team-card-container animate-on-scroll" data-animate="fade-in-up">
      <div class="team-card">
        <div class="team-card-face team-card-front">
          <img src="${member.image}" alt="${member.name}" class="team-photo" onerror="this.src='../MultiMedia/Images/placeholder.jpg'">
          <h3 class="team-name">${member.name}</h3>
          <p class="team-role">${member.role}</p>
        </div>
        <div class="team-card-face team-card-back">
          <div class="team-bio">${member.bio}</div>
          <div class="team-quote">"${member.goals}"</div>
        </div>
      </div>
    </div>
  `).join('');

  // Attach click handlers to cards
  document.querySelectorAll('.team-card-container').forEach(container => {
    container.addEventListener('click', function() {
      const card = this.querySelector('.team-card');
      card.classList.toggle('flipped');

      // Hide hint on first click
      if (cardHint && !cardHint.classList.contains('fade-out')) {
        cardHint.classList.add('fade-out');
      }
    });
  });

  // Observe animations on scroll
  if (typeof observeScrollAnimations === 'function') {
    observeScrollAnimations();
  }
}

// ===== EMAIL VALIDATION =====
function validateEmailFormat(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// ===== PROFANITY CHECK =====
function checkProfanity(text) {
  const lowerText = text.toLowerCase();
  return profanityList.some(word => lowerText.includes(word));
}

// ===== FORM VALIDATION =====
function validateContactField(input) {
  const name = input.name;
  const value = input.value.trim();
  const errorContainer = input.closest('.form-group').querySelector('.error-message');

  if (!value) {
    if (errorContainer) errorContainer.textContent = 'This field is required';
    return false;
  }

  if (name === 'fullName') {
    if (value.length < 3) {
      if (errorContainer) errorContainer.textContent = 'Name must be at least 3 characters';
      return false;
    }
    if (value.length > 50) {
      if (errorContainer) errorContainer.textContent = 'Name must be less than 50 characters';
      return false;
    }
  }

  if (name === 'email') {
    if (!validateEmailFormat(value)) {
      if (errorContainer) errorContainer.textContent = 'Please enter a valid email address';
      return false;
    }
  }

  if (name === 'message') {
    if (value.length < 10) {
      if (errorContainer) errorContainer.textContent = 'Message must be at least 10 characters';
      return false;
    }
    if (value.length > 2000) {
      if (errorContainer) errorContainer.textContent = 'Message must not exceed 2000 characters';
      return false;
    }
    // Check for profanity
    if (checkProfanity(value)) {
      if (errorContainer) errorContainer.textContent = 'Message contains inappropriate content';
      return false;
    }
  }

  if (errorContainer) errorContainer.textContent = '';
  return true;
}

// ===== EMAIL EXISTENCE CHECK =====
let emailTimeout;
async function checkEmailExists(email, feedbackElement) {
  if (!validateEmailFormat(email)) return;

  clearTimeout(emailTimeout);
  emailTimeout = setTimeout(async () => {
    try {
      const resp = await fetch('/api/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await resp.json();

      if (feedbackElement) {
        if (data.exists) {
          feedbackElement.textContent = '✓ Email already registered';
          feedbackElement.classList.remove('invalid');
          feedbackElement.classList.add('valid', 'visible');
        } else {
          feedbackElement.textContent = '✓ Email is available';
          feedbackElement.classList.remove('invalid');
          feedbackElement.classList.add('valid', 'visible');
        }
      }
    } catch (e) {
      console.log('Email check unavailable');
    }
  }, 400);
}

// ===== PROFANITY WARNING =====
function updateProfanityWarning(textarea) {
  const warning = textarea.closest('.form-group').querySelector('.profanity-warning');
  const value = textarea.value.toLowerCase();

  if (warning) {
    if (checkProfanity(value)) {
      warning.classList.add('visible');
    } else {
      warning.classList.remove('visible');
    }
  }
}

// ===== SEND EMAIL =====
async function sendContactEmail(data) {
  try {
    const resp = await fetch('/api/send-contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return resp.json();
  } catch (err) {
    return { success: false, error: 'Network error' };
  }
}

// ===== SHOW CONFIRMATION =====
let pendingEmailData = null;
function showConfirmation(emailData) {
  pendingEmailData = emailData;
  document.getElementById('confirmOverlay').classList.add('visible');
  document.getElementById('confirmDialog').classList.add('visible');
}

function hideConfirmation() {
  document.getElementById('confirmOverlay').classList.remove('visible');
  document.getElementById('confirmDialog').classList.remove('visible');
  pendingEmailData = null;
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', async function() {
  // Load team members first
  await loadTeamMembers();

  // Form element references
  const contactForm = document.getElementById('contactForm');
  const nameInput = document.getElementById('contactName');
  const emailInput = document.getElementById('contactEmail');
  const messageInput = document.getElementById('contactMessage');
  const emailFeedback = document.getElementById('emailFeedbackContact');
  const profanityWarning = document.getElementById('profanityWarning');
  const submitBtn = contactForm.querySelector('button[type="submit"]');

  // Real-time validation
  [nameInput, emailInput, messageInput].forEach(input => {
    input.addEventListener('blur', () => validateContactField(input));
    input.addEventListener('input', () => validateContactField(input));
  });

  // Email existence check
  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      setTimeout(() => {
        emailFeedback.classList.remove('visible');
      }, 200);
    });

    emailInput.addEventListener('input', () => {
      if (validateEmailFormat(emailInput.value.trim())) {
        checkEmailExists(emailInput.value.trim(), emailFeedback);
      }
    });
  }

  // Profanity warning on message input
  if (messageInput) {
    messageInput.addEventListener('input', () => {
      updateProfanityWarning(messageInput);
    });
  }

  // Form submission
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // Validate all fields
    let isValid = true;
    [nameInput, emailInput, messageInput].forEach(input => {
      if (!validateContactField(input)) {
        isValid = false;
      }
    });

    if (!isValid) {
      showNotification('Please fix the errors above', 'error');
      return;
    }

    // Check for profanity in message
    if (checkProfanity(messageInput.value)) {
      showNotification('Please remove inappropriate content from your message', 'error');
      return;
    }

    // Show confirmation
    showConfirmation({
      fullName: nameInput.value.trim(),
      email: emailInput.value.trim(),
      message: messageInput.value.trim(),
      to: 'youssefbhaa2010@gmail.com'
    });
  });

  // Confirmation dialog - Send
  document.getElementById('confirmSend').addEventListener('click', async () => {
    const data = pendingEmailData;
    hideConfirmation();

    // Disable button and show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const result = await sendContactEmail(data);

      if (result.success) {
        showNotification('✓ Message sent successfully! We\'ll get back to you soon.', 'success');
        contactForm.reset();
        profanityWarning.classList.remove('visible');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';

        // Reset form after notification
        setTimeout(() => {
          // Clear any feedback elements
          document.querySelectorAll('.error-message').forEach(el => (el.textContent = ''));
          document.querySelectorAll('.feedback-box').forEach(el => el.classList.remove('visible'));
        }, 300);
      } else {
        showNotification('Failed to send message. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }
    } catch (err) {
      showNotification('An error occurred. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });

  // Confirmation dialog - Cancel
  document.getElementById('confirmCancel').addEventListener('click', hideConfirmation);

  // Overlay click to close confirmation
  document.getElementById('confirmOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
      hideConfirmation();
    }
  });

  // Scroll animations
  if (typeof observeScrollAnimations === 'function') {
    observeScrollAnimations();
  }
});
