(() => {
  const text = document.body?.innerText || '';

  // Session Monitor page: reload every 30 minutes to keep the session alive
  if (/session monitor/i.test(document.title + text)) {
    setTimeout(() => location.reload(), 30 * 60 * 1000);
    return;
  }

  // Stop on an error banner to avoid a login loop
  if (/invalid credentials|authentication failed|incorrect username|login error/i.test(text)) return;

  const user = document.querySelector('input[type="text"], input[name*="user"], input[id*="user"]');
  const pass = document.querySelector('input[type="password"]');
  if (!user || !pass) return;

  chrome.storage.local.get(['rvce_username', 'rvce_password'], ({ rvce_username, rvce_password }) => {
    if (!rvce_username || !rvce_password) return;
    user.value = rvce_username;
    pass.value = rvce_password;
    for (const el of [user, pass]) el.dispatchEvent(new Event('input', { bubbles: true }));

    const btn = (pass.form || document).querySelector('[type="submit"], button:not([type="button"])');
    setTimeout(() => (btn ? btn.click() : pass.form?.submit()), 300);
  });
})();
