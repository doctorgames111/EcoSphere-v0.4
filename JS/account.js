// account.js - handles account info display and edits

document.addEventListener('DOMContentLoaded', function() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    // not logged in
    window.location.href = 'login.html';
    return;
  }

  // render sidebar tabs
  setupTabs();

  // populate info section
  renderAccountInfo(user);
  
  // load profile image
  loadProfileImage(user);

  // load and apply theme preference
  loadTheme();

  // attach global click handler for edit icons
  document.body.addEventListener('click', handleBodyClick);
  
  // setup image upload handlers
  setupImageUpload();

  // initialize theme selector dropdown (prefs tab)
  setupThemeSelector();
});

function loadProfileImage(user) {
  const imgEl = document.getElementById('profileImageDisplay');
  if (user.profile_image) {
    imgEl.src = user.profile_image;
  } else {
    imgEl.src = '../MultiMedia/Images/default-user-icon.webp';
  }
}

// theme helpers --------------------------------------------------
function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

function loadTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  applyTheme(theme);
  const display = document.getElementById('currentTheme');
  if (display) {
    display.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
  }
  // highlight current option in dropdown if present
  updateDropdownSelection(theme);
}

function updateDropdownSelection(theme) {
  const selector = document.querySelector('.theme-selector');
  if (!selector) return;
  selector.querySelectorAll('.theme-dropdown li').forEach(li => {
    if (li.dataset.theme === theme) {
      li.classList.add('selected');
    } else {
      li.classList.remove('selected');
    }
  });
}

function setupThemeSelector() {
  const selector = document.querySelector('.theme-selector');
  if (!selector) return;
  const display = selector.querySelector('#currentTheme');
  const dropdown = selector.querySelector('.theme-dropdown');

  selector.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('visible');
    selector.classList.toggle('open');
  });

  selector.querySelectorAll('.theme-dropdown li').forEach(li => {
    li.addEventListener('click', (e) => {
      const t = li.dataset.theme;
      applyTheme(t);
      updateDropdownSelection(t);
      if (display) display.textContent = t.charAt(0).toUpperCase() + t.slice(1);
      dropdown.classList.remove('visible');
      selector.classList.remove('open');
    });
  });

  document.addEventListener('click', (e) => {
    if (selector && !selector.contains(e.target)) {
      dropdown.classList.remove('visible');
      selector.classList.remove('open');
    }
  });
}


function setupImageUpload() {
  const uploadBtn = document.getElementById('uploadImageBtn');
  const overlay = document.getElementById('imageUploadOverlay');
  const dialog = document.getElementById('imageUploadDialog');
  const cancelBtn = document.getElementById('imageUploadCancel');
  const confirmBtn = document.getElementById('imageUploadConfirm');
  const fileInput = document.getElementById('imageFileInput');

  uploadBtn.addEventListener('click', () => {
    overlay.classList.add('visible');
    dialog.classList.add('visible');
    fileInput.value = '';
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('imageProgress').style.display = 'none';
  });

  cancelBtn.addEventListener('click', () => {
    overlay.classList.remove('visible');
    dialog.classList.remove('visible');
  });

  overlay.addEventListener('click', () => {
    overlay.classList.remove('visible');
    dialog.classList.remove('visible');
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // validate file size (2 MB)
    if (file.size > 2 * 1024 * 1024) {
      showNotification('File size must be less than 2 MB', 'error');
      fileInput.value = '';
      return;
    }

    // validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      showNotification('Only JPG and PNG files are allowed', 'error');
      fileInput.value = '';
      return;
    }

    // preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = document.getElementById('imagePreview');
      preview.innerHTML = `<img src="${event.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 8px; object-fit: cover;">`;
    };
    reader.readAsDataURL(file);
  });

  confirmBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) {
      showNotification('Please select an image', 'error');
      return;
    }

    await uploadProfileImage(file, confirmBtn);
  });
}

async function uploadProfileImage(file, confirmBtn) {
  const user = JSON.parse(localStorage.getItem('user'));
  const reader = new FileReader();

  reader.onload = async (event) => {
    const base64Image = event.target.result;

    // show progress
    document.getElementById('imageProgress').style.display = 'block';
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Uploading...';

    try {
      const resp = await fetch('/api/upload-profile-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          image: base64Image
        })
      });

      const data = await resp.json();

      if (!resp.ok) {
        showNotification(data.error || 'Upload failed', 'error');
        return;
      }

      // update local storage and session storage
      user.profile_image = base64Image;
      localStorage.setItem('user', JSON.stringify(user));
      sessionStorage.setItem('user', JSON.stringify(user));

      // reload image
      document.getElementById('profileImageDisplay').src = base64Image;

      // update navbar
      const navEl = document.querySelector('navbar-component');
      if (navEl) {
        navEl.updateAuthSection(navEl.shadowRoot);
      }

      showNotification('Profile photo updated successfully', 'success');

      // close dialog
      setTimeout(() => {
        document.getElementById('imageUploadOverlay').classList.remove('visible');
        document.getElementById('imageUploadDialog').classList.remove('visible');
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Upload';
        document.getElementById('imageProgress').style.display = 'none';
        document.getElementById('progressBar').style.width = '0%';
      }, 500);
    } catch (err) {
      console.error(err);
      showNotification('Network error', 'error');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Upload';
    }
  };

  reader.readAsDataURL(file);
}


function setupTabs() {
  const tabs = document.querySelectorAll('.account-nav li');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // remove active from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      // set clicked tab as active
      tab.classList.add('active');
      // hide all content sections
      document.querySelectorAll('.account-content').forEach(sec => {
        sec.classList.remove('visible');
      });
      // show only the target section
      const target = tab.dataset.tab;
      const targetSection = document.getElementById(target);
      if (targetSection) {
        targetSection.classList.add('visible');
      }
    });
  });

  // trigger the initial active tab to show its content
  const initial = document.querySelector('.account-nav li.active');
  if (initial) {
    initial.click();
  }
}

function maskEmail(email) {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const first = local.charAt(0);
  return first + '***@' + domain;
}

function renderAccountInfo(user) {
  const container = document.getElementById('accountInfo');
  container.innerHTML = '';
  const fields = [
    { label: 'Username', key: 'username' },
    { label: 'First Name', key: 'first_name' },
    { label: 'Last Name', key: 'last_name' },
    { label: 'Email Address', key: 'email' },
    { label: 'Password', key: 'password' }
  ];
  fields.forEach(f => {
    let value = user[f.key] || '';
    if (f.key === 'email') value = maskEmail(value);
    if (f.key === 'password') value = '********';
    const row = document.createElement('div');
    row.className = 'info-row';
    row.innerHTML = `
      <span class="field-label">${f.label}:</span>
      <span class="field-value">${value}</span>
      <i class="fas fa-pen edit-icon" data-field="${f.key}"></i>
    `;
    container.appendChild(row);
  });
}

// handle click events for edit icons or dialog buttons
function handleBodyClick(e) {
  if (e.target.closest('.edit-icon')) {
    const field = e.target.closest('.edit-icon').dataset.field;
    openEditDialog(field);
  }
  if (e.target.id === 'editCancel') {
    closeEditDialog();
  }
  if (e.target.id === 'editConfirm') {
    submitEditDialog();
  }
}

let currentEditField = null;
let lockUntil = null; // timestamp when user may try again (client-side)

function openEditDialog(field) {
  if (lockUntil && Date.now() < lockUntil) {
    const remaining = Math.ceil((lockUntil - Date.now()) / 60000);
    showNotification(`Too many attempts, try again in ${remaining} min`, 'error');
    return;
  }
  currentEditField = field;
  const title = document.getElementById('editTitle');
  const body = document.getElementById('editBody');
  title.textContent = `Edit ${prettyField(field)}`;
  body.innerHTML = '';

  // always ask for password
  if (field === 'email') {
    body.innerHTML = `
      <label>Old Email</label><input type="email" id="oldEmail" class="edit-input" />
      <label>Password</label><input type="password" id="oldPassword" class="edit-input" />
      <label>New Email</label><input type="email" id="newValue" class="edit-input" />
    `;
  } else if (field === 'password') {
    body.innerHTML = `
      <label>Email</label><input type="email" id="oldEmail" class="edit-input" />
      <label>Old Password</label><input type="password" id="oldPassword" class="edit-input" />
      <label>New Password</label><input type="password" id="newValue" class="edit-input" />
    `;
  } else {
    // username, first_name, last_name
    body.innerHTML = `
      <label>Password</label><input type="password" id="oldPassword" class="edit-input" />
      <label>New ${prettyField(field)}</label><input id="newValue" class="edit-input" />
    `;
  }

  document.getElementById('editOverlay').classList.add('visible');
  const dlg = document.getElementById('editDialog');
  dlg.classList.add('visible');
}

function closeEditDialog() {
  document.getElementById('editOverlay').classList.remove('visible');
  const dlg = document.getElementById('editDialog');
  dlg.classList.remove('visible');
  currentEditField = null;
}

function prettyField(key) {
  switch(key) {
    case 'first_name': return 'First Name';
    case 'last_name': return 'Last Name';
    case 'password': return 'Password';
    case 'email': return 'Email Address';
    default: return key.charAt(0).toUpperCase() + key.slice(1);
  }
}

async function submitEditDialog() {
  const user = JSON.parse(localStorage.getItem('user'));
  const newValueEl = document.getElementById('newValue');
  const oldPassEl = document.getElementById('oldPassword');
  const oldEmailEl = document.getElementById('oldEmail');
  const newVal = newValueEl ? newValueEl.value.trim() : '';
  const oldPass = oldPassEl ? oldPassEl.value : '';
  const oldEmail = oldEmailEl ? oldEmailEl.value.trim() : '';

  if (!oldPass && currentEditField !== 'email') {
    showNotification('Password required', 'error');
    return;
  }
  if ((currentEditField === 'email' || currentEditField === 'password') && !oldEmail) {
    showNotification('Email required', 'error');
    return;
  }
  if (!newVal) {
    showNotification('New value required', 'error');
    return;
  }

  // field-specific validation using shared utilities
  let validationResult;
  switch(currentEditField) {
    case 'username':
      validationResult = validation.validateUsername(newVal);
      if (!validationResult.valid) {
        showNotification(validationResult.message, 'error');
        return;
      }
      break;
    case 'first_name':
    case 'last_name':
      validationResult = validation.validateName(newVal);
      if (!validationResult.valid) {
        showNotification(validationResult.message, 'error');
        return;
      }
      break;
    case 'email':
      if (!validation.validateEmailFormat(newVal)) {
        showNotification('Please provide a valid email address', 'error');
        return;
      }
      break;
    case 'password':
      const rules = validation.validatePasswordRules(newVal);
      if (!rules.length || !rules.uppercase || !rules.number) {
        showNotification('Password must be ≥8 chars, include uppercase and number', 'error');
        return;
      }
      break;

  }

  // build payload
  const payload = {
    id: user.id,
    field: currentEditField,
    newValue: newVal,
    currentPassword: oldPass,
    currentEmail: oldEmail
  };

  try {
    const resp = await fetch('/api/update-account', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if (!resp.ok) {
      if (resp.status === 429) {
        // too many attempts
        lockUntil = Date.now() + (data.retryAfter || 3600000);
        showNotification(data.error || 'Too many attempts', 'error');
      } else {
        showNotification(data.error || 'Update failed', 'error');
      }
      return;
    }

    // success
    // update local/session storage
    if (currentEditField === 'email') user.email = newVal;
    if (currentEditField === 'username') user.username = newVal;
    if (currentEditField === 'first_name') user.first_name = newVal;
    if (currentEditField === 'last_name') user.last_name = newVal;
    // do not store password or pin in storage
    localStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('user', JSON.stringify(user));

    showNotification('Updated successfully', 'success');
    // update navbar auth section in case username/email changed
    const navEl = document.querySelector('navbar-component');
    if (navEl) {
      navEl.updateAuthSection(navEl.shadowRoot);
    }
    closeEditDialog();
    renderAccountInfo(user);
  } catch (err) {
    console.error(err);
    showNotification('Network error', 'error');
  }
}
