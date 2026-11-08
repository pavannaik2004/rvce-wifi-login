(() => {
  const text = document.body?.innerText || '';

  // Session Monitor page: reload every 30 minutes.
  if (/session monitor/i.test(document.title + text)) {
    setTimeout(() => location.reload(), 30 * 60 * 1000);
    return;
  }

  // Stop on authentication errors to avoid a login loop.
  if (
    /invalid credentials|authentication failed|incorrect username|login error/i.test(text)
  ) {
    return;
  }

  const user = document.querySelector(
    'input[type="text"], input[name*="user"], input[id*="user"]'
  );

  const pass = document.querySelector('input[type="password"]');

  if (!user || !pass) return;

  // Request credentials from the extension background service worker.
  chrome.runtime.sendMessage(
    { type: 'GET_CREDENTIALS' },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error(
          'RVCE Auto-Login:',
          chrome.runtime.lastError.message
        );
        return;
      }

      if (!response?.success || !response.credentials) {
        console.error(
          'RVCE Auto-Login:',
          response?.error || 'No saved credentials found.'
        );
        return;
      }

      const { username, password } = response.credentials;

      if (!username || !password) return;

      user.value = username;
      pass.value = password;

      for (const element of [user, pass]) {
        element.dispatchEvent(
          new Event('input', { bubbles: true })
        );
        element.dispatchEvent(
          new Event('change', { bubbles: true })
        );
      }

      const button = (
        pass.form || document
      ).querySelector(
        '[type="submit"], button:not([type="button"])'
      );

      setTimeout(() => {
        if (button) {
          button.click();
        } else if (pass.form) {
          pass.form.requestSubmit();
        }
      }, 300);
    }
  );
})();
