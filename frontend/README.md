<div align="center">

# 🔧 BoilerRepairInPortsmouth

**Local lead generation platform for Gas Safe boiler engineers in Portsmouth, UK.**

[![Python](https://img.shields.io/badge/Python-3.8%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0.3-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Gunicorn](https://img.shields.io/badge/Gunicorn-22.0.0-499848?style=flat-square&logo=gunicorn&logoColor=white)](https://gunicorn.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Local Development](#-local-development)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Production Deployment](#-production-deployment)
- [Troubleshooting](#-troubleshooting)
- [Tech Stack](#-tech-stack)

---

## 📌 Overview

A lightweight full-stack lead generation site. Prospective customers submit a **free quote request** or **callback request** via on-page forms. Submissions are validated both client-side and server-side, then delivered as formatted HTML emails to the business inbox via Gmail SMTP — within seconds of form submission.

**Flow:**

```
Browser → form-handler.js (validate) → POST /api/quote or /api/contact → Flask → Gmail SMTP → Business inbox
```

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────┐
│                   Browser                   │
│                                             │
│   index.html ──── form-handler.js           │
│       │                  │                  │
│       │           fetch() POST JSON         │
└───────┼──────────────────┼──────────────────┘
        │                  │
        ▼                  ▼
┌─────────────────────────────────────────────┐
│              Flask (app.py)                 │
│                                             │
│   GET  /              → serves index.html   │
│   GET  /form-handler.js → serves JS file   │
│   POST /api/quote     → email lead         │
│   POST /api/contact   → email lead         │
└───────────────────────┬─────────────────────┘
                        │
                        ▼
              Gmail SMTP (port 465)
                        │
                        ▼
              Business email inbox
```

---

## 📁 Project Structure

```
boilerrepair/
├── app.py                  # Flask app — routes, email builder, SMTP sender
├── form-handler.js         # Client-side validation, fetch, UX feedback
├── index.html              # Single-page frontend
├── privacy-policy.html     # GDPR privacy policy page
├── requirements.txt        # Python dependencies (pinned versions)
├── .env                    # Secret config — never commit this file
└── README.md               # You are here
```

---

## ✅ Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Python | 3.8+ | [python.org](https://www.python.org/downloads/) |
| pip | Latest | Bundled with Python |
| Gmail account | — | Must have 2-Step Verification enabled |
| Google App Password | 16 chars | [Generate here](https://myaccount.google.com/apppasswords) |

> ⚠️ **Do not use your normal Gmail password.** Gmail blocks SMTP logins with regular passwords. You must generate a dedicated App Password.

---

## 💻 Local Development

### 1. Clone the repository

```bash
git clone https://github.com/your-username/boilerrepair-portsmouth.git
cd boilerrepair-portsmouth
```

### 2. Create a virtual environment

```bash
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

```bash
cp .env.example .env   # or create .env manually
```

Edit `.env` with your real credentials (see [Environment Variables](#-environment-variables) below).

### 5. Start the development server

```bash
python app.py
```

Open your browser at **[http://localhost:5000](http://localhost:5000)**

> 🚫 Do not open `index.html` by double-clicking. The forms use `fetch()` to call the Flask API — this only works when the page is served over HTTP, not as a `file://` URL.

---

## 🔐 Environment Variables

Create a `.env` file in the project root. It must be named exactly `.env` (dot prefix).

```env
# .env
MAIL_USER=yourgmail@gmail.com
MAIL_PASS=abcd efgh ijkl mnop
WORK_EMAIL=leads@yourbusiness.co.uk
```

| Variable | Required | Description |
|---|---|---|
| `MAIL_USER` | ✅ Yes | Gmail address used to **send** emails via SMTP |
| `MAIL_PASS` | ✅ Yes | 16-character Google App Password — not your login password |
| `WORK_EMAIL` | ✅ Yes | Destination address that **receives** all lead emails |

> 🔑 **Generating a Google App Password:**
> `Google Account` → `Security` → `2-Step Verification` → `App Passwords` → Select app: Mail → **Generate**
> Copy the 16-character code directly into `MAIL_PASS`.

> ⛔ **Never commit `.env` to version control.** Add it to `.gitignore`:
> ```
> echo ".env" >> .gitignore
> ```

---

## 📡 API Reference

All endpoints accept and return `application/json`.

---

### `POST /api/quote`

Handles the **Get a Free Quote** form submission (hero section).

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Customer full name |
| `phone` | string | ✅ | Contact phone number |
| `service` | string | ✅ | Service type selected |
| `postcode` | string | — | Customer postcode |
| `description` | string | — | Free-text description of the issue |

**Example request**

```bash
curl -X POST http://localhost:5000/api/quote \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "phone": "07700 000000",
    "service": "Boiler Repair",
    "postcode": "PO1 1AA",
    "description": "No hot water since yesterday morning"
  }'
```

**Response — success**

```json
{ "success": true }
```

**Response — validation error**

```json
{ "success": false, "message": "Missing fields: phone, service" }
```

---

### `POST /api/contact`

Handles the **Request a Callback** form submission (contact section).

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Customer full name |
| `phone` | string | ✅ | Contact phone number |
| `email` | string | — | Customer email (sets Reply-To header) |
| `postcode` | string | — | Customer postcode |
| `service` | string | — | Service type |
| `message` | string | — | Free-text message |

**Example request**

```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "phone": "07700 111111",
    "email": "jane@example.com",
    "postcode": "PO5 2BB",
    "service": "Boiler Service",
    "message": "Need an annual check before winter"
  }'
```

**Response — success**

```json
{ "success": true }
```

---

## 🚀 Production Deployment

### Stack

```
Ubuntu 22.04 LTS
    └── Nginx (reverse proxy + SSL termination)
            └── Gunicorn (WSGI server)
                    └── Flask app (app.py)
```

### 1. Install system dependencies

```bash
sudo apt update && sudo apt install python3-pip python3-venv nginx certbot python3-certbot-nginx -y
```

### 2. Set up the app

```bash
git clone https://github.com/your-username/boilerrepair-portsmouth.git /var/www/boilerrepair
cd /var/www/boilerrepair
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
nano .env   # fill in real credentials
```

### 4. Create a systemd service

```bash
sudo nano /etc/systemd/system/boilerrepair.service
```

```ini
[Unit]
Description=BoilerRepair Portsmouth — Gunicorn
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/boilerrepair
EnvironmentFile=/var/www/boilerrepair/.env
ExecStart=/var/www/boilerrepair/venv/bin/gunicorn \
          --workers 2 \
          --bind 127.0.0.1:5000 \
          app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable boilerrepair
sudo systemctl start boilerrepair
```

### 5. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/boilerrepair
```

```nginx
server {
    listen 80;
    server_name yourdomain.co.uk www.yourdomain.co.uk;

    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/boilerrepair /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Enable HTTPS with Let's Encrypt

```bash
sudo certbot --nginx -d yourdomain.co.uk -d www.yourdomain.co.uk
```

### 7. Verify

```bash
sudo systemctl status boilerrepair   # should show: active (running)
curl -X POST https://yourdomain.co.uk/api/quote \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"07700000000","service":"Repair"}'
# expected: {"success": true}
```

---

## 🛠 Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Button does nothing, no network request | Page opened as `file://` | Access via `http://localhost:5000` |
| `404` on `/api/quote` or `/api/contact` | Flask not running | Run `python app.py` |
| `500` on form submit | Bad `.env` — missing or wrong credentials | Check file is named `.env`, use a Google App Password |
| Old JS still loading after update | Browser cache | Hard-refresh: `Ctrl + Shift + R` |
| `Connection refused` on port 5000 | Flask crashed or not started | Check terminal for Python errors |
| Emails not arriving | Gmail blocked the login | Confirm App Password is used, not your Gmail password |

---

## 🧰 Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Language | Python | 3.8+ |
| Web framework | Flask | 3.0.3 |
| WSGI server | Gunicorn | 22.0.0 |
| CORS | flask-cors | 4.0.1 |
| Config | python-dotenv | 1.0.1 |
| Email transport | Gmail SMTP (smtplib) | stdlib |
| Frontend | HTML5 / CSS3 / Vanilla JS | — |
| Fonts | Google Fonts (Barlow) | — |
| Reverse proxy | Nginx | Latest stable |
| SSL | Let's Encrypt / Certbot | — |

---

<div align="center">

Built for **boilerrepairinportsmouth.co.uk** · Portsmouth, Hampshire, UK

</div>