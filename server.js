// =============================================================
//  server.js  —  Boiler Repair in Portsmouth
//  Handles form submissions and sends email via Nodemailer
//
//  Setup:
//    1. npm install express nodemailer cors dotenv
//    2. Copy .env.example to .env and fill in your details
//    3. node server.js
// =============================================================

require('dotenv').config();
const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the entire project folder as static files
app.use(express.static(path.join(__dirname)));

// ── Mail transporter ─────────────────────────────────────────
// Uses Gmail + App Password.
// In Gmail: Settings → Security → 2-Step Verification → App Passwords
// Generate an app password for "Mail" and paste it as MAIL_PASS in .env
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,   // e.g. youraddress@gmail.com
    pass: process.env.MAIL_PASS,   // 16-character Gmail App Password
  },
});

transporter.verify((err) => {
  if (err) {
    console.error('❌  Mail transporter error:', err.message);
    console.error('    Check MAIL_USER and MAIL_PASS in your .env file');
  } else {
    console.log('✅  Mail transporter ready — emails will be sent to:', process.env.WORK_EMAIL);
  }
});

// ── Helper: build styled HTML email ──────────────────────────
function buildEmailHtml(title, icon, data) {
  const rows = Object.entries(data)
    .map(([k, v]) => `
      <tr>
        <td style="padding:10px 16px;background:#f4f6fa;font-weight:700;
                   color:#0B1F3A;width:36%;border-bottom:1px solid #dde2ed;
                   font-family:Arial,sans-serif;font-size:13px;
                   text-transform:uppercase;letter-spacing:0.04em;">
          ${k}
        </td>
        <td style="padding:10px 16px;color:#333;border-bottom:1px solid #dde2ed;
                   font-family:Arial,sans-serif;font-size:14px;line-height:1.5;">
          ${v && v.toString().trim() ? v : '<em style="color:#aaa;">Not provided</em>'}
        </td>
      </tr>`)
    .join('');

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;background:#eef0f5;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:36px 16px;">
        <table width="580" cellpadding="0" cellspacing="0"
               style="background:#fff;border-radius:10px;overflow:hidden;
                      box-shadow:0 4px 16px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:#E8380D;padding:28px 32px;">
              <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.7);
                        text-transform:uppercase;letter-spacing:2px;">
                New Enquiry · boilerrepairinportsmouth.co.uk
              </p>
              <h1 style="margin:0;font-size:22px;font-weight:900;color:#fff;">
                ${icon} ${title}
              </h1>
            </td>
          </tr>

          <!-- Alert strip -->
          <tr>
            <td style="background:#fff7ed;border-bottom:1px solid #fde8d8;
                       padding:12px 32px;">
              <p style="margin:0;font-size:13px;color:#7c3a00;font-weight:600;">
                ⚡ Action required — please respond within 60 minutes.
              </p>
            </td>
          </tr>

          <!-- Data table -->
          <tr>
            <td style="padding:28px 32px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="border:1px solid #dde2ed;border-radius:6px;overflow:hidden;">
                ${rows}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f4f6fa;padding:16px 32px;
                       border-top:1px solid #dde2ed;">
              <p style="margin:0;font-size:12px;color:#999;text-align:center;">
                Automated notification from boilerrepairinportsmouth.co.uk
              </p>
            </td>
          </tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
}

// ── Route: Free Quote form (hero section) ────────────────────
app.post('/api/quote', async (req, res) => {
  const { name, phone, postcode, service, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Please enter your name.' });
  }
  if (!phone || !phone.trim()) {
    return res.status(400).json({ success: false, message: 'Please enter your phone number.' });
  }
  if (!service || !service.trim()) {
    return res.status(400).json({ success: false, message: 'Please select a service.' });
  }

  const data = {
    'Name':           name.trim(),
    'Phone':          phone.trim(),
    'Postcode':       postcode ? postcode.trim() : '',
    'Service':        service.trim(),
    'Description':    description ? description.trim() : '',
    'Submitted':      new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }),
    'Form':           'Hero — Get a Free Quote',
  };

  try {
    await transporter.sendMail({
      from:    `"BoilerRepair Portsmouth" <${process.env.MAIL_USER}>`,
      to:      process.env.WORK_EMAIL,
      replyTo: process.env.MAIL_USER,
      subject: `🔧 Free Quote Request — ${name.trim()} (${postcode ? postcode.trim() : 'no postcode'})`,
      html:    buildEmailHtml('Free Quote Request', '🔧', data),
    });

    console.log(`[QUOTE] ✅ Sent — ${name.trim()} | ${phone.trim()} | ${service.trim()}`);
    return res.json({ success: true });

  } catch (err) {
    console.error('[QUOTE] ❌ Mail error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'We couldn\'t send your request. Please call us directly on 023 9200 0000.'
    });
  }
});

// ── Route: Contact / Callback form ───────────────────────────
app.post('/api/contact', async (req, res) => {
  const { name, phone, email, postcode, service, message } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Please enter your full name.' });
  }
  if (!phone || !phone.trim()) {
    return res.status(400).json({ success: false, message: 'Please enter your phone number.' });
  }

  const data = {
    'Name':        name.trim(),
    'Phone':       phone.trim(),
    'Email':       email ? email.trim() : '',
    'Postcode':    postcode ? postcode.trim() : '',
    'Service':     service ? service.trim() : '',
    'Message':     message ? message.trim() : '',
    'Submitted':   new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }),
    'Form':        'Contact — Request a Callback',
  };

  try {
    await transporter.sendMail({
      from:    `"BoilerRepair Portsmouth" <${process.env.MAIL_USER}>`,
      to:      process.env.WORK_EMAIL,
      replyTo: email ? email.trim() : process.env.MAIL_USER,
      subject: `📞 Callback Request — ${name.trim()} (${postcode ? postcode.trim() : 'no postcode'})`,
      html:    buildEmailHtml('Callback Request', '📞', data),
    });

    console.log(`[CONTACT] ✅ Sent — ${name.trim()} | ${phone.trim()}`);
    return res.json({ success: true });

  } catch (err) {
    console.error('[CONTACT] ❌ Mail error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'We couldn\'t send your message. Please call us directly on 023 9200 0000.'
    });
  }
});

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('🚀  Boiler Repair Portsmouth — Server running');
  console.log(`    http://localhost:${PORT}`);
  console.log('');
});
