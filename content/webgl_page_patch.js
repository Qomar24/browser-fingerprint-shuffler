// Page-world WebGL patcher injected by content/hooks_webgl.js.
(function () {
  const current = document.currentScript;
  if (!current) return;

  const jitter = parseFloat(current.dataset.fpJitter || "1");
  const maskVendors = current.dataset.fpMaskVendors === "true";
  const shuffleExt = current.dataset.fpShuffleExt === "true";
  const debug = current.dataset.fpDebug === "true";
  const baseSeed = Number(current.dataset.fpSeed || 0) >>> 0;

  function log () {
    if (debug) console.log.apply(console, arguments);
  }

  function createPRNG (seed) {
    let state = seed >>> 0;
    return function next () {
      state |= 0;
      state = (state + 0x6D2B79F5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const prng = createPRNG((baseSeed ^ 0x9E3779B9) >>> 0);
  function noise (scale) {
    return (prng() - 0.5) * (scale || 1);
  }

  function deterministicShuffle (arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function patch (proto) {
    if (!proto || !proto.getParameter) return;
    const orig = proto.getParameter;
    if (orig.__fp_patched) return;
    orig.__fp_patched = true;

    proto.getParameter = function (p) {
      const value = orig.call(this, p);
      if (typeof value === "number") {
        const delta = jitter || 1;
        const out = value + delta;
        log("[fp][webgl] jitter", p, "base", value, "delta", delta, "out", out);
        return out;
      }

      const gl = this;
      const vendorParams = [
        gl.VENDOR,
        gl.RENDERER,
        gl.UNMASKED_VENDOR_WEBGL,
        gl.UNMASKED_RENDERER_WEBGL
      ].filter(Boolean);

      if (maskVendors && vendorParams.includes(p) && typeof value === "string") {
        const suffix = (Math.floor(prng() * 0xFFFF) || 1) >>> 0;
        const out = value + " (fp-" + suffix + ")";
        log("[fp][webgl] vendor", value, "->", out);
        return out;
      }

      return value;
    };

    if (proto.getSupportedExtensions && shuffleExt) {
      const origExt = proto.getSupportedExtensions;
      if (!origExt.__fp_patched) {
        origExt.__fp_patched = true;
        proto.getSupportedExtensions = function () {
          const list = origExt.call(this);
          if (Array.isArray(list)) {
            const rev = list.slice().reverse();
            log("[fp][webgl] extensions", rev);
            return rev;
          }
          return list;
        };
      }
    }

    log("[fp][webgl] patched", proto.constructor && proto.constructor.name);
  }

  function tryPatch () {
    try {
      if (window.WebGLRenderingContext) patch(WebGLRenderingContext.prototype);
      if (window.WebGL2RenderingContext) patch(WebGL2RenderingContext.prototype);
    } catch (e) {
      // ignore
    }
  }

  tryPatch();
  if (!window.WebGLRenderingContext || !window.WebGL2RenderingContext) {
    window.addEventListener("load", tryPatch, { once: true });
  }
})();
