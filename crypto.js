
const DB_NAME = 'rvce-credential-db';
const STORE_NAME = 'keys';
const KEY_NAME = 'aes-gcm-key';

let keyPromise;

function openKeyDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      db.onversionchange = () => db.close();

      resolve(db);
    };

    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(
      new Error('Encryption database is blocked.')
    );
  });
}

function validateEncryptionKey(key) {
  return Boolean(
    key &&
    key.type === 'secret' &&
    key.extractable === false &&
    key.algorithm?.name === 'AES-GCM' &&
    key.algorithm?.length === 256 &&
    key.usages?.includes('encrypt') &&
    key.usages?.includes('decrypt')
  );
}

// By default, never create a replacement key.
// Pass true only when intentionally encrypting a new password.
async function getEncryptionKey(createIfMissing = false) {
  if (keyPromise) return keyPromise;

  keyPromise = (async () => {
    const db = await openKeyDatabase();

    try {
      const existingKey = await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const request = transaction.objectStore(STORE_NAME).get(KEY_NAME);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (existingKey) {
        if (!validateEncryptionKey(existingKey)) {
          throw new Error('Stored encryption key is invalid.');
        }

        return existingKey;
      }

      if (!createIfMissing) {
        throw new Error(
          'Encryption key is missing. Password recovery is not possible.'
        );
      }

      const newKey = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        false,
        ['encrypt', 'decrypt']
      );

      await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');

        transaction.objectStore(STORE_NAME).put(newKey, KEY_NAME);

        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });

      return newKey;
    } finally {
      db.close();
    }
  })();

  try {
    return await keyPromise;
  } catch (error) {
    keyPromise = undefined;
    throw error;
  }
}

function toBase64(buffer) {
  return btoa(
    Array.from(new Uint8Array(buffer), byte =>
      String.fromCharCode(byte)
    ).join('')
  );
}

function fromBase64(value) {
  if (typeof value !== 'string' || !value) {
    throw new Error('Invalid encrypted password data.');
  }

  return Uint8Array.from(
    atob(value),
    character => character.charCodeAt(0)
  );
}

async function encryptPassword(password) {
  if (typeof password !== 'string' || !password) {
    throw new Error('Password cannot be empty.');
  }

  const key = await getEncryptionKey(true);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    new TextEncoder().encode(password)
  );

  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv)
  };
}

async function decryptPassword(ciphertext, iv) {
  // Crucially, this does not create a new key.
  const key = await getEncryptionKey(false);

  const encryptedData = fromBase64(ciphertext);
  const initializationVector = fromBase64(iv);

  if (initializationVector.length !== 12 || encryptedData.length <= 16) {
    throw new Error('Invalid encrypted password data.');
  }

  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: initializationVector
    },
    key,
    encryptedData
  );

  return new TextDecoder().decode(plaintext);
}
