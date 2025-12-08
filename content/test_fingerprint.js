// Fingerprint sampler utilities for debugging/testing.
(function () {
  const hash = globalThis.fpHashString || (s => s.length);
  const pageScriptUrl = chrome.runtime.getURL("content/test_fingerprint_page.js");
  let pageHelperReady = false;
  const debug = (globalThis.fpConfig && globalThis.fpConfig.debug) || false;
  const dlog = debug ? console.log : () => { };

  function safe (fn, fallback) {
    try {
      return fn();
    } catch (e) {
      return fallback;
    }
  }

  function toHex (num) {
    return (num >>> 0).toString(16);
  }

  function sampleCanvas () {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "noctx";
    ctx.fillStyle = "#f60";
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = "#069";
    ctx.fillRect(2, 2, 29, 29);
    ctx.fillStyle = "#fff";
    ctx.fillText("fp", 4, 16);
    return canvas.toDataURL();
  }

  function sampleAudio () {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return "no-audio";
    const ctx = new AC();
    const buffer = ctx.createBuffer(1, 16, 44100);
    const channel = buffer.getChannelData(0);
    const sample = Array.from(channel.slice(0, 5));
    if (typeof ctx.close === "function") ctx.close();
    return sample;
  }

  function sampleNavigator () {
    const nav = window.navigator || {};
    return {
      hardwareConcurrency: nav.hardwareConcurrency,
      deviceMemory: nav.deviceMemory,
      languages: Array.isArray(nav.languages) ? nav.languages.slice() : nav.languages
    };
  }

  function ensurePageHelper () {
    if (pageHelperReady) return Promise.resolve();
    return new Promise(resolve => {
      const script = document.createElement("script");
      script.src = pageScriptUrl;
      script.onload = () => { pageHelperReady = true; script.remove(); resolve(); };
      script.onerror = () => { script.remove(); resolve(); };
      (document.documentElement || document.head || document.body).appendChild(script);
    });
  }

  async function sampleWebGLFromPage () {
    await ensurePageHelper();
    return new Promise(resolve => {
      const reqId = "fp-" + Math.random().toString(16).slice(2);
      function onMessage (event) {
        const data = event.data;
        if (!data || data.fpTestResponse !== reqId) return;
        window.removeEventListener("message", onMessage);
        resolve(data.webgl || "webgl-error");
      }
      window.addEventListener("message", onMessage);
      window.postMessage({ fpTestRequest: reqId }, "*");
      setTimeout(() => {
        window.removeEventListener("message", onMessage);
        resolve("webgl-timeout");
      }, 1000);
    });
  }

  async function testFingerprint () {
    const canvas = safe(sampleCanvas, "canvas-error");
    const webgl = await sampleWebGLFromPage();
    const audio = safe(sampleAudio, "audio-error");
    const nav = safe(sampleNavigator, "nav-error");

    dlog("[fp][test] samples", { webgl, canvas: typeof canvas === "string" ? canvas.slice(0, 32) + "..." : canvas, audio: audio, nav });

    const parts = {
      canvas: toHex(hash(String(canvas))),
      webgl: toHex(hash(JSON.stringify(webgl))),
      audio: toHex(hash(JSON.stringify(audio))),
      navigator: toHex(hash(JSON.stringify(nav)))
    };

    return `C${parts.canvas}W${parts.webgl}A${parts.audio}N${parts.navigator}`;
  }

  globalThis.fpTestFingerprint = testFingerprint;
})();
