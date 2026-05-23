(function () {
  'use strict';

  const API_BASE = "http://localhost:5000";

  // ── Spinner CSS ─────────────────────────────
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .spinner {
      display:inline-block;
      margin-right:8px;
      animation: spin 0.8s linear infinite;
    }
  `;
  document.head.appendChild(styleTag);

  const SPINNER = `
    <svg class="spinner" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83
      M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  `;

  // ── Helpers ─────────────────────────────

  function flash(el) {
    el.style.border = "2px solid #E8380D";
    el.style.boxShadow = "0 0 0 3px rgba(232,56,13,0.2)";
    el.focus();
    setTimeout(() => {
      el.style.border = "";
      el.style.boxShadow = "";
    }, 1500);
  }

  function error(btn, msg) {
    const old = btn.parentElement.querySelector('.err');
    if (old) old.remove();

    const el = document.createElement('div');
    el.className = "err";
    el.textContent = msg;
    el.style.cssText = `
      color:#E8380D;
      font-size:13px;
      margin-top:8px;
      text-align:center;
      background:#ffeaea;
      padding:8px;
      border-radius:6px;
    `;
    btn.insertAdjacentElement('afterend', el);
  }

  function success(container, name) {
    container.innerHTML = `
      <div style="text-align:center;padding:30px;">
        <h2 style="color:#0B1F3A;">Thanks ${name || ""}!</h2>
        <p>Your request has been sent. We will contact you soon.</p>
      </div>
    `;
  }

  // ── MAIN REQUEST ─────────────────────────────
  async function send(endpoint, data, btn, container) {
    const original = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = SPINNER + "Sending...";
    btn.style.opacity = "0.7";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (json.success) {
        success(container, data.name?.split(" ")[0]);
      } else {
        error(btn, json.message || "Failed to send request");
        btn.disabled = false;
        btn.innerHTML = original;
        btn.style.opacity = "1";
      }

    } catch (e) {
      error(btn, "Server not reachable");
      btn.disabled = false;
      btn.innerHTML = original;
      btn.style.opacity = "1";
    }
  }

  // ── QUOTE FORM ─────────────────────────────
  function quoteForm() {
    const container = document.querySelector('.lead-form-box');
    if (!container) return;

    const form = document.getElementById('quote-form') || container;

    const name = document.getElementById('q-name');
    const phone = document.getElementById('q-phone');
    const service = document.getElementById('q-service');
    const postcode = document.getElementById('q-postcode');
    const desc = document.getElementById('q-desc');
    const btn = document.getElementById('quote-submit-btn');

    if (!btn || !name || !phone || !service) return;

    function handleSubmit(e) {
      e.preventDefault();

      if (!name.value.trim()) return flash(name);
      if (!phone.value.trim()) return flash(phone);
      if (!service.value.trim()) return flash(service);

      send(`${API_BASE}/api/quote`, {
        name: name.value.trim(),
        phone: phone.value.trim(),
        service: service.value.trim(),
        postcode: postcode?.value.trim() || "",
        description: desc?.value.trim() || "",
      }, btn, container);
    }

    // IMPORTANT: works for BOTH click + form submit
    btn.addEventListener('click', handleSubmit);
    form.addEventListener('submit', handleSubmit);
  }

  // ── CONTACT FORM ─────────────────────────────
  function contactForm() {
    const container = document.querySelector('.contact-form-full');
    if (!container) return;

    const form = document.getElementById('contact-form') || container;

    const name = document.getElementById('c-name');
    const phone = document.getElementById('c-phone');
    const email = document.getElementById('c-email');
    const postcode = document.getElementById('c-postcode');
    const service = document.getElementById('c-service');
    const message = document.getElementById('c-message');
    const btn = document.getElementById('contact-submit-btn');

    if (!btn || !name || !phone) return;

    function handleSubmit(e) {
      e.preventDefault();

      if (!name.value.trim()) return flash(name);
      if (!phone.value.trim()) return flash(phone);

      send(`${API_BASE}/api/contact`, {
        name: name.value.trim(),
        phone: phone.value.trim(),
        email: email?.value.trim() || "",
        postcode: postcode?.value.trim() || "",
        service: service?.value.trim() || "",
        message: message?.value.trim() || "",
      }, btn, container);
    }

    btn.addEventListener('click', handleSubmit);
    form.addEventListener('submit', handleSubmit);
  }

  // ── INIT ─────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    quoteForm();
    contactForm();
  });

})();