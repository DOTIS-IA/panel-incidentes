import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv

load_dotenv()

SMTP_HOST     = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", 587))
SMTP_USER     = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_NAME     = os.getenv("EMAIL_FROM_NAME", "Panel Incidentes")


def _build_message(to: str, subject: str, body: str) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["From"]    = f"{FROM_NAME} <{SMTP_USER}>"
    msg["To"]      = to
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain", "utf-8"))
    return msg


def send_email(to: str, subject: str, body: str) -> bool:
    """Envía un correo a un destinatario. Retorna True si tuvo éxito."""
    if not SMTP_USER or not SMTP_PASSWORD:
        print("[email] Credenciales SMTP no configuradas — omitiendo envío")
        return False

    try:
        context = ssl.create_default_context()
        msg     = _build_message(to, subject, body)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls(context=context)
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to, msg.as_string())

        print(f"[email] Enviado a {to}: {subject}")
        return True
    except Exception as e:
        print(f"[email] Error al enviar a {to}: {e}")
        return False


def send_bulk(recipients: list[str], subject: str, body: str) -> dict:
    """Envía el mismo correo a varios destinatarios. Retorna resumen de resultados."""
    results: dict[str, list[str]] = {"sent": [], "failed": []}
    for recipient in recipients:
        ok = send_email(recipient, subject, body)
        (results["sent"] if ok else results["failed"]).append(recipient)
    return results


def enviar_digest_coordinadores(pool) -> None:
    """Digest diario para coordinadores: incidentes nuevos de las últimas 24 horas.
    Pendiente de implementar cuando el sistema de asignación esté listo.
    """
    pass
