(function () {
  const PRODUCTION_REDIRECT_URL = 'https://paineldecomando.vercel.app';
  const GOOGLE_SCOPES = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets.readonly'
  ].join(' ');

  function log(type, message) {
    if (window.V4_BOOT_LOG) window.V4_BOOT_LOG(type, message);
  }

  function client() {
    if (!window.V4_DRIVE_LIVE || typeof window.V4_DRIVE_LIVE.ensureClient !== 'function') return null;
    return window.V4_DRIVE_LIVE.ensureClient();
  }

  function status(message, type) {
    const el = document.querySelector('[data-auth-status]');
    if (!el) return;
    el.textContent = message;
    el.className = 'v4-auth-status ' + (type || '');
  }

  function busy(value) {
    document.querySelectorAll('[data-auth-action]').forEach(function (button) {
      button.disabled = Boolean(value);
    });
  }

  function patch(attempt) {
    attempt = attempt || 0;
    const root = document.getElementById('v4-auth-gate');
    const supabase = client();

    if (!root || !supabase) {
      if (attempt < 120) window.setTimeout(function () { patch(attempt + 1); }, 250);
      return;
    }

    if (root.dataset.v4RedirectFixed === 'true') return;
    root.dataset.v4RedirectFixed = 'true';

    root.querySelector('[data-auth-magic]')?.addEventListener('click', async function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const email = root.querySelector('[data-auth-login-form] input[name="email"]')?.value?.trim();
      if (!email) {
        status('Informe seu e-mail para receber o link mágico.', 'error');
        return;
      }
      busy(true);
      try {
        const response = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: PRODUCTION_REDIRECT_URL }
        });
        if (response.error) throw response.error;
        status('Link enviado. O retorno foi forçado para paineldecomando.vercel.app.', 'ok');
      } catch (error) {
        status(error.message || 'Não foi possível enviar o link.', 'error');
      } finally {
        busy(false);
      }
    }, true);

    root.querySelectorAll('[data-auth-google]').forEach(function (button) {
      button.addEventListener('click', async function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        busy(true);
        status('Abrindo Google com permissão de leitura do Drive/Sheets...', 'ok');
        try {
          const response = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: PRODUCTION_REDIRECT_URL,
              scopes: GOOGLE_SCOPES,
              queryParams: {
                access_type: 'offline',
                prompt: 'consent'
              }
            }
          });
          if (response.error) throw response.error;
        } catch (error) {
          status(error.message || 'Não foi possível iniciar o Google.', 'error');
          busy(false);
        }
      }, true);
    });

    root.querySelector('[data-auth-register-form]')?.addEventListener('submit', async function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const form = event.currentTarget;
      busy(true);
      try {
        const response = await supabase.auth.signUp({
          email: form.email.value.trim(),
          password: form.password.value,
          options: {
            data: { full_name: form.name.value.trim() },
            emailRedirectTo: PRODUCTION_REDIRECT_URL
          }
        });
        if (response.error) throw response.error;
        status('Cadastro criado. Confirme o e-mail; o retorno foi forçado para paineldecomando.vercel.app.', 'ok');
      } catch (error) {
        status(error.message || 'Não foi possível criar o cadastro.', 'error');
      } finally {
        busy(false);
      }
    }, true);

    log('auth_redirect_fix', 'Redirect de produção e scopes Google Drive/Sheets aplicados.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { patch(0); });
  else patch(0);
})();
