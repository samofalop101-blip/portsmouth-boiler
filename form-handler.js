// =============================================================
//  form-handler.js  —  Boiler Repair in Portsmouth
//  Handles both forms: hero quote form + contact callback form
//  Linked from index.html via <script src="form-handler.js">
// =============================================================

(function () {
  'use strict';

  // ── Inject spinner keyframe CSS once ─────────────────────────
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    @keyframes btn-spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    .btn-spinner {
      display: inline-block;
      vertical-align: middle;
      margin-right: 7px;
      animation: btn-spin 0.7s linear infinite;
    }
  `;
  document.head.appendChild(styleTag);

  // ── Spinner SVG ───────────────────────────────────────────────
  const SPINNER_SVG = `
    <svg class="btn-spinner" width="18" height="18" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83
               M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>`;

  // ── Success message ───────────────────────────────────────────
  function successHTML(firstName) {
    const greeting = firstName ? ', ' + firstName + '!' : '!';
    return `
      <div style="text-align:center;padding:2.5rem 1rem;">
        <div style="
          width:68px;height:68px;background:#e6f9ee;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 1.3rem;border:2.5px solid #1E9E52;">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
               stroke="#1E9E52" stroke-width="2.5">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div style="
          font-family:'Barlow Condensed',sans-serif;font-size:1.5rem;
          font-weight:900;color:#0B1F3A;text-transform:uppercase;
          letter-spacing:0.04em;margin-bottom:0.7rem;line-height:1.1;">
          Message Received${greeting}
        </div>
        <p style="font-size:0.97rem;color:#5A6A7E;line-height:1.7;
                  max-width:300px;margin:0 auto 1rem;">
          Your request has been sent successfully. We'll get back to you
          as soon as we can — usually within
          <strong style="color:#0B1F3A;">60 minutes</strong>.
        </p>
        <p style="font-size:0.84rem;color:#5A6A7E;">
          Need to speak to someone right now?<br>
          <a href="tel:02392000000"
             style="color:#E8380D;font-weight:800;text-decoration:none;
                    font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;
                    letter-spacing:0.04em;">
            📞 023 9200 0000
          </a>
        </p>
      </div>`;
  }

  // ── Show inline error ─────────────────────────────────────────
  function showError(btn, message) {
    const old = btn.parentElement.querySelector('.form-error-msg');
    if (old) old.remove();

    const el = document.createElement('p');
    el.className = 'form-error-msg';
    el.style.cssText = `
      color:#E8380D;font-size:0.84rem;font-weight:600;margin-top:0.7rem;
      text-align:center;background:rgba(232,56,13,0.06);
      border:1.5px solid rgba(232,56,13,0.25);border-radius:5px;
      padding:0.6rem 0.9rem;line-height:1.5;`;
    el.textContent = '⚠  ' + message;
    btn.insertAdjacentElement('afterend', el);
  }

  // ── Highlight a required field ────────────────────────────────
  function flashRequired(el) {
    el.style.borderColor = '#E8380D';
    el.style.boxShadow   = '0 0 0 3px rgba(232,56,13,0.15)';
    el.focus();
    setTimeout(() => {
      el.style.borderColor = '';
      el.style.boxShadow   = '';
    }, 2200);
  }

  // ── Core submit handler ───────────────────────────────────────
  async function submitForm(endpoint, payload, btn, container) {
    const originalHTML  = btn.innerHTML;
    btn.disabled        = true;
    btn.innerHTML       = SPINNER_SVG + 'Sending…';
    btn.style.opacity   = '0.82';
    btn.style.cursor    = 'not-allowed';
    btn.style.transform = 'none';

    // Remove any old error
    const oldErr = btn.parentElement.querySelector('.form-error-msg');
    if (oldErr) oldErr.remove();

    try {
      const res  = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        container.innerHTML = successHTML(
          (payload.name || '').trim().split(' ')[0]
        );
      } else {
        showError(btn, data.message || 'Something went wrong. Please try again.');
        btn.disabled        = false;
        btn.innerHTML       = originalHTML;
        btn.style.opacity   = '1';
        btn.style.cursor    = 'pointer';
      }

    } catch {
      showError(btn, 'Network error — please check your connection and try again.');
      btn.disabled        = false;
      btn.innerHTML       = originalHTML;
      btn.style.opacity   = '1';
      btn.style.cursor    = 'pointer';
    }
  }

  // ── Hero: "Get a Free Quote" form ─────────────────────────────
  function initQuoteForm() {
    const container = document.querySelector('.lead-form-box');
    if (!container) return;

    const nameEl     = document.getElementById('q-name');
    const phoneEl    = document.getElementById('q-phone');
    const postcodeEl = document.getElementById('q-postcode');
    const serviceEl  = document.getElementById('q-service');
    const descEl     = document.getElementById('q-desc');
    const btn        = document.getElementById('quote-submit-btn');

    if (!btn || !nameEl || !phoneEl || !serviceEl) return;

    btn.addEventListener('click', () => {
      if (!nameEl.value.trim())    { flashRequired(nameEl);    return; }
      if (!phoneEl.value.trim())   { flashRequired(phoneEl);   return; }
      if (!serviceEl.value.trim()) { flashRequired(serviceEl); return; }
     
      submitForm(
  `${window.location.origin}/api/quote`,
         {
          name:        nameEl.value.trim(),
          phone:       phoneEl.value.trim(),
          postcode:    postcodeEl ? postcodeEl.value.trim() : '',
          service:     serviceEl.value.trim(),
          description: descEl     ? descEl.value.trim()     : '',
        },
        btn,
        container
      );
    });
  }

  // ── Contact: "Request a Callback" form ───────────────────────
  function initContactForm() {
    const container = document.querySelector('.contact-form-full');
    if (!container) return;

    const nameEl     = document.getElementById('c-name');
    const phoneEl    = document.getElementById('c-phone');
    const emailEl    = document.getElementById('c-email');
    const postcodeEl = document.getElementById('c-postcode');
    const serviceEl  = document.getElementById('c-service');
    const messageEl  = document.getElementById('c-message');
    const btn        = document.getElementById('contact-submit-btn');

    if (!btn || !nameEl || !phoneEl) return;

    btn.addEventListener('click', () => {
      if (!nameEl.value.trim())  { flashRequired(nameEl);  return; }
      if (!phoneEl.value.trim()) { flashRequired(phoneEl); return; }

     submitForm(
  `${window.location.origin}/api/contact`,
  
  {
          name:     nameEl.value.trim(),
          phone:    phoneEl.value.trim(),
          email:    emailEl    ? emailEl.value.trim()    : '',
          postcode: postcodeEl ? postcodeEl.value.trim() : '',
          service:  serviceEl  ? serviceEl.value.trim()  : '',
          message:  messageEl  ? messageEl.value.trim()  : '',
        },
        btn,
        container
      );
    });
  }

  // ── Initialise on DOM ready ───────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initQuoteForm();
      initContactForm();
    });
  } else {
    initQuoteForm();
    initContactForm();
  }

})();
