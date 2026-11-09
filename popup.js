const $ = (id) => document.getElementById(id);

const user = $('username');
const pass = $('password');
const status = $('status');

function flash(message, color) {
  status.textContent = message;
  status.style.color = color;
  status.style.opacity = '1';

  setTimeout(() => {
    status.style.opacity = '0';
  }, 2000);
}
function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!response) {
        reject(new Error('No response from credential manager.'));
        return;
      }

      resolve(response);
    });
  });
}

// Load username and password-saved status.
async function loadSavedCredentials() {
  try {
    const response = await sendMessage({
      type: 'GET_STATUS'
    });

    if (!response.success) {
      throw new Error(response.error || 'Unable to load saved credentials.');
    }

    user.value = response.username || '';

    pass.value = '';
    pass.placeholder = response.passwordSaved
      ? 'Password already saved'
      : 'Enter Password';
  } catch (error) {
    flash(error.message, '#ef4444');
  }
}

$('saveBtn').addEventListener('click', async () => {
  const username = user.value.trim();
  const password = pass.value;

  if (!username) {
    return flash('Please enter your username', '#ef4444');
  }

  try {
    const response = await sendMessage({
      type: 'SAVE_CREDENTIALS',
      username,
      password
    });

    if (!response.success) {
      throw new Error(response.error || 'Unable to save credentials.');
    }

    pass.value = '';
    pass.placeholder = 'Password already saved';

    flash(
      '✓ Saved locally',
      'var(--success)'
    );
  } catch (error) {
    flash(error.message, '#ef4444');
  }
});

loadSavedCredentials();
