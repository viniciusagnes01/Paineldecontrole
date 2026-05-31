(function () {
  const UI = {
    qs(selector, root) {
      return (root || document).querySelector(selector);
    },

    qsa(selector, root) {
      return Array.from((root || document).querySelectorAll(selector));
    },

    escape(value) {
      return String(value ?? '').replace(/[&<>'"]/g, function (char) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char];
      });
    },

    initials(value, fallback) {
      const source = String(value || fallback || 'V4').trim();
      return source.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'V4';
    },

    storage: {
      get(key, fallback) {
        try {
          const value = localStorage.getItem(key);
          return value == null ? fallback : JSON.parse(value);
        } catch (_error) {
          return fallback;
        }
      },
      set(key, value) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (_error) {
          return false;
        }
      },
      sessionGet(key, fallback) {
        try {
          const value = sessionStorage.getItem(key);
          return value == null ? fallback : JSON.parse(value);
        } catch (_error) {
          return fallback;
        }
      },
      sessionSet(key, value) {
        try {
          sessionStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (_error) {
          return false;
        }
      }
    },

    on(root, eventName, selector, handler, options) {
      const target = root || document;
      target.addEventListener(eventName, function (event) {
        const matched = event.target.closest(selector);
        if (!matched || !target.contains(matched)) return;
        handler(event, matched);
      }, options || false);
    },

    loadCss(href, id) {
      if (id && document.getElementById(id)) return Promise.resolve();
      if (document.querySelector('link[href="' + href + '"]')) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        if (id) link.id = id;
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = reject;
        document.head.appendChild(link);
      });
    },

    loadScript(src, datasetKey) {
      const selector = datasetKey ? 'script[data-' + datasetKey.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()) + ']' : 'script[src="' + src + '"]';
      if (document.querySelector(selector)) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        if (datasetKey) script.dataset[datasetKey] = 'true';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    },

    log(type, message) {
      if (window.V4_BOOT_LOG) window.V4_BOOT_LOG(type, message);
    }
  };

  window.V4_UI = UI;
  UI.log('ui_helpers', 'Helpers compartilhados carregados.');
})();
