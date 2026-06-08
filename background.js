chrome.runtime.onInstalled.addListener(() => {
  console.log('[RVCE Auto-Login] Background service worker installed.');
});

// Listen for messages to start the keepalive alarm
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start_keepalive") {
    console.log('[RVCE Auto-Login] Received request to start keepalive.');

    // Create an alarm to fire every 40 minutes
    chrome.alarms.create("rvce_keepalive", { periodInMinutes: 40 });
    console.log('[RVCE Auto-Login] Keepalive alarm scheduled for every 40 minutes.');
  }
});

// Listen for the alarm and ping the keepalive URL
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "rvce_keepalive") {
    chrome.storage.local.get(['rvce_keepalive_url'], (result) => {
      const keepaliveUrl = result.rvce_keepalive_url;
      if (keepaliveUrl) {
        console.log('[RVCE Auto-Login] Pinging keepalive URL:', keepaliveUrl);
        fetch(keepaliveUrl, { mode: 'no-cors' })
          .then(() => console.log('[RVCE Auto-Login] Keepalive ping successful.'))
          .catch((err) => console.error('[RVCE Auto-Login] Keepalive ping failed:', err));
      } else {
        console.log('[RVCE Auto-Login] Keepalive URL not found. Clearing alarm.');
        chrome.alarms.clear("rvce_keepalive");
      }
    });
  }
});
