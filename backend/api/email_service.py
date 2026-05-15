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
    """Digest diario para coordinadores: incidentes nuevos de las últimas 24 horas."""
    from datetime import datetime, timedelta, timezone

    ahora   = datetime.now(timezone.utc)
    hace_24h = ahora - timedelta(hours=24)

    try:
        with pool.connection() as conn:
            cur = conn.execute(
                """
                SELECT id_conv_eleven, folio, event_ts, extortion_name, title
                FROM analytics.vw_report_conversation_panel
                WHERE event_ts >= %(desde)s
                ORDER BY event_ts DESC
                """,
                {"desde": hace_24h},
            )
            cols      = [d[0] for d in cur.description]
            incidentes = [dict(zip(cols, r)) for r in cur.fetchall()]

            if not incidentes:
                print("[email] Digest: sin incidentes nuevos en las últimas 24h")
                return

            emails = [
                r[0]
                for r in conn.execute(
                    "SELECT email FROM public.users WHERE role = 'coordinador_incidentes' AND is_active = true"
                ).fetchall()
            ]

    except Exception as e:
        print(f"[email] Digest: error al consultar BD: {e}")
        return

    if not emails:
        print("[email] Digest: no hay coordinadores activos")
        return

    fecha_str = ahora.strftime("%d/%m/%Y")
    lineas = [
        f"Resumen de incidentes nuevos — {fecha_str}",
        "",
        f"Se registraron {len(incidentes)} incidente(s) nuevo(s) en las últimas 24 horas:",
        "",
    ]
    for i, inc in enumerate(incidentes, 1):
        ts    = inc.get("event_ts")
        fecha = ts.strftime("%d/%m/%Y %H:%M") if ts else "—"
        lineas.append(
            f"{i}. {inc.get('folio') or inc['id_conv_eleven']} | "
            f"{inc.get('extortion_name') or '—'} | "
            f"{fecha} | "
            f"{inc.get('title') or '—'}"
        )
    lineas += ["", "Ingresa al panel para ver los detalles."]

    subject = f"Panel Incidentes — {len(incidentes)} caso(s) nuevo(s) el {fecha_str}"
    results = send_bulk(emails, subject, "\n".join(lineas))
    print(f"[email] Digest: {len(results['sent'])} enviados, {len(results['failed'])} fallidos")
