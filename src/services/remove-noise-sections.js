(function () {
  const HEADINGS_TO_REMOVE = [
    /Alertas e pontos de atenção/i,
    /Alertas e pontos de atencao/i,
    /Área editável do sistema/i,
    /Area editavel do sistema/i
  ];

  function removeNoiseSections() {
    document.querySelectorAll('h2, h3').forEach((heading) => {
      const text = heading.textContent || '';
      if (!HEADINGS_TO_REMOVE.some((pattern) => pattern.test(text))) return;
      const card = heading.closest('article.glass-card, .glass-card, article');
      if (card) card.remove();
    });
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(removeNoiseSections, 150));
  document.addEventListener('click', () => {
    setTimeout(removeNoiseSections, 80);
    setTimeout(removeNoiseSections, 500);
  });

  const observer = new MutationObserver(() => {
    clearTimeout(window.__v4RemoveNoiseTimer);
    window.__v4RemoveNoiseTimer = setTimeout(removeNoiseSections, 80);
  });

  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(removeNoiseSections, 300);
  setTimeout(removeNoiseSections, 1000);

  window.V4_REMOVE_NOISE_SECTIONS = { removeNoiseSections };
})();
