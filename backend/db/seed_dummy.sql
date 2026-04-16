-- Datos de prueba para desarrollo local
-- Ejecutar desde backend/db/:
--   psql -h localhost -p 5433 -U postgres -d bd_089 -f seed_dummy.sql
--
-- Todos los inserts usan ON CONFLICT DO NOTHING — se puede correr múltiples veces sin error.

BEGIN;

-- 1. Agente
INSERT INTO public.agents (id_agent, name, description)
VALUES (
    'agent_DUMMY0000000000000000001',
    'Agente Demo',
    'Agente de prueba para desarrollo local'
)
ON CONFLICT (id_agent) DO NOTHING;


-- 2. Tipo de extorsión (id 99 para no colisionar con los reales)
INSERT INTO public.extortion_type (id_extortion, name, description)
VALUES (
    99,
    'Extorsión telefónica-virtual-exigencia de pago o bienes (Indirecta)',
    'Extorsión realizada mediante llamada o mensaje exigiendo depósito bancario bajo amenaza.'
)
ON CONFLICT (id_extortion) DO NOTHING;


-- 3. Detalle de la conversación
INSERT INTO public.conv_details (
    id_conv_eleven, id_agent, id_extortion,
    title, summary,
    status_conv, call_duration_secs, call_successful
)
VALUES (
    'conv_DUMMY000000000000000001',
    'agent_DUMMY0000000000000000001',
    99,
    'Extorsión telefónica — exigencia de depósito urgente',
    'La víctima recibió una llamada de un individuo que se identificó como integrante de un grupo delictivo. Exigió un depósito de $15,000 MXN bajo amenaza de consecuencias físicas. La llamada duró 4 minutos 32 segundos. Se obtuvo número de cuenta bancaria y nombre del titular.',
    'done',
    272,
    'success'
)
ON CONFLICT (id_conv_eleven) DO NOTHING;


-- 4. Ejecución con transcripción (jsonb)
INSERT INTO public.conv_exec (
    id_conv_eleven, id_agent,
    date_exec, start_time, end_time,
    transcription
)
VALUES (
    'conv_DUMMY000000000000000001',
    'agent_DUMMY0000000000000000001',
    '2026-04-10',
    '2026-04-10 14:22:00',
    '2026-04-10 14:26:32',
    '[
        {
            "role": "agent",
            "message": "Buenas tardes, línea de atención a víctimas de extorsión. ¿En qué le puedo ayudar?",
            "time_in_call_secs": 0
        },
        {
            "role": "user",
            "message": "Buenas tardes, me están llamando para pedirme dinero. Dicen que si no pago me van a hacer algo a mí y a mi familia.",
            "time_in_call_secs": 5
        },
        {
            "role": "agent",
            "message": "Entiendo. ¿Está usted en un lugar seguro en este momento?",
            "time_in_call_secs": 19
        },
        {
            "role": "user",
            "message": "Sí, estoy en mi casa. Me llamaron hace unos diez minutos y dijeron que saben dónde vivo.",
            "time_in_call_secs": 24
        },
        {
            "role": "agent",
            "message": "¿Recuerda el número desde el que le llamaron?",
            "time_in_call_secs": 40
        },
        {
            "role": "user",
            "message": "Sí, fue el 55-1234-5678. Me dijeron que necesito depositar quince mil pesos hoy antes de las seis de la tarde.",
            "time_in_call_secs": 46
        },
        {
            "role": "agent",
            "message": "¿Le proporcionaron algún número de cuenta para el depósito?",
            "time_in_call_secs": 66
        },
        {
            "role": "user",
            "message": "Sí, me dieron una cuenta de BBVA: 012345678901234567, a nombre de Juan Pérez García.",
            "time_in_call_secs": 72
        },
        {
            "role": "agent",
            "message": "Registré esa información. Por favor no realice ningún depósito. ¿Tiene más datos del llamante, como nombre o descripción?",
            "time_in_call_secs": 92
        },
        {
            "role": "user",
            "message": "No, solo dijo que era de un grupo y que ya me estaban vigilando. Me asusté mucho.",
            "time_in_call_secs": 103
        },
        {
            "role": "agent",
            "message": "Es completamente comprensible. ¿Desde qué municipio o ciudad nos llama usted?",
            "time_in_call_secs": 118
        },
        {
            "role": "user",
            "message": "Soy de Ecatepec, Estado de México.",
            "time_in_call_secs": 128
        },
        {
            "role": "agent",
            "message": "Gracias. Se ha generado el folio de su reporte y las autoridades serán notificadas. ¿Desea orientación adicional?",
            "time_in_call_secs": 138
        },
        {
            "role": "user",
            "message": "No, con eso está bien. Muchas gracias por su ayuda.",
            "time_in_call_secs": 150
        },
        {
            "role": "agent",
            "message": "Que esté bien. Recuerde no realizar ningún pago. Hasta luego.",
            "time_in_call_secs": 158
        }
    ]'::jsonb
)
ON CONFLICT (id_conv_eleven) DO NOTHING;


-- 5. Reporte — esto hace que report_generated = true en la vista
INSERT INTO public.reports (
    folio,
    id_conv_eleven,
    mode,
    time_rep,
    place,
    report_date,
    phone,
    caller_role,
    contact_via,
    demand_type,
    required_amount,
    deposited_amount,
    acc_numbers,
    acc_holders,
    is_actionable
)
VALUES (
    'F-DEMO001',
    'conv_DUMMY000000000000000001',
    'Telefónico',
    '14:22',
    'Ecatepec, Estado de México',
    '2026-04-10',
    '5512345678',
    'Víctima directa',
    'Llamada telefónica entrante',
    'Transferencia bancaria inmediata',
    ARRAY[15000.00]::numeric(12,2)[],
    ARRAY[]::numeric(12,2)[],
    ARRAY['012345678901234567'],
    ARRAY['Juan Pérez García'],
    true
)
ON CONFLICT (folio) DO NOTHING;

COMMIT;

-- Verificación rápida:
-- SELECT id_conv_eleven, title, folio, is_actionable
-- FROM analytics.vw_report_conversation_panel
-- WHERE id_conv_eleven = 'conv_DUMMY000000000000000001';
