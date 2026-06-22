-- Seed: 10 casos completos para desarrollo local
-- Ejecutar desde backend/db/:
--   psql -h localhost -p 5433 -U postgres -d bd_089 -f seed_10casos.sql
--
-- Cubre los 4 pasos requeridos por cada caso:
--   1. agents            — agente que tomó la llamada
--   2. conv_details      — metadatos de la conversación
--   3. conv_exec         — timestamps + transcripción jsonb
--   4. reports           — reporte (activa report_generated = true en la vista)
--
-- ON CONFLICT DO NOTHING → seguro correrlo varias veces.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- Catálogo de tipos de extorsión (requerido por FK de conv_details)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.extortion_type (id_extortion, name, description) VALUES
(1, 'Extorsión presencial-exigencia de pago o bienes (Directa)',                             'Extorsión realizada de forma presencial exigiendo entrega inmediata de dinero o bienes.'),
(2, 'Extorsión por secuestro virtual',                                                        'Llamada falsa que simula tener retenido a un familiar para exigir rescate.'),
(3, 'Extorsión telefónica-virtual-exigencia de pago o bienes (Indirecta)',                   'Extorsión realizada mediante llamada o mensaje exigiendo depósito bancario bajo amenaza.'),
(4, 'Extorsión escrita-otros medios exigencia de pago o bienes (Indirecta)',                 'Amenaza enviada por escrito (nota, carta, mensaje) exigiendo pago o entrega de bienes.'),
(5, 'Fraude-engaño telefónico-virtual',                                                       'Engaño mediante llamada o medio digital simulando premios, autoridades o servicios falsos.'),
(6, 'Denuncia de localización y operación del probable extorsionador o grupo delictivo',     'Reporte ciudadano que identifica la ubicación u operación de un grupo extorsionador.'),
(7, 'Extorsión por invasión-despojo de predio',                                               'Toma ilegal de un terreno o propiedad exigiendo pago para su desocupación.'),
(8, 'Extorsión por contenido sexual o íntimo',                                                'Amenaza de difundir imágenes o videos íntimos a cambio de dinero (sextorsión).')
ON CONFLICT (id_extortion) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- Agente compartido para los 10 casos
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.agents (id_agent, name, description)
VALUES ('agent_SEED00000000000000000001', 'Agente Semilla', 'Agente de prueba para seed de 10 casos')
ON CONFLICT (id_agent) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- CASO 1 — Extorsión telefónica, CDMX, exige transferencia bancaria
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.conv_details (id_conv_eleven, id_agent, id_extortion, title, summary, status_conv, call_duration_secs, call_successful)
VALUES (
    'conv_SEED000000000000000001',
    'agent_SEED00000000000000000001',
    3,
    'Extorsión telefónica — depósito urgente bajo amenaza',
    'La víctima, residente de Iztapalapa CDMX, recibió una llamada exigiendo $20,000 MXN bajo amenaza de daño físico. El extorsionador proporcionó número de cuenta Banorte. La víctima no realizó ningún depósito y reportó el hecho.',
    'done', 318, 'success'
) ON CONFLICT (id_conv_eleven) DO NOTHING;

INSERT INTO public.conv_exec (id_conv_eleven, id_agent, date_exec, start_time, end_time, transcription)
VALUES (
    'conv_SEED000000000000000001',
    'agent_SEED00000000000000000001',
    '2026-05-03',
    '2026-05-03 09:14:00',
    '2026-05-03 09:19:18',
    '[
        {"role":"agent","message":"Línea de atención a víctimas, buenas días. ¿En qué le ayudo?","time_in_call_secs":0},
        {"role":"user","message":"Me acaban de llamar para pedirme veinte mil pesos. Dicen que si no pago hoy me va a pasar algo.","time_in_call_secs":4},
        {"role":"agent","message":"Entiendo. ¿Está usted en un lugar seguro ahora mismo?","time_in_call_secs":17},
        {"role":"user","message":"Sí, estoy en mi trabajo en Iztapalapa. Me llamaron de un número desconocido.","time_in_call_secs":22},
        {"role":"agent","message":"¿Tiene el número desde el que le llamaron?","time_in_call_secs":35},
        {"role":"user","message":"Sí, 55-9876-5432. Me dieron una cuenta Banorte: 123456789012345678, a nombre de Roberto Sánchez López.","time_in_call_secs":41},
        {"role":"agent","message":"Registrado. No realice ningún depósito. ¿Le dieron algún plazo?","time_in_call_secs":68},
        {"role":"user","message":"Dijeron antes de las tres de la tarde de hoy.","time_in_call_secs":75},
        {"role":"agent","message":"Se generará el folio de su reporte. ¿Algo más que quiera agregar?","time_in_call_secs":85},
        {"role":"user","message":"No, solo quiero que quede registrado. Gracias.","time_in_call_secs":93}
    ]'::jsonb
) ON CONFLICT (id_conv_eleven) DO NOTHING;

INSERT INTO public.reports (folio, id_conv_eleven, mode, time_rep, place, report_date, phone, caller_role, contact_via, demand_type, required_amount, deposited_amount, acc_numbers, acc_holders, is_actionable)
VALUES (
    'F-SED0001', 'conv_SEED000000000000000001',
    'Telefónico', '09:14', 'Iztapalapa, CDMX', '2026-05-03',
    '5598765432', 'Víctima directa', 'Llamada telefónica entrante',
    'Transferencia bancaria inmediata',
    ARRAY[20000.00]::numeric(12,2)[], ARRAY[]::numeric(12,2)[],
    ARRAY['123456789012345678'], ARRAY['Roberto Sánchez López'],
    true
) ON CONFLICT (folio) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- CASO 2 — Secuestro virtual, Guadalajara, familiar supuestamente retenido
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.conv_details (id_conv_eleven, id_agent, id_extortion, title, summary, status_conv, call_duration_secs, call_successful)
VALUES (
    'conv_SEED000000000000000002',
    'agent_SEED00000000000000000001',
    2,
    'Secuestro virtual — hijo supuestamente retenido',
    'Hombre de Guadalajara reporta que recibió llamada indicando que su hijo estaba secuestrado. Exigieron $50,000 MXN para liberarlo. La víctima contactó a su hijo y confirmó que estaba bien — secuestro virtual. Proporcionó número de cuenta BBVA del extorsionador.',
    'done', 427, 'success'
) ON CONFLICT (id_conv_eleven) DO NOTHING;

INSERT INTO public.conv_exec (id_conv_eleven, id_agent, date_exec, start_time, end_time, transcription)
VALUES (
    'conv_SEED000000000000000002',
    'agent_SEED00000000000000000001',
    '2026-05-05',
    '2026-05-05 11:30:00',
    '2026-05-05 11:37:07',
    '[
        {"role":"agent","message":"Línea de atención, buenas tardes. ¿En qué le puedo ayudar?","time_in_call_secs":0},
        {"role":"user","message":"Me llamaron diciéndome que tienen a mi hijo. Quieren cincuenta mil pesos o le hacen daño.","time_in_call_secs":5},
        {"role":"agent","message":"Mantenga la calma. ¿Ha podido comunicarse directamente con su hijo?","time_in_call_secs":20},
        {"role":"user","message":"No, me dijeron que no lo llame o le pasará algo.","time_in_call_secs":27},
        {"role":"agent","message":"Le sugiero intentar contactar a su hijo por otro medio mientras hablamos. ¿Tiene el número del que le llamaron?","time_in_call_secs":36},
        {"role":"user","message":"Sí, 33-4567-8901. Y me dieron cuenta BBVA: 456789012345678901, a nombre de María González Rivas.","time_in_call_secs":44},
        {"role":"agent","message":"Entendido. No realice ningún pago. Intente contactar a su hijo ahora.","time_in_call_secs":71},
        {"role":"user","message":"Un momento... lo llamé al cel por WhatsApp y me contestó. Está en la escuela. ¡Es mentira!","time_in_call_secs":120},
        {"role":"agent","message":"Es lo que se llama secuestro virtual. Quedará registrado el reporte. ¿Desea orientación adicional?","time_in_call_secs":145},
        {"role":"user","message":"No, gracias. Qué alivio. Voy a reportarlo también con la policía.","time_in_call_secs":158}
    ]'::jsonb
) ON CONFLICT (id_conv_eleven) DO NOTHING;

INSERT INTO public.reports (folio, id_conv_eleven, mode, time_rep, place, report_date, phone, caller_role, contact_via, demand_type, required_amount, deposited_amount, acc_numbers, acc_holders, is_actionable)
VALUES (
    'F-SED0002', 'conv_SEED000000000000000002',
    'Telefónico', '11:30', 'Guadalajara, Jalisco', '2026-05-05',
    '3345678901', 'Familiar de víctima', 'Llamada telefónica entrante',
    'Transferencia bancaria inmediata',
    ARRAY[50000.00]::numeric(12,2)[], ARRAY[]::numeric(12,2)[],
    ARRAY['456789012345678901'], ARRAY['María González Rivas'],
    true
) ON CONFLICT (folio) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- CASO 3 — Extorsión presencial directa, Monterrey, entrega de efectivo
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.conv_details (id_conv_eleven, id_agent, id_extortion, title, summary, status_conv, call_duration_secs, call_successful)
VALUES (
    'conv_SEED000000000000000003',
    'agent_SEED00000000000000000001',
    1,
    'Extorsión presencial — cobro de piso a negocio',
    'Dueño de taquería en Monterrey reporta que dos individuos se presentaron exigiendo pago mensual de $3,000 MXN como "cuota de protección". Amenazaron con dañar el local si no pagaba. Proporcionó descripción física de los extorsionadores.',
    'done', 389, 'success'
) ON CONFLICT (id_conv_eleven) DO NOTHING;

INSERT INTO public.conv_exec (id_conv_eleven, id_agent, date_exec, start_time, end_time, transcription)
VALUES (
    'conv_SEED000000000000000003',
    'agent_SEED00000000000000000001',
    '2026-05-07',
    '2026-05-07 16:45:00',
    '2026-05-07 16:51:29',
    '[
        {"role":"agent","message":"Línea de atención, buenas tardes.","time_in_call_secs":0},
        {"role":"user","message":"Fui víctima de extorsión. Llegaron dos hombres a mi negocio pidiendo dinero mensual, dicen que tengo que pagar o queman mi local.","time_in_call_secs":4},
        {"role":"agent","message":"¿Ocurrió esto hoy?","time_in_call_secs":20},
        {"role":"user","message":"Sí, hace como una hora, en mi taquería en San Pedro Garza García, Monterrey.","time_in_call_secs":25},
        {"role":"agent","message":"¿Puede describir a las personas?","time_in_call_secs":38},
        {"role":"user","message":"Dos hombres jóvenes, uno con tatuaje en el cuello, otro con gorra roja. Llegaron en moto sin placas.","time_in_call_secs":44},
        {"role":"agent","message":"¿Cuánto le exigieron?","time_in_call_secs":68},
        {"role":"user","message":"Tres mil pesos mensuales. Dijeron que vienen cada primer lunes del mes.","time_in_call_secs":73},
        {"role":"agent","message":"No realice ningún pago. Se generará reporte y se canalizará a las autoridades competentes.","time_in_call_secs":88},
        {"role":"user","message":"¿Qué hago si regresan antes?","time_in_call_secs":100},
        {"role":"agent","message":"Llame al 911 de inmediato si regresan. El folio de su reporte es el que recibirá al finalizar esta llamada.","time_in_call_secs":108}
    ]'::jsonb
) ON CONFLICT (id_conv_eleven) DO NOTHING;

INSERT INTO public.reports (folio, id_conv_eleven, mode, time_rep, place, report_date, phone, caller_role, contact_via, demand_type, required_amount, deposited_amount, acc_numbers, acc_holders, is_actionable)
VALUES (
    'F-SED0003', 'conv_SEED000000000000000003',
    'Presencial', '16:00', 'San Pedro Garza García, Nuevo León', '2026-05-07',
    NULL, 'Víctima directa', 'Llamada telefónica entrante',
    'Pago en efectivo recurrente (cobro de piso)',
    ARRAY[3000.00]::numeric(12,2)[], ARRAY[]::numeric(12,2)[],
    ARRAY[]::text[], ARRAY[]::text[],
    true
) ON CONFLICT (folio) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- CASO 4 — Fraude por engaño telefónico, Puebla, premio falso
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.conv_details (id_conv_eleven, id_agent, id_extortion, title, summary, status_conv, call_duration_secs, call_successful)
VALUES (
    'conv_SEED000000000000000004',
    'agent_SEED00000000000000000001',
    5,
    'Fraude telefónico — premio falso de sorteo',
    'Mujer de Puebla reporta que le informaron que ganó un auto y debe pagar $8,500 MXN de impuestos para recibirlo. Realizó un depósito de $4,000 MXN antes de sospechar y contactar la línea. Se registran número de cuenta y teléfono del defraudador.',
    'done', 512, 'success'
) ON CONFLICT (id_conv_eleven) DO NOTHING;

INSERT INTO public.conv_exec (id_conv_eleven, id_agent, date_exec, start_time, end_time, transcription)
VALUES (
    'conv_SEED000000000000000004',
    'agent_SEED00000000000000000001',
    '2026-05-09',
    '2026-05-09 13:05:00',
    '2026-05-09 13:13:32',
    '[
        {"role":"agent","message":"Línea de atención, buenas tardes. ¿En qué le ayudo?","time_in_call_secs":0},
        {"role":"user","message":"Me dijeron que gané un automóvil en un sorteo, pero tuve que pagar impuestos y creo que me engañaron.","time_in_call_secs":6},
        {"role":"agent","message":"¿Cuánto pagó y a qué cuenta?","time_in_call_secs":22},
        {"role":"user","message":"Deposité cuatro mil pesos a HSBC: 789012345678901234, a nombre de Sorteos del Norte SA.","time_in_call_secs":28},
        {"role":"agent","message":"¿Tiene el teléfono desde donde le contactaron?","time_in_call_secs":55},
        {"role":"user","message":"Sí, 22-1122-3344. Me habló una señora muy amable que dijo ser de Telecomm.","time_in_call_secs":61},
        {"role":"agent","message":"Ninguna institución legítima solicita pagos previos para entregar premios. Esto es un fraude. ¿Tiene comprobante del depósito?","time_in_call_secs":78},
        {"role":"user","message":"Sí, tengo el ticket del OXXO.","time_in_call_secs":92},
        {"role":"agent","message":"Guárdelo. Se generará el reporte y puede presentarlo como evidencia ante la fiscalía. ¿Desea más información?","time_in_call_secs":99},
        {"role":"user","message":"Sí, ¿puedo recuperar mi dinero?","time_in_call_secs":112},
        {"role":"agent","message":"Puede intentarlo mediante denuncia formal. Le daremos el folio de seguimiento.","time_in_call_secs":118}
    ]'::jsonb
) ON CONFLICT (id_conv_eleven) DO NOTHING;

INSERT INTO public.reports (folio, id_conv_eleven, mode, time_rep, place, report_date, phone, caller_role, contact_via, demand_type, required_amount, deposited_amount, acc_numbers, acc_holders, is_actionable)
VALUES (
    'F-SED0004', 'conv_SEED000000000000000004',
    'Telefónico', '13:05', 'Puebla, Puebla', '2026-05-09',
    '2211223344', 'Víctima directa', 'Llamada telefónica entrante',
    'Depósito por impuestos de premio falso',
    ARRAY[8500.00]::numeric(12,2)[], ARRAY[4000.00]::numeric(12,2)[],
    ARRAY['789012345678901234'], ARRAY['Sorteos del Norte SA'],
    true
) ON CONFLICT (folio) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- CASO 5 — Extorsión por contenido sexual, Tijuana, sextorsión
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.conv_details (id_conv_eleven, id_agent, id_extortion, title, summary, status_conv, call_duration_secs, call_successful)
VALUES (
    'conv_SEED000000000000000005',
    'agent_SEED00000000000000000001',
    8,
    'Sextorsión — amenaza de difusión de imágenes íntimas',
    'Joven de Tijuana reporta que un desconocido le contactó por redes sociales y obtuvo imágenes íntimas. Ahora amenaza con difundirlas si no paga $10,000 MXN. Nunca ha realizado pagos. Proporciona usuario de redes y número de CLABE interbancaria.',
    'done', 445, 'success'
) ON CONFLICT (id_conv_eleven) DO NOTHING;

INSERT INTO public.conv_exec (id_conv_eleven, id_agent, date_exec, start_time, end_time, transcription)
VALUES (
    'conv_SEED000000000000000005',
    'agent_SEED00000000000000000001',
    '2026-05-11',
    '2026-05-11 20:18:00',
    '2026-05-11 20:25:25',
    '[
        {"role":"agent","message":"Línea de atención, buenas noches.","time_in_call_secs":0},
        {"role":"user","message":"Alguien me está amenazando con publicar fotos mías si no le pago dinero. No sé qué hacer.","time_in_call_secs":5},
        {"role":"agent","message":"Esto se llama sextorsión. Primero: no realice ningún pago. ¿Por qué medio le contactó?","time_in_call_secs":18},
        {"role":"user","message":"Por Instagram, el usuario es @extorsor_fake_123. También me mandó mensaje a mi WhatsApp desde 664-321-9876.","time_in_call_secs":26},
        {"role":"agent","message":"¿Le ha pedido que deposite a alguna cuenta?","time_in_call_secs":51},
        {"role":"user","message":"Sí, me dio una CLABE: 012345678901234567. Dice que es de Mercado Pago.","time_in_call_secs":57},
        {"role":"agent","message":"No realice el pago. Bloquéelo en todas las plataformas y conserve capturas de pantalla como evidencia.","time_in_call_secs":75},
        {"role":"user","message":"¿Y si de todas formas publica las fotos?","time_in_call_secs":88},
        {"role":"agent","message":"Puede reportar el contenido directamente en la plataforma. El pago no garantiza que no lo haga. Quedará registrado su reporte.","time_in_call_secs":96}
    ]'::jsonb
) ON CONFLICT (id_conv_eleven) DO NOTHING;

INSERT INTO public.reports (folio, id_conv_eleven, mode, time_rep, place, report_date, phone, caller_role, contact_via, demand_type, required_amount, deposited_amount, acc_numbers, acc_holders, is_actionable)
VALUES (
    'F-SED0005', 'conv_SEED000000000000000005',
    'Virtual', '20:18', 'Tijuana, Baja California', '2026-05-11',
    '6643219876', 'Víctima directa', 'Mensaje por red social',
    'Transferencia a cuenta de Mercado Pago',
    ARRAY[10000.00]::numeric(12,2)[], ARRAY[]::numeric(12,2)[],
    ARRAY['012345678901234567'], ARRAY['Desconocido (Mercado Pago)'],
    true
) ON CONFLICT (folio) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- CASO 6 — Denuncia de localización de grupo delictivo, Estado de México
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.conv_details (id_conv_eleven, id_agent, id_extortion, title, summary, status_conv, call_duration_secs, call_successful)
VALUES (
    'conv_SEED000000000000000006',
    'agent_SEED00000000000000000001',
    6,
    'Denuncia — localización de probable célula extorsionadora',
    'Vecino de Naucalpan denuncia que un grupo de individuos opera desde una casa abandonada en su colonia. Describe actividades sospechosas, uso de radios y vehículos sin placas. Afirma que varios negocios del área han sido extorsionados. No es víctima directa.',
    'done', 356, 'success'
) ON CONFLICT (id_conv_eleven) DO NOTHING;

INSERT INTO public.conv_exec (id_conv_eleven, id_agent, date_exec, start_time, end_time, transcription)
VALUES (
    'conv_SEED000000000000000006',
    'agent_SEED00000000000000000001',
    '2026-05-13',
    '2026-05-13 08:30:00',
    '2026-05-13 08:35:56',
    '[
        {"role":"agent","message":"Línea de atención, buenos días.","time_in_call_secs":0},
        {"role":"user","message":"Quiero reportar un grupo que creo que está extorsionando negocios en mi colonia.","time_in_call_secs":4},
        {"role":"agent","message":"Claro, ¿puede describir la situación?","time_in_call_secs":16},
        {"role":"user","message":"Vivo en Naucalpan y hay una casa abandonada en la calle Hidalgo 45 donde se reúnen varios hombres. He visto que van a las tiendas de la zona y los dueños me han dicho que los presionan para que paguen.","time_in_call_secs":22},
        {"role":"agent","message":"¿Ha observado vehículos asociados?","time_in_call_secs":55},
        {"role":"user","message":"Sí, dos camionetas Silverado negras sin placas y una moto roja. Usan radios de comunicación.","time_in_call_secs":61},
        {"role":"agent","message":"¿Tiene aproximación de cuántas personas están involucradas?","time_in_call_secs":82},
        {"role":"user","message":"Entre cinco y ocho personas, siempre hay al menos dos afuera de la casa.","time_in_call_secs":88},
        {"role":"agent","message":"Quedará registrado el reporte con la ubicación. Le asignamos folio de seguimiento.","time_in_call_secs":104}
    ]'::jsonb
) ON CONFLICT (id_conv_eleven) DO NOTHING;

INSERT INTO public.reports (folio, id_conv_eleven, mode, time_rep, place, report_date, phone, caller_role, contact_via, demand_type, required_amount, deposited_amount, acc_numbers, acc_holders, is_actionable)
VALUES (
    'F-SED0006', 'conv_SEED000000000000000006',
    'Telefónico', '08:30', 'Naucalpan, Estado de México', '2026-05-13',
    NULL, 'Testigo / denunciante', 'Llamada telefónica entrante',
    NULL,
    ARRAY[]::numeric(12,2)[], ARRAY[]::numeric(12,2)[],
    ARRAY[]::text[], ARRAY[]::text[],
    true
) ON CONFLICT (folio) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- CASO 7 — Extorsión escrita, Cancún, mensaje intimidatorio en negocio
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.conv_details (id_conv_eleven, id_agent, id_extortion, title, summary, status_conv, call_duration_secs, call_successful)
VALUES (
    'conv_SEED000000000000000007',
    'agent_SEED00000000000000000001',
    4,
    'Extorsión escrita — nota intimidatoria dejada en restaurante',
    'Propietario de restaurante en Cancún encontró nota manuscrita amenazando con quemar el local si no deposita $15,000 MXN semanales. La nota incluye número de cuenta bancaria. El negociante nunca ha pagado. Conserva la nota original como evidencia.',
    'done', 298, 'success'
) ON CONFLICT (id_conv_eleven) DO NOTHING;

INSERT INTO public.conv_exec (id_conv_eleven, id_agent, date_exec, start_time, end_time, transcription)
VALUES (
    'conv_SEED000000000000000007',
    'agent_SEED00000000000000000001',
    '2026-05-15',
    '2026-05-15 07:55:00',
    '2026-05-15 08:00:58',
    '[
        {"role":"agent","message":"Línea de atención, buenos días.","time_in_call_secs":0},
        {"role":"user","message":"Encontré una nota en la puerta de mi restaurante amenazándome con quemarme el negocio.","time_in_call_secs":5},
        {"role":"agent","message":"¿Cuándo encontró la nota?","time_in_call_secs":18},
        {"role":"user","message":"Esta mañana al abrir, como a las siete y media. Aquí en el centro de Cancún.","time_in_call_secs":23},
        {"role":"agent","message":"¿La nota menciona algún monto o forma de pago?","time_in_call_secs":36},
        {"role":"user","message":"Sí, dice que debo depositar quince mil pesos cada semana a Santander: 234567890123456789, a nombre de Inversiones CM.","time_in_call_secs":42},
        {"role":"agent","message":"No realice ningún depósito. Conserve la nota sin tocarla más, puede ser evidencia. ¿Tiene cámaras de seguridad en el local?","time_in_call_secs":72},
        {"role":"user","message":"Sí, tengo cámaras. Las voy a revisar ahora.","time_in_call_secs":85},
        {"role":"agent","message":"Excelente. Guarde las grabaciones. Le asignamos folio de reporte.","time_in_call_secs":92}
    ]'::jsonb
) ON CONFLICT (id_conv_eleven) DO NOTHING;

INSERT INTO public.reports (folio, id_conv_eleven, mode, time_rep, place, report_date, phone, caller_role, contact_via, demand_type, required_amount, deposited_amount, acc_numbers, acc_holders, is_actionable)
VALUES (
    'F-SED0007', 'conv_SEED000000000000000007',
    'Escrito / Nota', '07:30', 'Cancún, Quintana Roo', '2026-05-15',
    NULL, 'Víctima directa', 'Llamada telefónica entrante',
    'Depósito semanal a cuenta Santander',
    ARRAY[15000.00]::numeric(12,2)[], ARRAY[]::numeric(12,2)[],
    ARRAY['234567890123456789'], ARRAY['Inversiones CM'],
    true
) ON CONFLICT (folio) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- CASO 8 — Extorsión por invasión de predio, Oaxaca
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.conv_details (id_conv_eleven, id_agent, id_extortion, title, summary, status_conv, call_duration_secs, call_successful)
VALUES (
    'conv_SEED000000000000000008',
    'agent_SEED00000000000000000001',
    7,
    'Extorsión por despojo — invasión de terreno ejidal',
    'Campesino de los Valles Centrales de Oaxaca reporta que un grupo armado tomó posesión de su parcela ejidal exigiendo $30,000 MXN para retirarse. Hay presencia de al menos 12 personas en el predio. El denunciante no puede acceder a su tierras.',
    'done', 503, 'success'
) ON CONFLICT (id_conv_eleven) DO NOTHING;

INSERT INTO public.conv_exec (id_conv_eleven, id_agent, date_exec, start_time, end_time, transcription)
VALUES (
    'conv_SEED000000000000000008',
    'agent_SEED00000000000000000001',
    '2026-05-17',
    '2026-05-17 10:10:00',
    '2026-05-17 10:18:23',
    '[
        {"role":"agent","message":"Línea de atención, buenos días.","time_in_call_secs":0},
        {"role":"user","message":"Hay gente armada que tomó mi parcela y me piden dinero para salirse.","time_in_call_secs":5},
        {"role":"agent","message":"¿Está usted en un lugar seguro lejos del predio?","time_in_call_secs":19},
        {"role":"user","message":"Sí, estoy en la cabecera municipal de Tlacolula de Matamoros, Oaxaca.","time_in_call_secs":25},
        {"role":"agent","message":"¿Cuántas personas aproximadamente están en el predio?","time_in_call_secs":39},
        {"role":"user","message":"Como doce. Tienen camionetas y algunos traen armas largas.","time_in_call_secs":45},
        {"role":"agent","message":"¿Le han contactado directamente para exigirle el pago?","time_in_call_secs":62},
        {"role":"user","message":"Sí, el que parece ser el jefe me llamó de 951-555-7788 y dijo que quieren treinta mil para dejar la parcela.","time_in_call_secs":68},
        {"role":"agent","message":"No negocie directamente con ellos. Se dará aviso inmediato a las autoridades y se registra el reporte con carácter urgente.","time_in_call_secs":95},
        {"role":"user","message":"Gracias, tengo familia que depende de esa tierra para sembrar.","time_in_call_secs":110}
    ]'::jsonb
) ON CONFLICT (id_conv_eleven) DO NOTHING;

INSERT INTO public.reports (folio, id_conv_eleven, mode, time_rep, place, report_date, phone, caller_role, contact_via, demand_type, required_amount, deposited_amount, acc_numbers, acc_holders, is_actionable)
VALUES (
    'F-SED0008', 'conv_SEED000000000000000008',
    'Telefónico', '10:10', 'Tlacolula de Matamoros, Oaxaca', '2026-05-17',
    '9515557788', 'Víctima directa', 'Llamada telefónica entrante',
    'Pago en efectivo para desalojo',
    ARRAY[30000.00]::numeric(12,2)[], ARRAY[]::numeric(12,2)[],
    ARRAY[]::text[], ARRAY[]::text[],
    true
) ON CONFLICT (folio) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- CASO 9 — Extorsión telefónica, Querétaro, funcionario público amenazado
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.conv_details (id_conv_eleven, id_agent, id_extortion, title, summary, status_conv, call_duration_secs, call_successful)
VALUES (
    'conv_SEED000000000000000009',
    'agent_SEED00000000000000000001',
    3,
    'Extorsión a funcionario — amenaza contra familia por no pagar',
    'Funcionario municipal de Querétaro recibe llamadas amenazantes exigiendo $40,000 MXN mensuales a cambio de no dañar a su familia. Los extorsionadores demuestran conocer su domicilio y la escuela de sus hijos. Realizó dos pagos antes de reportar.',
    'done', 618, 'success'
) ON CONFLICT (id_conv_eleven) DO NOTHING;

INSERT INTO public.conv_exec (id_conv_eleven, id_agent, date_exec, start_time, end_time, transcription)
VALUES (
    'conv_SEED000000000000000009',
    'agent_SEED00000000000000000001',
    '2026-05-19',
    '2026-05-19 14:00:00',
    '2026-05-19 14:10:18',
    '[
        {"role":"agent","message":"Línea de atención, buenas tardes.","time_in_call_secs":0},
        {"role":"user","message":"Soy funcionario municipal y llevo dos meses pagando a extorsionadores. Ya no puedo más.","time_in_call_secs":5},
        {"role":"agent","message":"¿Cuánto ha pagado en total?","time_in_call_secs":20},
        {"role":"user","message":"Ochenta mil pesos en dos pagos de cuarenta mil. Me exigen lo mismo cada mes.","time_in_call_secs":26},
        {"role":"agent","message":"¿A qué cuenta ha depositado?","time_in_call_secs":45},
        {"role":"user","message":"A dos cuentas distintas. La primera Banamex: 345678901234567890, a nombre de Carlos Vega. La segunda Banorte: 567890123456789012, también a nombre de él.","time_in_call_secs":52},
        {"role":"agent","message":"¿Desde qué número le han llamado?","time_in_call_secs":90},
        {"role":"user","message":"Cambian el número cada vez. El primero fue 442-111-2233, el último 442-444-5566.","time_in_call_secs":97},
        {"role":"agent","message":"Su caso requiere atención especializada. Se generará el reporte y se canalizará a la unidad antisecuestros.","time_in_call_secs":118},
        {"role":"user","message":"¿Estoy en peligro si dejo de pagar?","time_in_call_secs":132},
        {"role":"agent","message":"Recomendamos que tome medidas de seguridad con su familia. Las autoridades le orientarán. No vuelva a pagar.","time_in_call_secs":140}
    ]'::jsonb
) ON CONFLICT (id_conv_eleven) DO NOTHING;

INSERT INTO public.reports (folio, id_conv_eleven, mode, time_rep, place, report_date, phone, caller_role, contact_via, demand_type, required_amount, deposited_amount, acc_numbers, acc_holders, is_actionable)
VALUES (
    'F-SED0009', 'conv_SEED000000000000000009',
    'Telefónico', '14:00', 'Querétaro, Querétaro', '2026-05-19',
    '4421112233', 'Víctima directa', 'Llamada telefónica entrante',
    'Transferencia bancaria mensual',
    ARRAY[40000.00]::numeric(12,2)[], ARRAY[80000.00]::numeric(12,2)[],
    ARRAY['345678901234567890','567890123456789012'], ARRAY['Carlos Vega','Carlos Vega'],
    true
) ON CONFLICT (folio) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- CASO 10 — Secuestro virtual, Veracruz, abuelo reporta por nieto
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.conv_details (id_conv_eleven, id_agent, id_extortion, title, summary, status_conv, call_duration_secs, call_successful)
VALUES (
    'conv_SEED000000000000000010',
    'agent_SEED00000000000000000001',
    2,
    'Secuestro virtual — nieto supuestamente retenido en accidente',
    'Adulto mayor de Veracruz reporta que le llamaron diciendo que su nieto tuvo un accidente y está detenido, exigiendo $25,000 MXN para liberarlo. El agente ayudó a la víctima a contactar a su nieto quien confirmó estar bien. Secuestro virtual confirmado.',
    'done', 482, 'success'
) ON CONFLICT (id_conv_eleven) DO NOTHING;

INSERT INTO public.conv_exec (id_conv_eleven, id_agent, date_exec, start_time, end_time, transcription)
VALUES (
    'conv_SEED000000000000000010',
    'agent_SEED00000000000000000001',
    '2026-05-21',
    '2026-05-21 15:45:00',
    '2026-05-21 15:53:02',
    '[
        {"role":"agent","message":"Línea de atención, buenas tardes.","time_in_call_secs":0},
        {"role":"user","message":"Me dijeron que mi nieto chocó y que lo tienen detenido y que si no pago no lo sueltan, por favor ayúdeme.","time_in_call_secs":6},
        {"role":"agent","message":"Tranquilo, vamos a ayudarle. ¿Tiene el número desde el que le llamaron?","time_in_call_secs":23},
        {"role":"user","message":"Sí, 229-777-8899.","time_in_call_secs":31},
        {"role":"agent","message":"¿Cuánto le están exigiendo?","time_in_call_secs":38},
        {"role":"user","message":"Veinticinco mil pesos. Me dieron cuenta Azteca: 678901234567890123, a nombre de Lic. Ramírez.","time_in_call_secs":44},
        {"role":"agent","message":"Antes de hacer cualquier pago: ¿puede llamar directamente a su nieto desde otro teléfono?","time_in_call_secs":68},
        {"role":"user","message":"Espere... mi esposa lo está llamando... ya contestó. Dice que está bien, en el trabajo.","time_in_call_secs":120},
        {"role":"agent","message":"Es un secuestro virtual, una modalidad de fraude muy común. Su nieto está bien. No realice ningún pago.","time_in_call_secs":150},
        {"role":"user","message":"Qué alivio tan grande. Gracias a Dios. ¿Puedo denunciarlos?","time_in_call_secs":165},
        {"role":"agent","message":"Por supuesto. Le generamos el folio del reporte ahora mismo.","time_in_call_secs":175}
    ]'::jsonb
) ON CONFLICT (id_conv_eleven) DO NOTHING;

INSERT INTO public.reports (folio, id_conv_eleven, mode, time_rep, place, report_date, phone, caller_role, contact_via, demand_type, required_amount, deposited_amount, acc_numbers, acc_holders, is_actionable)
VALUES (
    'F-SED0010', 'conv_SEED000000000000000010',
    'Telefónico', '15:45', 'Veracruz, Veracruz', '2026-05-21',
    '2297778899', 'Familiar de víctima', 'Llamada telefónica entrante',
    'Transferencia bancaria inmediata',
    ARRAY[25000.00]::numeric(12,2)[], ARRAY[]::numeric(12,2)[],
    ARRAY['678901234567890123'], ARRAY['Lic. Ramírez'],
    true
) ON CONFLICT (folio) DO NOTHING;

COMMIT;

-- Verificación rápida:
-- SELECT id_conv_eleven, title, folio, extortion_name, place, is_actionable
-- FROM analytics.vw_report_conversation_panel
-- WHERE folio LIKE 'F-SED%'
-- ORDER BY folio;
