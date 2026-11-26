// Runs in the page's MAIN world so it can call the Sophos portal's own submitRequest().
// content.js (isolated world) can't: Chrome blocks the javascript: link it would click.
document.addEventListener('rvce-autologin-submit', () => {
  if (typeof window.submitRequest === 'function') window.submitRequest();
});
