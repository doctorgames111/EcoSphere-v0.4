document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const identifier = form.email.value.trim();
      const pwd = form.password.value;
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Checking...';
      // decide if identifier is email
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      const payload = isEmail ? { email: identifier, password: pwd } : { username: identifier, password: pwd };
      try {
        const resp = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await resp.json();
        if (data.error) {
          // Show specific error based on input format
          const fieldType = isEmail ? 'email' : 'username';
          showNotification(`Your ${fieldType} or password is incorrect`, 'error');
          console.log(`Login failed for ${fieldType}:`, data.error);
        } else {
          // store user data in localStorage and sessionStorage
          localStorage.setItem('user', JSON.stringify(data.user));
          sessionStorage.setItem('user', JSON.stringify(data.user));
          showNotification('Login successful!', 'success');
          console.log('Login success:', data.user);
          
          // dispatch event so navbar updates
          window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: data.user }));
          
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1000);
        }
      } catch (err) {
        console.error(err);
        showNotification('Something went wrong, please try again later', 'error');
      }
      btn.disabled = false;
      btn.textContent = 'Log In';
    });
  }
});