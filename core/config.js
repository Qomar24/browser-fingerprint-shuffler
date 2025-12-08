// Basic configuration knobs for fingerprint perturbation.
// Tweak these to tune aggressiveness without changing code.
(function () {
  const config = {
    debug: false, // set true to log storage and hook activity
    enableCanvasNoise: true,
    canvasNoiseStrength: 2, // bump to ensure visible pixel delta

    enableWebGLMasking: true,
    webglJitter: 2, // bump to ensure hash delta while staying small
    maskWebGLVendorStrings: true,
    shuffleWebGLExtensions: true,

    enableAudioNoise: true,
    audioNoiseStrength: 1e-7,

    enableNavigatorFuzz: true,
    navigator: {
      fuzzHardwareConcurrency: true,
      fuzzDeviceMemory: true,
      shuffleLanguages: true
    },

    perOriginFingerprint: true
  };

  // Expose globally for other modules.
  globalThis.fpConfig = config;
})();
