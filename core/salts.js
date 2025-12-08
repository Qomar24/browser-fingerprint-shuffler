// Persistent salt management using chrome.storage.local.
(function () {
  const STORAGE_KEY = "fp_salt";
  let cachedSalt = null;

  function logDebug (...args) {
    try {
      if (globalThis.fpConfig && globalThis.fpConfig.debug) {
        console.log("[fp][salt]", ...args);
      }
    } catch (e) {
      // ignore logging errors
    }
  }

  function randomHex128 () {
    try {
      const arr = new Uint32Array(4);
      crypto.getRandomValues(arr);
      return Array.from(arr, n => n.toString(16).padStart(8, "0")).join("");
    } catch (e) {
      // Fallback to Math.random if crypto is unavailable
      let out = "";
      for (let i = 0; i < 4; i++) {
        out += Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, "0");
      }
      return out;
    }
  }

  function readSalt () {
    return new Promise((resolve, reject) => {
      try {
        if (!chrome?.storage?.local) {
          resolve(null);
          return;
        }
        chrome.storage.local.get([STORAGE_KEY], result => {
          const err = chrome.runtime?.lastError;
          if (err) {
            logDebug("read error", err);
            reject(err);
            return;
          }
          logDebug("read", result?.[STORAGE_KEY]);
          resolve(result?.[STORAGE_KEY] || null);
        });
      } catch (e) {
        logDebug("read exception", e);
        reject(e);
      }
    });
  }

  function writeSalt (salt) {
    return new Promise((resolve, reject) => {
      try {
        if (!chrome?.storage?.local) {
          resolve();
          return;
        }
        chrome.storage.local.set({ [STORAGE_KEY]: salt }, () => {
          const err = chrome.runtime?.lastError;
          if (err) {
            logDebug("write error", err);
            reject(err);
            return;
          }
          logDebug("write success", salt);
          resolve();
        });
      } catch (e) {
        logDebug("write exception", e);
        reject(e);
      }
    });
  }

  async function getSalt () {
    if (cachedSalt) return cachedSalt;

    try {
      const existing = await readSalt();
      if (existing) {
        cachedSalt = existing;
        return cachedSalt;
      }
    } catch (e) {
      logDebug("read failed, generating new salt", e);
      // Ignore read errors, will generate a fresh salt
    }

    const newSalt = randomHex128();
    cachedSalt = newSalt;
    try {
      await writeSalt(newSalt);
    } catch (e) {
      logDebug("write failed; using in-memory salt only", e);
      // Storage failed; keep in-memory salt for this page load
    }
    logDebug("using salt", cachedSalt);
    return cachedSalt;
  }

  globalThis.fpGetSalt = getSalt;
})();
