(function () {
  // Compatibility layer kept to avoid 404s from older deployed HTML.
  // The actual cleanup now lives in global-panel-cleanup.js.
  function removeNoiseSections() {
    if (window.V4_GLOBAL_PANEL_CLEANUP?.removeBrokenBlocks) {
      window.V4_GLOBAL_PANEL_CLEANUP.removeBrokenBlocks();
    }
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(removeNoiseSections, 150));
  document.addEventListener('click', () => setTimeout(removeNoiseSections, 120));
  setTimeout(removeNoiseSections, 500);

  window.V4_REMOVE_NOISE_SECTIONS = { removeNoiseSections };
})();
