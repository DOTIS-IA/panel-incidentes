import os
from html import escape

PANEL_URL = os.getenv("PANEL_URL", "http://localhost:5173")

_GUINDA = "#6B1228"
_ORO    = "#C9A035"
_BG       = "#F8F4F5"
_TEXT     = "#1A1A1A"
_GRIS     = "#6B7280"


def _wrap_html(titulo: str, badge: str, contenido: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{titulo}</title>
</head>
<body style="margin:0;padding:0;background-color:{_BG};font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:{_BG};padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;background:#ffffff;
                      border-radius:4px;overflow:hidden;
                      box-shadow:0 2px 8px rgba(0,0,0,0.12);">

          <!-- ENCABEZADO -->
          <tr>
            <td style="background-color:{_GUINDA};padding:28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin:0;color:{_ORO};font-size:10px;
                               letter-spacing:2px;text-transform:uppercase;
                               font-weight:bold;">Sistema Institucional</p>
                    <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;
                                font-weight:700;letter-spacing:0.5px;">
                      Panel de Incidentes
                    </h1>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="display:inline-block;background:{_ORO};
                                  color:{_GUINDA};font-size:10px;
                                  font-weight:700;letter-spacing:1.5px;
                                  text-transform:uppercase;padding:5px 12px;
                                  border-radius:2px;">{badge}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FRANJA DORADA -->
          <tr>
            <td style="height:4px;background:{_ORO};"></td>
          </tr>

          <!-- CONTENIDO -->
          <tr>
            <td style="padding:32px;">
              {contenido}
            </td>
          </tr>

          <!-- PIE -->
          <tr>
            <td style="background-color:#F3EDEF;padding:20px 32px;
                        border-top:1px solid #E0D0D5;">
              <p style="margin:0;font-size:11px;color:{_GRIS};line-height:1.6;">
                <strong>Aviso de confidencialidad:</strong> Este mensaje y sus adjuntos son
                confidenciales y de uso exclusivo del destinatario. Si lo recibiste por error,
                elimínalo e informa al remitente.
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:{_GRIS};">
                Panel de Incidentes &bull; Sistema Interno de Monitoreo
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def html_asignacion(username: str, id_conv: str) -> str:
    contenido = f"""
      <h2 style="margin:0 0 8px;color:{_GUINDA};font-size:18px;">
        Nuevo caso asignado
      </h2>
      <p style="margin:0 0 24px;color:{_GRIS};font-size:14px;">
        Se le ha asignado un nuevo caso en el sistema de monitoreo.
        Por favor revise los detalles a la brevedad.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="background:{_BG};border-radius:4px;
                    border:1px solid #E0D0D5;margin-bottom:28px;">
        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid #E0D0D5;">
            <span style="font-size:11px;color:{_GRIS};
                          text-transform:uppercase;letter-spacing:1px;">
              Analista asignado
            </span>
            <p style="margin:4px 0 0;font-size:15px;color:{_TEXT};
                       font-weight:600;">{escape(username)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 20px;">
            <span style="font-size:11px;color:{_GRIS};
                          text-transform:uppercase;letter-spacing:1px;">
              Identificador del caso
            </span>
            <p style="margin:4px 0 0;font-size:15px;color:{_TEXT};
                       font-weight:600;font-family:monospace;">{escape(id_conv)}</p>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 20px;font-size:14px;color:{_TEXT};line-height:1.6;">
        Ingrese al panel para revisar la transcripción y el contexto
        del caso antes de iniciar el análisis.
      </p>

      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background-color:{_GUINDA};border-radius:3px;">
            <a href="{PANEL_URL}" target="_blank"
               style="display:inline-block;padding:12px 28px;
                       color:#ffffff;text-decoration:none;
                       font-size:14px;font-weight:700;letter-spacing:0.5px;">
              Ver caso en el panel &rarr;
            </a>
          </td>
        </tr>
      </table>
    """
    return _wrap_html("Nuevo caso asignado", "Asignación", contenido)


def html_digest(incidentes: list[dict], fecha_str: str) -> str:
    n = len(incidentes)

    filas = ""
    for i, inc in enumerate(incidentes):
        ts     = inc.get("event_ts")
        fecha  = ts.strftime("%d/%m/%Y %H:%M") if ts else "—"
        folio  = inc.get("folio") or inc.get("id_conv_eleven", "—")
        tipo   = inc.get("extortion_name") or "—"
        titulo = inc.get("title") or "—"
        bg     = "#ffffff" if i % 2 == 0 else "#FCF7F8"
        filas += f"""
          <tr style="background:{bg};">
            <td style="padding:10px 14px;font-size:13px;color:{_GUINDA};
                        font-weight:600;font-family:monospace;
                        border-bottom:1px solid #EDE4E7;">{escape(folio)}</td>
            <td style="padding:10px 14px;font-size:13px;color:{_TEXT};
                        border-bottom:1px solid #EDE4E7;">{escape(tipo)}</td>
            <td style="padding:10px 14px;font-size:13px;color:{_GRIS};
                        white-space:nowrap;border-bottom:1px solid #EDE4E7;">{fecha}</td>
            <td style="padding:10px 14px;font-size:13px;color:{_TEXT};
                        border-bottom:1px solid #EDE4E7;">
              {escape(titulo[:60])}{"&#8230;" if len(titulo) > 60 else ""}
            </td>
          </tr>
        """

    contenido = f"""
      <h2 style="margin:0 0 6px;color:{_GUINDA};font-size:18px;">
        Resumen diario de incidentes
      </h2>
      <p style="margin:0 0 24px;color:{_GRIS};font-size:14px;">
        {fecha_str} &bull;
        <strong style="color:{_TEXT};">{n} caso(s) nuevo(s)</strong>
        registrado(s) en las últimas 24 horas.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="border-radius:4px;border:1px solid #E0D0D5;
                    border-collapse:collapse;margin-bottom:28px;">
        <tr style="background:{_GUINDA};">
          <th style="padding:10px 14px;text-align:left;font-size:11px;
                      color:{_ORO};text-transform:uppercase;letter-spacing:1px;
                      font-weight:700;">Folio</th>
          <th style="padding:10px 14px;text-align:left;font-size:11px;
                      color:{_ORO};text-transform:uppercase;letter-spacing:1px;
                      font-weight:700;">Tipo</th>
          <th style="padding:10px 14px;text-align:left;font-size:11px;
                      color:{_ORO};text-transform:uppercase;letter-spacing:1px;
                      font-weight:700;">Fecha / Hora</th>
          <th style="padding:10px 14px;text-align:left;font-size:11px;
                      color:{_ORO};text-transform:uppercase;letter-spacing:1px;
                      font-weight:700;">Título</th>
        </tr>
        {filas}
      </table>

      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background-color:{_GUINDA};border-radius:3px;">
            <a href="{PANEL_URL}" target="_blank"
               style="display:inline-block;padding:12px 28px;
                       color:#ffffff;text-decoration:none;
                       font-size:14px;font-weight:700;letter-spacing:0.5px;">
              Ir al panel &rarr;
            </a>
          </td>
        </tr>
      </table>
    """
    return _wrap_html(f"Digest {fecha_str}", "Digest diario", contenido)
