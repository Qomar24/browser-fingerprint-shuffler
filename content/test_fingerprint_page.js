// Page-world fingerprint sampler used for WebGL to avoid content-script isolation.
(function () {
  function safe (fn, fallback) {
    try {
      return fn();
    } catch (e) {
      return fallback;
    }
  }

  function sampleWebGL () {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl") || canvas.getContext("webgl2");
    if (!gl || !gl.getParameter) return "no-webgl";
    const params = [
      gl.MAX_TEXTURE_SIZE,
      gl.MAX_VERTEX_ATTRIBS,
      gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS
    ];
    const values = params.map(p => safe(() => gl.getParameter(p), null));
    const vendor = safe(() => gl.getParameter(gl.VENDOR), null);
    const renderer = safe(() => gl.getParameter(gl.RENDERER), null);
    const extensions = safe(() => (gl.getSupportedExtensions ? gl.getSupportedExtensions().slice(0, 10) : []), []);
    return { vendor, renderer, values, extensions };
  }

  window.addEventListener("message", event => {
    const data = event.data;
    if (!data || !data.fpTestRequest) return;
    const id = data.fpTestRequest;
    const webgl = sampleWebGL();
    window.postMessage({ fpTestResponse: id, webgl }, "*");
  });
})();
