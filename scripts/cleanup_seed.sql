-- BORRADO DE DATOS QA: ejecuta únicamente si deseas eliminar los fixtures de seed_postgres.sql.
-- Solo borra IDs determinísticos del conjunto de integración, sin truncar tablas reales.
\set ON_ERROR_STOP on
BEGIN;
DELETE FROM cola_reservas WHERE id IN (
 SELECT md5('loan-yiz:cola:' || clave)::uuid FROM (VALUES
 ('SO-1'),('SO-2'),('NET-1'),('NET-2'),('NET-3'),('BD-atendido'),('SO-cancelado')) q(clave)
);
DELETE FROM prestamos WHERE id IN (
 SELECT md5('loan-yiz:prestamo:' || codigo)::uuid FROM (VALUES
 ('AL-003'),('AL-004'),('AL-005'),('SO-001'),('SO-002'),('SO-003'),
 ('ED-003'),('ED-004'),('NET-001'),('NET-002'),('BD-002'),('BD-003'),('ARQ-003')) p(codigo)
);
DELETE FROM ejemplares_fisicos WHERE codigo_inventario IN (
 SELECT 'QA-LS-' || prefijo || '-' || lpad(num::text,3,'0')
 FROM (VALUES ('AL',5),('SO',3),('ED',4),('NET',2),('IA',4),('BD',3),('ARQ',3),('CAL',4)) t(prefijo,cantidad)
 CROSS JOIN LATERAL generate_series(1,t.cantidad) num
);
DELETE FROM fichas_recurso WHERE id IN (
 SELECT md5('loan-yiz:ficha:' || n)::uuid FROM generate_series(1,8) n
);
DELETE FROM categorias WHERE id=md5('loan-yiz:categoria:qa')::uuid;
DELETE FROM users WHERE email='qa-loan-admin@unsa.edu.pe'
 OR email IN (SELECT 'qa-loan-' || lpad(n::text,2,'0') || '@unsa.edu.pe' FROM generate_series(1,12) n);
-- Retirar únicamente las políticas que este seed creó (ID determinístico).
DELETE FROM politicas_prestamo WHERE id IN (
 SELECT md5('loan-yiz:policy:' || rol)::uuid FROM (VALUES
 ('STUDENT'),('TEACHER'),('ADMINISTRATIVE_STAFF'),('ADMINISTRATOR')) p(rol)
);
COMMIT;
