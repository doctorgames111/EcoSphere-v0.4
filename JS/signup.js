document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('signupForm');
  const usernameInput = document.getElementById('username');
  const firstNameInput = document.getElementById('firstName');
  const lastNameInput = document.getElementById('lastName');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirmPassword');

  const emailFeedback = document.getElementById('emailFeedback');
  const passwordRules = document.getElementById('passwordRules');
  const passwordGood = document.getElementById('passwordGood');

  let emailTimeout;

  // when using real backend, send signup data over API
  async function sendSignup(data) {
    const resp = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return resp.json();
  }



  function showPasswordRules(show) {
    if (show) {
      passwordRules.classList.remove('hidden');
    } else {
      passwordRules.classList.add('hidden');
    }
  }

  function updatePasswordRules(pwd) {
    const rules = validation.validatePasswordRules(pwd);
    let all = true;
    for (const rule in rules) {
      const li = passwordRules.querySelector(`li[data-rule="${rule}"]`);
      if (rules[rule]) {
        li.classList.add('valid');
        li.classList.remove('invalid');
      } else {
        li.classList.add('invalid');
        li.classList.remove('valid');
        all = false;
      }
    }
    if (all) {
      passwordGood.classList.remove('hidden');
      passwordRules.style.borderColor = 'var(--primary-600, #16a34a)';
    } else {
      passwordGood.classList.add('hidden');
      passwordRules.style.borderColor = '';
    }
  }

  function displayFieldError(input, message) {
    const err = input.closest('.form-group').querySelector('.error-message');
    if (message) {
      err.textContent = message;
    } else {
      err.textContent = '';
    }
  }

  function validateField(input) {
    const name = input.name;
    const value = input.value.trim();
    if (!value) {
      displayFieldError(input, 'This field is required');
      return false;
    }
    if (name === 'username') {
      const { valid, message } = validation.validateUsername(value);
      if (!valid) {
        displayFieldError(input, message);
        return false;
      }
    }
    if (name === 'firstName' || name === 'lastName') {
      const { valid, message } = validation.validateName(value);
      if (!valid) {
        displayFieldError(input, message);
        return false;
      }
    }
    if (name === 'email') {
      if (!validation.validateEmailFormat(value)) {
        displayFieldError(input, 'Please enter a valid email');
        return false;
      }
      // uniqueness checked via server feedback
    }
    if (name === 'password') {
      const rules = validation.validatePasswordRules(value);
      if (!rules.length || !rules.uppercase || !rules.number) {
        displayFieldError(input, 'Password does not meet requirements');
        return false;
      }
    }
    if (name === 'confirmPassword') {
      if (value !== passwordInput.value) {
        displayFieldError(input, 'Passwords do not match');
        return false;
      }
    }
    displayFieldError(input, '');
    return true;
  }

  function handleEnterNavigation(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputs = Array.from(form.querySelectorAll('input'));
      const idx = inputs.indexOf(e.target);
      if (idx === -1) return;
      // validate current
      if (!validateField(e.target)) return;
      if (idx === inputs.length - 1) {
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      } else {
        inputs[idx + 1].focus();
      }
    }
  }

  // attach listeners
  [usernameInput, firstNameInput, lastNameInput, emailInput, passwordInput, confirmInput].forEach(i => {
    i.addEventListener('keydown', handleEnterNavigation);
  });

  passwordInput.addEventListener('focus', () => showPasswordRules(true));
  passwordInput.addEventListener('blur', () => setTimeout(() => showPasswordRules(false), 200));
  passwordInput.addEventListener('input', e => {
    updatePasswordRules(e.target.value);
  });

  emailInput.addEventListener('blur', () => setTimeout(() => {
    emailFeedback.classList.remove('visible');
  }, 200));

  emailInput.addEventListener('input', () => {
    clearTimeout(emailTimeout);
    emailTimeout = setTimeout(async () => {
      const val = emailInput.value.trim();
      emailFeedback.classList.remove('valid', 'invalid');
      if (!val) {
        emailFeedback.classList.remove('valid','invalid');
        emailFeedback.classList.remove('visible');
        return;
      }
      if (!validateEmailFormat(val)) {
        emailFeedback.textContent = 'Format incorrect (need @ and domain)';
        emailFeedback.classList.remove('hidden');
        emailFeedback.classList.add('invalid');
        return;
      }
      // ask server
      try {
        const resp = await fetch(`/api/check-email?email=${encodeURIComponent(val)}`);
        const data = await resp.json();
        if (data.available) {
          emailFeedback.textContent = 'Email available';
          emailFeedback.classList.remove('invalid');
          emailFeedback.classList.add('valid','visible');
        } else {
          emailFeedback.textContent = 'Email already registered';
          emailFeedback.classList.remove('valid');
          emailFeedback.classList.add('invalid','visible');
        }
      } catch (e) {
        console.warn('availability check failed', e);
      }
    }, 400);
  });

  usernameInput.addEventListener('blur', async () => {
    const val = usernameInput.value.trim();
    if (!val) return;
    try {
      const resp = await fetch(`/api/check-username?username=${encodeURIComponent(val)}`);
      const data = await resp.json();
      if (!data.available) {
        displayFieldError(usernameInput, 'Username already taken');
      }
    } catch (e) {
      console.warn(e);
    }
  });

  // capitalize name fields on blur
  [firstNameInput, lastNameInput].forEach(inp => {
    inp.addEventListener('blur', () => {
      const v = inp.value.trim();
      if (v) {
        inp.value = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
      }
    });
  });

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    // re-validate all
    let valid = true;
    [usernameInput, firstNameInput, lastNameInput, emailInput, passwordInput, confirmInput].forEach(i => {
      if (!validateField(i)) valid = false;
    });
    if (!valid) {
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    const payload = {
      username: usernameInput.value.trim(),
      firstName: firstNameInput.value.trim(),
      lastName: lastNameInput.value.trim(),
      email: emailInput.value.trim(),
      password: passwordInput.value
    };
    try {
      const result = await sendSignup(payload);
      if (result.error) {
        showNotification(result.error, 'error');
        btn.disabled = false;
        btn.textContent = 'Create Account';
        return;
      }
      showNotification('Account created successfully!', 'success');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1000);
    } catch (err) {
      console.error(err);
      showNotification('Something went wrong, please try again later', 'error');
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });

  // load accounts into cache

});
