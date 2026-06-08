(function () {
  if (!window.location.hostname.startsWith('172.16.')) return;
  console.log('[RVCE Auto-Login] Extension loaded.');

  // 1. DOM Safety Verification
  const pageTitle = document.title || '';
  const pageText = document.body ? document.body.innerText : '';

  if (!pageTitle.includes('RV Institutions') && !pageText.includes('RV Institutions')) {
    console.log('[RVCE Auto-Login] Safety check failed. Terminating execution.');
    return;
  }

  // 2. Infinite Loop Prevention: Check for error messages
  const errorKeywords = ['invalid credentials', 'authentication failed', 'incorrect username', 'login error'];
  const lowerPageText = pageText.toLowerCase();
  for (let kw of errorKeywords) {
    if (lowerPageText.includes(kw)) {
      console.log(`[RVCE Auto-Login] Detected error banner ("${kw}"). Terminating to prevent infinite loop.`);
      return;
    }
  }

  // 2.5. Keepalive setup on Session Monitor page
  if (pageTitle.includes('Secure Session Monitor') || pageText.includes('Session Monitor')) {
    console.log('[RVCE Auto-Login] Session Monitor page detected.');

    // Automatically refresh the page every 30 minutes to keep the countdown updated and session alive
    setTimeout(() => {
      console.log('[RVCE Auto-Login] Refreshing page to update countdown...');
      window.location.reload();
    }, 30 * 60 * 1000);

    return; // Stop execution on this page
  }

  // 3. Credential Fetching
  chrome.storage.local.get(['rvce_username', 'rvce_password'], (result) => {
    const username = result.rvce_username;
    const password = result.rvce_password;

    if (!username || !password) {
      console.log('[RVCE Auto-Login] Credentials not found in storage. Aborting auto-login.');
      return;
    }

    console.log('[RVCE Auto-Login] Credentials found. Proceeding with form injection.');

    // 4. Form Injection
    const usernameInputs = document.querySelectorAll('input[type="text"], input[name*="user"], input[id*="user"]');
    const passwordInputs = document.querySelectorAll('input[type="password"], input[name*="pass"], input[id*="pass"]');

    // Find the most likely visible inputs
    const usernameField = Array.from(usernameInputs).find(el => el.type !== 'hidden' && el.style.display !== 'none');
    const passwordField = Array.from(passwordInputs).find(el => el.type !== 'hidden' && el.style.display !== 'none');

    if (!usernameField || !passwordField) {
      console.log('[RVCE Auto-Login] Could not locate login fields.');
      return;
    }

    // Programmatically set field values
    usernameField.value = username;
    passwordField.value = password;

    // Dispatch events to simulate user input if modern frameworks are in use
    usernameField.dispatchEvent(new Event('input', { bubbles: true }));
    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
    usernameField.dispatchEvent(new Event('change', { bubbles: true }));
    passwordField.dispatchEvent(new Event('change', { bubbles: true }));

    // 5. Form Submission
    const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"], button:not([type="button"])');
    const submitBtn = Array.from(submitButtons).find(el =>
      el.innerText.toLowerCase().includes('sign in') ||
      el.innerText.toLowerCase().includes('login') ||
      el.value?.toLowerCase().includes('sign in') ||
      el.value?.toLowerCase().includes('login') ||
      el.type === 'submit'
    );

    // Add a slight delay to ensure the DOM and any scripts have registered the input values
    setTimeout(() => {
      if (submitBtn) {
        console.log('[RVCE Auto-Login] Submitting form via button click.');
        submitBtn.click();
      } else if (usernameField.form) {
        console.log('[RVCE Auto-Login] Submitting parent form directly.');
        usernameField.form.submit();
      } else {
        console.log('[RVCE Auto-Login] Could not find submit method.');
      }
    }, 300);
  });
})();
