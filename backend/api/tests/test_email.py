"""
Pruebas automatizadas del módulo de correos (email_service + email_templates).

Cómo leer este archivo:
  - Cada función que empieza con "test_" es una prueba independiente.
  - `patch(...)` reemplaza temporalmente una parte del sistema (ej. la conexión SMTP real)
    por un "doble" falso que controlamos nosotros. Al salir del bloque `with`, el original
    se restaura solo.
  - Ninguna prueba aquí envía correos reales ni toca la base de datos.

Cómo correr:
  cd backend/api
  source .panel/bin/activate
  pytest tests/ -v
"""

import sys
import os
from datetime import datetime
from unittest.mock import MagicMock, patch

# Agrega backend/api al path para que Python encuentre email_service y email_templates
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import email_service  # importamos una vez aquí arriba; los tests usan este objeto


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def mock_pool(incidentes_rows, email_rows):
    """
    Crea un pool de BD falso para enviar_digest_coordinadores.
    La función hace dos consultas en orden:
      1. Incidentes de las últimas 24h
      2. Emails de coordinadores activos
    Este helper devuelve un pool que responde con los datos que le pasamos.
    """
    pool = MagicMock()
    conn = MagicMock()
    # pool.connection() se usa como "with pool.connection() as conn:" — simulamos eso
    pool.connection.return_value.__enter__.return_value = conn

    # Primera consulta: incidentes
    cur_incidentes = MagicMock()
    cur_incidentes.description = [
        ("id_conv_eleven",), ("folio",), ("event_ts",), ("extortion_name",), ("title",)
    ]
    cur_incidentes.fetchall.return_value = incidentes_rows

    # Segunda consulta: emails de coordinadores
    cur_emails = MagicMock()
    cur_emails.fetchall.return_value = email_rows

    # side_effect: la primera llamada a conn.execute() devuelve cur_incidentes,
    # la segunda devuelve cur_emails
    conn.execute.side_effect = [cur_incidentes, cur_emails]

    return pool


# ---------------------------------------------------------------------------
# Tests: send_email (función base)
# ---------------------------------------------------------------------------

def test_send_email_sin_credenciales_no_envía():
    """Si SMTP_USER está vacío, send_email debe retornar False sin intentar conectarse."""
    # Parcheamos las variables ya cargadas en el módulo (más limpio que recargar)
    with patch.object(email_service, "SMTP_USER", ""), \
         patch.object(email_service, "SMTP_PASSWORD", ""):
        result = email_service.send_email("alguien@yopmail.com", "Asunto", "Cuerpo")

    assert result is False


def test_send_email_con_credenciales_llama_smtp():
    """Con credenciales válidas, send_email debe conectarse al servidor SMTP y enviar."""
    with patch("email_service.smtplib.SMTP") as mock_smtp_class, \
         patch.object(email_service, "SMTP_USER", "test@gmail.com"), \
         patch.object(email_service, "SMTP_PASSWORD", "fake-password"):

        # mock_smtp_class() es la instancia que se usa dentro del `with smtplib.SMTP(...)`
        mock_server = mock_smtp_class.return_value.__enter__.return_value

        result = email_service.send_email("dest@yopmail.com", "Asunto", "Hola")

    assert result is True
    # Verificamos que intentó autenticarse y enviar
    mock_server.login.assert_called_once()
    mock_server.sendmail.assert_called_once()


# ---------------------------------------------------------------------------
# Tests: send_asignacion_email
# ---------------------------------------------------------------------------

def test_asignacion_email_datos_correctos():
    """
    send_asignacion_email debe llamar a send_email con el destinatario y asunto correctos,
    e incluir el id_conv en el cuerpo HTML.
    """
    # Parcheamos send_email para interceptar la llamada sin enviar nada real
    with patch.object(email_service, "send_email") as mock_send:
        email_service.send_asignacion_email(
            to="monitorista@yopmail.com",
            username="juan",
            id_conv="CONV-TEST-001",
        )

    mock_send.assert_called_once()
    args = mock_send.call_args[0]   # args posicionales: (to, subject, body, html)

    assert args[0] == "monitorista@yopmail.com"     # destinatario
    assert "Nuevo caso asignado" in args[1]          # asunto
    assert "juan" in args[2]                         # cuerpo texto
    assert "CONV-TEST-001" in args[3]                # cuerpo HTML


# ---------------------------------------------------------------------------
# Tests: enviar_digest_coordinadores
# ---------------------------------------------------------------------------

def test_digest_sin_incidentes_no_envía():
    """Si no hay incidentes en las últimas 24h, no debe enviar ningún correo."""
    pool = mock_pool(incidentes_rows=[], email_rows=[])

    with patch.object(email_service, "send_bulk") as mock_bulk:
        email_service.enviar_digest_coordinadores(pool)

    mock_bulk.assert_not_called()


def test_digest_sin_coordinadores_no_envía():
    """Si hay incidentes pero no hay coordinadores activos, no debe enviar nada."""
    fila = ("CONV-001", "F-001", datetime.now(), "Extorsión telefónica", "Caso de prueba")
    pool = mock_pool(incidentes_rows=[fila], email_rows=[])

    with patch.object(email_service, "send_bulk") as mock_bulk:
        email_service.enviar_digest_coordinadores(pool)

    mock_bulk.assert_not_called()


def test_digest_envía_html_a_coordinadores():
    """Con incidentes y coordinadores activos, debe llamar a send_bulk con HTML incluido."""
    fila = ("CONV-001", "F-001", datetime.now(), "Extorsión telefónica", "Caso de prueba")
    pool = mock_pool(
        incidentes_rows=[fila],
        email_rows=[("coord@ejemplo.com",)],
    )

    with patch.object(email_service, "send_bulk") as mock_bulk:
        email_service.enviar_digest_coordinadores(pool)

    mock_bulk.assert_called_once()
    args = mock_bulk.call_args[0]   # (destinatarios, subject, texto, html)

    assert "coord@ejemplo.com" in args[0]           # lista de destinatarios
    assert args[3] is not None                       # HTML presente (bug que corregimos)
    assert "CONV-001" in args[3] or "F-001" in args[3]  # contenido en el HTML


# ---------------------------------------------------------------------------
# Tests: plantillas HTML (sin mocks — solo verifican que rendericen bien)
# ---------------------------------------------------------------------------

def test_html_asignacion_contiene_datos():
    from email_templates import html_asignacion
    html = html_asignacion("maria", "CONV-XYZ-999")
    assert "maria" in html
    assert "CONV-XYZ-999" in html


def test_html_digest_contiene_incidentes():
    from email_templates import html_digest
    incidentes = [{
        "id_conv_eleven": "CONV-001",
        "folio": "F-001",
        "event_ts": datetime.now(),
        "extortion_name": "Extorsión telefónica",
        "title": "Caso de prueba",
    }]
    html = html_digest(incidentes, "22/06/2026")
    assert "F-001" in html
    assert "Extorsión telefónica" in html
    assert "22/06/2026" in html
