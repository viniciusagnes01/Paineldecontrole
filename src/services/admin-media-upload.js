(function () {
  const BUCKET = 'organization-assets';

  function ui() {
    return window.V4_UI || { log: function () {} };
  }

  function client() {
    try {
      return window.V4_DRIVE_LIVE?.ensureClient?.() || null;
    } catch (_error) {
      return null;
    }
  }

  function slug(value) {
    return String(value || 'image')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'image';
  }

  function folderForInput(input) {
    const form = input.closest('form');
    if (form?.matches('[data-admin-user-form]')) return 'users';
    if (form?.matches('[data-admin-squad-form]')) return 'squads';
    if (form?.matches('[data-admin-client-form]')) return 'clients';
    return 'general';
  }

  function statusFor(input) {
    const media = input.closest('.v4-media-field');
    if (!media) return null;
    let status = media.querySelector('[data-v4-media-upload-status]');
    if (!status) {
      status = document.createElement('small');
      status.className = 'v4-media-upload-status';
      status.dataset.v4MediaUploadStatus = 'true';
      media.querySelector('.v4-media-controls')?.appendChild(status);
    }
    return status;
  }

  function previewFor(input, url) {
    const media = input.closest('.v4-media-field');
    const preview = media?.querySelector('.v4-media-preview');
    if (!preview || !url) return;
    preview.innerHTML = '<img class="v4-admin-avatar v4-admin-avatar-lg" src="' + url.replace(/"/g, '&quot;') + '" alt="" />';
  }

  function enhanceField(field) {
    if (field.dataset.v4MediaEnhanced === 'true') return;
    const textInput = field.querySelector('input[type="text"], input:not([type])');
    if (!textInput) return;
    field.dataset.v4MediaEnhanced = 'true';
    const row = document.createElement('div');
    row.className = 'v4-media-upload-row';
    row.innerHTML = '<input type="file" accept="image/*" data-v4-media-file><button class="v4-admin-btn" type="button" data-v4-media-clear>Remover foto</button>';
    field.querySelector('.v4-media-controls')?.appendChild(row);
  }

  function enhanceAll() {
    document.querySelectorAll('.v4-media-field').forEach(enhanceField);
  }

  async function upload(input) {
    const file = input.files?.[0];
    if (!file) return;
    const status = statusFor(input);
    const sb = client();
    if (!sb?.storage) {
      if (status) status.textContent = 'Storage do Supabase indisponível. Use uma URL pública por enquanto.';
      return;
    }
    const folder = folderForInput(input);
    const path = folder + '/' + Date.now() + '-' + slug(file.name);
    if (status) status.textContent = 'Enviando imagem...';
    try {
      const uploaded = await sb.storage.from(BUCKET).upload(path, file, { upsert: true, cacheControl: '3600' });
      if (uploaded.error) throw uploaded.error;
      const publicUrl = sb.storage.from(BUCKET).getPublicUrl(path)?.data?.publicUrl || '';
      const media = input.closest('.v4-media-field');
      const textInput = media?.querySelector('input[type="text"], input:not([type]):not([type="file"])');
      if (textInput) {
        textInput.value = publicUrl;
        textInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      previewFor(input, publicUrl);
      if (status) status.textContent = 'Upload concluído. Clique em salvar para persistir.';
    } catch (error) {
      if (status) status.textContent = 'Falha no upload. Verifique se o bucket organization-assets existe e é público. ' + (error.message || '');
    }
  }

  function bind() {
    if (window.__v4AdminMediaUploadBound) return;
    window.__v4AdminMediaUploadBound = true;
    document.addEventListener('change', function (event) {
      const input = event.target.closest('[data-v4-media-file]');
      if (input) upload(input);
    }, true);
    document.addEventListener('click', function (event) {
      const button = event.target.closest('[data-v4-media-clear]');
      if (!button) return;
      const field = button.closest('.v4-media-field');
      const textInput = field?.querySelector('input[type="text"], input:not([type])');
      if (textInput) textInput.value = '';
      const preview = field?.querySelector('.v4-media-preview');
      if (preview) preview.innerHTML = '<span class="v4-admin-avatar v4-admin-avatar-lg">V4</span>';
    }, true);
  }

  function start() {
    bind();
    enhanceAll();
    const observer = new MutationObserver(enhanceAll);
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    ui().log('admin_media_upload', 'Upload de imagens admin carregado.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
