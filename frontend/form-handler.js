(function () {
  'use strict';

  // Correctly builds API base — never doubles the port
  const API_BASE = window.location.protocol + '//' + window.location.hostname + ':5000';

  // Spinner CSS
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
    .spinner { display:inline-block; margin-right:8px; animation:spin 0.8s linear infinite; }
  `;
  document.head.appendChild(styleTag);

  const SPINNER = '<svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>';

  function flash(el) {
    el.style.border = '2px solid #E8380D';
    el.style.boxShadow = '0 0 0 3px rgba(232,56,13,0.2)';
    el.focus();
    setTimeout(() => { el.style.border = ''; el.style.boxShadow = ''; }, 1500);
  }

  function showError(btn, msg) {
    const old = btn.parentElement.querySelector('.err');
    if (old) old.remove();
    const el = document.createElement('div');
    el.className = 'err';
    el.textContent = msg;
    el.style.cssText = 'color:#E8380D;font-size:13px;margin-top:8px;text-align:center;background:#ffeaea;padding:8px;border-radius:6px;';
    btn.insertAdjacentElement('afterend', el);
  }

  function showSuccess(container, name) {
    container.innerHTML = '<div style="text-align:center;padding:30px 20px;"><div style="font-size:3rem;margin-bottom:1rem;">✅</div><h2 style="color:#0B1F3A;margin-bottom:0.5rem;">Thanks ' + (name || '') + '!</h2><p style="color:#5A6A7E;">Your request has been sent. A local engineer will call you back shortly.</p></div>';
  }

  async function sendRequest(endpoint, data, btn, container) {
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = SPINNER + 'Sending...';
    btn.style.opacity = '0.7';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      let json;
      try { json = await res.json(); } catch(e) { throw new Error('Bad server response'); }

      if (json.success) {
        showSuccess(container, data.name ? data.name.split(' ')[0] : '');
      } else {
        showError(btn, json.message || 'Failed to send. Please try again.');
        btn.disabled = false;
        btn.innerHTML = original;
        btn.style.opacity = '1';
      }
    } catch (e) {
      console.error('Form error:', e);
      showError(btn, 'Could not reach server. Please call us directly.');
      btn.disabled = false;
      btn.innerHTML = original;
      btn.style.opacity = '1';
    }
  }

  // ── QUOTE FORM (hero) ──────────────────────────────────────────
  function initQuoteForm() {
    const container = document.querySelector('.lead-form-box');
    if (!container) return;

    const name     = document.getElementById('q-name');
    const phone    = document.getElementById('q-phone');
    const service  = document.getElementById('q-service');
    const postcode = document.getElementById('q-postcode');
    const desc     = document.getElementById('q-desc');
    const btn      = document.getElementById('quote-submit-btn');

    if (!btn) return;

    btn.addEventListener('click', function(e) {
      e.preventDefault();

      // Clear old errors
      var old = container.querySelector('.err');
      if (old) old.remove();

      // Validate
      if (!name || !name.value.trim())    { if(name) flash(name); return; }
      if (!phone || !phone.value.trim())  { if(phone) flash(phone); return; }
      if (!service || !service.value.trim()) { if(service) flash(service); return; }

      sendRequest(API_BASE + '/api/quote', {
        name:        name.value.trim(),
        phone:       phone.value.trim(),
        service:     service.value.trim(),
        postcode:    postcode ? postcode.value.trim() : '',
        description: desc ? desc.value.trim() : ''
      }, btn, container);
    });
  }

  // ── CONTACT FORM ──────────────────────────────────────────────
  function initContactForm() {
    const container = document.querySelector('.contact-form-full');
    if (!container) return;

    const name     = document.getElementById('c-name');
    const phone    = document.getElementById('c-phone');
    const email    = document.getElementById('c-email');
    const postcode = document.getElementById('c-postcode');
    const service  = document.getElementById('c-service');
    const message  = document.getElementById('c-message');
    const btn      = document.getElementById('contact-submit-btn');

    if (!btn) return;

    btn.addEventListener('click', function(e) {
      e.preventDefault();

      var old = container.querySelector('.err');
      if (old) old.remove();

      if (!name || !name.value.trim())   { if(name) flash(name); return; }
      if (!phone || !phone.value.trim()) { if(phone) flash(phone); return; }

      sendRequest(API_BASE + '/api/contact', {
        name:     name.value.trim(),
        phone:    phone.value.trim(),
        email:    email ? email.value.trim() : '',
        postcode: postcode ? postcode.value.trim() : '',
        service:  service ? service.value.trim() : '',
        message:  message ? message.value.trim() : ''
      }, btn, container);
    });
  }

  // ── INIT ──────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initQuoteForm();
      initContactForm();
    });
  } else {
    // DOM already ready (script loaded at bottom of body)
    initQuoteForm();
    initContactForm();
  }

})();