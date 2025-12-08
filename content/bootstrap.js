// Bootstrap: load salt, derive seed, initialize PRNG/noise helpers.
(function () {
  const readyPromise = (async () => {
    try {
      const getSalt = globalThis.fpGetSalt;
      const deriveSeed = globalThis.fpDeriveSeed;
      const hashString = globalThis.fpHashString;
      const createPRNG = globalThis.fpCreatePRNG;
      const config = globalThis.fpConfig || {};

      if (!getSalt || !deriveSeed || !hashString || !createPRNG) {
        throw new Error("Fingerprint bootstrap missing prerequisites");
      }

      const salt = await getSalt();
      const baseSeed = hashString(String(salt));
      const seed = config.perOriginFingerprint ? deriveSeed(salt, location.origin) : baseSeed;
      const prng = createPRNG(seed);
      const noise = (scale = 1) => (prng() - 0.5) * scale;

      const env = { salt, seed, prng, noise, config };

      globalThis.fpPRNG = prng;
      globalThis.fpNoise = noise;
      globalThis.fpEnv = env;

      return env;
    } catch (e) {
      // Fail closed: do not break the page if bootstrap fails.
      return null;
    }
  })();

  globalThis.fpReady = readyPromise;
})();
