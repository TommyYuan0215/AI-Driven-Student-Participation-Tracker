import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 465))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_SENDER = os.getenv("SMTP_SENDER", "")

def send_email(to_email, subject, html_content):
    if not SMTP_USER or not SMTP_PASSWORD:
        print("SMTP credentials are not configured. Cannot send email.", flush=True)
        return False
    
    # Create MIME message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_SENDER
    msg["To"] = to_email

    # Attach HTML content
    msg.attach(MIMEText(html_content, "html"))

    try:
        context = ssl.create_default_context()
        if SMTP_PORT == 465:
            # SSL Connection
            with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, context=context) as server:
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(SMTP_SENDER, to_email, msg.as_string())
        else:
            # STARTTLS Connection
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls(context=context)
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(SMTP_SENDER, to_email, msg.as_string())
        print(f"Successfully sent email to {to_email}", flush=True)
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}", flush=True)
        return False

def send_otp_email(to_email, username, otp_code):
    subject = "FocusTrack - Login Verification Code"
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eee;">
          <h2 style="color: #6366f1; text-align: center; font-weight: 900; margin-bottom: 20px;">FocusTrack</h2>
          <p>Hello <strong>{username}</strong>,</p>
          <p>We received a request to log in to your account. Use the verification code below to complete the authentication process. This code is valid for <strong>5 minutes</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ef4444; background-color: #fef2f2; padding: 12px 24px; border-radius: 8px; border: 1px dashed #fca5a5; display: inline-block;">
              {otp_code}
            </span>
          </div>
          <p style="font-size: 13px; color: #666; text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            If you did not make this request, you can safely ignore this email.
          </p>
        </div>
      </body>
    </html>
    """
    return send_email(to_email, subject, html_content)

def send_reset_email(to_email, username, reset_token):
    # Determine external app URL
    app_url = os.getenv("APP_URL", "http://localhost:5180")
    reset_url = f"{app_url}/reset-password?token={reset_token}"
    
    subject = "FocusTrack - Reset Your Password"
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eee;">
          <h2 style="color: #6366f1; text-align: center; font-weight: 900; margin-bottom: 20px;">FocusTrack</h2>
          <p>Hello <strong>{username}</strong>,</p>
          <p>We received a request to reset the password for your account. Click the button below to set a new password. This link is valid for <strong>15 minutes</strong>.</p>
          <div style="text-align: center; margin: 35px 0;">
            <a href="{reset_url}" style="background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.2);">
              Reset Password
            </a>
          </div>
          <p style="font-size: 13px; color: #555;">If the button above does not work, copy and paste this link into your web browser:</p>
          <p style="font-size: 13px; word-break: break-all; color: #6366f1;"><a href="{reset_url}">{reset_url}</a></p>
          <p style="font-size: 13px; color: #666; text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>
      </body>
    </html>
    """
    return send_email(to_email, subject, html_content)
