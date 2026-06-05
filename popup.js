document.addEventListener('DOMContentLoaded', () => {
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const saveBtn = document.getElementById('saveBtn');
  const statusEl = document.getElementById('status');

  // Load saved credentials securely
  chrome.storage.local.get(['rvce_username', 'rvce_password'], (result) => {
    if (result.rvce_username) usernameInput.value = result.rvce_username;
    if (result.rvce_password) passwordInput.value = result.rvce_password;
  });

  saveBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      statusEl.style.color = '#ef4444'; // Error red
      statusEl.innerHTML = 'Please fill all fields';
      statusEl.style.opacity = '1';
      setTimeout(() => { statusEl.style.opacity = '0'; }, 2000);
      return;
    }

    // Save logic
    chrome.storage.local.set({
      rvce_username: username,
      rvce_password: password
    }, () => {
      // Show success
      statusEl.style.color = 'var(--success)';
      statusEl.innerHTML = '<span class="check-icon"></span>Saved securely';
      statusEl.style.opacity = '1';
      setTimeout(() => {
        statusEl.style.opacity = '0';
      }, 2000);
    });
  });
});
