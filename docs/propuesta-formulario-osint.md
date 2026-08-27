# Propuesta de campos — Formulario de investigación OSINT

Documento para revisión con el cliente. Por cada campo, marcar en la columna **¿Incluir?** con Sí / No / Ajustar (y anotar el ajuste).

## 1. Datos generales del reporte

| Campo | ¿Incluir? | Notas |
| --- | --- | --- |
| Folio | ☐ | Identificador del caso |
| Categoría del reporte | ☐ | |
| Folio Relacional | ☐ | Para vincular con otro folio ya existente |
| Narrativa | ☐ | Resumen general de la investigación |

## 2. Línea telefónica

| Campo | ¿Incluir? | Notas |
| --- | --- | --- |
| Número | ☐ | |
| Nombre de la persona | ☐ | Titular registrado de la línea |
| Procedencia | ☐ | |
| Proveedor | ☐ | Compañía telefónica |
| Status | ☐ | Activo/Inactivo |
| Tipo de línea | ☐ | Movil/Fijo/Virtual. |
| Herramientas | ☐ | Herramientas OSINT usadas para esta consulta |
| Observaciones | ☐ | Notas encontradas por cada número |

*¿Puede haber más de un número investigado por caso? Si sí, el formulario permitirá agregar varias líneas.*

*Agregar casilla "sin información", al aplicarse significa que no se encontró ningún dato*
## 3. Mensajería (WhatsApp / Telegram)

| Campo | ¿Incluir? | Notas |
| --- | --- | --- |
| WhatsApp | ☐ | Estado/datos encontrados en WhatsApp |
| Telegram | ☐ | Estado/datos encontrados en Telegram |
| Empresa/Persona | ☐ | A quién está vinculada la cuenta |
| Nombre al que está registrado | ☐ | |
| Imagen | ☐ | Foto de perfil |
| URL | ☐ | Enlace al perfil |
| Resumen | ☐ | |
| Herramientas | ☐ | |

## 4. Redes sociales

| Campo | ¿Incluir? | Notas |
| --- | --- | --- |
| Red vinculada | ☐ | Facebook, Instagram, X, TikTok, etc. |
| Número de cuentas vinculadas | ☐ | |
| ID/Nombre | ☐ | URL completa del perfil, NO del username |
| Activa | ☐ | Sí/No |
| Publicaciones asociadas | ☐ | Agr |
| Imágenes de las publicaciones | ☐ | |

*¿Se investiga una cuenta a la vez o varias por caso? El formulario permitirá agregar varias.*
*Se agregarán no solo perfiles, sino publicaciones asociadas*

## 5. Datos bancarios

| Campo | ¿Incluir? | Notas |
| --- | --- | --- |
| Nombre | ☐ | Titular de la cuenta |
| Cuenta bancaria | ☐ | |
| Nombre de la tarjeta | ☐ | Banco/institución |

## 6. Identificación oficial

| Campo | ¿Incluir? | Notas |
| --- | --- | --- |
| Nombre | ☐ | |
| CURP | ☐ | |
| Nombre de licencia | ☐ | Licencia de conducir u otro documento |
| Foto de la persona | ☐ | |
| Herramientas | ☐ | |

## 7. Vehículos

| Campo | ¿Incluir? | Notas |
| --- | --- | --- |
| Registro (nombre de la persona) | ☐ | Propietario registrado |
| Cantidad de vehículos | ☐ | |
| Vehículo | ☐ | Marca/modelo/color |
| Placas | ☐ | |
| VIN | ☐ | |

## 8. Sitio web (bloque opcional — solo si el caso involucra una página)

| Campo | ¿Incluir? | Notas |
| --- | --- | --- |
| URL | ☐ | |
| ISP | ☐ | |
| Dominio | ☐ | |
| Correo o nombre | ☐ | Dato de registro (whois) |
| IPs | ☐ | |
| Número de cuentas relacionadas | ☐ | |
| Frameworks | ☐ | Tecnología del sitio |
| Puertos | ☐ | Puertos abiertos detectados |
| Herramientas | ☐ | |

---

## Sugerencias

Campos que no estaban en la lista original y que suelen ser útiles en este tipo de investigación — para que el cliente decida si los quiere agregar:

- **Geolocalización del caso** (latitud/longitud o dirección aproximada del incidente en general, no solo del sitio web). Se mencionó "geolocalizaciones" como necesidad pero no apareció como campo explícito en la lista compartida.
- **Investigador responsable y fecha de la investigación** — quién hizo el hallazgo y cuándo, útil para auditoría y para saber si la información sigue vigente.
- **Fuente/evidencia por hallazgo** — un campo de URL o archivo adjunto (captura de pantalla) por cada dato encontrado, para poder sustentar el hallazgo ante un tercero.
- **Nivel de confianza del dato** (ej. confirmado / probable / sin verificar) — para distinguir un dato validado de una pista sin corroborar.
- **Adjuntos generales del caso** — más allá de las fotos ya contempladas (perfil, persona, publicaciones), un espacio para subir documentos o evidencia adicional que no encaje en las categorías anteriores.
- **Clasificación de riesgo o prioridad del caso** — si el equipo ya prioriza casos por gravedad, un campo así ayuda a ordenar la carga de trabajo del monitorista.
