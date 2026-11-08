
importScripts('crypto.js');

const storageAccessReady = chrome.storage.local.setAccessLevel({
  accessLevel: 'TRUSTED_CONTEXTS'
}).catch(error => {
  console.error(
    'RVCE Auto-Login: Failed to restrict storage access.',
    error
  );
  throw error;
});

const STORAGE_KEYS = {
  username: 'rvce_username',
  legacyPassword: 'rvce_password',
  ciphertext: 'rvce_password_encrypted',
  iv: 'rvce_password_iv',
  version: 'rvce_password_version'
};

const ENCRYPTION_VERSION = 1;
const GATEWAY_HOST = '172.16.0.2';
const GATEWAY_PORT = '1003';

// Serialize credential operations to prevent concurrent migrations or saves.
let operationQueue = Promise.resolve();

function runExclusive(operation) {
  const result = operationQueue.then(operation, operation);
  operationQueue = result.catch(() => {});
  return result;
}

async function getStoredData() {
  await storageAccessReady;

  return new Promise((resolve, reject) => {
    chrome.storage.local.get(Object.values(STORAGE_KEYS), result => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(result);
    });
  });
}

async function setStoredData(data) {
  await storageAccessReady;

  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}

async function removeStoredData(keys) {
  await storageAccessReady;

  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(keys, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}

function hasEncryptedFields(data) {
  return Boolean(
    data[STORAGE_KEYS.ciphertext] ||
    data[STORAGE_KEYS.iv] ||
    data[STORAGE_KEYS.version] !== undefined
  );
}

function hasCompleteEncryptedData(data) {
  return Boolean(
    data[STORAGE_KEYS.ciphertext] &&
    data[STORAGE_KEYS.iv] &&
    data[STORAGE_KEYS.version] === ENCRYPTION_VERSION
  );
}

async function getPassword(data) {
  if (!hasCompleteEncryptedData(data)) {
    throw new Error(
      'Encrypted password data is incomplete or unsupported.'
    );
  }

  return decryptPassword(
    data[STORAGE_KEYS.ciphertext],
    data[STORAGE_KEYS.iv]
  );
}

// Save encrypted data before removing the legacy plaintext.
async function migrateLegacyPassword(data) {
  const legacyPassword = data[STORAGE_KEYS.legacyPassword];

  if (!legacyPassword) return data;

  if (hasEncryptedFields(data)) {
    if (!hasCompleteEncryptedData(data)) {
      throw new Error(
        'Credential storage is inconsistent. Manual recovery is required.'
      );
    }

    // Handle an interrupted previous migration safely.
    const existingPassword = await getPassword(data);

    if (existingPassword !== legacyPassword) {
      throw new Error(
        'Legacy and encrypted passwords do not match. Manual recovery is required.'
      );
    }

    await removeStoredData(STORAGE_KEYS.legacyPassword);
    return getStoredData();
  }

  const encrypted = await encryptPassword(legacyPassword);

  await setStoredData({
    [STORAGE_KEYS.ciphertext]: encrypted.ciphertext,
    [STORAGE_KEYS.iv]: encrypted.iv,
    [STORAGE_KEYS.version]: ENCRYPTION_VERSION
  });

  await removeStoredData(STORAGE_KEYS.legacyPassword);

  return getStoredData();
}

// Normalize old credentials and validate the stored state.
async function normalizeStoredData(data) {
  if (data[STORAGE_KEYS.legacyPassword]) {
    data = await migrateLegacyPassword(data);
  }

  if (hasEncryptedFields(data) &&
      !hasCompleteEncryptedData(data)) {
    throw new Error(
      'Encrypted password data is incomplete or unsupported.'
    );
  }

  return data;
}

async function getCredentials() {
  let data = await getStoredData();
  data = await normalizeStoredData(data);

  const username = data[STORAGE_KEYS.username];
  const password = hasCompleteEncryptedData(data)
    ? await getPassword(data)
    : null;

  if (!username || !password) return null;

  return { username, password };
}

async function saveCredentials(username, newPassword) {
  let data = await getStoredData();
  data = await normalizeStoredData(data);

  if (newPassword) {
    // Verify existing encrypted data before replacing it.
    if (hasCompleteEncryptedData(data)) {
      await getPassword(data);
    }

    const encrypted = await encryptPassword(newPassword);

    await setStoredData({
      [STORAGE_KEYS.username]: username,
      [STORAGE_KEYS.ciphertext]: encrypted.ciphertext,
      [STORAGE_KEYS.iv]: encrypted.iv,
      [STORAGE_KEYS.version]: ENCRYPTION_VERSION
    });

    // Remove legacy data only after the new data is saved.
    await removeStoredData(STORAGE_KEYS.legacyPassword);
  } else {
    // Keep the existing password if the user leaves the field empty.
    if (!hasCompleteEncryptedData(data)) {
      throw new Error('Please enter your password.');
    }

    // Ensure the existing key and password are still usable.
    await getPassword(data);

    await setStoredData({
      [STORAGE_KEYS.username]: username
    });
  }

  return { success: true };
}

async function getCredentialStatus() {
  let data = await getStoredData();
  data = await normalizeStoredData(data);

  const passwordSaved = hasCompleteEncryptedData(data);

  // Validate decryption without returning the password to the popup.
  if (passwordSaved) {
    await getPassword(data);
  }

  return {
    success: true,
    username: data[STORAGE_KEYS.username] || '',
    passwordSaved
  };
}

function isGatewayRequest(sender) {
  if (!sender.tab?.url) return false;

  try {
    const url = new URL(sender.tab.url);

    return (
      ['http:', 'https:'].includes(url.protocol) &&
      url.hostname === GATEWAY_HOST &&
      url.port === GATEWAY_PORT
    );
  } catch {
    return false;
  }
}

function isPopupRequest(sender) {
  return (
    sender.id === chrome.runtime.id &&
    sender.url === chrome.runtime.getURL('popup.html')
  );
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'GET_CREDENTIALS') {
    if (!isGatewayRequest(sender)) {
      sendResponse({
        success: false,
        error: 'Unauthorized request.'
      });
      return;
    }

    runExclusive(() => getCredentials())
      .then(credentials => {
        sendResponse({ success: true, credentials });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }

  if (message?.type === 'GET_STATUS') {
    if (!isPopupRequest(sender)) {
      sendResponse({
        success: false,
        error: 'Unauthorized request.'
      });
      return;
    }

    runExclusive(() => getCredentialStatus())
      .then(sendResponse)
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }

  if (message?.type === 'SAVE_CREDENTIALS') {
    if (!isPopupRequest(sender)) {
      sendResponse({
        success: false,
        error: 'Unauthorized request.'
      });
      return;
    }

    const username = typeof message.username === 'string'
      ? message.username.trim()
      : '';

    const password = typeof message.password === 'string'
      ? message.password
      : '';

    if (!username) {
      sendResponse({
        success: false,
        error: 'Please enter your username.'
      });
      return;
    }

    runExclusive(() => saveCredentials(username, password))
      .then(sendResponse)
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }
});
