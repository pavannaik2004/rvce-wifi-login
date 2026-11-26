const $ = (id) => document.getElementById(id);
const user = $('username'), pass = $('password'), status = $('status');

chrome.storage.local.get(['rvce_username', 'rvce_password'], (r) => {
  user.value = r.rvce_username || '';
  pass.value = r.rvce_password || '';
});

function flash(html, color) {
  status.innerHTML = html;
  status.style.color = color;
  status.style.opacity = '1';
  setTimeout(() => (status.style.opacity = '0'), 2000);
}

$('saveBtn').addEventListener('click', () => {
  const rvce_username = user.value.trim(), rvce_password = pass.value;
  if (!rvce_username || !rvce_password) return flash('Please fill all fields', '#ef4444');
  chrome.storage.local.set({ rvce_username, rvce_password }, () =>
    flash('<span class="check-icon"></span>Saved securely', 'var(--success)'));
});
