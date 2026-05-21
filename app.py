import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# -------------------------------------------------
# Load .env
# # -------------------------------------------------
load_dotenv()

MAIL_USER = os.getenv("MAIL_USER")
MAIL_PASS = os.getenv("MAIL_PASS")
WORK_EMAIL = os.getenv("WORK_EMAIL")

# -------------------------------------------------
# Flask setup
# -------------------------------------------------
app = Flask(__name__)
CORS(app)

# -------------------------------------------------
# Helpers
# -------------------------------------------------
def now_uk():
    return datetime.now().strftime("%d/%m/%Y %H:%M:%S")


def validate(data, fields):
    return [f for f in fields if not data.get(f)]


def build_email_html(title, icon, data):
    rows = ""

    for k, v in data.items():
        value = v if v and str(v).strip() else "<em style='color:#aaa;'>Not provided</em>"

        rows += f"""
        <tr>
          <td style="padding:10px 16px;background:#f4f6fa;font-weight:700;
                     color:#0B1F3A;width:36%;border-bottom:1px solid #dde2ed;
                     font-family:Arial;font-size:13px;text-transform:uppercase;">
            {k}
          </td>
          <td style="padding:10px 16px;color:#333;border-bottom:1px solid #dde2ed;
                     font-family:Arial;font-size:14px;">
            {value}
          </td>
        </tr>
        """

    return f"""
    <html>
    <body style="margin:0;padding:0;background:#eef0f5;font-family:Arial;">
      <div style="max-width:600px;margin:30px auto;background:#fff;
                  border-radius:10px;overflow:hidden;
                  box-shadow:0 4px 16px rgba(0,0,0,0.1);">

        <div style="background:#E8380D;padding:24px;color:#fff;">
          <div style="font-size:12px;opacity:0.8;">New Enquiry</div>
          <h2 style="margin:6px 0 0;">{icon} {title}</h2>
        </div>

        <div style="padding:12px 24px;background:#fff7ed;color:#7c3a00;
                    font-weight:600;font-size:13px;">
          ⚡ Action required — respond within 60 minutes
        </div>

        <table width="100%" style="border-collapse:collapse;">
          {rows}
        </table>

        <div style="padding:14px;text-align:center;background:#f4f6fa;
                    font-size:12px;color:#999;">
          Automated email — Boiler Repair System
        </div>

      </div>
    </body>
    </html>
    """


def send_email(subject, html, reply_to=None):
    msg = MIMEMultipart()
    msg["From"] = f"BoilerRepair <{MAIL_USER}>"
    msg["To"] = WORK_EMAIL
    msg["Subject"] = subject
    msg["Reply-To"] = reply_to if reply_to else MAIL_USER

    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(MAIL_USER, MAIL_PASS)
        server.send_message(msg)

# -------------------------------------------------
# QUOTE endpoint
# -------------------------------------------------
@app.route("/api/quote", methods=["POST"])
def quote():
    data = request.get_json() or {}

    missing = validate(data, ["name", "phone", "service"])
    if missing:
        return jsonify({
            "success": False,
            "message": f"Missing fields: {', '.join(missing)}"
        }), 400

    payload = {
        "Name": data.get("name"),
        "Phone": data.get("phone"),
        "Postcode": data.get("postcode", ""),
        "Service": data.get("service"),
        "Description": data.get("description", ""),
        "Submitted": now_uk(),
        "Form": "Hero — Get a Free Quote"
    }

    try:
        html = build_email_html("Free Quote Request", "🔧", payload)

        send_email(
            subject=f"🔧 Free Quote Request — {data.get('name')}",
            html=html
        )

        print("[QUOTE] SENT:", data)
        return jsonify({"success": True})

    except Exception as e:
        print("[QUOTE ERROR]", e)
        return jsonify({
            "success": False,
            "message": "Email failed. Call us directly."
        }), 500

# -------------------------------------------------
# CONTACT endpoint
# -------------------------------------------------
@app.route("/api/contact", methods=["POST"])
def contact():
    data = request.get_json() or {}

    missing = validate(data, ["name", "phone"])
    if missing:
        return jsonify({
            "success": False,
            "message": f"Missing fields: {', '.join(missing)}"
        }), 400

    payload = {
        "Name": data.get("name"),
        "Phone": data.get("phone"),
        "Email": data.get("email", ""),
        "Postcode": data.get("postcode", ""),
        "Service": data.get("service", ""),
        "Message": data.get("message", ""),
        "Submitted": now_uk(),
        "Form": "Contact — Request Callback"
    }

    try:
        html = build_email_html("Callback Request", "📞", payload)

        send_email(
            subject=f"📞 Callback Request — {data.get('name')}",
            html=html,
            reply_to=data.get("email")
        )

        print("[CONTACT] SENT:", data)
        return jsonify({"success": True})

    except Exception as e:
        print("[CONTACT ERROR]", e)
        return jsonify({
            "success": False,
            "message": "Email failed. Call us directly."
        }), 500

# -------------------------------------------------
# RUN SERVER
# -------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)