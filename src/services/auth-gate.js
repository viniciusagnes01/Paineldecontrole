(function () {
  const AUTH_MOUNT_ID = 'v4-auth-gate';
  const APP_SELECTOR = '#app';
  const DEFAULT_EMAIL = 'vinicius.agnes@v4company.com';

  const SUPABASE_FALLBACK = {
    url: 'https://pptxhpmnojsldcjajxxc.supabase.co',
    key: 'sb_publishable_N2mH6E8wh6QzsrWU8bkQPQ_wS-XjdVd'
  };

  let supabaseClient = null;

  function bootLog(type, message) {
    if (window.V4_BOOT_LOG) window.V4_BOOT_LOG(type, message);
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function getRedirectUrl() {
    return window.location.origin + window.location.pathname;
  }

  function ensureClient() {
    if (window.V4_DRIVE_LIVE && typeof window.V4_DRIVE_LIVE.ensureClient === 'function') {
      return window.V4_DRIVE_LIVE.ensureClient();
    }

    if (supabaseClient) return supabaseClient;

    if (!window.supabase || !window.supabase.createClient) {
      throw new Error('Supabase SDK não carregado.');
    }

    supabaseClient = window.supabase.createClient(SUPABASE_FALLBACK.url, SUPABASE_FALLBACK.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    return supabaseClient;
  }

  function setMode(mode) {
    const root = document.getElementById(AUTH_MOUNT_ID);
    if (!root) return;
    root.dataset.mode = mode;
    root.querySelectorAll('[data-auth-tab]').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.authTab === mode);
    });
    root.querySelectorAll('[data-auth-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.authPanel !== mode;
    });
  }

  function setStatus(message, type) {
    const status = document.querySelector('[data-auth-status]');
    if (!status) return;
    status.textContent = message || '';
    status.className = `v4-auth-status ${type || ''}`;
  }

  function setBusy(isBusy) {
    document.querySelectorAll('[data-auth-action]').forEach((button) => {
      button.disabled = Boolean(isBusy);
    });
  }

  function template() {
    return `
      <section class="v4-auth-gate" id="${AUTH_MOUNT_ID}" data-mode="login" aria-live="polite">
        <div class="v4-auth-grid"></div>
        <div class="v4-auth-orb v4-auth-orb-a"></div>
        <div class="v4-auth-orb v4-auth-orb-b"></div>
        <main class="v4-auth-card" role="dialog" aria-modal="true" aria-labelledby="v4-auth-title">
          <aside class="v4-auth-brand">
            <div class="v4-auth-logo-wrap">
              <img src="src/assets/v4-company-logo.jpg" alt="V4 Company" class="v4-auth-logo" />
            </div>
            <div class="v4-auth-signal">
              <span></span><strong>Área segura para operação e performance</strong><small>V4 Company</small>
            </div>
            <p class="v4-auth-kicker">V4 Company • Growth Access</p>
            <h1 id="v4-auth-title">Entre no seu cockpit <strong>de crescimento.</strong></h1>
            <p class="v4-auth-copy">Acesse indicadores, tarefas, funil comercial, próximos passos e rotinas do projeto em uma experiência simples, segura e com visual tecnológico.</p>
            <div class="v4-auth-feature-grid">
              <div class="v4-auth-feature"><strong>CRM</strong><small>Funil e campos obrigatórios</small></div>
              <div class="v4-auth-feature"><strong>CS</strong><small>Check-ins e follow-ups</small></div>
              <div class="v4-auth-feature"><strong>BI</strong><small>Performance e decisões</small></div>
            </div>
            <div class="v4-auth-flow" aria-hidden="true">
              <div class="v4-auth-flow-row"><span>Leads</span><div class="v4-auth-flow-bar"><span style="--p:82%"></span></div><strong>82%</strong></div>
              <div class="v4-auth-flow-row"><span>MQL</span><div class="v4-auth-flow-bar"><span style="--p:64%"></span></div><strong>64%</strong></div>
              <div class="v4-auth-flow-row"><span>SQL</span><div class="v4-auth-flow-bar"><span style="--p:48%"></span></div><strong>48%</strong></div>
            </div>
          </aside>

          <section class="v4-auth-form-card">
            <div class="v4-auth-tabs" role="tablist" aria-label="Autenticação">
              <button type="button" class="active" data-auth-tab="login">Login</button>
              <button type="button" data-auth-tab="register">Cadastro</button>
            </div>

            <div class="v4-auth-panel" data-auth-panel="login">
              <h2>Entrar no painel</h2>
              <p>Use login/e-mail e senha ou continue direto com seu e-mail Google.</p>
              <form data-auth-login-form>
                <label>Login ou e-mail
                  <input type="text" name="email" autocomplete="email" placeholder="nome@empresa.com" value="${escapeHtml(DEFAULT_EMAIL)}" required />
                </label>
                <label>Senha
                  <input type="password" name="password" autocomplete="current-password" placeholder="Digite sua senha" required />
                </label>
                <button type="submit" class="v4-auth-primary" data-auth-action>Entrar com login e senha</button>
              </form>
              <div class="v4-auth-divider"><span>ou</span></div>
              <button type="button" class="v4-auth-google" data-auth-google data-auth-action>
                <span class="v4-auth-google-icon" aria-hidden="true">G</span>
                Continuar com Google
              </button>
              <button type="button" class="v4-auth-link" data-auth-magic data-auth-action>Receber link mágico por e-mail</button>
            </div>

            <div class="v4-auth-panel" data-auth-panel="register" hidden>
              <h2>Criar acesso</h2>
              <p>Cadastre com login e senha ou continue direto com seu e-mail Google.</p>
              <form data-auth-register-form>
                <label>Nome completo
                  <input type="text" name="name" autocomplete="name" placeholder="Seu nome" required />
                </label>
                <label>E-mail
                  <input type="email" name="email" autocomplete="email" placeholder="nome@empresa.com" required />
                </label>
                <label>Senha
                  <input type="password" name="password" autocomplete="new-password" placeholder="Crie uma senha segura" minlength="6" required />
                </label>
                <label>Confirmar senha
                  <input type="password" name="confirmPassword" autocomplete="new-password" placeholder="Repita sua senha" minlength="6" required />
                </label>
                <button type="submit" class="v4-auth-primary" data-auth-action>Criar cadastro com login e senha</button>
              </form>
              <div class="v4-auth-divider"><span>ou</span></div>
              <button type="button" class="v4-auth-google" data-auth-google data-auth-action>
                <span class="v4-auth-google-icon" aria-hidden="true">G</span>
                Continuar com Google
              </button>
              <div class="v4-auth-info-box">
                <span>✉</span>
                <div><strong>Cadastro direto com e-mail</strong><small>Ao continuar com Google, o sistema cria o acesso usando o e-mail validado e pode pedir aprovação do administrador.</small></div>
              </div>
            </div>

            <div class="v4-auth-status" data-auth-status>Faça login para liberar o painel.</div>
          </section>
        </main>
      </section>
    `;
  }

  function showGate() {
    document.body.classList.remove('v4-authenticated');
    document.body.classList.add('v4-auth-required');
    const app = document.querySelector(APP_SELECTOR);
    if (app) app.setAttribute('aria-hidden', 'true');
    if (!document.getElementById(AUTH_MOUNT_ID)) {
      const mount = document.createElement('div');
      mount.innerHTML = template();
      document.body.appendChild(mount.firstElementChild);
      bindEvents();
    }
  }

  function hideGate(session) {
    document.body.classList.remove('v4-auth-required');
    document.body.classList.add('v4-authenticated');
    const app = document.querySelector(APP_SELECTOR);
    if (app) app.removeAttribute('aria-hidden');
    const root = document.getElementById(AUTH_MOUNT_ID);
    if (root) root.remove();
    injectLogout(session);
  }

  function injectLogout(session) {
    if (document.querySelector('[data-v4-auth-logout]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'v4-auth-logout';
    button.dataset.v4AuthLogout = 'true';
    button.innerHTML = `<span>${escapeHtml(session?.user?.email || 'Sessão ativa')}</span><strong>Sair</strong>`;
    button.addEventListener('click', async () => {
      try {
        await ensureClient().auth.signOut();
      } finally {
        button.remove();
        showGate();
      }
    });
    document.body.appendChild(button);
  }

  async function handleGoogle() {
    setBusy(true);
    setStatus('Abrindo login com Google...', 'ok');
    try {
      const { error } = await ensureClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: getRedirectUrl() }
      });
      if (error) throw error;
    } catch (error) {
      setStatus(error.message || 'Não foi possível iniciar o Google.', 'error');
      setBusy(false);
    }
  }

  async function handleMagicLink() {
    const email = document.querySelector('[data-auth-login-form] input[name="email"]')?.value.trim();
    if (!email) {
      setStatus('Informe seu e-mail para receber o link mágico.', 'error');
      return;
    }
    setBusy(true);
    try {
      const { error } = await ensureClient().auth.signInWithOtp({
        email,
        options: { emailRedirectTo: getRedirectUrl() }
      });
      if (error) throw error;
      setStatus('Link enviado. Confira seu e-mail e volte para o painel.', 'ok');
    } catch (error) {
      setStatus(error.message || 'Não foi possível enviar o link.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = form.email.value.trim();
    const password = form.password.value;
    setBusy(true);
    try {
      const { data, error } = await ensureClient().auth.signInWithPassword({ email, password });
      if (error) throw error;
      setStatus('Acesso liberado. Carregando painel...', 'ok');
      hideGate(data.session);
    } catch (error) {
      setStatus(error.message || 'Login ou senha inválidos.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;
    const name = form.name.value.trim();
    if (password !== confirmPassword) {
      setStatus('As senhas não conferem.', 'error');
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await ensureClient().auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: getRedirectUrl()
        }
      });
      if (error) throw error;
      if (data.session) {
        setStatus('Cadastro criado. Carregando painel...', 'ok');
        hideGate(data.session);
      } else {
        setStatus('Cadastro criado. Confirme o e-mail para liberar o painel.', 'ok');
      }
    } catch (error) {
      setStatus(error.message || 'Não foi possível criar o cadastro.', 'error');
    } finally {
      setBusy(false);
    }
  }

  function bindEvents() {
    const root = document.getElementById(AUTH_MOUNT_ID);
    if (!root) return;
    root.querySelectorAll('[data-auth-tab]').forEach((tab) => {
      tab.addEventListener('click', () => setMode(tab.dataset.authTab));
    });
    root.querySelector('[data-auth-login-form]')?.addEventListener('submit', handleLogin);
    root.querySelector('[data-auth-register-form]')?.addEventListener('submit', handleRegister);
    root.querySelectorAll('[data-auth-google]').forEach((button) => button.addEventListener('click', handleGoogle));
    root.querySelector('[data-auth-magic]')?.addEventListener('click', handleMagicLink);
  }

  async function init() {
    document.body.classList.add('v4-auth-loading');
    try {
      const client = ensureClient();
      client.auth.onAuthStateChange((_event, session) => {
        document.body.classList.remove('v4-auth-loading');
        if (session) hideGate(session);
        else showGate();
      });
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      document.body.classList.remove('v4-auth-loading');
      if (data.session) hideGate(data.session);
      else showGate();
      bootLog('auth_gate', data.session ? 'Sessao autenticada.' : 'Login obrigatorio renderizado.');
    } catch (error) {
      document.body.classList.remove('v4-auth-loading');
      showGate();
      setStatus(error.message || 'Falha ao preparar autenticação.', 'error');
      bootLog('auth_gate_error', error.message || 'Falha ao preparar auth gate.');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();