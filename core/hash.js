// Hashing helpers to derive deterministic seeds.
(function () {
  function hashString (str) {
    let h1 = 0x811C9DC5;
    for (let i = 0; i < str.length; i++) {
      h1 ^= str.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193);
      h1 >>>= 0;
    }
    return h1 >>> 0;
  }

  function deriveSeed (baseSalt, origin) {
    const saltHash = hashString(String(baseSalt));
    const originHash = hashString(String(origin || ""));
    return (saltHash ^ originHash) >>> 0;
  }

  globalThis.fpHashString = hashString;
  globalThis.fpDeriveSeed = deriveSeed;
})();
